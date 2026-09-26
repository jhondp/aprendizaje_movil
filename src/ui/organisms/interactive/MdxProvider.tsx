import { MDXProvider } from '@mdx-js/react';
import type { ReactNode } from 'react';
import { mdxComponents } from './mdxComponents';

export function MdxProvider({ children }: { children: ReactNode }) {
  return <MDXProvider components={mdxComponents}>{children}</MDXProvider>;
}
