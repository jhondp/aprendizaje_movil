import type { LessonId } from '@/domain/course/types';
import type { ProgressState } from './types';

const MIN_GRADES_FOR_ACTIVE_DAY = 5;

export function emptyProgress(): ProgressState {
  return { completed: {}, quizScores: {}, checklists: {}, lastOpened: null, activityDays: [] };
}

function withActivityDay(state: ProgressState, day: string): ProgressState {
  if (state.activityDays.includes(day)) return state;
  return { ...state, activityDays: [...state.activityDays, day].sort() };
}

export function completeLesson(state: ProgressState, id: LessonId, today: string): ProgressState {
  const completed = id in state.completed ? state.completed : { ...state.completed, [id]: today };
  return withActivityDay({ ...state, completed }, today);
}

export function openLesson(state: ProgressState, id: LessonId): ProgressState {
  return state.lastOpened === id ? state : { ...state, lastOpened: id };
}

export function recordQuizScore(state: ProgressState, id: LessonId, score: number): ProgressState {
  const clamped = Math.min(1, Math.max(0, score));
  const previous = state.quizScores[id] ?? 0;
  if (clamped <= previous && id in state.quizScores) return state;
  return { ...state, quizScores: { ...state.quizScores, [id]: Math.max(previous, clamped) } };
}

export function toggleChecklistItem(
  state: ProgressState,
  key: string,
  index: number,
): ProgressState {
  const current = state.checklists[key] ?? [];
  const next = current.includes(index)
    ? current.filter((i) => i !== index)
    : [...current, index].sort((a, b) => a - b);
  return { ...state, checklists: { ...state.checklists, [key]: next } };
}

export function recordReviewSession(
  state: ProgressState,
  gradesCount: number,
  today: string,
): ProgressState {
  if (gradesCount < MIN_GRADES_FOR_ACTIVE_DAY) return state;
  return withActivityDay(state, today);
}
