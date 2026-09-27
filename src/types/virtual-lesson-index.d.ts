declare module 'virtual:lesson-index' {
  import type { LessonMeta } from '@/domain/course/types';

  /** Lesson frontmatter keyed by root-relative path, e.g. `/content/01-javascript/00-a.mdx`. */
  const lessonIndex: Record<string, LessonMeta>;
  export default lessonIndex;
}
