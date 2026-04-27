import Image from 'next/image';
import styles from './page.module.scss';

export default function HomePage() {
  return (
    <main className={styles.hero}>
      <Image
        src="/brand/logo-seal.png"
        alt="SecuritasEtSalus"
        width={160}
        height={160}
        priority
        className={styles.logo}
      />
      <h1 className={styles.title}>SecuritasEtSalus</h1>
      <p className={styles.subtitle}>
        Escuela de formación profesional en cerrajería y seguridad. Plataforma en construcción.
      </p>
      <div className={styles.statusBlock}>
        <h2>Fase 0 — Setup técnico</h2>
        <p>
          La infraestructura base está lista: Next.js 16, Prisma 7, design system propio con paleta
          extraída del logo, integración con Stripe, R2 y Resend preparada. La landing y el
          catálogo público llegan en Fase 1.
        </p>
      </div>
    </main>
  );
}
