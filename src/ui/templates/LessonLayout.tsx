import { useEffect, type ReactNode } from 'react';
import styles from './LessonLayout.module.css';

export function LessonLayout({
  sidebar,
  sidebarId,
  children,
  sidebarOpen,
  onToggleSidebar,
  onCloseSidebar,
}: {
  sidebar: ReactNode;
  sidebarId: string;
  children: ReactNode;
  sidebarOpen: boolean;
  onToggleSidebar(): void;
  onCloseSidebar(): void;
}) {
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseSidebar();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [sidebarOpen, onCloseSidebar]);

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={sidebarOpen}
        aria-controls={sidebarId}
        onClick={onToggleSidebar}
      >
        {sidebarOpen ? 'Cerrar índice' : 'Ver índice'}
      </button>
      {sidebar}
      {sidebarOpen && <div className={styles.scrim} onClick={onCloseSidebar} aria-hidden="true" />}
      <div className={styles.main}>{children}</div>
    </div>
  );
}
