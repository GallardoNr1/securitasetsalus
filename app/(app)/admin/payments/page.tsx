import type { Metadata } from 'next';
import type { Route } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Pagination } from '@/components/ui/Pagination';
import { Table } from '@/components/ui/Table';
import { formatDate } from '@/lib/format';
import {
  listPaymentsAdmin,
  listPendingSenceEnrollments,
  type AdminPaymentFilters,
} from '@/lib/queries/payments';
import { SenceReviewPanel } from './SenceReviewPanel';
import styles from './payments.module.scss';

export const metadata: Metadata = {
  title: 'Pagos · Admin',
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

const STATUS_LABEL = {
  PENDING: { label: 'Pendiente', status: 'pending' as const },
  COMPLETED: { label: 'Pagado', status: 'confirmed' as const },
  REFUNDED_FULL: { label: 'Reembolsado', status: 'revoked' as const },
  REFUNDED_PARTIAL: { label: 'Reemb. parcial', status: 'revoked' as const },
  FAILED: { label: 'Fallido', status: 'failed' as const },
};

type Props = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    senceUsed?: string;
    page?: string;
  }>;
};

export default async function AdminPaymentsPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') redirect('/');

  const params = await searchParams;
  const filters: AdminPaymentFilters = {
    q: params.q,
    status:
      params.status === 'PENDING' ||
      params.status === 'COMPLETED' ||
      params.status === 'REFUNDED_FULL' ||
      params.status === 'REFUNDED_PARTIAL' ||
      params.status === 'FAILED'
        ? params.status
        : undefined,
    senceUsed:
      params.senceUsed === 'true' || params.senceUsed === 'false' ? params.senceUsed : undefined,
    page: params.page ? Math.max(1, Number.parseInt(params.page, 10) || 1) : 1,
  };

  const [list, pendingSence] = await Promise.all([
    listPaymentsAdmin(filters),
    listPendingSenceEnrollments(),
  ]);

  function buildHref(overrides: Record<string, string | undefined>): Route {
    const url = new URLSearchParams();
    const merged = { ...params, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && typeof v === 'string') url.set(k, v);
    }
    const qs = url.toString();
    return (qs ? `/admin/payments?${qs}` : '/admin/payments') as Route;
  }

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[{ label: 'Panel admin', href: '/admin' }, { label: 'Pagos' }]}
      />

      <header className={styles.pageHeader}>
        <span className={styles.pageEyebrow}>Administración</span>
        <h1 className={styles.pageTitle}>
          Pagos e <span className={styles.pageTitleItalic}>inscripciones.</span>
        </h1>
        <p className={styles.pageLead}>
          Histórico de pagos vía Stripe + solicitudes pendientes de aprobación SENCE.
        </p>
      </header>

      {/* Bloque de SENCE pendiente — siempre arriba si hay alguno */}
      {pendingSence.length > 0 ? (
        <section className={styles.senceSection}>
          <header className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>SENCE pendiente</span>
            <h2 className={styles.sectionTitle}>
              {pendingSence.length} solicitud{pendingSence.length === 1 ? '' : 'es'} por revisar
            </h2>
            <p className={styles.sectionLead}>
              Revisa los datos del empleador y aprueba o rechaza. Aprobar pasa la inscripción a
              CONFIRMED (cupo asegurado); rechazar libera el cupo.
            </p>
          </header>
          <ul className={styles.senceList}>
            {pendingSence.map((e) => (
              <li key={e.id} className={styles.senceItem}>
                <SenceReviewPanel enrollment={e} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Filtros + tabla de pagos */}
      <section className={styles.tableSection}>
        <header className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Pagos Stripe</span>
          <h2 className={styles.sectionTitle}>Histórico</h2>
        </header>

        <form method="GET" className={styles.filterBar}>
          <input
            type="text"
            name="q"
            placeholder="Alumno, email o curso…"
            defaultValue={params.q ?? ''}
            className={styles.filterSearch}
          />
          <select name="status" defaultValue={params.status ?? ''} className={styles.filterSelect}>
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="COMPLETED">Pagado</option>
            <option value="REFUNDED_FULL">Reembolsado total</option>
            <option value="REFUNDED_PARTIAL">Reembolsado parcial</option>
            <option value="FAILED">Fallido</option>
          </select>
          <select
            name="senceUsed"
            defaultValue={params.senceUsed ?? ''}
            className={styles.filterSelect}
          >
            <option value="">SENCE: cualquiera</option>
            <option value="true">SENCE: sí</option>
            <option value="false">SENCE: no</option>
          </select>
          <button type="submit" className={styles.filterButton}>
            Filtrar
          </button>
          {params.q || params.status || params.senceUsed ? (
            <Link href={'/admin/payments' as Route} className={styles.filterClear}>
              Limpiar
            </Link>
          ) : null}
        </form>

        {list.items.length === 0 ? (
          <Table.Empty>No hay pagos que cumplan el filtro.</Table.Empty>
        ) : (
          <>
            <Table>
              <Table.Head>
                <Table.HeaderCell>Alumno</Table.HeaderCell>
                <Table.HeaderCell>Curso</Table.HeaderCell>
                <Table.HeaderCell>Fecha</Table.HeaderCell>
                <Table.HeaderCell align="right">Monto</Table.HeaderCell>
                <Table.HeaderCell>Estado</Table.HeaderCell>
              </Table.Head>
              <Table.Body>
                {list.items.map((p) => {
                  const meta = STATUS_LABEL[p.status];
                  return (
                    <Table.Row key={p.id}>
                      <Table.Cell>
                        <strong className={styles.userName}>{p.user.name}</strong>
                        <div className={styles.userEmail}>{p.user.email}</div>
                      </Table.Cell>
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
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
            <Pagination
              page={list.page}
              pageCount={list.totalPages}
              total={list.total}
              itemLabel={{ singular: 'pago', plural: 'pagos' }}
              hrefFor={(p) => buildHref({ page: String(p) })}
            />
          </>
        )}
      </section>
    </div>
  );
}
