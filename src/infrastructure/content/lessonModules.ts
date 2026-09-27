import lessonIndex from 'virtual:lesson-index';
import type { LessonComponent, LessonMeta } from '@/domain/course';

/** Frontmatter of every lesson, built by `scripts/vite/lessonIndexPlugin.ts` without importing
 *  the MDX modules, so each lesson body stays in its own lazily loaded chunk. */
export const lessonFrontmatter: Record<string, LessonMeta> = lessonIndex;

export const lessonComponents = import.meta.glob<LessonComponent>('/content/**/*.mdx', {
  import: 'default',
});

/** `/content/01-javascript/03-funciones.mdx` -> `01-javascript/03-funciones` */
export function idFromPath(path: string): string {
  return path.replace(/^\/content\//, '').replace(/\.mdx$/, '');
}
