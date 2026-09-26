import { computeStreak, lastSevenDays } from './streak';

const today = '2026-09-26';

describe('computeStreak', () => {
  it('is zero with no activity', () => {
    expect(computeStreak([], today)).toBe(0);
  });
  it('counts consecutive days ending today', () => {
    expect(computeStreak(['2026-09-24', '2026-09-25', '2026-09-26'], today)).toBe(3);
  });
  it('survives when today has no activity yet but yesterday did', () => {
    expect(computeStreak(['2026-09-24', '2026-09-25'], today)).toBe(2);
  });
  it('breaks after a missed calendar day', () => {
    expect(computeStreak(['2026-09-22', '2026-09-23', '2026-09-25'], today)).toBe(1);
    expect(computeStreak(['2026-09-22', '2026-09-23'], today)).toBe(0);
  });
});

describe('lastSevenDays', () => {
  it('returns Monday to Sunday labels for the current week with activity flags', () => {
    const week = lastSevenDays(['2026-09-22', '2026-09-26'], today);
    expect(week.map((d) => d.label)).toEqual(['L', 'M', 'X', 'J', 'V', 'S', 'D']);
    expect(week.map((d) => d.date)).toEqual([
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
    ]);
    expect(week.filter((d) => d.active).map((d) => d.date)).toEqual(['2026-09-22', '2026-09-26']);
    expect(week.find((d) => d.isToday)?.date).toBe(today);
  });
});
