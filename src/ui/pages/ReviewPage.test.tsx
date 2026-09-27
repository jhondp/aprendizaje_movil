import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '@/test/renderApp';
import { createMemoryStore } from '@/application/testing/memoryStore';
import { emptyProgress } from '@/domain/progress';
import { cardKey, newCardState, type SrsState } from '@/domain/srs';

const today = '2026-09-26';

function deck(n: number): SrsState {
  const cards: SrsState = {};
  for (let i = 0; i < n; i += 1) {
    const key = cardKey('00-intro/00-a', i);
    cards[key] = {
      key,
      lessonId: '00-intro/00-a',
      front: `P${i}`,
      back: `R${i}`,
      state: newCardState(today),
      graded: false,
    };
  }
  return cards;
}

describe('ReviewPage', () => {
  it('shows the empty state when nothing is due', () => {
    renderApp('/repaso');
    expect(screen.getByText('No tienes tarjetas pendientes')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver a la biblioteca' })).toBeInTheDocument();
  });

  it('walks through due cards, reschedules them and counts the session as activity', async () => {
    const { repos } = renderApp('/repaso', {
      repos: {
        srs: createMemoryStore(deck(5)),
        progress: createMemoryStore({ ...emptyProgress(), completed: { '00-intro/00-a': today } }),
      },
    });
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
    for (let i = 0; i < 5; i += 1) {
      await userEvent.click(screen.getByRole('button', { name: /Toca para girar/ }));
      await userEvent.click(screen.getByRole('button', { name: /Bien/ }));
    }
    expect(screen.getByText('Sesión terminada')).toBeInTheDocument();
    expect(repos.srs.get()['00-intro/00-a#0']?.state.due).toBe('2026-09-27');
    expect(repos.progress.get().activityDays).toEqual([today]);
  });

  it('re-queues a card graded again', async () => {
    renderApp('/repaso', {
      repos: {
        srs: createMemoryStore(deck(1)),
        progress: createMemoryStore({ ...emptyProgress(), completed: { '00-intro/00-a': today } }),
      },
    });
    await userEvent.click(screen.getByRole('button', { name: /Toca para girar/ }));
    await userEvent.click(screen.getByRole('button', { name: /Otra vez/ }));
    expect(screen.getByText('P0')).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });
});
