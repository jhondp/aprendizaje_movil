import styles from './StatusDot.module.css';

export type LessonState = 'done' | 'active' | 'pending';

export function StatusDot({ state }: { state: LessonState }) {
  return (
    <span className={styles.root} data-state={state} aria-hidden="true">
      {state === 'done' ? '✓' : ''}
    </span>
  );
}
