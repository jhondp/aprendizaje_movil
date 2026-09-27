import type { CardState, SrsCard, SrsState } from './types';

export function isDue(state: CardState, today: string): boolean {
  return state.due <= today;
}

export function dueCards(
  cards: SrsState,
  completed: Record<string, string>,
  today: string,
): SrsCard[] {
  return Object.values(cards)
    .filter((card) => (card.graded ? isDue(card.state, today) : card.lessonId in completed))
    .sort((a, b) => a.key.localeCompare(b.key));
}
