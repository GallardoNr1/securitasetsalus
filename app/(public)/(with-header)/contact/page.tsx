import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ContactForm } from './ContactForm';
import styles from './contact.module.scss';

export const metadata: Metadata = {
  title: 'Contacto',
  description:
    'Habla con SecuritasEtSalus — cursos para empresas, franquicia SENCE, sedes y soporte general.',
};

export default function ContactPage() {
  return (
    <main className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <Image
          src="/brand/logo-seal.png"
          alt=""
          width={520}
          height={520}
          aria-hidden
          className={styles.heroSeal}
        />
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>Contacto</span>
          <h1 className={styles.title}>
            Hablemos de
            <br />
            <span className={styles.titleItalic}>tu cohorte.</span>
          </h1>
          <p className={styles.lead}>
            Si quieres inscribir a tu equipo, postular como instructor o tienes preguntas
            sobre franquicia SENCE, escríbenos. Respondemos en 24h hábiles.
          </p>
        </div>
      </section>

      {/* Form + Info side-by-side */}
      <section className={styles.body}>
        <div className={styles.bodyInner}>
          <div className={styles.formSide}>
            <header className={styles.formHeader}>
              <span className={styles.formEyebrow}>Escríbenos</span>
              <h2 className={styles.formTitle}>Te respondemos en 24h hábiles.</h2>
              <p className={styles.formLead}>
                Cuéntanos quién eres y qué necesitas. Si es un curso para empresa o un
                trámite SENCE, te derivamos al equipo correcto.
              </p>
            </header>

            <ContactForm />
          </div>

          <aside className={styles.infoSide}>
            <article className={styles.infoCard}>
              <div className={styles.infoIcon} aria-hidden>
                <MailIcon />
              </div>
              <h3>Correo</h3>
              <p>
                Para inscripciones, soporte general y prensa.
              </p>
              <a className={styles.infoLink} href="mailto:hola@securitasetsalus.cl">
                hola@securitasetsalus.cl
              </a>
            </article>

            <article className={styles.infoCard}>
              <div className={styles.infoIcon} aria-hidden>
                <PhoneIcon />
              </div>
              <h3>WhatsApp</h3>
              <p>De lunes a viernes, 09:00 – 18:00 (hora Chile).</p>
              <a
                className={styles.infoLink}
                href="https://wa.me/56912345678"
                target="_blank"
                rel="noopener noreferrer"
              >
                +56 9 1234 5678
              </a>
            </article>

            <article className={`${styles.infoCard} ${styles.infoCardDark}`}>
              <div className={styles.infoIconDark} aria-hidden>
                <BuildingIcon />
              </div>
              <h3>Cursos para empresas</h3>
              <p>
                Cohortes cerradas en tu sede o en la nuestra, con franquicia SENCE
                gestionada por nuestra OTEC.
              </p>
              <a
                className={styles.infoLinkDark}
                href="mailto:empresas@securitasetsalus.cl"
              >
                empresas@securitasetsalus.cl
              </a>
            </article>

            <article className={styles.venuesCard}>
              <span className={styles.venuesEyebrow}>Sedes</span>
              <h3 className={styles.venuesTitle}>Dónde se imparte el oficio.</h3>
              <ul className={styles.venuesList}>
                <li className={styles.venueItem}>
                  <span className={styles.venueDot} aria-hidden />
                  <div className={styles.venueText}>
                    <strong>Santiago — Providencia</strong>
                    <span>Av. Providencia 1234, oficina 502</span>
                  </div>
                </li>
                <li className={styles.venueItem}>
                  <span className={styles.venueDot} aria-hidden />
                  <div className={styles.venueText}>
                    <strong>Valparaíso — Almendral</strong>
                    <span>Av. Pedro Montt 567, taller</span>
                  </div>
                </li>
                <li className={styles.venueItem}>
                  <span className={styles.venueDot} aria-hidden />
                  <div className={styles.venueText}>
                    <strong>Concepción — Centro</strong>
                    <span>O&apos;Higgins 890, segundo piso</span>
                  </div>
                </li>
              </ul>
              <p className={styles.venuesNote}>
                Las sedes activas dependen de la cohorte. Confirmar siempre en{' '}
                <Link href="/courses" className={styles.venuesLink}>
                  /courses
                </Link>
                .
              </p>
            </article>
          </aside>
        </div>
      </section>
    </main>
  );
}

// ---------- Icons ----------

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x={3} y={5} width={18} height={14} rx={2} />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x={4} y={3} width={16} height={18} rx={1} />
      <path d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
    </svg>
  );
}
