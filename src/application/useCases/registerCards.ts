import { cardKey, newCardState, type SrsCard } from '@/domain/srs';
import type { LessonId } from '@/domain/course';
import type { Repositories } from '@/application/ports/Repositories';

export function registerCardsUseCase(
  repos: Pick<Repositories, 'srs' | 'clock'>,
  lessonId: LessonId,
  cards: { front: string; back: string }[],
): void {
  const current = repos.srs.get();
  const today = repos.clock.today();
  let changed = false;
  const next: Record<string, SrsCard> = { ...current };
  cards.forEach((card, index) => {
    const key = cardKey(lessonId, index);
    if (key in next) return;
    next[key] = {
      key,
      lessonId,
      front: card.front,
      back: card.back,
      state: newCardState(today),
      graded: false,
    };
    changed = true;
  });
  if (changed) repos.srs.set(next);
}
