import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Table } from '@/components/ui/Table';
import { formatDate } from '@/lib/format';
import { listPaymentsByUser } from '@/lib/queries/payments';
import { CancelButton } from './CancelButton';
import styles from './billing.module.scss';

export const metadata: Metadata = {
  title: 'Mis pagos',
  robots: { index: false, follow: false },
};

function formatMoney(amount: number, currency: string): string {
  const isZeroDecimal = ['CLP', 'JPY', 'KRW', 'CLF'].includes(currency.toUpperCase());
  const display = isZeroDecimal ? amount : amount / 100;
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
  }).format(display);
}

const STATUS_LABEL: Record<
  'PENDING' | 'COMPLETED' | 'REFUNDED_FULL' | 'REFUNDED_PARTIAL' | 'FAILED',
  { label: string; status: 'pending' | 'confirmed' | 'cancelled' | 'failed' | 'revoked' }
> = {
  PENDING: { label: 'Pendiente', status: 'pending' },
  COMPLETED: { label: 'Pagado', status: 'confirmed' },
  REFUNDED_FULL: { label: 'Reembolsado', status: 'revoked' },
  REFUNDED_PARTIAL: { label: 'Reemb. parcial', status: 'revoked' },
  FAILED: { label: 'Fallido', status: 'failed' },
};

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'STUDENT' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const payments = await listPaymentsByUser(session.user.id);

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[{ label: 'Mi panel', href: '/dashboard' }, { label: 'Mis pagos' }]}
      />

      <header className={styles.pageHeader}>
        <span className={styles.pageEyebrow}>Facturación</span>
        <h1 className={styles.pageTitle}>
          Mis <span className={styles.pageTitleItalic}>pagos.</span>
        </h1>
        <p className={styles.pageLead}>
          Histórico de tus inscripciones y pagos. Si quieres cancelar una inscripción a un
          curso que aún no ha empezado, puedes hacerlo desde aquí.
        </p>
      </header>

      {payments.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>Aún no tienes pagos</h2>
          <p>Cuando te inscribas a un curso, los pagos aparecerán aquí.</p>
          <Link href="/courses" className={styles.emptyCta}>
            Ver catálogo
          </Link>
        </div>
      ) : (
        <Table>
          <Table.Head>
            <Table.HeaderCell>Curso</Table.HeaderCell>
            <Table.HeaderCell>Fecha</Table.HeaderCell>
            <Table.HeaderCell align="right">Monto</Table.HeaderCell>
            <Table.HeaderCell>Estado</Table.HeaderCell>
            <Table.HeaderCell align="right">Acciones</Table.HeaderCell>
          </Table.Head>
          <Table.Body>
            {payments.map((p) => {
              const meta = STATUS_LABEL[p.status];
              const canCancel =
                p.status === 'COMPLETED' &&
                (p.enrollment.status === 'CONFIRMED' || p.enrollment.status === 'PENDING_PAYMENT');
              return (
                <Table.Row key={p.id}>
                  <Table.Cell>
                    <Link
                      href={{ pathname: `/courses/${p.enrollment.course.slug}` }}
                      className={styles.courseLink}
                    >
                      {p.enrollment.course.title}
                    </Link>
                    {p.enrollment.senceUsed ? (
                      <span className={styles.senceTag}>SENCE</span>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell muted>
                    {formatDate(p.paidAt ?? p.createdAt, 'short')}
                  </Table.Cell>
                  <Table.Cell align="right">
                    <strong>{formatMoney(p.amount, p.currency)}</strong>
                    {p.refundedAmount && p.refundedAmount > 0 ? (
                      <div className={styles.refundedHint}>
                        −{formatMoney(p.refundedAmount, p.currency)} reembolsado
                      </div>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge status={meta.status} showDot={false}>
                      {meta.label}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell align="right">
                    {canCancel ? (
                      <CancelButton
                        enrollmentId={p.enrollment.id}
                        courseTitle={p.enrollment.course.title}
                      />
                    ) : (
                      <span className={styles.noActions}>—</span>
                    )}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
      )}
    </div>
  );
}
