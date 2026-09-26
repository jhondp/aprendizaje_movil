import type { LessonId } from '@/domain/course/types';

export interface ProgressState {
  completed: Record<LessonId, string>;
  quizScores: Record<LessonId, number>;
  checklists: Record<string, number[]>;
  lastOpened: LessonId | null;
  activityDays: string[];
}

export interface DayActivity {
  date: string;
  label: string;
  active: boolean;
  isToday: boolean;
}

export interface StageProgress {
  done: number;
  total: number;
  pct: number;
}
