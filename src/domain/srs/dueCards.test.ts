import { dueCards, isDue } from './dueCards';
import { cardKey, newCardState } from './gradeCard';
import type { SrsState } from './types';

const today = '2026-09-26';

const cards: SrsState = {
  [cardKey('01-js/00-a', 0)]: {
    key: cardKey('01-js/00-a', 0),
    lessonId: '01-js/00-a',
    front: 'q1',
    back: 'a1',
    state: newCardState(today),
    graded: false,
  },
  [cardKey('01-js/00-b', 0)]: {
    key: cardKey('01-js/00-b', 0),
    lessonId: '01-js/00-b',
    front: 'q2',
    back: 'a2',
    state: newCardState(today),
    graded: false,
  },
  [cardKey('01-js/00-c', 0)]: {
    key: cardKey('01-js/00-c', 0),
    lessonId: '01-js/00-c',
    front: 'q3',
    back: 'a3',
    state: { interval: 5, ease: 2.5, due: '2026-09-30', reps: 1 },
    graded: true,
  },
};

describe('isDue', () => {
  it('is due when due date is today or earlier', () => {
    expect(isDue({ interval: 1, ease: 2.5, due: '2026-09-26', reps: 1 }, today)).toBe(true);
    expect(isDue({ interval: 1, ease: 2.5, due: '2026-09-25', reps: 1 }, today)).toBe(true);
    expect(isDue({ interval: 1, ease: 2.5, due: '2026-09-27', reps: 1 }, today)).toBe(false);
  });
});

describe('dueCards', () => {
  it('includes new cards only from completed lessons and graded cards only when due', () => {
    const due = dueCards(cards, { '01-js/00-a': today }, today);
    expect(due.map((c) => c.lessonId)).toEqual(['01-js/00-a']);
  });

  it('includes graded cards once their due date arrives', () => {
    const due = dueCards(cards, {}, '2026-09-30');
    expect(due.map((c) => c.lessonId)).toEqual(['01-js/00-c']);
  });

  it('returns an empty list when nothing is due', () => {
    expect(dueCards({}, {}, today)).toEqual([]);
  });
});
