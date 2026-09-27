import { toIsoDate } from '@/domain/srs';
import type { Clock } from '@/application/ports/Clock';

export const systemClock: Clock = {
  today: () => toIsoDate(new Date()),
  now: () => new Date().toISOString(),
};
