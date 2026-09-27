import { useEffect, useState } from 'react';
import { useSrs } from '@/application/hooks/useSrs';
import { useLessonId } from './useLessonId';
import styles from './Flashcards.module.css';

export interface Flashcard {
  front: string;
  back: string;
}

export function Flashcards({ cards }: { cards: Flashcard[] }) {
  const lessonId = useLessonId();
  const { registerCards } = useSrs();
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  useEffect(() => {
    registerCards(lessonId, cards);
  }, [lessonId, cards, registerCards]);

  return (
    <section className={styles.root} aria-label="Tarjetas de repaso">
      <div className={styles.badge}>Tarjetas de repaso</div>
      <div className={styles.grid}>
        {cards.map((card, i) => {
          const isBack = flipped[i] === true;
          return (
            <button
              key={i}
              type="button"
              className={styles.card}
              data-side={isBack ? 'back' : 'front'}
              onClick={() => setFlipped((f) => ({ ...f, [i]: !isBack }))}
            >
              <span className={styles.side}>{isBack ? 'Respuesta' : 'Pregunta'}</span>
              <span className={styles.text}>{isBack ? card.back : card.front}</span>
              <span className={styles.hint}>Toca para girar</span>
            </button>
          );
        })}
      </div>
      <p className={styles.note}>
        Estas tarjetas se suman a tu repaso cuando completes la lección.
      </p>
    </section>
  );
}
