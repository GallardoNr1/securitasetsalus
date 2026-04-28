import { SiteHeader } from '@/components/features/SiteHeader';
import { SiteFooter } from '@/components/features/SiteFooter';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
