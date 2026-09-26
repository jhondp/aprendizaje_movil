import { addDays } from './dates';
import type { CardState, Grade } from './types';

const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;

export function cardKey(lessonId: string, index: number): string {
  return `${lessonId}#${index}`;
}

export function newCardState(today: string): CardState {
  return { interval: 0, ease: DEFAULT_EASE, due: today, reps: 0 };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function gradeCard(state: CardState, grade: Grade, today: string): CardState {
  if (grade === 'again') {
    return { interval: 0, ease: Math.max(MIN_EASE, round2(state.ease - 0.2)), due: today, reps: 0 };
  }
  if (grade === 'good') {
    const interval = state.reps === 0 ? 1 : Math.round(state.interval * state.ease);
    return { interval, ease: state.ease, due: addDays(today, interval), reps: state.reps + 1 };
  }
  const interval = state.reps === 0 ? 3 : Math.round(state.interval * state.ease * 1.3);
  return {
    interval,
    ease: round2(state.ease + 0.15),
    due: addDays(today, interval),
    reps: state.reps + 1,
  };
}
