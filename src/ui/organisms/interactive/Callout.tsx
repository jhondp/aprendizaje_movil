import type { ReactNode } from 'react';
import styles from './Callout.module.css';

export type CalloutKind = 'tip' | 'warning' | 'danger';

const ICON: Record<CalloutKind, string> = { tip: 'i', warning: '!', danger: '×' };

export function Callout({ kind = 'tip', children }: { kind?: CalloutKind; children: ReactNode }) {
  return (
    <aside role="note" data-kind={kind} className={styles.root}>
      <span className={styles.icon} aria-hidden="true">
        {ICON[kind]}
      </span>
      <div className={styles.body}>{children}</div>
    </aside>
  );
}
