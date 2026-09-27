import type { Clock } from '@/application/ports/Clock';

export function fixedClock(today: string, now = `${today}T12:00:00.000Z`): Clock {
  return { today: () => today, now: () => now };
}
