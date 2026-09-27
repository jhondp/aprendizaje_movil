import { cardKey, newCardState, type SrsCard } from '@/domain/srs';
import type { LessonId } from '@/domain/course';
import type { Repositories } from '@/application/ports/Repositories';

/**
 * Syncs the SRS deck with the lesson's current flashcards: adds new cards, refreshes the text of
 * existing ones (keeping their review state) and drops cards the lesson no longer has.
 * Writes nothing when the deck is already in sync.
 */
export function registerCardsUseCase(
  repos: Pick<Repositories, 'srs' | 'clock'>,
  lessonId: LessonId,
  cards: { front: string; back: string }[],
): void {
  const current = repos.srs.get();
  const today = repos.clock.today();
  const wanted = new Set(cards.map((_, index) => cardKey(lessonId, index)));
  let changed = false;
  const next: Record<string, SrsCard> = {};
  for (const [key, card] of Object.entries(current)) {
    if (card.lessonId === lessonId && !wanted.has(key)) {
      changed = true;
      continue;
    }
    next[key] = card;
  }
  cards.forEach(({ front, back }, index) => {
    const key = cardKey(lessonId, index);
    const existing = next[key];
    if (existing) {
      if (existing.front === front && existing.back === back) return;
      next[key] = { ...existing, front, back };
    } else {
      next[key] = { key, lessonId, front, back, state: newCardState(today), graded: false };
    }
    changed = true;
  });
  if (changed) repos.srs.set(next);
}
