import type { ReactNode } from 'react';
import type { LessonId } from '@/domain/course';
import { LessonContext } from './useLessonId';

export function LessonProvider({
  lessonId,
  children,
}: {
  lessonId: LessonId;
  children: ReactNode;
}) {
  return <LessonContext.Provider value={lessonId}>{children}</LessonContext.Provider>;
}
