import type { Course, Lesson } from '@/domain/course';
import { useRepositories } from '@/application/useRepositories';
import { continueLearning } from '@/application/useCases/continueLearning';
import { useStoreValue } from './useStoreValue';

export function useContinueLearning(course: Course): Lesson | null {
  const repos = useRepositories();
  const progress = useStoreValue(repos.progress);
  return continueLearning(course, progress);
}
