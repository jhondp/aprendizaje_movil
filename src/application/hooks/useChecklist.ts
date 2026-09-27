import { useCallback } from 'react';
import { toggleChecklistItem } from '@/domain/progress';
import type { LessonId } from '@/domain/course';
import { useRepositories } from '@/application/RepositoriesContext';
import { useStoreValue } from './useStoreValue';

export function checklistKey(lessonId: LessonId, id: string): string {
  return `${lessonId}:${id}`;
}

export function useChecklist(
  lessonId: LessonId,
  id: string,
): { checked: number[]; toggle(index: number): void } {
  const repos = useRepositories();
  const { checklists } = useStoreValue(repos.progress);
  const key = checklistKey(lessonId, id);
  const toggle = useCallback(
    (index: number) => repos.progress.set(toggleChecklistItem(repos.progress.get(), key, index)),
    [repos, key],
  );
  return { checked: checklists[key] ?? [], toggle };
}
