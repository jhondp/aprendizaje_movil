import type { Grade, SrsCard } from '@/domain/srs';
import styles from './ReviewCard.module.css';

const GRADES: { grade: Grade; label: string; when: string }[] = [
  { grade: 'again', label: 'Otra vez', when: 'hoy' },
  { grade: 'good', label: 'Bien', when: 'próximos días' },
  { grade: 'easy', label: 'Fácil', when: 'más adelante' },
];

export function ReviewCard({
  card,
  flipped,
  onFlip,
  onGrade,
}: {
  card: SrsCard;
  flipped: boolean;
  onFlip(): void;
  onGrade(grade: Grade): void;
}) {
  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.card}
        data-side={flipped ? 'back' : 'front'}
        onClick={onFlip}
      >
        <span className={styles.side}>{flipped ? 'Respuesta' : 'Pregunta'}</span>
        <span className={styles.text}>{flipped ? card.back : card.front}</span>
        <span className={styles.hint}>Toca para girar</span>
      </button>
      {flipped && (
        <div className={styles.grades}>
          {GRADES.map((g) => (
            <button
              key={g.grade}
              type="button"
              className={styles.grade}
              data-grade={g.grade}
              onClick={() => onGrade(g.grade)}
            >
              <span className={styles.gradeLabel}>{g.label}</span>
              <span className={styles.gradeWhen}>{g.when}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
