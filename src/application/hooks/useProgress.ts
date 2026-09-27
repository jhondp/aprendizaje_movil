import { useCallback } from 'react';
import {
  openLesson,
  recordQuizScore,
  recordReviewSession,
  type ProgressState,
} from '@/domain/progress';
import type { LessonId } from '@/domain/course';
import { useRepositories } from '@/application/useRepositories';
import { completeLessonUseCase } from '@/application/useCases/completeLesson';
import { useStoreValue } from './useStoreValue';

export function useProgress(): {
  state: ProgressState;
  completeLesson(id: LessonId): void;
  openLesson(id: LessonId): void;
  recordQuizScore(id: LessonId, score: number): void;
  recordReviewSession(gradesCount: number): void;
} {
  const repos = useRepositories();
  const state = useStoreValue(repos.progress);
  return {
    state,
    completeLesson: useCallback((id: LessonId) => completeLessonUseCase(repos, id), [repos]),
    openLesson: useCallback(
      (id: LessonId) => repos.progress.set(openLesson(repos.progress.get(), id)),
      [repos],
    ),
    recordQuizScore: useCallback(
      (id: LessonId, score: number) =>
        repos.progress.set(recordQuizScore(repos.progress.get(), id, score)),
      [repos],
    ),
    recordReviewSession: useCallback(
      (gradesCount: number) =>
        repos.progress.set(
          recordReviewSession(repos.progress.get(), gradesCount, repos.clock.today()),
        ),
      [repos],
    ),
  };
}
