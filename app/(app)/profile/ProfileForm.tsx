'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label, ErrorMessage, Select } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
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
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2>Datos personales</h2>
          <p>Actualiza la información de tu cuenta.</p>
        </header>

        {profileMsg ? (
          <div className={profileMsg.ok ? styles.success : styles.error}>{profileMsg.text}</div>
        ) : null}

        <form action={handleProfileSubmit} className={styles.form} noValidate>
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

          <Button type="submit" variant="primary" size="md" loading={profilePending}>
            Guardar cambios
          </Button>
        </form>
      </section>

      {/* Sección 2 — cambiar contraseña */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2>Cambiar contraseña</h2>
          <p>Solo aplica si tu cuenta tiene contraseña. Las cuentas con Magic Link no la usan.</p>
        </header>

        {pwdMsg ? (
          <div className={pwdMsg.ok ? styles.success : styles.error}>{pwdMsg.text}</div>
        ) : null}

        <form
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

          <Button type="submit" variant="secondary" size="md" loading={pwdPending}>
            Cambiar contraseña
          </Button>
        </form>
      </section>
    </>
  );
}
