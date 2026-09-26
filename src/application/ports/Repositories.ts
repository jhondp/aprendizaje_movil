import type { ProgressState } from '@/domain/progress';
import type { NotesState } from '@/domain/notes';
import type { SrsState } from '@/domain/srs';
import type { Clock } from './Clock';
import type { Store } from './Store';

export interface Repositories {
  progress: Store<ProgressState>;
  notes: Store<NotesState>;
  srs: Store<SrsState>;
  clock: Clock;
}
