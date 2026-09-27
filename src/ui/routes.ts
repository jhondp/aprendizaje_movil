import type { Lesson } from '@/domain/course';

export function lessonPath(lesson: Pick<Lesson, 'stageSlug' | 'slug'>): string {
  return `/etapa/${lesson.stageSlug}/${lesson.slug}`;
}

export const ROUTES = { library: '/', review: '/repaso', notes: '/notas' } as const;
