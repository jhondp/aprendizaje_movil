import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '@/test/renderApp';
import { emptyProgress } from '@/domain/progress';
import { createMemoryStore } from '@/application/testing/memoryStore';

describe('LibraryPage', () => {
  it('shows greeting, continue card, review card, streak and one card per stage', () => {
    renderApp('/');
    expect(
      screen.getByRole('heading', { name: 'Todo lo que aprendes, en un solo lugar.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reanudar lección' })).toHaveAttribute(
      'href',
      '/etapa/00-intro/00-a',
    );
    expect(screen.getByRole('link', { name: /Repaso de hoy: 0 tarjetas/ })).toBeInTheDocument();
    expect(screen.getByText('0 días')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /% completado/ })).toHaveLength(2);
  });

  it('filters stages by progress', async () => {
    renderApp('/', {
      repos: {
        progress: createMemoryStore({
          ...emptyProgress(),
          completed: { '00-intro/00-a': '2026-09-26', '00-intro/01-b': '2026-09-26' },
        }),
      },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Terminados' }));
    expect(screen.getAllByRole('link', { name: /% completado/ })).toHaveLength(1);
    expect(screen.getByRole('link', { name: /Intro, 100% completado/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'En curso' }));
    expect(screen.getByRole('link', { name: /JS, 0% completado/ })).toBeInTheDocument();
  });
});
