import { screen } from '@testing-library/react';
import { renderApp } from '@/test/renderApp';
import { createMemoryStore } from '@/application/testing/memoryStore';

describe('NotesPage', () => {
  it('shows an empty state', () => {
    renderApp('/notas');
    expect(screen.getByText('Todavía no escribiste ninguna nota')).toBeInTheDocument();
  });

  it('groups notes by stage with a link to the lesson', () => {
    renderApp('/notas', {
      repos: {
        notes: createMemoryStore({
          '00-intro/00-a': {
            lessonId: '00-intro/00-a',
            text: 'Primera nota',
            updatedAt: '2026-09-26T10:00:00.000Z',
          },
          '01-js/00-a': {
            lessonId: '01-js/00-a',
            text: 'Otra nota',
            updatedAt: '2026-09-26T11:00:00.000Z',
          },
        }),
      },
    });
    expect(screen.getByRole('heading', { name: 'Intro' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'JS' })).toBeInTheDocument();
    expect(screen.getByText('Primera nota')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Qué es un programa' })).toHaveAttribute(
      'href',
      '/etapa/00-intro/00-a',
    );
  });
});
