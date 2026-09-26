import type { MDXComponents } from 'mdx/types';
import { Playground } from './Playground';
import { LazySandpack } from './LazySandpack';
import { Snack } from './Snack';
import { Quiz } from './Quiz';
import { Flashcards } from './Flashcards';
import { Challenge } from './Challenge';
import { Terminal } from './Terminal';
import { Checklist } from './Checklist';
import { Callout } from './Callout';

export const mdxComponents: MDXComponents = {
  Playground,
  Sandpack: LazySandpack,
  Snack,
  Quiz,
  Flashcards,
  Challenge,
  Terminal,
  Checklist,
  Callout,
};
