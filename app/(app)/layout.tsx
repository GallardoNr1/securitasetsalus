import { AppHeader } from '@/components/features/AppHeader';
import styles from './layout.module.scss';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className={styles.main}>{children}</main>
    </>
  );
}
