import type { ReactNode } from 'react';
import styles from './Chip.module.css';

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick(): void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={styles.root}
      data-active={active}
    >
      {children}
    </button>
  );
}
