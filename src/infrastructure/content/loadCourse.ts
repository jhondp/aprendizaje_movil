import stagesJson from '../../../content/stages.json';
import {
  buildCourse,
  type Course,
  type LessonId,
  type LessonLoader,
  type LessonMeta,
  type StageMeta,
} from '@/domain/course';
import { idFromPath, lessonComponents, lessonFrontmatter } from './lessonModules';

const stages = stagesJson as StageMeta[];

function collectMetas(): LessonMeta[] {
  return Object.entries(lessonFrontmatter).map(([path, meta]) => ({
    ...meta,
    id: idFromPath(path),
  }));
}

function collectLoaders(): Record<LessonId, LessonLoader> {
  const loaders: Record<LessonId, LessonLoader> = {};
  for (const [path, loader] of Object.entries(lessonComponents)) loaders[idFromPath(path)] = loader;
  return loaders;
}

let cached: Course | null = null;

export function loadCourse(): Course {
  if (!cached) cached = buildCourse(stages, collectMetas(), collectLoaders());
  return cached;
}
