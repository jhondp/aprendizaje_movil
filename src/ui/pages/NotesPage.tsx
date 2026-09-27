import { Link } from 'react-router-dom';
import { useCourse } from '@/application/CourseContext';
import { useNotes } from '@/application/hooks/useNotes';
import { lessonPath } from '@/ui/routes';
import styles from './NotesPage.module.css';

export function NotesPage() {
  const course = useCourse();
  const { notes } = useNotes();
  const groups = course.stages
    .map((stage) => ({
      stage,
      items: stage.lessons
        .filter((l) => notes[l.id])
        .map((l) => ({ lesson: l, note: notes[l.id]! })),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <section className={styles.root}>
      <h1 className={styles.title}>Notas</h1>
      {groups.length === 0 && <p className={styles.empty}>Todavía no escribiste ninguna nota</p>}
      {groups.map(({ stage, items }) => (
        <div key={stage.id} className={styles.group}>
          <h2 className={styles.stage}>{stage.title}</h2>
          {items.map(({ lesson, note }) => (
            <article key={lesson.id} className={styles.note}>
              <Link to={lessonPath(lesson)} className={styles.lesson}>
                {lesson.title}
              </Link>
              <p className={styles.text}>{note.text}</p>
              <time className={styles.time} dateTime={note.updatedAt}>
                {new Date(note.updatedAt).toLocaleDateString('es')}
              </time>
            </article>
          ))}
        </div>
      ))}
    </section>
  );
}
