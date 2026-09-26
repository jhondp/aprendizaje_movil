import { emptyProgress, type ProgressState } from '@/domain/progress';
import { emptyNotes, type NotesState } from '@/domain/notes';
import type { SrsState } from '@/domain/srs';
import type { Repositories } from '@/application/ports/Repositories';
import { createPersistedStore } from './createPersistedStore';
import { systemClock } from './systemClock';

export function createRepositories(): Repositories {
  return {
    progress: createPersistedStore<ProgressState>('progress', emptyProgress()),
    notes: createPersistedStore<NotesState>('notes', emptyNotes()),
    srs: createPersistedStore<SrsState>('srs', {}),
    clock: systemClock,
  };
}
