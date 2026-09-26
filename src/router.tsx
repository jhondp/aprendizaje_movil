import { useRoutes, type RouteObject } from 'react-router-dom';
import { AppShell } from '@/ui/templates/AppShell';
import { LibraryPage } from '@/ui/pages/LibraryPage';
import { NotFoundPage } from '@/ui/pages/NotFoundPage';

function LessonPlaceholder() {
  return <h1>Lección</h1>;
}
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
      { path: 'etapa/:stageSlug/:lessonSlug', element: <LessonPlaceholder /> },
      { path: 'repaso', element: <ReviewPlaceholder /> },
      { path: 'notas', element: <NotesPlaceholder /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function AppRoutes() {
  return useRoutes(routes);
}
