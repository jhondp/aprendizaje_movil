import type { RenderResult } from '@testing-library/react';
import { CourseProvider } from '@/application/CourseContext';
import type { Repositories } from '@/application/ports/Repositories';
import { renderWithRepositories } from '@/application/testing/renderWithRepositories';
import { AppRoutes } from '@/router';
import { testCourse } from './fixtures/testCourse';

export function renderApp(
  route: string,
  opts: { repos?: Partial<Repositories> } = {},
): { repos: Repositories } & RenderResult {
  return renderWithRepositories(
    <CourseProvider value={testCourse}>
      <AppRoutes />
    </CourseProvider>,
    { route, repos: opts.repos },
  );
}
