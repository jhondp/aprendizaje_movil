import { addDays, toIsoDate } from './dates';

describe('dates', () => {
  it('adds days across month boundaries', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('formats a Date as YYYY-MM-DD in local time', () => {
    expect(toIsoDate(new Date(2026, 8, 26, 23, 30))).toBe('2026-09-26');
  });
});
