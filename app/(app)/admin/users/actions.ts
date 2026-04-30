'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { createUserSchema, updateUserSchema } from '@/lib/validations/users';

type FieldErrors = Record<string, string>;

function flattenIssues(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.map((p) => String(p)).join('.');
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return null;
  }
  return session;
}

// ---------- Crear usuario ----------

export type CreateUserActionResult =
  | { ok: true; userId: string }
  | { ok: false; error: 'unauthorized' | 'invalid' | 'email-taken'; message: string; fieldErrors?: FieldErrors };

export async function createUserAction(formData: FormData): Promise<CreateUserActionResult> {
  const session = await requireSuperAdmin();
  if (!session) {
    return { ok: false, error: 'unauthorized', message: 'No tienes permisos.' };
  }

  const parsed = createUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    role: formData.get('role'),
    region: formData.get('region'),
    subdivision: formData.get('subdivision'),
    phone: formData.get('phone'),
    rut: formData.get('rut'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: 'invalid',
      message: 'Revisa los datos del formulario.',
      fieldErrors: flattenIssues(parsed.error.issues),
    };
  }

  const data = parsed.data;

  const existing = await db.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  if (existing) {
    return {
      ok: false,
      error: 'email-taken',
      message: 'Ya hay una cuenta con ese correo.',
    };
  }

  const passwordHash = data.password ? await hashPassword(data.password) : null;

  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      region: data.region,
      subdivision: data.subdivision ?? null,
      phone: data.phone ?? null,
      rut: data.rut ?? null,
      // Los usuarios creados manualmente quedan pre-verificados.
      // El registro público (/register) no usa este flujo, pasa por
      // /verify-email/[token] como en Fase 2.
      emailVerifiedAt: new Date(),
    },
    select: { id: true },
  });

  revalidatePath('/admin/users');
  return { ok: true, userId: user.id };
}

// ---------- Editar usuario ----------

export type UpdateUserActionResult =
  | { ok: true; message: string }
  | { ok: false; error: 'unauthorized' | 'not-found' | 'invalid'; message: string; fieldErrors?: FieldErrors };

export async function updateUserAction(
  userId: string,
  formData: FormData,
): Promise<UpdateUserActionResult> {
  const session = await requireSuperAdmin();
  if (!session) {
    return { ok: false, error: 'unauthorized', message: 'No tienes permisos.' };
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!target) {
    return { ok: false, error: 'not-found', message: 'Usuario no encontrado.' };
  }

  const parsed = updateUserSchema.safeParse({
    role: formData.get('role'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: 'invalid',
      message: 'Revisa los datos del formulario.',
      fieldErrors: flattenIssues(parsed.error.issues),
    };
  }

  // Salvaguarda: no permitimos que el último SUPER_ADMIN se desclasifique
  // a sí mismo (queda el sistema sin admin).
  if (target.role === 'SUPER_ADMIN' && parsed.data.role !== 'SUPER_ADMIN') {
    const adminCount = await db.user.count({ where: { role: 'SUPER_ADMIN' } });
    if (adminCount <= 1) {
      return {
        ok: false,
        error: 'invalid',
        message:
          'No puedes quitar el rol al único SUPER_ADMIN. Crea otro admin primero o cambia este después.',
      };
    }
  }

  await db.user.update({
    where: { id: userId },
    data: { role: parsed.data.role },
  });

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true, message: 'Rol actualizado.' };
}

// ---------- Acción navegacional para "Ver perfil" (redirect del cliente) ----------

export async function gotoUserDetail(userId: string) {
  redirect(`/admin/users/${userId}`);
}

// ---------- Suspender / reactivar cuenta ----------

export type SuspendUserActionResult =
  | { ok: true; message: string }
  | { ok: false; error: 'unauthorized' | 'not-found' | 'self' | 'last-admin'; message: string };

/**
 * Suspende una cuenta: rellena `suspendedAt` y opcionalmente `suspendedReason`.
 * El usuario suspendido no puede iniciar sesión (lo bloquea NextAuth en
 * `signIn` y `session` callbacks). Las relaciones (enrollments, diplomas)
 * se preservan para no romper la verificación pública histórica.
 *
 * Reglas de seguridad:
 * - Solo el SUPER_ADMIN puede suspender.
 * - No puedes suspenderte a ti mismo (te quedarías fuera).
 * - No puedes suspender al último SUPER_ADMIN activo.
 */
export async function suspendUserAction(
  userId: string,
  reason: string | null,
): Promise<SuspendUserActionResult> {
  const session = await requireSuperAdmin();
  if (!session) {
    return { ok: false, error: 'unauthorized', message: 'No tienes permisos.' };
  }

  if (session.user.id === userId) {
    return {
      ok: false,
      error: 'self',
      message: 'No puedes suspender tu propia cuenta — te quedarías sin acceso.',
    };
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, suspendedAt: true },
  });
  if (!target) {
    return { ok: false, error: 'not-found', message: 'Usuario no encontrado.' };
  }

  // Si suspender al último admin activo dejaría el sistema sin admin operativo.
  if (target.role === 'SUPER_ADMIN') {
    const activeAdmins = await db.user.count({
      where: { role: 'SUPER_ADMIN', suspendedAt: null },
    });
    if (activeAdmins <= 1) {
      return {
        ok: false,
        error: 'last-admin',
        message:
          'No puedes suspender al único administrador activo. Promociona otro admin primero.',
      };
    }
  }

  const trimmedReason = reason?.trim().slice(0, 500) ?? null;

  await db.user.update({
    where: { id: userId },
    data: {
      suspendedAt: new Date(),
      suspendedReason: trimmedReason && trimmedReason.length > 0 ? trimmedReason : null,
    },
  });

  // Invalidamos sesiones activas del usuario suspendido (NextAuth con
  // adapter Prisma persiste sesiones — borrarlas fuerza re-login).
  await db.session.deleteMany({ where: { userId } });

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true, message: 'Cuenta suspendida.' };
}

export type ReactivateUserActionResult =
  | { ok: true; message: string }
  | { ok: false; error: 'unauthorized' | 'not-found'; message: string };

export async function reactivateUserAction(
  userId: string,
): Promise<ReactivateUserActionResult> {
  const session = await requireSuperAdmin();
  if (!session) {
    return { ok: false, error: 'unauthorized', message: 'No tienes permisos.' };
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!target) {
    return { ok: false, error: 'not-found', message: 'Usuario no encontrado.' };
  }

  await db.user.update({
    where: { id: userId },
    data: { suspendedAt: null, suspendedReason: null },
  });

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true, message: 'Cuenta reactivada.' };
}
