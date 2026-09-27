import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import remarkGfm from 'remark-gfm';
import path from 'node:path';
import { lessonIndexPlugin } from './scripts/vite/lessonIndexPlugin';

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [
          remarkFrontmatter,
          [remarkMdxFrontmatter, { name: 'frontmatter' }],
          remarkGfm,
        ],
      }),
    },
    lessonIndexPlugin(),
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/application/**'],
      exclude: ['**/*.test.*', 'src/application/testing/**'],
      thresholds: { lines: 90, branches: 85, functions: 90, statements: 90 },
    },
  },
});
