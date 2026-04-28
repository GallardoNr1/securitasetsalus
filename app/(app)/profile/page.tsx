import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { SUPPORTED_REGIONS, type SupportedRegion } from '@/lib/regions';
import { ProfileForm } from './ProfileForm';

export const metadata: Metadata = {
  title: 'Mi perfil',
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      region: true,
      subdivision: true,
      phone: true,
      rut: true,
    },
  });
  if (!user) redirect('/login');

  // Forzamos region al tipo SupportedRegion (default a CL si está vacía o no
  // forma parte del catálogo, lo cual no debería ocurrir pero blindamos).
  const region: SupportedRegion =
    user.region && (SUPPORTED_REGIONS as readonly string[]).includes(user.region)
      ? (user.region as SupportedRegion)
      : 'CL';

  return (
    <ProfileForm
      initial={{
        name: user.name,
        email: user.email,
        region,
        subdivision: user.subdivision,
        phone: user.phone,
        rut: user.rut,
      }}
    />
  );
}
