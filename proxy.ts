import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// Next.js 16 renombró `middleware.ts` a `proxy.ts`. Este archivo corre en
// Edge runtime: NO puede importar Prisma ni bcrypt. Por eso re-usamos solo
// `authConfig` (ver auth.config.ts).
export default NextAuth(authConfig).auth;

export const config = {
  // Excluimos assets estáticos y rutas de Next/assets que no necesitan auth.
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp)).*)',
  ],
};
