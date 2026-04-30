import Image from 'next/image';
import type { ReactNode } from 'react';
import styles from './AuthShell.module.scss';

type Side = 'login' | 'signup' | 'recover';

type Props = {
  /**
   * Variante visual del panel derecho. Cambia el copy del eyebrow + el
   * título/subtítulo del lado de marca y, sutilmente, el gradiente.
   */
  side: Side;
  /**
   * Título principal del lado del formulario. Usar saltos de línea con
   * <br/> si quieres romper en dos líneas (ej: 'Iniciar<br/>sesión.').
   */
  title: ReactNode;
  /** Subtítulo descriptivo bajo el título. Opcional. */
  subtitle?: string;
  /** Banner de error o success arriba del form. Opcional. */
  banner?: ReactNode;
  children: ReactNode;
};

const PANEL_COPY: Record<Side, { eyebrow: string; title: ReactNode; body: string }> = {
  login: {
    eyebrow: 'Acceso a tu cuenta',
    title: (
      <>
        Bienvenido
        <br />
        de <span className={styles.italic}>vuelta.</span>
      </>
    ),
    body: 'Tu cuenta SES guarda tus diplomas, te avisa de nuevas cohortes y te conecta con el registro Clavero.',
  },
  signup: {
    eyebrow: 'Crear cuenta',
    title: (
      <>
        El primer paso
        <br />
        de tu <span className={styles.italic}>oficio.</span>
      </>
    ),
    body: 'Crea tu cuenta para inscribirte en cohortes, recibir tus diplomas con QR firmado y conectarte con el registro Clavero.',
  },
  recover: {
    eyebrow: 'Recuperación',
    title: (
      <>
        Recupera el acceso
        <br />
        en <span className={styles.italic}>un minuto.</span>
      </>
    ),
    body: 'Te enviamos un enlace seguro al correo que tengas asociado a tu cuenta SES. Caduca en 30 minutos.',
  },
};

/**
 * Layout split para las páginas de auth (login / signup / recover):
 *  - Izquierda: form con título + subtítulo + cuerpo (children).
 *  - Derecha: panel verde marca con el sello como decoración + copy
 *    institucional según `side`.
 *
 * En mobile (<lg) el panel derecho se oculta — solo se ve el form a
 * todo el ancho. La identidad visual queda con el header AuthLayout
 * (logo + 'Volver al inicio') y el form bien centrado.
 */
export function AuthShell({ side, title, subtitle, banner, children }: Props) {
  const panel = PANEL_COPY[side];

  return (
    <div className={styles.shell}>
      {/* Lado del form */}
      <div className={styles.formSide}>
        <div className={styles.formInner}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          {banner ? <div className={styles.banner}>{banner}</div> : null}
          <div className={styles.body}>{children}</div>
        </div>
      </div>

      {/* Lado de marca */}
      <aside
        className={`${styles.brandSide} ${styles[`brandSide-${side}`]}`}
        aria-hidden
      >
        <span className={styles.eyebrowPill}>{panel.eyebrow}</span>

        <Image
          src="/brand/logo-seal.png"
          alt=""
          width={420}
          height={420}
          className={styles.sealBg}
        />

        <div className={styles.brandFooter}>
          <h2 className={styles.brandTitle}>{panel.title}</h2>
          <p className={styles.brandBody}>{panel.body}</p>
        </div>
      </aside>
    </div>
  );
}
