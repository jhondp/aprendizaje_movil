import type { LessonId } from '@/domain/course/types';

export type Grade = 'again' | 'good' | 'easy';

export interface CardState {
  interval: number;
  ease: number;
  due: string;
  reps: number;
}

export interface SrsCard {
  key: string;
  lessonId: LessonId;
  front: string;
  back: string;
  state: CardState;
  graded: boolean;
}

export type SrsState = Record<string, SrsCard>;
