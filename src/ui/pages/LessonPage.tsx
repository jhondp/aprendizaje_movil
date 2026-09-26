import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCourse } from '@/application/CourseContext';
import { useNotes } from '@/application/hooks/useNotes';
import { useProgress } from '@/application/hooks/useProgress';
import { findLesson, type LessonComponent } from '@/domain/course';
import { stageProgress } from '@/domain/progress';
import { LessonProvider } from '@/ui/organisms/interactive/LessonContext';
import { MdxProvider } from '@/ui/organisms/interactive/MdxProvider';
import { LessonArticle } from '@/ui/organisms/LessonArticle';
import { Sidebar } from '@/ui/organisms/Sidebar';
import { LessonLayout } from '@/ui/templates/LessonLayout';
import { lessonPath, ROUTES } from '@/ui/routes';
import styles from './LessonPage.module.css';

export function LessonPage() {
  const { stageSlug = '', lessonSlug = '' } = useParams();
  const course = useCourse();
  const navigate = useNavigate();
  const { state, openLesson, completeLesson } = useProgress();
  const { notes, upsert } = useNotes();
  const lesson = findLesson(course, stageSlug, lessonSlug);
  const stage = lesson ? course.stages.find((s) => s.id === lesson.stage) : undefined;

  const [Body, setBody] = useState<LessonComponent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNote, setShowNote] = useState(false);

  useEffect(() => {
    if (!lesson) return;
    openLesson(lesson.id);
    setShowNote(Boolean(notes[lesson.id]?.text));
    let cancelled = false;
    setBody(null);
    setLoadError(null);
    lesson
      .load()
      .then((component) => {
        if (!cancelled) setBody(() => component);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : String(error));
      });
    return () => {
      cancelled = true;
    };
    // notes is intentionally not a dependency: it only seeds the initial visibility of the note box
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id, openLesson]);

  if (!lesson || !stage) {
    return (
      <section className={styles.notFound}>
        <h1>Lección no encontrada</h1>
        <Link to={ROUTES.library}>Volver a la biblioteca</Link>
      </section>
    );
  }

  const prev = lesson.prev ? (course.byId[lesson.prev] ?? null) : null;
  const next = lesson.next ? (course.byId[lesson.next] ?? null) : null;

  const complete = () => {
    completeLesson(lesson.id);
    navigate(next ? lessonPath(next) : ROUTES.library);
  };

  return (
    <LessonLayout
      sidebarOpen={sidebarOpen}
      onToggleSidebar={() => setSidebarOpen((o) => !o)}
      sidebar={
        <Sidebar
          stage={stage}
          currentLessonId={lesson.id}
          completed={state.completed}
          progress={stageProgress(stage, state.completed)}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      }
    >
      <LessonArticle
        lesson={lesson}
        stageTitle={stage.title}
        prev={prev}
        note={notes[lesson.id]?.text ?? ''}
        onNoteChange={(text) => upsert(lesson.id, text)}
        showNote={showNote}
        onToggleNote={() => setShowNote((s) => !s)}
        onComplete={complete}
      >
        <LessonProvider lessonId={lesson.id}>
          <MdxProvider>
            {loadError && (
              <p className={styles.error}>No pudimos cargar esta lección: {loadError}</p>
            )}
            {!Body && !loadError && <p className={styles.loading}>Cargando lección…</p>}
            {Body && <Body />}
          </MdxProvider>
        </LessonProvider>
      </LessonArticle>
    </LessonLayout>
  );
}
