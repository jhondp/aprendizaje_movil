import { completeLesson } from '@/domain/progress';
import type { LessonId } from '@/domain/course';
import type { Repositories } from '@/application/ports/Repositories';

export function completeLessonUseCase(
  repos: Pick<Repositories, 'progress' | 'clock'>,
  id: LessonId,
): void {
  repos.progress.set(completeLesson(repos.progress.get(), id, repos.clock.today()));
}
