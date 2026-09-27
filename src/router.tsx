import { Link, useRoutes, type RouteObject } from 'react-router-dom';
import { AppShell } from '@/ui/templates/AppShell';
import { LibraryPage } from '@/ui/pages/LibraryPage';
import { LessonPage } from '@/ui/pages/LessonPage';
import { NotFoundPage } from '@/ui/pages/NotFoundPage';
import { ReviewPage } from '@/ui/pages/ReviewPage';
import { NotesPage } from '@/ui/pages/NotesPage';

/** Minimal branded fallback for unexpected render errors, so the routed
 * subtree never falls back to react-router's unstyled default error page. */
function RouteError() {
  return (
    <section style={{ padding: 'var(--page-gutter)' }}>
      <h1>Algo salió mal</h1>
      <p>
        <Link to="/">Volver al inicio</Link>
      </p>
    </section>
  );
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <LibraryPage /> },
      { path: 'etapa/:stageSlug/:lessonSlug', element: <LessonPage /> },
      { path: 'repaso', element: <ReviewPage /> },
      { path: 'notas', element: <NotesPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function AppRoutes() {
  return useRoutes(routes);
}
