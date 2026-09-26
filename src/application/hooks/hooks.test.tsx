import { act, screen } from '@testing-library/react';
import { renderWithRepositories } from '@/application/testing/renderWithRepositories';
import { useProgress } from './useProgress';
import { useStreak } from './useStreak';
import { useNotes } from './useNotes';
import { useChecklist } from './useChecklist';
import { useSrs } from './useSrs';

function Probe() {
  const progress = useProgress();
  const { streak } = useStreak();
  const notes = useNotes();
  const checklist = useChecklist('a/b', 'release');
  const srs = useSrs();
  return (
    <div>
      <span data-testid="streak">{streak}</span>
      <span data-testid="completed">{Object.keys(progress.state.completed).join(',')}</span>
      <span data-testid="note">{notes.notes['a/b']?.text ?? ''}</span>
      <span data-testid="checked">{checklist.checked.join(',')}</span>
      <span data-testid="due">{srs.due.length}</span>
      <button onClick={() => progress.completeLesson('a/b')}>complete</button>
      <button onClick={() => notes.upsert('a/b', 'nota')}>note</button>
      <button onClick={() => checklist.toggle(1)}>toggle</button>
      <button onClick={() => srs.registerCards('a/b', [{ front: 'q', back: 'a' }])}>
        register
      </button>
    </div>
  );
}

describe('application hooks', () => {
  it('re-render on store changes and route actions through the domain', () => {
    renderWithRepositories(<Probe />);
    expect(screen.getByTestId('streak')).toHaveTextContent('0');
    act(() => screen.getByText('register').click());
    expect(screen.getByTestId('due')).toHaveTextContent('0');
    act(() => screen.getByText('complete').click());
    expect(screen.getByTestId('completed')).toHaveTextContent('a/b');
    expect(screen.getByTestId('streak')).toHaveTextContent('1');
    expect(screen.getByTestId('due')).toHaveTextContent('1');
    act(() => screen.getByText('note').click());
    expect(screen.getByTestId('note')).toHaveTextContent('nota');
    act(() => screen.getByText('toggle').click());
    expect(screen.getByTestId('checked')).toHaveTextContent('1');
  });
});
