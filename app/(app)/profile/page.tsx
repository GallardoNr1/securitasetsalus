import type { Metadata } from 'next';
import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { isBucketConfigured } from '@/lib/r2-config';
import { SUPPORTED_REGIONS, type SupportedRegion } from '@/lib/regions';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { AvatarUploader } from './AvatarUploader';
import { ProfileForm } from './ProfileForm';
import { ProfileSidebar } from './ProfileSidebar';
import styles from './profile.module.scss';

const DASHBOARD_FOR_ROLE: Record<'SUPER_ADMIN' | 'INSTRUCTOR' | 'STUDENT', { label: string; href: Route }> = {
  SUPER_ADMIN: { label: 'Panel admin', href: '/admin' },
  INSTRUCTOR: { label: 'Panel instructor', href: '/instructor' },
  STUDENT: { label: 'Mi panel', href: '/dashboard' },
};

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
      id: true,
      name: true,
      email: true,
      region: true,
      subdivision: true,
      phone: true,
      rut: true,
      avatarKey: true,
    },
  });
  if (!user) redirect('/login');

  const region: SupportedRegion =
    user.region && (SUPPORTED_REGIONS as readonly string[]).includes(user.region)
      ? (user.region as SupportedRegion)
      : 'CL';

  const avatarsConfigured = isBucketConfigured('avatars');
  const home = DASHBOARD_FOR_ROLE[session.user.role];

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: home.label, href: home.href },
          { label: 'Mi perfil' },
        ]}
      />

      <header className={styles.pageHeader}>
        <span className={styles.pageEyebrow}>Mi cuenta</span>
        <h1 className={styles.pageTitle}>
          Editar <span className={styles.pageTitleItalic}>perfil.</span>
        </h1>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebarWrap}>
          <ProfileSidebar />
        </aside>

        <div className={styles.main}>
          {/* Foto de perfil — vive bajo la sección "Datos personales".
              El id="datos" lo lleva la primera section dentro de ProfileForm. */}
          <section className={styles.section}>
            <header className={styles.sectionHeader}>
              <h2>Foto de perfil</h2>
              <p>
                {avatarsConfigured
                  ? 'Sube una foto cuadrada para que aparezca en la cabecera y, en el futuro, en tu perfil público.'
                  : 'El almacenamiento de avatares aún no está configurado. La opción se activa en cuanto el admin rellene las variables R2_*.'}
              </p>
            </header>

            {avatarsConfigured ? (
              <AvatarUploader userId={user.id} name={user.name} avatarKey={user.avatarKey} />
            ) : (
              <p className={styles.hint}>
                Mientras tanto, tu avatar muestra las iniciales generadas a partir de tu nombre.
              </p>
            )}
          </section>

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

          {/* Notificaciones — placeholder por ahora */}
          <section id="notificaciones" className={styles.section}>
            <header className={styles.sectionHeader}>
              <h2>Notificaciones</h2>
              <p>Decide qué emails y avisos quieres recibir desde SES.</p>
            </header>

            <div className={styles.placeholder}>
              <span className={styles.placeholderTag}>Próximamente</span>
              <p>
                Por ahora envíamos los avisos imprescindibles: confirmación de inscripción,
                recordatorio de cohorte, emisión de diploma y revocación. Cuando esto se abra,
                podrás silenciar las categorías opcionales (newsletter, lanzamientos).
              </p>
            </div>
          </section>

          {/* Métodos de pago — placeholder hasta que Stripe entre en live */}
          <section id="pagos" className={styles.section}>
            <header className={styles.sectionHeader}>
              <h2>Métodos de pago</h2>
              <p>Tarjetas guardadas en Stripe y facturas históricas.</p>
            </header>

            <div className={styles.placeholder}>
              <span className={styles.placeholderTag}>Próximamente</span>
              <p>
                La pasarela Stripe está integrada en modo dual y se abrirá en cuanto
                emitamos la primera factura chilena con la SpA. Mientras tanto, las inscripciones
                pagadas vía empresa (SENCE) se gestionan por correo con{' '}
                empresas@securitasetsalus.cl.
              </p>
            </div>
          </section>

          {/* Eliminar cuenta — placeholder destructivo */}
          <section
            id="peligro"
            className={`${styles.section} ${styles.dangerSection}`}
          >
            <header className={styles.sectionHeader}>
              <h2>Eliminar cuenta</h2>
              <p>
                Esta acción es irreversible. Tu información personal se anonimiza, pero los
                diplomas emitidos siguen vivos para no romper la verificación pública.
              </p>
            </header>

            <button type="button" className={styles.dangerButton} disabled>
              Solicitar eliminación
            </button>
            <p className={styles.hint}>
              Por ahora la eliminación se procesa manualmente — escríbenos a{' '}
              hola@securitasetsalus.cl indicando tu RUT y motivo.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
