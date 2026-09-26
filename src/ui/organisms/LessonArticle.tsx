import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Lesson } from '@/domain/course';
import { Button } from '@/ui/atoms/Button';
import { NoteBox } from '@/ui/molecules/NoteBox';
import { lessonPath } from '@/ui/routes';
import styles from './LessonArticle.module.css';

export function LessonArticle({
  lesson,
  stageTitle,
  prev,
  note,
  onNoteChange,
  showNote,
  onToggleNote,
  onComplete,
  children,
}: {
  lesson: Lesson;
  stageTitle: string;
  prev: Lesson | null;
  note: string;
  onNoteChange(text: string): void;
  showNote: boolean;
  onToggleNote(): void;
  onComplete(): void;
  children: ReactNode;
}) {
  return (
    <>
      <div className={styles.topbar}>
        <span>
          {stageTitle} · {lesson.module}
        </span>
        <Button variant="ghost" onClick={onToggleNote} className={styles.noteButton}>
          {showNote ? 'Ocultar nota' : 'Añadir nota'}
        </Button>
      </div>
      <article className={styles.article}>
        <div className={styles.minutes}>{lesson.minutes} min de lectura y práctica</div>
        <h1 className={styles.title}>{lesson.title}</h1>
        <p className={styles.summary}>{lesson.summary}</p>
        {showNote && <NoteBox value={note} onChange={onNoteChange} />}
        <div className={styles.body}>{children}</div>
        <footer className={styles.footer}>
          {prev ? (
            <Link to={lessonPath(prev)} className={styles.prev}>
              ‹ Anterior
            </Link>
          ) : (
            <span />
          )}
          <Button onClick={onComplete}>
            {lesson.next ? 'Completar y seguir ›' : 'Completar y terminar'}
          </Button>
        </footer>
      </article>
    </>
  );
}
