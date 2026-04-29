'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label, ErrorMessage, Select } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useFormDirty, snapshotForm } from '@/lib/hooks/use-dirty';
import { REGION_LABELS, SUPPORTED_REGIONS, getSubdivisions, type SupportedRegion } from '@/lib/regions';
import { createUserAction, updateUserAction } from './actions';
import styles from './UserForm.module.scss';

type Role = 'SUPER_ADMIN' | 'INSTRUCTOR' | 'STUDENT';

type Props = {
  /** Modo del formulario: crear nuevo usuario o editar uno existente. */
  mode: 'create' | 'edit';
  /** Solo en modo edit — id del usuario a actualizar. */
  userId?: string;
  /** Valores iniciales (vacíos por defecto en create). */
  initial: {
    name: string;
    email: string;
    role: Role;
    region: SupportedRegion;
    subdivision: string | null;
    phone: string | null;
    rut: string | null;
  };
};

export function UserForm({ mode, userId, initial }: Props) {
  const router = useRouter();
  const [region, setRegion] = useState<SupportedRegion>(initial.region);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  // Snapshot del último estado guardado — el botón Guardar se desactiva
  // cuando el form coincide con esto. En create, el snapshot inicial son
  // los defaults vacíos, así que el botón se activa al primer tecleo.
  const formRef = useRef<HTMLFormElement>(null);
  const [savedSnapshot, setSavedSnapshot] = useState({
    name: initial.name,
    email: initial.email,
    role: initial.role,
    region: initial.region,
    subdivision: initial.subdivision ?? '',
    phone: initial.phone ?? '',
    rut: initial.rut ?? '',
    // Para create: los inputs de password también están vacíos por default.
    password: '',
  });
  const isDirty = useFormDirty(formRef, savedSnapshot);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      setFieldErrors({});

      if (mode === 'create') {
        const result = await createUserAction(formData);
        if (!result.ok) {
          setError(result.message);
          if (result.error === 'invalid' && result.fieldErrors) {
            setFieldErrors(result.fieldErrors);
          }
          return;
        }
        router.push(`/admin/usuarios/${result.userId}`);
        router.refresh();
        return;
      }

      if (!userId) return;
      const result = await updateUserAction(userId, formData);
      if (!result.ok) {
        setError(result.message);
        if (result.error === 'invalid' && result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      router.refresh();
      // El form sigue montado tras editar — actualizamos el snapshot
      // para que el botón vuelva a quedar deshabilitado.
      if (formRef.current) {
        const snap = snapshotForm(formRef.current);
        setSavedSnapshot((prev) => ({ ...prev, ...snap }));
      }
    });
  }

  function fieldError(name: string): string | undefined {
    return fieldErrors[name];
  }

  const subdivisions = getSubdivisions(region);

  return (
    <form ref={formRef} action={handleSubmit} className={styles.form} noValidate>
      {error ? <div className={styles.error}>{error}</div> : null}

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
        <Label htmlFor="email" required={mode === 'create'}>
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={initial.email}
          required={mode === 'create'}
          disabled={mode === 'edit'}
          readOnly={mode === 'edit'}
          error={Boolean(fieldError('email'))}
        />
        {mode === 'edit' ? (
          <p className={styles.hint}>El email no se puede cambiar desde aquí.</p>
        ) : null}
        {fieldError('email') ? <ErrorMessage>{fieldError('email')}</ErrorMessage> : null}
      </Field>

      <div className={styles.row}>
        <Field>
          <Label htmlFor="role" required>
            Rol
          </Label>
          <Select
            id="role"
            name="role"
            required
            defaultValue={initial.role}
            error={Boolean(fieldError('role'))}
          >
            <option value="STUDENT">Alumno</option>
            <option value="INSTRUCTOR">Instructor</option>
            <option value="SUPER_ADMIN">Administrador</option>
          </Select>
          {fieldError('role') ? <ErrorMessage>{fieldError('role')}</ErrorMessage> : null}
        </Field>

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
      </div>

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

      {mode === 'create' ? (
        <Field>
          <Label htmlFor="password">Contraseña inicial (opcional)</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
          />
          <p className={styles.hint}>
            Si la dejas vacía, el usuario solo podrá entrar con Magic Link hasta crear una
            contraseña con &quot;¿Olvidaste tu contraseña?&quot;.
          </p>
          {fieldError('password') ? <ErrorMessage>{fieldError('password')}</ErrorMessage> : null}
        </Field>
      ) : null}

      <div className={styles.actions}>
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={pending}
          disabled={pending || !isDirty}
        >
          {mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
        </Button>
        <Link href="/admin/usuarios" className={styles.cancelLink}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
