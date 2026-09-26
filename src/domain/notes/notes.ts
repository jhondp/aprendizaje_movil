import type { LessonId } from '@/domain/course/types';
import type { NotesState } from './types';

export function emptyNotes(): NotesState {
  return {};
}

export function upsertNote(
  state: NotesState,
  lessonId: LessonId,
  text: string,
  now: string,
): NotesState {
  if (text.trim() === '') {
    const { [lessonId]: _removed, ...rest } = state;
    void _removed;
    return rest;
  }
  return { ...state, [lessonId]: { lessonId, text, updatedAt: now } };
}
