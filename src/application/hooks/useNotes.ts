import { useCallback } from 'react';
import { upsertNote, type NotesState } from '@/domain/notes';
import type { LessonId } from '@/domain/course';
import { useRepositories } from '@/application/useRepositories';
import { useStoreValue } from './useStoreValue';

export function useNotes(): { notes: NotesState; upsert(lessonId: LessonId, text: string): void } {
  const repos = useRepositories();
  const notes = useStoreValue(repos.notes);
  const upsert = useCallback(
    (lessonId: LessonId, text: string) =>
      repos.notes.set(upsertNote(repos.notes.get(), lessonId, text, repos.clock.now())),
    [repos],
  );
  return { notes, upsert };
}
