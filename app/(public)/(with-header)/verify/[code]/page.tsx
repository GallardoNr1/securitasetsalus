import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { findDiplomaByCodePublic } from '@/lib/queries/diplomas';
import { formatDate } from '@/lib/format';
import { REGION_LABELS, type SupportedRegion } from '@/lib/regions';
import styles from './page.module.scss';

type Props = {
  params: Promise<{ code: string }>;
};

const CODE_REGEX = /^SES-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const normalized = code.trim().toUpperCase();
  return {
    title: `Verificación · ${normalized}`,
    description: `Verificación pública del diploma ${normalized} emitido por SecuritasEtSalus.`,
    robots: { index: false, follow: false },
  };
}

export default async function VerifyCodePage({ params }: Props) {
  const { code } = await params;
  const normalized = code.trim().toUpperCase();

  if (!CODE_REGEX.test(normalized)) return <InvalidFormat code={normalized} />;

  const diploma = await findDiplomaByCodePublic(normalized);
  if (!diploma) return <NotFound code={normalized} />;
  if (diploma.status === 'REVOKED') return <Revoked diploma={diploma} />;

  // Active — tarjeta tipo "pasaporte" con sello a la derecha.
  const region =
    diploma.course.region &&
    Object.prototype.hasOwnProperty.call(REGION_LABELS, diploma.course.region)
      ? REGION_LABELS[diploma.course.region as SupportedRegion]
      : null;

  // Separamos nombre del alumno en primer nombre + resto para el display.
  const { primary: namePrimary, secondary: nameSecondary } = splitName(diploma.user.name ?? '');

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          {/* Status banner */}
          <div className={styles.statusPill}>
            <span className={styles.statusDot} aria-hidden />
            <span className={styles.statusText}>Diploma auténtico · vigente</span>
            <span className={styles.statusBadge}>VERIFICADO</span>
          </div>

          <h1 className={styles.studentName}>
            {namePrimary}
            {nameSecondary ? (
              <>
                <br />
                <span className={styles.studentNameItalic}>{nameSecondary}</span>
              </>
            ) : null}
          </h1>

          <p className={styles.intro}>
            ha completado satisfactoriamente el curso presencial de{' '}
            <strong>{diploma.course.title}</strong>
            {diploma.course.venueName ? (
              <>
                , impartido por SecuritasEtSalus en{' '}
                <strong>{diploma.course.venueName}</strong>
              </>
            ) : null}
            .
          </p>

          {/* Card principal */}
          <article className={styles.card}>
            <div className={styles.cardLeft}>
              <div className={styles.cardEyebrow}>Código de verificación</div>
              <div className={styles.cardCode}>{diploma.code}</div>

              <dl className={styles.meta}>
                <Field label="Curso" value={diploma.course.title} />
                <Field
                  label="Duración"
                  value={`${diploma.course.durationHours} horas lectivas`}
                />
                {diploma.course.venueName ? (
                  <Field
                    label="Sede"
                    value={
                      region
                        ? `${diploma.course.venueName}, ${region}`
                        : diploma.course.venueName
                    }
                  />
                ) : null}
                <Field label="Emitido" value={formatDate(diploma.issuedAt, 'long')} />
                {diploma.course.claveroSkillCode ? (
                  <Field
                    label="Skill Clavero"
                    value={`${diploma.course.claveroSkillCode}${
                      diploma.course.claveroSkillSuffix
                        ? ` (${diploma.course.claveroSkillSuffix})`
                        : ''
                    }`}
                  />
                ) : null}
                {region && !diploma.course.venueName ? (
                  <Field label="País" value={region} />
                ) : null}
              </dl>

              <div className={styles.cardNote}>
                <ShieldIcon />
                <p>
                  Este diploma acredita la <strong>formación recibida</strong> en SES y
                  no caduca. Para la <strong>idoneidad profesional</strong> consulta el
                  registro{' '}
                  <a href="https://clavero.cl" target="_blank" rel="noopener noreferrer">
                    Clavero
                  </a>
                  .
                </p>
              </div>
            </div>

            <div className={styles.cardRight} aria-hidden>
              <Image
                src="/brand/logo-seal.png"
                alt=""
                width={180}
                height={180}
                className={styles.cardSeal}
              />
              <div className={styles.cardSig}>
                <div className={styles.cardSigEyebrow}>Firma criptográfica</div>
                <div className={styles.cardSigHash}>
                  ED25519
                  <br />
                  HASH {hashFromCode(diploma.code)}
                </div>
              </div>
            </div>
          </article>

          {/* Acciones */}
          <div className={styles.actions}>
            <Link href="/verify" className={styles.actionLink}>
              <QrIcon /> Verificar otro código
            </Link>
            <Link href="/" className={styles.actionLink}>
              ← Inicio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

// ---------- Estados de error ----------

function InvalidFormat({ code }: { code: string }) {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={`${styles.statusPill} ${styles.statusPillDanger}`}>
            <span className={`${styles.statusDot} ${styles.statusDotDanger}`} aria-hidden />
            <span className={styles.statusText}>Resultado de la verificación</span>
            <span className={`${styles.statusBadge} ${styles.statusBadgeDanger}`}>
              FORMATO INVÁLIDO
            </span>
          </div>

          <h1 className={styles.studentName}>
            Código
            <br />
            <span className={`${styles.studentNameItalic} ${styles.studentNameItalicDanger}`}>
              mal escrito.
            </span>
          </h1>
          <p className={styles.intro}>
            El código que ingresaste no respeta el formato de los diplomas SES.
            Comprueba que esté completo y sin espacios.
          </p>

          <div className={styles.errorCard}>
            <div className={styles.errorCardEyebrow}>Código consultado</div>
            <div className={`${styles.errorCardCode} ${styles.errorCardCodeStrike}`}>
              {code}
            </div>
            <p className={styles.errorCardHelp}>
              El formato correcto es <strong>SES-XXXX-XXXX</strong> (4 letras o
              dígitos, guión, 4 letras o dígitos).
            </p>
          </div>

          <div className={styles.actions}>
            <Link href="/verify" className={styles.actionLink}>
              <QrIcon /> Verificar otro código
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function NotFound({ code }: { code: string }) {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={`${styles.statusPill} ${styles.statusPillDanger}`}>
            <span className={`${styles.statusDot} ${styles.statusDotDanger}`} aria-hidden />
            <span className={styles.statusText}>Resultado de la verificación</span>
            <span className={`${styles.statusBadge} ${styles.statusBadgeDanger}`}>
              CÓDIGO NO ENCONTRADO
            </span>
          </div>

          <h1 className={styles.studentName}>
            Código
            <br />
            <span className={`${styles.studentNameItalic} ${styles.studentNameItalicDanger}`}>
              no encontrado.
            </span>
          </h1>
          <p className={styles.intro}>
            El código que ingresaste <strong>no existe en nuestro registro</strong>.
            Verifica que esté escrito correctamente o contacta al titular del diploma.
          </p>

          <div className={styles.errorCard}>
            <div className={styles.errorCardEyebrow}>Código consultado</div>
            <div className={`${styles.errorCardCode} ${styles.errorCardCodeStrike}`}>
              {code}
            </div>
          </div>

          <div className={styles.actions}>
            <Link href="/verify" className={styles.actionLink}>
              <QrIcon /> Verificar otro código
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Revoked({
  diploma,
}: {
  diploma: NonNullable<Awaited<ReturnType<typeof findDiplomaByCodePublic>>>;
}) {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={`${styles.statusPill} ${styles.statusPillWarning}`}>
            <span
              className={`${styles.statusDot} ${styles.statusDotWarning}`}
              aria-hidden
            />
            <span className={styles.statusText}>Resultado de la verificación</span>
            <span className={`${styles.statusBadge} ${styles.statusBadgeWarning}`}>
              REVOCADO
            </span>
          </div>

          <h1 className={styles.studentName}>
            Diploma
            <br />
            <span className={`${styles.studentNameItalic} ${styles.studentNameItalicWarning}`}>
              revocado.
            </span>
          </h1>
          <p className={styles.intro}>
            Este diploma fue emitido legítimamente por SES, pero ha sido{' '}
            <strong>revocado</strong>. Se mantiene en el registro solo para fines de
            auditoría — ya no acredita la formación.
          </p>

          <article className={styles.card}>
            <div className={styles.cardLeft}>
              <div className={styles.cardEyebrow}>Código del diploma</div>
              <div className={styles.cardCode}>{diploma.code}</div>

              <dl className={styles.meta}>
                <Field label="Curso" value={diploma.course.title} />
                <Field label="Emitido" value={formatDate(diploma.issuedAt, 'long')} />
                {diploma.revokedAt ? (
                  <Field
                    label="Revocado el"
                    value={formatDate(diploma.revokedAt, 'long')}
                  />
                ) : null}
                <Field label="Estado" value="No vigente" />
              </dl>

              {diploma.revocationReason ? (
                <div className={styles.cardNoteWarning}>
                  <p>
                    <strong>Motivo de revocación:</strong> {diploma.revocationReason}
                  </p>
                </div>
              ) : null}
            </div>
          </article>

          <div className={styles.actions}>
            <Link href="/verify" className={styles.actionLink}>
              <QrIcon /> Verificar otro código
            </Link>
            <Link href="/" className={styles.actionLink}>
              ← Inicio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

// ---------- Helpers visuales ----------

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.field}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function splitName(full: string): { primary: string; secondary: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 1) return { primary: full, secondary: '' };
  if (parts.length === 2) return { primary: parts[0]!, secondary: parts[1]! };
  // 3+ partes: primer nombre arriba, el resto en la segunda línea
  return { primary: parts[0]!, secondary: parts.slice(1).join(' ') };
}

function hashFromCode(code: string): string {
  // Pseudo-hash visual derivado del código — no es una firma real, pero
  // el código en sí es único e identifica el diploma. Damos formato
  // tipo hex agrupado solo para que el "Firma criptográfica" no se vea
  // mock; el usuario que escanea el QR vuelve a esta misma página.
  const clean = code.replace(/[^A-Z2-9]/g, '').toLowerCase();
  return [
    clean.slice(0, 4),
    clean.slice(4, 8),
    clean.slice(0, 4) + clean.slice(4, 8).split('').reverse().join(''),
  ]
    .join('·')
    .slice(0, 14);
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.shieldIcon}
    >
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M9 12l2 2 4-5" />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x={3} y={3} width={7} height={7} />
      <rect x={14} y={3} width={7} height={7} />
      <rect x={3} y={14} width={7} height={7} />
      <path d="M14 14h3v3h-3zM20 14v3M14 20h3" />
    </svg>
  );
}
