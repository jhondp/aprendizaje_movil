import { Link } from 'react-router-dom';
import type { Lesson } from '@/domain/course';
import { StatusDot, type LessonState } from '@/ui/atoms/StatusDot';
import { lessonPath } from '@/ui/routes';
import styles from './LessonRow.module.css';

export function LessonRow({
  lesson,
  state,
  onNavigate,
}: {
  lesson: Lesson;
  state: LessonState;
  onNavigate?(): void;
}) {
  return (
    <Link to={lessonPath(lesson)} className={styles.root} data-state={state} onClick={onNavigate}>
      <StatusDot state={state} />
      <span className={styles.title}>{lesson.title}</span>
      <span className={styles.minutes}>{lesson.minutes} min</span>
    </Link>
  );
}
