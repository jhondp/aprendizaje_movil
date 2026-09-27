import { gradeCard, type Grade } from '@/domain/srs';
import type { Repositories } from '@/application/ports/Repositories';

export function gradeCardUseCase(
  repos: Pick<Repositories, 'srs' | 'clock'>,
  key: string,
  grade: Grade,
): void {
  const cards = repos.srs.get();
  const card = cards[key];
  if (!card) return;
  const state = gradeCard(card.state, grade, repos.clock.today());
  repos.srs.set({ ...cards, [key]: { ...card, state, graded: true } });
}
