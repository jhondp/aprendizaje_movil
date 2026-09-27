import { Link } from 'react-router-dom';
import type { LessonId, Stage } from '@/domain/course';
import type { StageProgress } from '@/domain/progress';
import { ProgressBar } from '@/ui/atoms/ProgressBar';
import type { LessonState } from '@/ui/atoms/StatusDot';
import { LessonRow } from '@/ui/molecules/LessonRow';
import { ROUTES } from '@/ui/routes';
import styles from './Sidebar.module.css';

export function Sidebar({
  id,
  stage,
  currentLessonId,
  completed,
  progress,
  open,
  onClose,
}: {
  id?: string;
  stage: Stage;
  currentLessonId: LessonId;
  completed: Record<LessonId, string>;
  progress: StageProgress;
  open: boolean;
  onClose(): void;
}) {
  const stateOf = (id: LessonId): LessonState =>
    id === currentLessonId ? 'active' : id in completed ? 'done' : 'pending';
  return (
    <aside id={id} className={styles.root} data-open={open}>
      <Link to={ROUTES.library} className={styles.back} onClick={onClose}>
        ‹ Biblioteca
      </Link>
      <div className={styles.kicker}>Etapa {stage.id}</div>
      <h2 className={styles.title}>{stage.title}</h2>
      <ProgressBar pct={progress.pct} tone="lime" label={`Progreso de ${stage.title}`} />
      <div className={styles.pct}>{progress.pct}% completado</div>
      <nav aria-label="Lecciones de la etapa">
        {stage.modules.map((module) => (
          <div key={module.name} className={styles.module}>
            <div className={styles.moduleName}>{module.name}</div>
            {module.lessons.map((lesson) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                state={stateOf(lesson.id)}
                onNavigate={onClose}
              />
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
