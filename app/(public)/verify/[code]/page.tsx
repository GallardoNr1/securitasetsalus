import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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

  // Formato inválido: ni siquiera tocamos BD.
  if (!CODE_REGEX.test(normalized)) {
    return <InvalidFormat code={normalized} />;
  }

  const diploma = await findDiplomaByCodePublic(normalized);

  if (!diploma) {
    return <NotFound code={normalized} />;
  }

  if (diploma.status === 'REVOKED') {
    return <Revoked diploma={diploma} />;
  }

  // Active — mostramos el detalle del diploma.
  const region =
    diploma.course.region &&
    Object.prototype.hasOwnProperty.call(REGION_LABELS, diploma.course.region)
      ? REGION_LABELS[diploma.course.region as SupportedRegion]
      : null;

  return (
    <main className={styles.page}>
      <article className={styles.card}>
        <header className={styles.cardHeader}>
          <span className={styles.eyebrow}>Diploma verificado</span>
          <Badge status="active" showDot={false}>
            Vigente
          </Badge>
        </header>

        <h1 className={styles.studentName}>{diploma.user.name}</h1>
        <p className={styles.subtitle}>
          ha completado satisfactoriamente el curso
        </p>
        <h2 className={styles.courseTitle}>{diploma.course.title}</h2>

        <dl className={styles.meta}>
          <div>
            <dt>Código</dt>
            <dd className={styles.code}>{diploma.code}</dd>
          </div>
          <div>
            <dt>Emitido</dt>
            <dd>{formatDate(diploma.issuedAt, 'long')}</dd>
          </div>
          <div>
            <dt>Duración</dt>
            <dd>{diploma.course.durationHours} h lectivas</dd>
          </div>
          {diploma.course.venueName ? (
            <div>
              <dt>Sede</dt>
              <dd>{diploma.course.venueName}</dd>
            </div>
          ) : null}
          {region ? (
            <div>
              <dt>País</dt>
              <dd>{region}</dd>
            </div>
          ) : null}
          {diploma.course.claveroSkillCode ? (
            <div>
              <dt>Skill Clavero</dt>
              <dd>
                {diploma.course.claveroSkillCode}
                {diploma.course.claveroSkillSuffix
                  ? ` (${diploma.course.claveroSkillSuffix})`
                  : ''}
              </dd>
            </div>
          ) : null}
        </dl>

        <p className={styles.note}>
          Este diploma acredita la <strong>formación recibida</strong> en SES y es
          fuente de verdad para sistemas externos como{' '}
          <a href="https://clavero.cl" target="_blank" rel="noopener noreferrer">
            Clavero
          </a>{' '}
          al evaluar la idoneidad profesional.
        </p>

        <div className={styles.actions}>
          <Button href="/verify" variant="secondary" size="md">
            Verificar otro código
          </Button>
          <Link href="/" className={styles.homeLink}>
            ← Inicio
          </Link>
        </div>
      </article>
    </main>
  );
}

function InvalidFormat({ code }: { code: string }) {
  return (
    <main className={styles.page}>
      <article className={styles.card}>
        <span className={styles.eyebrow}>Verificación de diploma</span>
        <p className={styles.codeLabel}>Código consultado</p>
        <p className={styles.code}>{code}</p>
        <div className={styles.placeholder}>
          <h1>Formato no válido</h1>
          <p>
            Los códigos de diploma SES tienen el formato{' '}
            <code>SES-XXXX-XXXX</code> (ej: <code>SES-A4F2-9P3X</code>). Comprueba que
            lo has copiado completo y sin caracteres adicionales.
          </p>
        </div>
        <div className={styles.actions}>
          <Button href="/verify" variant="secondary" size="md">
            Probar otro código
          </Button>
        </div>
      </article>
    </main>
  );
}

function NotFound({ code }: { code: string }) {
  return (
    <main className={styles.page}>
      <article className={styles.card}>
        <span className={styles.eyebrow}>Verificación de diploma</span>
        <p className={styles.codeLabel}>Código consultado</p>
        <p className={styles.code}>{code}</p>
        <div className={styles.placeholder}>
          <h1>Diploma no encontrado</h1>
          <p>
            El código <code>{code}</code> no corresponde a ningún diploma emitido por
            SES. Comprueba que el código esté bien escrito o contacta con la persona
            que te facilitó el diploma.
          </p>
        </div>
        <div className={styles.actions}>
          <Button href="/verify" variant="secondary" size="md">
            Probar otro código
          </Button>
        </div>
      </article>
    </main>
  );
}

function Revoked({ diploma }: { diploma: NonNullable<Awaited<ReturnType<typeof findDiplomaByCodePublic>>> }) {
  return (
    <main className={styles.page}>
      <article className={`${styles.card} ${styles.cardRevoked}`}>
        <header className={styles.cardHeader}>
          <span className={styles.eyebrow}>Diploma revocado</span>
          <Badge status="revoked" showDot={false}>
            Revocado
          </Badge>
        </header>

        <h1>Este diploma ha sido revocado</h1>
        <p className={styles.revokedBody}>
          El diploma <code>{diploma.code}</code> existe en SES pero ha sido revocado y
          ya no acredita la formación. Se mantiene en este registro únicamente para
          fines de auditoría.
        </p>

        {diploma.revocationReason ? (
          <p className={styles.revocationReason}>
            <strong>Motivo:</strong> {diploma.revocationReason}
          </p>
        ) : null}

        {diploma.revokedAt ? (
          <p className={styles.muted}>
            Revocado el {formatDate(diploma.revokedAt, 'long')}
          </p>
        ) : null}

        <div className={styles.actions}>
          <Button href="/verify" variant="secondary" size="md">
            Probar otro código
          </Button>
          <Link href="/" className={styles.homeLink}>
            ← Inicio
          </Link>
        </div>
      </article>
    </main>
  );
}
