import { dueCards, type SrsCard } from '@/domain/srs';
import type { Repositories } from '@/application/ports/Repositories';

export function dueCardsUseCase(
  repos: Pick<Repositories, 'srs' | 'progress' | 'clock'>,
): SrsCard[] {
  return dueCards(repos.srs.get(), repos.progress.get().completed, repos.clock.today());
}
