import type { Lesson, Stage } from '@/domain/course';
import type { StageProgress } from '@/domain/progress';
import { ButtonLink } from '@/ui/atoms/Button';
import { ProgressBar } from '@/ui/atoms/ProgressBar';
import { lessonPath } from '@/ui/routes';
import styles from './ContinueCard.module.css';

export function ContinueCard({
  lesson,
  stage,
  progress,
}: {
  lesson: Lesson | null;
  stage: Stage | null;
  progress: StageProgress;
}) {
  return (
    <section className={styles.root}>
      <span className={styles.circleBig} aria-hidden="true" />
      <span className={styles.circleSmall} aria-hidden="true" />
      <div className={styles.kicker}>Continuar aprendiendo</div>
      <div className={styles.content}>
        {lesson && stage ? (
          <>
            <div className={styles.meta}>
              {stage.title} · {lesson.module}
            </div>
            <div className={styles.title}>{lesson.title}</div>
            <div className={styles.actions}>
              <ButtonLink to={lessonPath(lesson)}>Reanudar lección</ButtonLink>
              <div className={styles.progress}>
                <ProgressBar
                  pct={progress.pct}
                  tone="lime"
                  onDark
                  label={`Progreso de ${stage.title}`}
                />
                <div className={styles.progressText}>
                  {progress.pct}% · {progress.done} de {progress.total} lecciones
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.title}>Completaste todo el curso</div>
        )}
      </div>
    </section>
  );
}
