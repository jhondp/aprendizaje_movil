import type { ReactNode } from 'react';
import styles from './LessonLayout.module.css';

export function LessonLayout({
  sidebar,
  children,
  sidebarOpen,
  onToggleSidebar,
}: {
  sidebar: ReactNode;
  children: ReactNode;
  sidebarOpen: boolean;
  onToggleSidebar(): void;
}) {
  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={sidebarOpen}
        onClick={onToggleSidebar}
      >
        {sidebarOpen ? 'Cerrar índice' : 'Ver índice'}
      </button>
      {sidebar}
      {sidebarOpen && <div className={styles.scrim} onClick={onToggleSidebar} aria-hidden="true" />}
      <div className={styles.main}>{children}</div>
    </div>
  );
}
