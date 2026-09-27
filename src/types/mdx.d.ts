declare module '*.mdx' {
  import type { ComponentType } from 'react';
  import type { MDXComponents } from 'mdx/types';
  import type { LessonMeta } from '@/domain/course/types';

  export const frontmatter: LessonMeta;
  const MDXContent: ComponentType<{ components?: MDXComponents }>;
  export default MDXContent;
}
