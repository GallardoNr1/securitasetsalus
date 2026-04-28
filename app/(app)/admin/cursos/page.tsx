import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { listCoursesAdmin } from '@/lib/queries/courses';
import { courseListFiltersSchema } from '@/lib/validations/courses';
import { REGION_LABELS, SUPPORTED_REGIONS } from '@/lib/regions';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Table } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';
import { formatDate, formatPrice } from '@/lib/format';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Cursos · Admin',
  robots: { index: false, follow: false },
};

const STATUS_LABELS = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado',
} as const;

const STATUS_TONES: Record<keyof typeof STATUS_LABELS, 'pending' | 'confirmed' | 'cancelled' | 'failed'> = {
  DRAFT: 'pending',
  PUBLISHED: 'confirmed',
  CLOSED: 'cancelled',
  CANCELLED: 'failed',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminCoursesPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const params = await searchParams;
  const filters = courseListFiltersSchema.parse({
    q: typeof params.q === 'string' ? params.q : undefined,
    status: typeof params.status === 'string' ? params.status : undefined,
    region: typeof params.region === 'string' ? params.region : undefined,
    page: typeof params.page === 'string' ? params.page : undefined,
  });

  const { courses, total, totalPages, page } = await listCoursesAdmin(filters);

  const baseSearch = new URLSearchParams();
  if (filters.q) baseSearch.set('q', filters.q);
  if (filters.status) baseSearch.set('status', filters.status);
  if (filters.region) baseSearch.set('region', filters.region);

  function pageHref(p: number) {
    const sp = new URLSearchParams(baseSearch);
    if (p > 1) sp.set('page', String(p));
    const query = sp.toString();
    return (query ? `/admin/cursos?${query}` : '/admin/cursos') as `/admin/cursos`;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Administración</span>
          <h1>Cursos</h1>
          <p>
            {total} {total === 1 ? 'curso' : 'cursos'} en el catálogo. Crea, edita y publica
            cursos al catálogo público.
          </p>
        </div>
        <Button href="/admin/cursos/new" variant="primary" size="md">
          Crear curso
        </Button>
      </header>

      <form method="get" className={styles.filters}>
        <input
          type="search"
          name="q"
          defaultValue={filters.q ?? ''}
          placeholder="Buscar por título o slug"
          className={styles.search}
          aria-label="Buscar cursos"
        />
        <select
          name="status"
          defaultValue={filters.status ?? ''}
          className={styles.select}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          <option value="DRAFT">Borrador</option>
          <option value="PUBLISHED">Publicado</option>
          <option value="CLOSED">Cerrado</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
        <select
          name="region"
          defaultValue={filters.region ?? ''}
          className={styles.select}
          aria-label="Filtrar por país"
        >
          <option value="">Todos los países</option>
          {SUPPORTED_REGIONS.map((code) => (
            <option key={code} value={code}>
              {REGION_LABELS[code]}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" size="md">
          Aplicar
        </Button>
      </form>

      {courses.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay cursos que coincidan con los filtros.</p>
          <Link href="/admin/cursos" className={styles.emptyLink}>
            Limpiar filtros
          </Link>
        </div>
      ) : (
        <Table>
          <Table.Head>
            <Table.HeaderCell>Curso</Table.HeaderCell>
            <Table.HeaderCell>Instructor</Table.HeaderCell>
            <Table.HeaderCell>Estado</Table.HeaderCell>
            <Table.HeaderCell>Sesiones</Table.HeaderCell>
            <Table.HeaderCell>Inscritos</Table.HeaderCell>
            <Table.HeaderCell align="right">Precio</Table.HeaderCell>
          </Table.Head>
          <Table.Body>
            {courses.map((c) => (
              <Table.Row key={c.id}>
                <Table.Cell>
                  <Link href={`/admin/cursos/${c.id}`} className={styles.titleCell}>
                    <span className={styles.title}>{c.title}</span>
                    <span className={styles.slug}>/{c.slug}</span>
                    <span className={styles.tags}>
                      {c.senceEligible ? <Tag tone="accent">SENCE</Tag> : null}
                      {c.claveroSkillCode ? <Tag tone="brand">{c.claveroSkillCode}</Tag> : null}
                    </span>
                  </Link>
                </Table.Cell>
                <Table.Cell muted>{c.instructor.name}</Table.Cell>
                <Table.Cell>
                  <Badge status={STATUS_TONES[c.status]} showDot={false}>
                    {STATUS_LABELS[c.status]}
                  </Badge>
                  {c.publishedAt ? (
                    <span className={styles.metaInline}>
                      desde {formatDate(c.publishedAt, 'short')}
                    </span>
                  ) : null}
                </Table.Cell>
                <Table.Cell muted>{c._count.sessions}</Table.Cell>
                <Table.Cell muted>
                  {c._count.enrollments} / {c.capacity}
                </Table.Cell>
                <Table.Cell align="right">{formatPrice(c.price, c.currency)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      {totalPages > 1 ? (
        <Pagination
          page={page}
          pageCount={totalPages}
          total={total}
          itemLabel={{ singular: 'curso', plural: 'cursos' }}
          hrefFor={pageHref}
        />
      ) : null}
    </div>
  );
}
