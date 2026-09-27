import { createContext, useContext } from 'react';
import type { LessonId } from '@/domain/course';

export const LessonContext = createContext<LessonId | null>(null);

export function useLessonId(): LessonId {
  const id = useContext(LessonContext);
  if (!id) throw new Error('useLessonId must be used inside a LessonProvider');
  return id;
}
