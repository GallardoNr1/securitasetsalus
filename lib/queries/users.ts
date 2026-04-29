import type { Prisma, Role } from '@prisma/client';
import { db } from '@/lib/db';
import type { UserListFilters } from '@/lib/validations/users';

const PAGE_SIZE = 20;

/**
 * Devuelve la `avatarKey` del usuario o null si no tiene foto subida.
 * Se usa desde el endpoint público /api/users/[id]/avatar para resolver
 * el redirect a la URL firmada de R2.
 */
export async function getUserAvatarKey(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { avatarKey: true },
  });
  return user?.avatarKey ?? null;
}

/**
 * Listado paginado de usuarios para /admin/users con filtros opcionales.
 */
export async function listUsers(filters: UserListFilters) {
  const where: Prisma.UserWhereInput = {};

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: 'insensitive' } },
      { email: { contains: filters.q, mode: 'insensitive' } },
    ];
  }
  if (filters.role) where.role = filters.role;
  if (filters.region) where.region = filters.region;

  const skip = (filters.page - 1) * PAGE_SIZE;

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        region: true,
        subdivision: true,
        emailVerifiedAt: true,
        avatarKey: true,
        createdAt: true,
      },
    }),
    db.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return { users, total, totalPages, page: filters.page, pageSize: PAGE_SIZE };
}

export type UserListItem = Awaited<ReturnType<typeof listUsers>>['users'][number];

/**
 * Detalle de un usuario para el formulario de edición.
 */
export async function getUserById(id: string) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      region: true,
      subdivision: true,
      phone: true,
      rut: true,
      avatarKey: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });
}

export type UserDetail = NonNullable<Awaited<ReturnType<typeof getUserById>>>;

/**
 * Listado de instructores activos para autocomplete en el formulario de
 * curso (Fase 3b).
 */
export async function listInstructors() {
  return db.user.findMany({
    where: { role: 'INSTRUCTOR' },
    orderBy: [{ name: 'asc' }],
    select: { id: true, name: true, email: true },
  });
}

/**
 * Helpers para el rol — útiles en server components para evitar repetir
 * los strings literales.
 */
export function isAdminRole(role: Role): boolean {
  return role === 'SUPER_ADMIN';
}
