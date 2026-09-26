import styles from './ProgressBar.module.css';

export function ProgressBar({
  pct,
  tone = 'teal',
  onDark = false,
  label = 'Progreso',
}: {
  pct: number;
  tone?: 'lime' | 'teal';
  onDark?: boolean;
  label?: string;
}) {
  const value = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className={styles.track}
      data-on-dark={onDark}
    >
      <div className={styles.fill} data-tone={tone} style={{ width: `${value}%` }} />
    </div>
  );
}
