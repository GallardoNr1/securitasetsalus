'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ErrorMessage } from '@/components/ui/Input';
import { uploadAvatarAction, deleteAvatarAction } from './actions';
import styles from './AvatarUploader.module.scss';

type Props = {
  userId: string;
  name: string;
  avatarKey: string | null;
};

const OUTPUT_SIZE = 512; // px — cuadrado final que sube a R2
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SOURCE_BYTES = 10 * 1024 * 1024; // 10 MB del archivo original

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Recorta el área seleccionada y devuelve un Blob JPEG de 512×512.
 * Comprime fotos grandes a un tamaño razonable sin perder calidad
 * visible para un avatar.
 */
async function cropToBlob(imageSrc: string, area: Area): Promise<Blob> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible.');
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se generó el blob.'))),
      'image/jpeg',
      0.9,
    );
  });
}

export function AvatarUploader({ userId, name, avatarKey }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  function clearFeedback() {
    setError(null);
    setSuccess(null);
  }

  function onPickFile(file: File) {
    clearFeedback();

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Formato no admitido. Usa JPG, PNG o WebP.');
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError('La imagen original supera los 10 MB. Elige una más ligera.');
      return;
    }

    const url = URL.createObjectURL(file);
    setSourceUrl(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedArea(null);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onPickFile(file);
    e.target.value = '';
  }

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  function cancel() {
    setSourceUrl(null);
    setCroppedArea(null);
    clearFeedback();
  }

  function save() {
    if (!sourceUrl || !croppedArea) return;
    clearFeedback();

    startTransition(async () => {
      try {
        const blob = await cropToBlob(sourceUrl, croppedArea);
        const formData = new FormData();
        formData.append('file', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));

        const result = await uploadAvatarAction(formData);
        if (!result.ok) {
          const errorMessages = {
            unauthorized: 'No estás autenticado.',
            'storage-not-configured':
              'El almacenamiento aún no está configurado. Avisa al admin.',
            'invalid-file': 'Formato no admitido. Usa JPG, PNG o WebP.',
            'too-large': 'La imagen recortada es demasiado grande.',
            unknown: 'No se pudo guardar la foto. Vuelve a intentarlo.',
          } as const;
          setError(errorMessages[result.formError]);
          return;
        }
        setSuccess(result.message);
        setSourceUrl(null);
        setCroppedArea(null);
      } catch (err) {
        console.error(err);
        setError('Error procesando la imagen. Vuelve a intentarlo.');
      }
    });
  }

  function removeCurrent() {
    clearFeedback();
    if (!confirm('¿Eliminar la foto de perfil actual?')) return;

    startTransition(async () => {
      const result = await deleteAvatarAction();
      if (!result.ok) {
        setError('No se pudo eliminar la foto.');
        return;
      }
      setSuccess(result.message);
    });
  }

  return (
    <div className={styles.root}>
      {sourceUrl ? (
        <div className={styles.cropperBlock}>
          <div className={styles.cropperFrame}>
            <Cropper
              image={sourceUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className={styles.zoomRow}>
            <label htmlFor="avatar-zoom" className={styles.zoomLabel}>
              Zoom
            </label>
            <input
              id="avatar-zoom"
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className={styles.zoomInput}
              disabled={isPending}
            />
          </div>
          <div className={styles.actions}>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={save}
              loading={isPending}
              disabled={!croppedArea}
            >
              Guardar foto
            </Button>
            <Button type="button" variant="ghost" size="md" onClick={cancel} disabled={isPending}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.previewBlock}>
          <Avatar userId={userId} name={name} avatarKey={avatarKey} size="xl" />
          <div className={styles.previewActions}>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
            >
              {avatarKey ? 'Cambiar foto' : 'Subir foto'}
            </Button>
            {avatarKey ? (
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={removeCurrent}
                disabled={isPending}
              >
                Eliminar foto
              </Button>
            ) : null}
          </div>
          <p className={styles.hint}>
            JPG, PNG o WebP — máximo 10 MB. Te dejaremos cuadrarla antes de guardarla.
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={onFileChange}
        className={styles.hiddenInput}
      />

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {success ? <p className={styles.success}>{success}</p> : null}
    </div>
  );
}
