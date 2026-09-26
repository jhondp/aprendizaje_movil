import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '@/application/hooks/useProgress';
import { useSrs } from '@/application/hooks/useSrs';
import type { Grade, SrsCard } from '@/domain/srs';
import { ProgressBar } from '@/ui/atoms/ProgressBar';
import { ReviewCard } from '@/ui/organisms/ReviewCard';
import { ROUTES } from '@/ui/routes';
import styles from './ReviewPage.module.css';

const GRADES_FOR_ACTIVITY = 5;

export function ReviewPage() {
  const { due, cards, grade } = useSrs();
  const { recordReviewSession } = useProgress();
  const [queue, setQueue] = useState<SrsCard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [graded, setGraded] = useState(0);
  const recorded = useRef(false);

  useEffect(() => {
    if (queue === null) setQueue(due);
  }, [due, queue]);

  useEffect(() => {
    if (graded >= GRADES_FOR_ACTIVITY && !recorded.current) {
      recorded.current = true;
      recordReviewSession(graded);
    }
  }, [graded, recordReviewSession]);

  if (queue === null) return null;

  if (queue.length === 0) {
    return (
      <section className={styles.empty}>
        <h1>No tienes tarjetas pendientes</h1>
        <p>Completa lecciones para sumar tarjetas a tu repaso.</p>
        <Link to={ROUTES.library}>Volver a la biblioteca</Link>
      </section>
    );
  }

  if (index >= queue.length) {
    return (
      <section className={styles.empty}>
        <h1>Sesión terminada</h1>
        <p>Repasaste {graded} tarjetas. Vuelve mañana para mantener la racha.</p>
        <Link to={ROUTES.library}>Volver a la biblioteca</Link>
      </section>
    );
  }

  const current = queue[index]!;
  const live = cards[current.key] ?? current;

  const onGrade = (g: Grade) => {
    grade(current.key, g);
    setGraded((n) => n + 1);
    setFlipped(false);
    if (g === 'again') setQueue((q) => (q ? [...q, current] : q));
    setIndex((i) => i + 1);
  };

  return (
    <section className={styles.root}>
      <div className={styles.bar}>
        <Link to={ROUTES.library} className={styles.exit}>
          ✕ Salir
        </Link>
        <span className={styles.barTitle}>Repaso</span>
        <span>
          {index + 1} / {queue.length}
        </span>
      </div>
      <ProgressBar
        pct={((index + 1) / queue.length) * 100}
        tone="lime"
        onDark
        label="Progreso del repaso"
      />
      <div className={styles.stage}>
        <ReviewCard
          card={live}
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
          onGrade={onGrade}
        />
      </div>
    </section>
  );
}
