import type { Stage } from '@/domain/course/types';
import type { StageProgress } from './types';

export function stageProgress(stage: Stage, completed: Record<string, string>): StageProgress {
  const total = stage.lessons.length;
  const done = stage.lessons.filter((l) => l.id in completed).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, pct };
}
