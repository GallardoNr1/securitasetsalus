'use client';

import { useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label, ErrorMessage, Select } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useFormDirty, snapshotForm } from '@/lib/hooks/use-dirty';
import { REGION_LABELS, SUPPORTED_REGIONS, type SupportedRegion } from '@/lib/regions';
import { getSubdivisions } from '@/lib/regions';
import { changePasswordAction, updateProfileAction } from './actions';
import styles from './profile.module.scss';

type Props = {
  initial: {
    name: string;
    email: string;
    region: SupportedRegion;
    subdivision: string | null;
    phone: string | null;
    rut: string | null;
  };
};

export function ProfileForm({ initial }: Props) {
  const [region, setRegion] = useState<SupportedRegion>(initial.region);

  // Banners de estado por sección.
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [profileFieldErrors, setProfileFieldErrors] = useState<Record<string, string>>({});
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [profilePending, startProfileTransition] = useTransition();
  const [pwdPending, startPwdTransition] = useTransition();

  // Refs + snapshots para que el botón Guardar de cada sección solo se
  // active cuando el usuario haya tocado algo respecto al último guardado.
  const profileFormRef = useRef<HTMLFormElement>(null);
  const [savedProfileSnapshot, setSavedProfileSnapshot] = useState<Record<string, string>>({
    name: initial.name,
    region: initial.region,
    subdivision: initial.subdivision ?? '',
    phone: initial.phone ?? '',
    rut: initial.rut ?? '',
  });
  const isProfileDirty = useFormDirty(profileFormRef, savedProfileSnapshot);

  const passwordFormRef = useRef<HTMLFormElement>(null);
  // Para la contraseña el snapshot inicial son strings vacíos: cualquier
  // tecleo activa el botón. Tras guardar, el form se resetea y vuelve a
  // quedar deshabilitado.
  const isPasswordDirty = useFormDirty(passwordFormRef, {
    currentPassword: '',
    newPassword: '',
    newPasswordConfirm: '',
  });

  function handleProfileSubmit(formData: FormData) {
    startProfileTransition(async () => {
      setProfileMsg(null);
      setProfileFieldErrors({});
      const result = await updateProfileAction(formData);
      if (!result.ok) {
        setProfileMsg({ ok: false, text: result.message });
        if (result.error === 'invalid' && result.fieldErrors) {
          setProfileFieldErrors(result.fieldErrors);
        }
        return;
      }
      setProfileMsg({ ok: true, text: result.message });
      // Tras un guardado exitoso, el snapshot pasa a ser el estado actual:
      // el botón vuelve a quedar deshabilitado hasta el próximo cambio.
      if (profileFormRef.current) {
        const snap = snapshotForm(profileFormRef.current);
        setSavedProfileSnapshot({
          name: snap.name ?? '',
          region: snap.region ?? '',
          subdivision: snap.subdivision ?? '',
          phone: snap.phone ?? '',
          rut: snap.rut ?? '',
        });
      }
    });
  }

  function handlePasswordSubmit(formData: FormData) {
    startPwdTransition(async () => {
      setPwdMsg(null);
      const result = await changePasswordAction(formData);
      if (!result.ok) {
        setPwdMsg({ ok: false, text: result.message });
        return;
      }
      setPwdMsg({ ok: true, text: result.message });
      // Limpia el formulario.
      const form = document.getElementById('passwordForm') as HTMLFormElement | null;
      form?.reset();
    });
  }

  function fieldError(name: string): string | undefined {
    return profileFieldErrors[name];
  }

  const subdivisions = getSubdivisions(region);

  return (
    <>
      {/* Sección 1 — datos de perfil */}
      <section id="datos" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2>Datos personales</h2>
          <p>Actualiza la información de tu cuenta.</p>
        </header>

        {profileMsg ? (
          <div className={profileMsg.ok ? styles.success : styles.error}>{profileMsg.text}</div>
        ) : null}

        <form ref={profileFormRef} action={handleProfileSubmit} className={styles.form} noValidate>
          <Field>
            <Label htmlFor="name" required>
              Nombre completo
            </Label>
            <Input
              id="name"
              name="name"
              defaultValue={initial.name}
              required
              error={Boolean(fieldError('name'))}
            />
            {fieldError('name') ? <ErrorMessage>{fieldError('name')}</ErrorMessage> : null}
          </Field>

          <Field>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={initial.email} disabled readOnly />
            <p className={styles.hint}>
              El email no se puede cambiar desde aquí. Si necesitas hacerlo, contacta con el
              administrador.
            </p>
          </Field>

          <div className={styles.row}>
            <Field>
              <Label htmlFor="region" required>
                País
              </Label>
              <Select
                id="region"
                name="region"
                required
                value={region}
                onChange={(e) => setRegion(e.target.value as SupportedRegion)}
                error={Boolean(fieldError('region'))}
              >
                {SUPPORTED_REGIONS.map((code) => (
                  <option key={code} value={code}>
                    {REGION_LABELS[code]}
                  </option>
                ))}
              </Select>
              {fieldError('region') ? <ErrorMessage>{fieldError('region')}</ErrorMessage> : null}
            </Field>

            <Field>
              <Label htmlFor="subdivision">Región / Provincia / Estado</Label>
              <Select
                id="subdivision"
                name="subdivision"
                defaultValue={initial.subdivision ?? ''}
                error={Boolean(fieldError('subdivision'))}
              >
                <option value="">Sin especificar</option>
                {subdivisions.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </Select>
              {fieldError('subdivision') ? (
                <ErrorMessage>{fieldError('subdivision')}</ErrorMessage>
              ) : null}
            </Field>
          </div>

          <div className={styles.row}>
            <Field>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={initial.phone ?? ''}
                error={Boolean(fieldError('phone'))}
              />
              {fieldError('phone') ? <ErrorMessage>{fieldError('phone')}</ErrorMessage> : null}
            </Field>

            <Field>
              <Label htmlFor="rut">RUT</Label>
              <Input
                id="rut"
                name="rut"
                defaultValue={initial.rut ?? ''}
                placeholder="12.345.678-9"
                error={Boolean(fieldError('rut'))}
              />
              {fieldError('rut') ? <ErrorMessage>{fieldError('rut')}</ErrorMessage> : null}
            </Field>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={profilePending}
            disabled={profilePending || !isProfileDirty}
          >
            Guardar cambios
          </Button>
        </form>
      </section>

      {/* Sección 2 — cambiar contraseña */}
      <section id="seguridad" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2>Cuenta y seguridad</h2>
          <p>Solo aplica si tu cuenta tiene contraseña. Las cuentas con Magic Link no la usan.</p>
        </header>

        {pwdMsg ? (
          <div className={pwdMsg.ok ? styles.success : styles.error}>{pwdMsg.text}</div>
        ) : null}

        <form
          ref={passwordFormRef}
          id="passwordForm"
          action={handlePasswordSubmit}
          className={styles.form}
          noValidate
          autoComplete="off"
        >
          <Field>
            <Label htmlFor="currentPassword" required>
              Contraseña actual
            </Label>
            <PasswordInput
              id="currentPassword"
              name="currentPassword"
              autoComplete="current-password"
              required
            />
          </Field>

          <div className={styles.row}>
            <Field>
              <Label htmlFor="newPassword" required>
                Nueva contraseña
              </Label>
              <PasswordInput
                id="newPassword"
                name="newPassword"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </Field>

            <Field>
              <Label htmlFor="newPasswordConfirm" required>
                Repite la nueva
              </Label>
              <PasswordInput
                id="newPasswordConfirm"
                name="newPasswordConfirm"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </Field>
          </div>

          <Button
            type="submit"
            variant="secondary"
            size="md"
            loading={pwdPending}
            disabled={pwdPending || !isPasswordDirty}
          >
            Cambiar contraseña
          </Button>
        </form>
      </section>
    </>
  );
}
