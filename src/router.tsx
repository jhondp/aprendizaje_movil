import { useRoutes, type RouteObject } from 'react-router-dom';
import { AppShell } from '@/ui/templates/AppShell';
import { LibraryPage } from '@/ui/pages/LibraryPage';
import { LessonPage } from '@/ui/pages/LessonPage';
import { NotFoundPage } from '@/ui/pages/NotFoundPage';
import { ReviewPage } from '@/ui/pages/ReviewPage';
import { NotesPage } from '@/ui/pages/NotesPage';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
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
