import { Link } from 'react-router-dom';
import styles from './Brand.module.css';

export function Brand() {
  return (
    <Link to="/" className={styles.root}>
      <span className={styles.square} aria-hidden="true" />
      Saber
    </Link>
  );
}
