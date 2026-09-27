import type { Course, Lesson } from '@/domain/course';
import type { ProgressState } from '@/domain/progress';

export function continueLearning(course: Course, progress: ProgressState): Lesson | null {
  if (progress.lastOpened) {
    const last = course.byId[progress.lastOpened];
    if (last && !last.hidden) return last;
  }
  return course.lessons.find((l) => !l.hidden && !(l.id in progress.completed)) ?? null;
}
