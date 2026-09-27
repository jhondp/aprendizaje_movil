import type { LessonId } from '@/domain/course/types';

export interface Note {
  lessonId: LessonId;
  text: string;
  updatedAt: string;
}

export type NotesState = Record<LessonId, Note>;
