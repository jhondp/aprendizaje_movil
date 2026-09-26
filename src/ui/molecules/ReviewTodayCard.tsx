import { Link } from 'react-router-dom';
import { ROUTES } from '@/ui/routes';
import styles from './ReviewTodayCard.module.css';

export function ReviewTodayCard({ count }: { count: number }) {
  return (
    <Link
      to={ROUTES.review}
      className={styles.root}
      aria-label={`Repaso de hoy: ${count} tarjetas`}
    >
      <span className={styles.label}>Repaso de hoy</span>
      <span className={styles.row}>
        <span className={styles.count}>
          {count}
          <span className={styles.unit}>tarjetas</span>
        </span>
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
      </span>
    </Link>
  );
}
