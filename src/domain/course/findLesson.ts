import type { Course, Lesson } from './types';

export function findLesson(
  course: Course,
  stageSlug: string,
  lessonSlug: string,
): Lesson | undefined {
  return course.byId[`${stageSlug}/${lessonSlug}`];
}
