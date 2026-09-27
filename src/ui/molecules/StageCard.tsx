import { Link } from 'react-router-dom';
import type { Stage } from '@/domain/course';
import type { StageProgress } from '@/domain/progress';
import { ProgressBar } from '@/ui/atoms/ProgressBar';
import { lessonPath } from '@/ui/routes';
import styles from './StageCard.module.css';

function pluralize(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function StageCard({ stage, progress }: { stage: Stage; progress: StageProgress }) {
  const first = stage.lessons[0];
  const meta = `${pluralize(stage.lessons.length, 'lección', 'lecciones')} · ${pluralize(stage.modules.length, 'módulo', 'módulos')} · ${stage.hours} h`;
  const body = (
    <>
      <div className={styles.cover} style={{ background: stage.bg }}>
        <span className={styles.mark} style={{ color: stage.fg }}>
          {stage.mark}
        </span>
      </div>
      <div className={styles.body}>
        <div className={styles.meta}>{first ? meta : 'Próximamente'}</div>
        <div className={styles.title}>{stage.title}</div>
        <div className={styles.bar}>
          <ProgressBar pct={progress.pct} label={`Progreso de ${stage.title}`} />
        </div>
      </div>
    </>
  );
  if (!first) return <div className={styles.root}>{body}</div>;
  return (
    <Link
      to={lessonPath(first)}
      className={styles.root}
      aria-label={`${stage.title}, ${progress.pct}% completado`}
    >
      {body}
    </Link>
  );
}
