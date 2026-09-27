import { emptyProgress } from '@/domain/progress';
import { emptyNotes } from '@/domain/notes';
import { buildCourse } from '@/domain/course';
import type { SrsState } from '@/domain/srs';
import { createMemoryStore } from '@/application/testing/memoryStore';
import { fixedClock } from '@/application/testing/fixedClock';
import { completeLessonUseCase } from './completeLesson';
import { gradeCardUseCase } from './gradeCard';
import { registerCardsUseCase } from './registerCards';
import { dueCardsUseCase } from './dueCards';
import { continueLearning } from './continueLearning';

const today = '2026-09-26';

function repos() {
  return {
    progress: createMemoryStore(emptyProgress()),
    notes: createMemoryStore(emptyNotes()),
    srs: createMemoryStore<SrsState>({}),
    clock: fixedClock(today),
  };
}

describe('use cases', () => {
  it('registers cards idempotently and only exposes them once the lesson is completed', () => {
    const r = repos();
    registerCardsUseCase(r, 'a/b', [{ front: 'q', back: 'a' }]);
    registerCardsUseCase(r, 'a/b', [{ front: 'q', back: 'a' }]);
    expect(Object.keys(r.srs.get())).toEqual(['a/b#0']);
    expect(dueCardsUseCase(r)).toEqual([]);
    completeLessonUseCase(r, 'a/b');
    expect(dueCardsUseCase(r).map((c) => c.key)).toEqual(['a/b#0']);
  });

  it('refreshes card text from the lesson while preserving review state', () => {
    const r = repos();
    registerCardsUseCase(r, 'a/b', [{ front: 'q', back: 'a' }]);
    gradeCardUseCase(r, 'a/b#0', 'good');
    const before = r.srs.get()['a/b#0'];
    registerCardsUseCase(r, 'a/b', [{ front: 'q2', back: 'a2' }]);
    expect(r.srs.get()['a/b#0']).toEqual({ ...before, front: 'q2', back: 'a2' });
  });

  it('drops cards that no longer exist in the lesson and keeps other lessons', () => {
    const r = repos();
    const five = [0, 1, 2, 3, 4].map((i) => ({ front: `q${i}`, back: `a${i}` }));
    registerCardsUseCase(r, 'a/b', five);
    registerCardsUseCase(r, 'x/y', [{ front: 'o', back: 'p' }]);
    registerCardsUseCase(r, 'a/b', five.slice(0, 3));
    expect(Object.keys(r.srs.get()).sort()).toEqual(['a/b#0', 'a/b#1', 'a/b#2', 'x/y#0']);
  });

  it('does not write the store when nothing changes', () => {
    const r = repos();
    registerCardsUseCase(r, 'a/b', [{ front: 'q', back: 'a' }]);
    const set = vi.spyOn(r.srs, 'set');
    registerCardsUseCase(r, 'a/b', [{ front: 'q', back: 'a' }]);
    expect(set).not.toHaveBeenCalled();
  });

  it('grading marks the card as graded and reschedules it', () => {
    const r = repos();
    registerCardsUseCase(r, 'a/b', [{ front: 'q', back: 'a' }]);
    gradeCardUseCase(r, 'a/b#0', 'good');
    expect(r.srs.get()['a/b#0']).toMatchObject({
      graded: true,
      state: { due: '2026-09-27', reps: 1 },
    });
    expect(dueCardsUseCase(r)).toEqual([]);
  });

  it('ignores grades for unknown cards', () => {
    const r = repos();
    gradeCardUseCase(r, 'nope', 'good');
    expect(r.srs.get()).toEqual({});
  });
});

describe('continueLearning', () => {
  const course = buildCourse(
    [{ id: 0, slug: 's', title: 'S', mark: 'S', bg: '#000', fg: '#111', project: '', hours: 1 }],
    [
      {
        id: 's/00-a',
        title: 'a',
        stage: 0,
        module: 'M',
        order: 0,
        minutes: 1,
        prereqs: [],
        summary: '',
      },
      {
        id: 's/01-b',
        title: 'b',
        stage: 0,
        module: 'M',
        order: 1,
        minutes: 1,
        prereqs: [],
        summary: '',
      },
    ],
  );
  it('prefers the last opened lesson', () => {
    expect(continueLearning(course, { ...emptyProgress(), lastOpened: 's/01-b' })?.id).toBe(
      's/01-b',
    );
  });
  it('falls back to the first incomplete lesson', () => {
    expect(
      continueLearning(course, { ...emptyProgress(), completed: { 's/00-a': today } })?.id,
    ).toBe('s/01-b');
  });
  it('returns null when everything is complete', () => {
    expect(
      continueLearning(course, {
        ...emptyProgress(),
        completed: { 's/00-a': today, 's/01-b': today },
      }),
    ).toBeNull();
  });
});
