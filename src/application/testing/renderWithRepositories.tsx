import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { emptyProgress } from '@/domain/progress';
import { emptyNotes } from '@/domain/notes';
import type { SrsState } from '@/domain/srs';
import { RepositoriesProvider } from '@/application/RepositoriesContext';
import type { Repositories } from '@/application/ports/Repositories';
import { createMemoryStore } from './memoryStore';
import { fixedClock } from './fixedClock';

export function testRepositories(over: Partial<Repositories> = {}): Repositories {
  return {
    progress: createMemoryStore(emptyProgress()),
    notes: createMemoryStore(emptyNotes()),
    srs: createMemoryStore<SrsState>({}),
    clock: fixedClock('2026-09-26'),
    ...over,
  };
}

export function renderWithRepositories(
  ui: ReactElement,
  opts: { repos?: Partial<Repositories>; route?: string } = {},
): { repos: Repositories } & RenderResult {
  const repos = testRepositories(opts.repos);
  const result = render(
    <RepositoriesProvider value={repos}>
      <MemoryRouter
        initialEntries={[opts.route ?? '/']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        {ui}
      </MemoryRouter>
    </RepositoriesProvider>,
  );
  return { repos, ...result };
}
