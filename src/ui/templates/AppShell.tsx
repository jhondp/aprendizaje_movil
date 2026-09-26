import { Outlet } from 'react-router-dom';
import { TopNav } from '@/ui/organisms/TopNav';
import styles from './AppShell.module.css';

export function AppShell() {
  return (
    <div className={styles.root}>
      <TopNav />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
