import { useRoutes, type RouteObject } from 'react-router-dom';
import { AppShell } from '@/ui/templates/AppShell';
import { LibraryPage } from '@/ui/pages/LibraryPage';
import { LessonPage } from '@/ui/pages/LessonPage';
import { NotFoundPage } from '@/ui/pages/NotFoundPage';

function ReviewPlaceholder() {
  return <h1>Repaso</h1>;
}
function NotesPlaceholder() {
  return <h1>Notas</h1>;
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <LibraryPage /> },
      { path: 'etapa/:stageSlug/:lessonSlug', element: <LessonPage /> },
      { path: 'repaso', element: <ReviewPlaceholder /> },
      { path: 'notas', element: <NotesPlaceholder /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function AppRoutes() {
  return useRoutes(routes);
}
