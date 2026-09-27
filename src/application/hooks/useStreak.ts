import { computeStreak, lastSevenDays, type DayActivity } from '@/domain/progress';
import { useRepositories } from '@/application/useRepositories';
import { useStoreValue } from './useStoreValue';

export function useStreak(): { streak: number; week: DayActivity[] } {
  const repos = useRepositories();
  const { activityDays } = useStoreValue(repos.progress);
  const today = repos.clock.today();
  return { streak: computeStreak(activityDays, today), week: lastSevenDays(activityDays, today) };
}
