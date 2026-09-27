import { useState, type ReactNode } from 'react';
import styles from './Challenge.module.css';

export function Challenge({
  title,
  children,
  solution,
}: {
  title: string;
  children: ReactNode;
  solution: ReactNode;
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <section className={styles.root}>
      <div className={styles.head}>
        <span className={styles.badge}>Ejercicio</span>
        <h3 className={styles.title}>{title}</h3>
      </div>
      <div>{children}</div>
      <button type="button" className={styles.toggle} onClick={() => setRevealed((r) => !r)}>
        {revealed ? 'Ocultar solución' : 'Ver solución'}
      </button>
      {revealed && (
        <div className={styles.solution}>
          <div className={styles.solutionLabel}>Solución</div>
          {solution}
        </div>
      )}
    </section>
  );
}
