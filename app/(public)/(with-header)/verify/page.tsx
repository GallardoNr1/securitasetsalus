import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Verificar diploma',
  description:
    'Comprueba la autenticidad de un diploma de SecuritasEtSalus introduciendo su código.',
};

async function verifyAction(formData: FormData) {
  'use server';
  const codeRaw = formData.get('code');
  const code = typeof codeRaw === 'string' ? codeRaw.trim() : '';
  if (!code) return;
  redirect(`/verify/${encodeURIComponent(code)}`);
}

export default function VerifyIndexPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>Verificación pública</span>
          <h1 className={styles.title}>
            Verificar un<br />
            <span className={styles.titleItalic}>diploma SES.</span>
          </h1>
          <p className={styles.lead}>
            Introduce el código que aparece en el PDF del diploma o escanea el QR.
            La verificación es pública — cualquiera puede comprobar si un diploma de
            SecuritasEtSalus es legítimo.
          </p>

          <form action={verifyAction} className={styles.form}>
            <label htmlFor="code" className={styles.label}>
              Código del diploma
            </label>
            <div className={styles.inputRow}>
              <input
                id="code"
                name="code"
                type="text"
                required
                placeholder="SES-XXXX-XXXX"
                className={styles.input}
                autoComplete="off"
                spellCheck={false}
              />
              <button type="submit" className={styles.submit}>
                Verificar
                <svg
                  viewBox="0 0 24 24"
                  width={14}
                  height={14}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <p className={styles.formHint}>
              Formato: <code>SES-XXXX-XXXX</code> (4 caracteres, guión, 4 caracteres).
            </p>
          </form>
        </div>

        {/* Sello flotante decorativo en desktop */}
        <div className={styles.sealWrap} aria-hidden>
          <Image
            src="/brand/logo-seal.png"
            alt=""
            width={280}
            height={280}
            className={styles.seal}
          />
        </div>
      </section>

      <section className={styles.about}>
        <div className={styles.aboutInner}>
          <h2>Sobre los diplomas SES</h2>
          <div className={styles.aboutGrid}>
            <article>
              <span className={styles.aboutEyebrow}>Formación</span>
              <h3>Cada diploma acredita un curso real.</h3>
              <p>
                Los diplomas de SecuritasEtSalus se emiten al cerrar un curso presencial
                con asistencia y evaluación. No caducan — acreditan que el titular
                completó esa formación en una fecha determinada.
              </p>
            </article>
            <article>
              <span className={styles.aboutEyebrow}>Verificación</span>
              <h3>Código único y QR firmado.</h3>
              <p>
                Cada diploma lleva un código corto del tipo <code>SES-XXXX-XXXX</code>
                y un QR que apunta a esta misma página. El verificador puede ser
                cualquier persona — no requiere cuenta.
              </p>
            </article>
            <article>
              <span className={styles.aboutEyebrow}>Idoneidad profesional</span>
              <h3>Para algo más, consulta Clavero.</h3>
              <p>
                Si necesitas comprobar la <strong>idoneidad profesional íntegra</strong>
                {' '}— compliance, seguro de RC, antecedentes — consulta el registro de{' '}
                <a
                  href="https://clavero.cl"
                  className={styles.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Clavero
                </a>
                . SES solo acredita la formación recibida.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
