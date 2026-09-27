import type { DayActivity } from '@/domain/progress';
import styles from './StreakBars.module.css';

export function StreakBars({ week, streak }: { week: DayActivity[]; streak: number }) {
  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <span className={styles.label}>Racha</span>
        <span className={styles.count}>{streak} días</span>
      </div>
      <div className={styles.bars}>
        {week.map((day) => (
          <div key={day.date} className={styles.day} data-testid="streak-day">
            <div className={styles.bar} data-active={day.active} data-today={day.isToday} />
            <span className={styles.dayLabel}>{day.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
