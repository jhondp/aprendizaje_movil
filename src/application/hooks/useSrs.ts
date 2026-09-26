import { useCallback, useMemo } from 'react';
import { dueCards, type Grade, type SrsCard, type SrsState } from '@/domain/srs';
import type { LessonId } from '@/domain/course';
import { useRepositories } from '@/application/RepositoriesContext';
import { gradeCardUseCase } from '@/application/useCases/gradeCard';
import { registerCardsUseCase } from '@/application/useCases/registerCards';
import { useStoreValue } from './useStoreValue';

export function useSrs(): {
  cards: SrsState;
  due: SrsCard[];
  registerCards(lessonId: LessonId, cards: { front: string; back: string }[]): void;
  grade(key: string, grade: Grade): void;
} {
  const repos = useRepositories();
  const cards = useStoreValue(repos.srs);
  const { completed } = useStoreValue(repos.progress);
  const today = repos.clock.today();
  const due = useMemo(() => dueCards(cards, completed, today), [cards, completed, today]);
  return {
    cards,
    due,
    registerCards: useCallback(
      (lessonId: LessonId, list: { front: string; back: string }[]) =>
        registerCardsUseCase(repos, lessonId, list),
      [repos],
    ),
    grade: useCallback((key: string, grade: Grade) => gradeCardUseCase(repos, key, grade), [repos]),
  };
}
