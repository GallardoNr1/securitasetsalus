import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { listUsers } from '@/lib/queries/users';
import { userListFiltersSchema } from '@/lib/validations/users';
import { REGION_LABELS, SUPPORTED_REGIONS } from '@/lib/regions';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Table } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';
import { formatDate } from '@/lib/format';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Usuarios · Admin',
  robots: { index: false, follow: false },
};

const ROLE_LABELS = {
  SUPER_ADMIN: 'Administrador',
  INSTRUCTOR: 'Instructor',
  STUDENT: 'Alumno',
} as const;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const params = await searchParams;
  const filters = userListFiltersSchema.parse({
    q: typeof params.q === 'string' ? params.q : undefined,
    role: typeof params.role === 'string' ? params.role : undefined,
    region: typeof params.region === 'string' ? params.region : undefined,
    page: typeof params.page === 'string' ? params.page : undefined,
  });

  const { users, total, totalPages, page } = await listUsers(filters);

  // Construye href para paginación preservando filtros.
  const baseSearch = new URLSearchParams();
  if (filters.q) baseSearch.set('q', filters.q);
  if (filters.role) baseSearch.set('role', filters.role);
  if (filters.region) baseSearch.set('region', filters.region);

  function pageHref(p: number) {
    const sp = new URLSearchParams(baseSearch);
    if (p > 1) sp.set('page', String(p));
    const query = sp.toString();
    return (query ? `/admin/usuarios?${query}` : '/admin/usuarios') as `/admin/usuarios`;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Administración</span>
          <h1>Usuarios</h1>
          <p>
            {total} {total === 1 ? 'usuario' : 'usuarios'} en el sistema. Crea instructores
            manualmente desde aquí; los alumnos suelen registrarse por su cuenta.
          </p>
        </div>
        <Button href="/admin/usuarios/new" variant="primary" size="md">
          Crear usuario
        </Button>
      </header>

      <form method="get" className={styles.filters}>
        <input
          type="search"
          name="q"
          defaultValue={filters.q ?? ''}
          placeholder="Buscar por nombre o email"
          className={styles.search}
          aria-label="Buscar usuarios"
        />
        <select
          name="role"
          defaultValue={filters.role ?? ''}
          className={styles.select}
          aria-label="Filtrar por rol"
        >
          <option value="">Todos los roles</option>
          <option value="SUPER_ADMIN">Administrador</option>
          <option value="INSTRUCTOR">Instructor</option>
          <option value="STUDENT">Alumno</option>
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

      {users.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay usuarios que coincidan con los filtros.</p>
          <Link href="/admin/usuarios" className={styles.emptyLink}>
            Limpiar filtros
          </Link>
        </div>
      ) : (
        <Table>
          <Table.Head>
            <Table.HeaderCell>Usuario</Table.HeaderCell>
            <Table.HeaderCell>Email</Table.HeaderCell>
            <Table.HeaderCell>Rol</Table.HeaderCell>
            <Table.HeaderCell>País</Table.HeaderCell>
            <Table.HeaderCell>Estado</Table.HeaderCell>
            <Table.HeaderCell>Alta</Table.HeaderCell>
          </Table.Head>
          <Table.Body>
            {users.map((u) => (
              <Table.Row key={u.id}>
                <Table.Cell>
                  <Link href={`/admin/usuarios/${u.id}`} className={styles.userCell}>
                    <Avatar
                      name={u.name}
                      userId={u.id}
                      avatarKey={u.avatarKey}
                      size="sm"
                    />
                    <span className={styles.userName}>{u.name}</span>
                  </Link>
                </Table.Cell>
                <Table.Cell muted>{u.email}</Table.Cell>
                <Table.Cell>
                  <Tag tone={u.role === 'SUPER_ADMIN' ? 'accent' : 'brand'}>
                    {ROLE_LABELS[u.role]}
                  </Tag>
                </Table.Cell>
                <Table.Cell muted>
                  {u.region ? (REGION_LABELS[u.region as keyof typeof REGION_LABELS] ?? u.region) : '—'}
                </Table.Cell>
                <Table.Cell>
                  {u.emailVerifiedAt ? (
                    <Badge status="confirmed" showDot={false}>
                      Verificado
                    </Badge>
                  ) : (
                    <Badge status="pending" showDot={false}>
                      Sin verificar
                    </Badge>
                  )}
                </Table.Cell>
                <Table.Cell muted>{formatDate(u.createdAt, 'short')}</Table.Cell>
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
          itemLabel={{ singular: 'usuario', plural: 'usuarios' }}
          hrefFor={pageHref}
        />
      ) : null}
    </div>
  );
}
