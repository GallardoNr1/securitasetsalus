import type { Role } from '@prisma/client';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /** Campos propios añadidos al objeto User que devuelve `authorize`. */
  interface User {
    role: Role;
    region: string | null;
  }

  /** Forma final de `auth()`.user y `useSession().data.user`. */
  interface Session {
    user: {
      id: string;
      role: Role;
      region: string | null;
    } & DefaultSession['user'];
  }
}

// NextAuth v5 beta re-exporta desde @auth/core. Duplicamos la augmentation
// para cubrir los dos caminos posibles de import durante la compilación.
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    region: string | null;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: Role;
    region: string | null;
  }
}
