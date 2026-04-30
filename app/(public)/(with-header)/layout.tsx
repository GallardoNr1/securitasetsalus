import { SiteHeader } from '@/components/features/SiteHeader';

/**
 * Layout para páginas públicas que llevan el SiteHeader clásico
 * (catálogo de cursos, detalle, verify, legal). La landing vive en el
 * `(public)/` directo con su propio FloatingHeader, así que NO entra
 * en este layout.
 */
export default function WithHeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
