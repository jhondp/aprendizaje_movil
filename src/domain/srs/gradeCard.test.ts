import { gradeCard, newCardState } from './gradeCard';

const today = '2026-09-26';

describe('gradeCard (SM-2 lite)', () => {
  it('again resets interval and reps and lowers ease with a floor of 1.3', () => {
    const s = gradeCard({ interval: 10, ease: 1.4, due: today, reps: 3 }, 'again', today);
    expect(s).toEqual({ interval: 0, ease: 1.3, due: today, reps: 0 });
  });

  it('good on a new card schedules 1 day and keeps ease', () => {
    const s = gradeCard(newCardState(today), 'good', today);
    expect(s).toEqual({ interval: 1, ease: 2.5, due: '2026-09-27', reps: 1 });
  });

  it('good on a seen card multiplies interval by ease', () => {
    const s = gradeCard({ interval: 4, ease: 2.5, due: today, reps: 2 }, 'good', today);
    expect(s.interval).toBe(10);
    expect(s.due).toBe('2026-10-06');
    expect(s.reps).toBe(3);
  });

  it('easy on a new card schedules 3 days and raises ease by 0.15', () => {
    const s = gradeCard(newCardState(today), 'easy', today);
    expect(s).toEqual({ interval: 3, ease: 2.65, due: '2026-09-29', reps: 1 });
  });

  it('easy on a seen card multiplies by ease and 1.3', () => {
    const s = gradeCard({ interval: 4, ease: 2.5, due: today, reps: 2 }, 'easy', today);
    expect(s.interval).toBe(13);
    expect(s.ease).toBeCloseTo(2.65);
  });
});
