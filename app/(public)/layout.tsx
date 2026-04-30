import { SiteFooter } from '@/components/features/SiteFooter';

/**
 * Layout del grupo (public). NO incluye header — cada página decide
 * el suyo (FloatingHeader en la landing, SiteHeader en el resto). Esto
 * evita renderizar dos headers cuando una página quiere su propia versión.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
