import { createContext, useContext, type ReactNode } from 'react';
import type { LessonId } from '@/domain/course';

const LessonContext = createContext<LessonId | null>(null);

export function LessonProvider({
  lessonId,
  children,
}: {
  lessonId: LessonId;
  children: ReactNode;
}) {
  return <LessonContext.Provider value={lessonId}>{children}</LessonContext.Provider>;
}

export function useLessonId(): LessonId {
  const id = useContext(LessonContext);
  if (!id) throw new Error('useLessonId must be used inside a LessonProvider');
  return id;
}
