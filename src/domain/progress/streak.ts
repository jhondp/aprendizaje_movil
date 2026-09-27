import { addDays, parseIsoDate } from '@/domain/srs/dates';
import type { DayActivity } from './types';

const WEEK_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function computeStreak(activityDays: string[], today: string): number {
  const days = new Set(activityDays);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function lastSevenDays(activityDays: string[], today: string): DayActivity[] {
  const days = new Set(activityDays);
  const weekday = parseIsoDate(today).getDay();
  const offsetToMonday = weekday === 0 ? 6 : weekday - 1;
  const monday = addDays(today, -offsetToMonday);
  return WEEK_LABELS.map((label, i) => {
    const date = addDays(monday, i);
    return { date, label, active: days.has(date), isToday: date === today };
  });
}
