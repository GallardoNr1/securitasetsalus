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
