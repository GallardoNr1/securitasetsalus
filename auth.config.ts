import type { NextAuthConfig } from 'next-auth';
import type { Role } from '@prisma/client';

// Las rutas tipadas (`Route`) las genera Next en `.next/types/` solo después
// de un build. En el callback edge usamos `string` simple para no acoplar
// auth.config a esa generación — el matcher de URL no necesita el tipo
// estricto y nos evita errores en dev antes del primer build.
type Route = string;

/**
 * Configuración base de NextAuth compatible con el runtime Edge del middleware
 * (proxy.ts en Next 16).
 *
 * Este archivo NO puede importar nada que dependa de Node.js (Prisma, bcrypt).
 * La configuración completa con providers + adaptador vive en `lib/auth.ts`.
 * Ver: https://authjs.dev/guides/edge-compatibility
 */

// Reglas de acceso por prefijo de ruta. Un array vacío en `roles` significa
// "cualquier usuario autenticado". Si una ruta no aparece aquí, es pública.
const routeRules: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: '/admin', roles: ['SUPER_ADMIN'] },
  { prefix: '/instructor', roles: ['INSTRUCTOR', 'SUPER_ADMIN'] },
  { prefix: '/dashboard', roles: ['STUDENT', 'SUPER_ADMIN'] },
  { prefix: '/my-courses', roles: ['STUDENT', 'SUPER_ADMIN'] },
  { prefix: '/my-diplomas', roles: ['STUDENT', 'SUPER_ADMIN'] },
  { prefix: '/billing', roles: ['STUDENT', 'SUPER_ADMIN'] },
  { prefix: '/profile', roles: [] },
];

// Rutas de autenticación: si el usuario YA está logueado, no tiene sentido
// mostrárselas — lo mandamos al dashboard que le corresponde.
const authPages = ['/login', '/register'];

function dashboardForRole(role: Role): Route {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin';
    case 'INSTRUCTOR':
      return '/instructor';
    case 'STUDENT':
    default:
      return '/dashboard';
  }
}

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  // Los providers reales viven en lib/auth.ts; aquí solo se declara la forma
  // del callback authorized para que el middleware pueda evaluarlo.
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const user = auth?.user;
      const { pathname } = nextUrl;

      // Redirigir usuarios ya logueados fuera de /login y /register.
      if (user && authPages.some((page) => pathname.startsWith(page))) {
        return Response.redirect(new URL(dashboardForRole(user.role), nextUrl));
      }

      // Rutas públicas: todo lo que no matchee ninguna regla.
      const rule = routeRules.find((r) => pathname.startsWith(r.prefix));
      if (!rule) return true;

      // Requiere sesión.
      if (!user) return false;

      // Si la regla define roles, el usuario debe tener uno de ellos.
      if (rule.roles.length > 0 && !rule.roles.includes(user.role)) {
        return Response.redirect(new URL(dashboardForRole(user.role), nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? token.id;
        token.role = user.role;
        token.region = user.region;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (token.role) session.user.role = token.role;
      session.user.region = token.region ?? null;
      return session;
    },
  },
} satisfies NextAuthConfig;

export { dashboardForRole };
