import { useMemo } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { CourseProvider } from '@/application/CourseContext';
import { RepositoriesProvider } from '@/application/RepositoriesContext';
import { loadCourse } from '@/infrastructure/content/loadCourse';
import { createRepositories } from '@/infrastructure/storage/createRepositories';
import { routes } from '@/router';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

export function App() {
  const repositories = useMemo(() => createRepositories(), []);
  const course = useMemo(() => loadCourse(), []);
  const router = useMemo(
    () =>
      createBrowserRouter(routes, {
        basename,
        future: { v7_relativeSplatPath: true },
      }),
    [],
  );
  return (
    <RepositoriesProvider value={repositories}>
      <CourseProvider value={course}>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </CourseProvider>
    </RepositoriesProvider>
  );
}
