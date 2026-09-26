import type { LessonComponent, LessonMeta } from '@/domain/course';

export const lessonFrontmatter = import.meta.glob<LessonMeta>('/content/**/*.mdx', {
  eager: true,
  import: 'frontmatter',
});

export const lessonComponents = import.meta.glob<LessonComponent>('/content/**/*.mdx', {
  import: 'default',
});

/** `/content/01-javascript/03-funciones.mdx` -> `01-javascript/03-funciones` */
export function idFromPath(path: string): string {
  return path.replace(/^\/content\//, '').replace(/\.mdx$/, '');
}
