import type { ComponentType } from 'react';
import type { MDXComponents } from 'mdx/types';

export type LessonId = string;

/** The compiled MDX lesson body. Resolved lazily by the infrastructure layer. */
export type LessonComponent = ComponentType<{ components?: MDXComponents }>;
export type LessonLoader = () => Promise<LessonComponent>;

export interface LessonMeta {
  id: LessonId;
  title: string;
  stage: number;
  module: string;
  order: number;
  minutes: number;
  prereqs: LessonId[];
  summary: string;
  hidden?: boolean;
}

export interface Lesson extends LessonMeta {
  stageSlug: string;
  slug: string;
  prev: LessonId | null;
  next: LessonId | null;
  load: LessonLoader;
}

export interface Module {
  name: string;
  lessons: Lesson[];
}

export interface StageMeta {
  id: number;
  slug: string;
  title: string;
  mark: string;
  bg: string;
  fg: string;
  project: string;
  hours: number;
}

export interface Stage extends StageMeta {
  modules: Module[];
  lessons: Lesson[];
}

export interface Course {
  stages: Stage[];
  lessons: Lesson[];
  byId: Record<LessonId, Lesson>;
}
