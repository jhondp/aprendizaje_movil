# Saber Platform (Wave 1 Scaffold) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the static web platform ("Saber") that hosts the React Native course: design tokens from the template, four screens, nine MDX interactive components, pure domain (course, SRS, progress, notes), localStorage persistence, MDX content pipeline, content validator, one real lesson, one hidden demo lesson, and CI/deploy workflows.

**Architecture:** Hexagonal-lite: `src/domain` is pure TypeScript (no React, no browser), `src/application` defines ports (a minimal `Store<T>` contract plus `Clock`) and use cases, `src/infrastructure` implements the ports with Zustand vanilla stores persisted to localStorage and loads MDX lessons via `import.meta.glob`, and `src/ui` is atomic design (atoms → molecules → organisms → templates → pages) consuming application hooks. Content lives outside `src` in `content/<stage>/<nn>-<slug>.mdx` with YAML frontmatter, so writer agents only touch their own directory.

**Tech Stack:** pnpm, Vite 6, React 18, TypeScript 5 (strict), react-router-dom 6, @mdx-js/rollup + @mdx-js/react 3, remark-frontmatter, remark-mdx-frontmatter, remark-gfm, zustand 5 (vanilla + persist), sucrase, @codesandbox/sandpack-react, Vitest 3 + Testing Library + jsdom, ESLint 9 flat config + typescript-eslint, Prettier 3, tsx, gray-matter, CSS modules.

**Spec:** `docs/superpowers/specs/2026-09-26-saber-platform-design.md`

## Global Constraints

- Package manager is pnpm. Executor runs `pnpm install` once after Task 1 and commits `pnpm-lock.yaml`. Dependency versions below use caret ranges; if a version does not resolve, take the newest version of the same major and note it in the commit body.
- TypeScript `strict: true`, `noUncheckedIndexedAccess: true`. `pnpm typecheck` must pass with zero errors after every task.
- `src/domain/**` has no runtime import from `react`, `zustand`, or browser globals (`window`, `document`, `localStorage`). Type-only imports of React and MDX types are allowed there, solely so `Lesson.load()` can be typed.
- `src/application/**` imports only from `src/domain/**`, `react` (for hooks and context), and its own files. Never from `src/infrastructure/**` or `src/ui/**`. The only exception is `src/application/testing/**`, which is test support and may import `react-router-dom` and Testing Library.
- All UI copy, lesson prose, quiz text and flashcards are neutral professional Spanish. All identifiers, comments, file names, test names and commit messages are English.
- Commit messages follow Conventional Commits. Never add `Co-Authored-By` or any AI attribution line.
- Formatting: `pnpm lint` includes `prettier --check .`, so every task runs `pnpm format` (Prettier `--write`) before `pnpm lint` and before `git add`. Code blocks in this plan are written to fit `printWidth: 100` with single quotes; whatever is left over, `pnpm format` normalizes. Hex colours in CSS and JSON are lowercase (Prettier lowercases them anyway).
- `prereqs` in lesson frontmatter are lesson ids (e.g. `["01-javascript/02-condicionales"]`), never titles. The `## Objetivo` section repeats them in prose on a line starting with `**Prerrequisitos:**` (or `**Prerrequisitos:** ninguno.`).
- Styling is plain CSS modules plus `src/ui/tokens.css`. No Tailwind, no CSS-in-JS, no Storybook, no Redux.
- Design tokens (spec 8.3, hex lowercased): `--color-ink: #022a2a; --color-teal: #10484a; --color-accent: #ff3d00; --color-lime: #9bc62b; --color-sand: #efe6da; --color-paper: #f6f1ea; --color-canvas: #e4ddd2;` font Poppins; radii 10/14/22/28px. Light theme only.
- Lesson id format is `<stage-dir>/<file-name-without-extension>`, e.g. `01-javascript/03-funciones`. Routes are `/etapa/:stageSlug/:lessonSlug`, `/repaso`, `/notas`, `/`.
- Dates in domain state are ISO calendar dates `YYYY-MM-DD` (never full timestamps) except `Note.updatedAt`, which is a full ISO timestamp.
- Lesson MDX section order (spec section 4): `## Objetivo`, `## Concepto`, `## Práctica`, `## Ejercicio`, `## Errores comunes`, `<Flashcards`, `<Quiz`. Exactly one `Quiz` with 3 questions; one `Flashcards` with 3 to 5 cards.

## Review Focus

1. **A lesson file with malformed or partial frontmatter** (missing `order`, `stage` as a string, `prereqs` omitted): the app must not crash at boot; the validator must name the file and the missing field. Pinned in Task 21 (`validateLesson` reports missing fields) and Task 3 (`buildCourse` defaults `prereqs` to `[]` and `hidden` to `false`).
2. **Two lessons declaring the same `order` inside one stage, or the same `id`**: sidebar order must be deterministic (tie-break by id) and the validator must flag duplicate ids. Pinned in Task 3 (tie-break test) and Task 21 (duplicate id test).
3. **localStorage unavailable or containing garbage** (private mode, old schema): stores must fall back to the initial state instead of throwing at boot. Pinned in Task 8 (corrupt JSON test, missing localStorage test).
4. **Review session with zero due cards, or a card whose lesson was never completed**: `/repaso` must render an empty state, and new cards must not appear before their lesson is completed. Pinned in Task 4/7 (`dueCards` test) and Task 20 (empty state smoke test).
5. **Learner code in `Playground` that throws, never resolves, or contains `</script>`**: the sandbox must report the error, must not hang the page, and must not break out of the srcdoc. Pinned in Task 13 (escape test, error message test, timeout test).

---

### Task 1: Project scaffold and toolchain

**Files:**
- Create: `package.json`, `.gitignore`, `.npmrc`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `eslint.config.js`, `.prettierrc`, `.prettierignore`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `src/test/setup.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: `pnpm dev|build|lint|typecheck|test|validate:content` scripts; path alias `@/` → `src/`; Vitest with jsdom and Testing Library matchers; the MDX plugin is wired here so later tasks only add files.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "saber",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint . && prettier --check .",
    "format": "prettier --write .",
    "typecheck": "tsc -b --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "validate:content": "tsx scripts/validate-content.ts"
  },
  "dependencies": {
    "@codesandbox/sandpack-react": "^2.19.0",
    "@mdx-js/react": "^3.1.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.0",
    "sucrase": "^3.35.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.17.0",
    "@mdx-js/rollup": "^3.1.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/mdx": "^2.0.13",
    "@types/node": "^22.10.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "eslint": "^9.17.0",
    "eslint-plugin-react-hooks": "^5.1.0",
    "eslint-plugin-react-refresh": "^0.4.16",
    "globals": "^15.14.0",
    "gray-matter": "^4.0.3",
    "jsdom": "^25.0.1",
    "prettier": "^3.4.2",
    "remark-frontmatter": "^5.0.0",
    "remark-gfm": "^4.0.0",
    "remark-mdx-frontmatter": "^5.0.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "typescript-eslint": "^8.19.0",
    "@vitest/coverage-v8": "^3.0.0",
    "vite": "^6.0.7",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create `.gitignore`, `.npmrc`, `.prettierrc`, `.prettierignore`**

`.gitignore`:
```
node_modules
dist
coverage
.vite
*.local
.DS_Store
```

`.npmrc`:
```
auto-install-peers=true
strict-peer-dependencies=false
```

`.prettierrc`:
```json
{ "singleQuote": true, "semi": true, "printWidth": 100, "trailingComma": "all" }
```

`.prettierignore`:
```
dist
pnpm-lock.yaml
template
docs
.atl
content/**/*.mdx
*.md
content/**/*.mdx
```

- [ ] **Step 3: Create `tsconfig.json` and `tsconfig.node.json`**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client", "vitest/globals", "@testing-library/jest-dom", "node"],
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src", "scripts", "content/stages.json"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "types": ["node"],
    "allowSyntheticDefaultImports": true,
    "noEmit": true
  },
  "include": ["vite.config.ts", "eslint.config.js"]
}
```

- [ ] **Step 4: Create `vite.config.ts` (MDX wired from day one)**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import remarkGfm from 'remark-gfm';
import path from 'node:path';

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
  },
});
```

- [ ] **Step 5: Create `eslint.config.js`**

```js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'template', 'content', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-*', 'mdx/*'], allowTypeImports: true },
            { group: ['zustand', 'zustand/*', '@/application/*', '@/infrastructure/*', '@/ui/*'] },
          ],
        },
      ],
      'no-restricted-globals': ['error', 'window', 'document', 'localStorage'],
    },
  },
  {
    files: ['src/application/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['zustand', 'zustand/*', '@/infrastructure/*', '@/ui/*'] }],
    },
  },
);
```

- [ ] **Step 6: Create `index.html`, `src/vite-env.d.ts`, `src/test/setup.ts`, `src/main.tsx`, `src/App.tsx`**

`index.html`:
```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Saber</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
```

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

`src/App.tsx`:
```tsx
export function App() {
  return <h1>Saber</h1>;
}
```

`src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 7: Write the failing smoke test `src/App.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders the brand name', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Saber' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 8: Install and run**

Run: `pnpm install && pnpm test`
Expected: 1 test passes. If `pnpm install` reports a version that does not exist, bump to the newest same-major version and continue.

Run: `pnpm format && pnpm lint && pnpm typecheck && pnpm build`
Expected: all exit 0; `dist/index.html` exists.

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-lock.yaml .gitignore .npmrc .prettierrc .prettierignore tsconfig.json tsconfig.node.json vite.config.ts eslint.config.js index.html src
git commit -m "chore: scaffold Vite React TypeScript project with MDX and Vitest"
```

---

### Task 2: Design tokens and global styles

**Files:**
- Create: `src/ui/tokens.css`, `src/ui/global.css`
- Modify: `src/main.tsx` (import both CSS files)
- Test: `src/ui/tokens.test.ts`

**Interfaces:**
- Produces: CSS custom properties used by every later component: `--color-ink`, `--color-teal`, `--color-accent`, `--color-lime`, `--color-sand`, `--color-paper`, `--color-canvas`, `--ink-06/08/10/25/55/65`, `--radius-s/m/l/xl`, `--font`.

- [ ] **Step 1: Write the failing test `src/ui/tokens.test.ts`**

```ts
import { readFileSync } from 'node:fs';
import path from 'node:path';

const css = readFileSync(path.resolve(__dirname, 'tokens.css'), 'utf8');

describe('design tokens', () => {
  it.each([
    ['--color-ink', '#022a2a'],
    ['--color-teal', '#10484a'],
    ['--color-accent', '#ff3d00'],
    ['--color-lime', '#9bc62b'],
    ['--color-sand', '#efe6da'],
    ['--color-paper', '#f6f1ea'],
    ['--color-canvas', '#e4ddd2'],
    ['--radius-s', '10px'],
    ['--radius-m', '14px'],
    ['--radius-l', '22px'],
    ['--radius-xl', '28px'],
  ])('defines %s as %s', (name, value) => {
    expect(css).toContain(`${name}: ${value}`);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/ui/tokens.test.ts`
Expected: FAIL with `ENOENT ... tokens.css`.

- [ ] **Step 3: Create `src/ui/tokens.css`**

```css
:root {
  --color-ink: #022a2a;
  --color-teal: #10484a;
  --color-accent: #ff3d00;
  --color-lime: #9bc62b;
  --color-sand: #efe6da;
  --color-paper: #f6f1ea;
  --color-canvas: #e4ddd2;
  --color-white: #ffffff;

  --ink-06: rgba(2, 42, 42, 0.06);
  --ink-08: rgba(2, 42, 42, 0.08);
  --ink-10: rgba(2, 42, 42, 0.1);
  --ink-25: rgba(2, 42, 42, 0.25);
  --ink-55: rgba(2, 42, 42, 0.55);
  --ink-65: rgba(2, 42, 42, 0.65);
  --sand-15: rgba(239, 230, 218, 0.15);
  --sand-70: rgba(239, 230, 218, 0.7);

  --radius-s: 10px;
  --radius-m: 14px;
  --radius-l: 22px;
  --radius-xl: 28px;

  --font: 'Poppins', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: ui-monospace, Menlo, Consolas, monospace;

  --shadow-card: 0 20px 60px rgba(2, 42, 42, 0.18);
  --shadow-chip: 0 1px 3px rgba(2, 42, 42, 0.12);

  --topbar-height: 56px;
  --sidebar-width: 320px;
  --page-gutter: 48px;
}
```

- [ ] **Step 4: Create `src/ui/global.css`**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  min-height: 100%;
}

body {
  background: var(--color-paper);
  color: var(--color-ink);
  font-family: var(--font);
  -webkit-font-smoothing: antialiased;
  line-height: 1.5;
}

a {
  color: var(--color-teal);
}

a:hover {
  color: var(--color-accent);
}

button {
  font: inherit;
  cursor: pointer;
  border: 0;
  background: none;
  color: inherit;
}

h1,
h2,
h3 {
  margin: 0;
  letter-spacing: -0.02em;
  font-weight: 600;
}

code,
pre {
  font-family: var(--font-mono);
}

@media (max-width: 900px) {
  :root {
    --page-gutter: 20px;
  }
}
```

- [ ] **Step 5: Import in `src/main.tsx`**

Add at the top, before the `App` import:
```ts
import '@/ui/tokens.css';
import '@/ui/global.css';
```

- [ ] **Step 6: Run tests and lint**

Run: `pnpm format && pnpm vitest run src/ui/tokens.test.ts && pnpm lint && pnpm typecheck`
Expected: PASS, exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/ui/tokens.css src/ui/global.css src/ui/tokens.test.ts src/main.tsx
git commit -m "feat(ui): add design tokens and global styles from template"
```

---

### Task 3: Domain — course types and `buildCourse`

**Files:**
- Create: `src/domain/course/types.ts`, `src/domain/course/buildCourse.ts`, `src/domain/course/findLesson.ts`, `src/domain/course/index.ts`
- Test: `src/domain/course/buildCourse.test.ts`

**Interfaces:**
- Produces (used verbatim by every later task):

```ts
export type LessonId = string;
export interface LessonMeta { id: LessonId; title: string; stage: number; module: string; order: number; minutes: number; prereqs: LessonId[]; summary: string; hidden?: boolean; }
export type LessonComponent = ComponentType<{ components?: MDXComponents }>;   // type-only imports from 'react' and 'mdx/types'
export type LessonLoader = () => Promise<LessonComponent>;
export interface Lesson extends LessonMeta { stageSlug: string; slug: string; prev: LessonId | null; next: LessonId | null; load: LessonLoader; }
export interface Module { name: string; lessons: Lesson[]; }
export interface StageMeta { id: number; slug: string; title: string; mark: string; bg: string; fg: string; project: string; hours: number; }
export interface Stage extends StageMeta { modules: Module[]; lessons: Lesson[]; }
export interface Course { stages: Stage[]; lessons: Lesson[]; byId: Record<LessonId, Lesson>; }
export function buildCourse(stages: StageMeta[], lessons: LessonMeta[], loaders?: Record<LessonId, LessonLoader>): Course;   // missing loader -> load() rejects
export function findLesson(course: Course, stageSlug: string, lessonSlug: string): Lesson | undefined;
```

- [ ] **Step 1: Write the failing test `src/domain/course/buildCourse.test.ts`**

```ts
import { buildCourse } from './buildCourse';
import { findLesson } from './findLesson';
import type { LessonMeta, StageMeta } from './types';

const stages: StageMeta[] = [
  { id: 0, slug: '00-intro', title: 'Intro', mark: 'In', bg: '#022a2a', fg: '#10484a', project: 'Repo', hours: 4 },
  { id: 1, slug: '01-js', title: 'JS', mark: 'Js', bg: '#ff3d00', fg: '#ff6a3a', project: 'Todo', hours: 20 },
];

const meta = (over: Partial<LessonMeta> & Pick<LessonMeta, 'id' | 'stage' | 'order'>): LessonMeta => ({
  title: over.id,
  module: 'M1',
  minutes: 5,
  prereqs: [],
  summary: '',
  ...over,
});

describe('buildCourse', () => {
  it('groups lessons by stage and module keeping numeric order', () => {
    const course = buildCourse(stages, [
      meta({ id: '01-js/01-b', stage: 1, order: 1, module: 'B' }),
      meta({ id: '00-intro/00-a', stage: 0, order: 0, module: 'A' }),
      meta({ id: '01-js/00-a', stage: 1, order: 0, module: 'A' }),
    ]);
    expect(course.stages.map((s) => s.slug)).toEqual(['00-intro', '01-js']);
    expect(course.stages[1]?.modules.map((m) => m.name)).toEqual(['A', 'B']);
    expect(course.lessons.map((l) => l.id)).toEqual(['00-intro/00-a', '01-js/00-a', '01-js/01-b']);
  });

  it('links prev and next across stages and skips hidden lessons', () => {
    const course = buildCourse(stages, [
      meta({ id: '00-intro/00-a', stage: 0, order: 0 }),
      meta({ id: '00-intro/99-demo', stage: 0, order: 99, hidden: true }),
      meta({ id: '01-js/00-a', stage: 1, order: 0 }),
    ]);
    expect(course.byId['00-intro/00-a']?.next).toBe('01-js/00-a');
    expect(course.byId['01-js/00-a']?.prev).toBe('00-intro/00-a');
    expect(course.byId['01-js/00-a']?.next).toBeNull();
    expect(course.stages[0]?.lessons.map((l) => l.id)).toEqual(['00-intro/00-a']);
    expect(course.byId['00-intro/99-demo']?.hidden).toBe(true);
  });

  it('derives stageSlug and slug from the id and defaults prereqs and hidden', () => {
    const course = buildCourse(stages, [
      { ...meta({ id: '01-js/03-fn', stage: 1, order: 3 }), prereqs: undefined as unknown as string[] },
    ]);
    const lesson = course.byId['01-js/03-fn'];
    expect(lesson?.stageSlug).toBe('01-js');
    expect(lesson?.slug).toBe('03-fn');
    expect(lesson?.prereqs).toEqual([]);
    expect(lesson?.hidden).toBe(false);
  });

  it('tie-breaks equal order by id so the sidebar is deterministic', () => {
    const course = buildCourse(stages, [
      meta({ id: '01-js/01-z', stage: 1, order: 1 }),
      meta({ id: '01-js/01-a', stage: 1, order: 1 }),
    ]);
    expect(course.lessons.map((l) => l.slug)).toEqual(['01-a', '01-z']);
  });

  it('ignores lessons whose stage does not exist', () => {
    const course = buildCourse(stages, [meta({ id: '07-x/00-a', stage: 7, order: 0 })]);
    expect(course.lessons).toHaveLength(0);
  });

  it('attaches the loader for each lesson id and rejects when none exists', async () => {
    const Stub = () => null;
    const course = buildCourse(
      stages,
      [meta({ id: '01-js/00-a', stage: 1, order: 0 }), meta({ id: '01-js/01-b', stage: 1, order: 1 })],
      { '01-js/00-a': async () => Stub },
    );
    await expect(course.byId['01-js/00-a']?.load()).resolves.toBe(Stub);
    await expect(course.byId['01-js/01-b']?.load()).rejects.toThrow('No loader for lesson 01-js/01-b');
  });
});

describe('findLesson', () => {
  it('finds by stage slug and lesson slug', () => {
    const course = buildCourse(stages, [meta({ id: '01-js/00-a', stage: 1, order: 0 })]);
    expect(findLesson(course, '01-js', '00-a')?.id).toBe('01-js/00-a');
    expect(findLesson(course, '01-js', 'nope')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/domain/course`
Expected: FAIL, cannot resolve `./buildCourse`.

- [ ] **Step 3: Create `src/domain/course/types.ts`**

```ts
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
```

- [ ] **Step 4: Create `src/domain/course/buildCourse.ts`**

```ts
import type { Course, Lesson, LessonId, LessonLoader, LessonMeta, Module, Stage, StageMeta } from './types';

function splitId(id: string): { stageSlug: string; slug: string } {
  const slash = id.indexOf('/');
  if (slash === -1) return { stageSlug: '', slug: id };
  return { stageSlug: id.slice(0, slash), slug: id.slice(slash + 1) };
}

function normalize(meta: LessonMeta): LessonMeta {
  return { ...meta, prereqs: Array.isArray(meta.prereqs) ? meta.prereqs : [], hidden: meta.hidden === true };
}

function byStageThenOrder(a: LessonMeta, b: LessonMeta): number {
  if (a.stage !== b.stage) return a.stage - b.stage;
  if (a.order !== b.order) return a.order - b.order;
  return a.id.localeCompare(b.id);
}

export function buildCourse(
  stageMetas: StageMeta[],
  lessonMetas: LessonMeta[],
  loaders: Record<LessonId, LessonLoader> = {},
): Course {
  const stageIds = new Set(stageMetas.map((s) => s.id));
  const sorted = lessonMetas
    .map(normalize)
    .filter((m) => stageIds.has(m.stage))
    .sort(byStageThenOrder);

  const visible = sorted.filter((m) => !m.hidden);
  const lessons: Lesson[] = sorted.map((m) => {
    const { stageSlug, slug } = splitId(m.id);
    const index = visible.findIndex((v) => v.id === m.id);
    const prev = index > 0 ? (visible[index - 1]?.id ?? null) : null;
    const next = index >= 0 && index < visible.length - 1 ? (visible[index + 1]?.id ?? null) : null;
    const load: LessonLoader =
      loaders[m.id] ?? (() => Promise.reject(new Error(`No loader for lesson ${m.id}`)));
    return { ...m, stageSlug, slug, prev, next, load };
  });

  const byId: Record<string, Lesson> = {};
  for (const lesson of lessons) byId[lesson.id] = lesson;

  const stages: Stage[] = [...stageMetas]
    .sort((a, b) => a.id - b.id)
    .map((meta) => {
      const stageLessons = lessons.filter((l) => l.stage === meta.id && !l.hidden);
      const modules: Module[] = [];
      for (const lesson of stageLessons) {
        let module = modules.find((m) => m.name === lesson.module);
        if (!module) {
          module = { name: lesson.module, lessons: [] };
          modules.push(module);
        }
        module.lessons.push(lesson);
      }
      return { ...meta, modules, lessons: stageLessons };
    });

  return { stages, lessons, byId };
}
```

- [ ] **Step 5: Create `src/domain/course/findLesson.ts` and `src/domain/course/index.ts`**

`findLesson.ts`:
```ts
import type { Course, Lesson } from './types';

export function findLesson(course: Course, stageSlug: string, lessonSlug: string): Lesson | undefined {
  return course.byId[`${stageSlug}/${lessonSlug}`];
}
```

`index.ts`:
```ts
export * from './types';
export { buildCourse } from './buildCourse';
export { findLesson } from './findLesson';
```

- [ ] **Step 6: Run tests**

Run: `pnpm format && pnpm vitest run src/domain/course && pnpm lint && pnpm typecheck`
Expected: 7 tests pass, exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/domain/course
git commit -m "feat(domain): add course model and buildCourse navigation"
```

---

### Task 4: Domain — SRS scheduler (SM-2 lite)

**Files:**
- Create: `src/domain/srs/dates.ts`, `src/domain/srs/types.ts`, `src/domain/srs/gradeCard.ts`, `src/domain/srs/dueCards.ts`, `src/domain/srs/index.ts`
- Test: `src/domain/srs/gradeCard.test.ts`, `src/domain/srs/dueCards.test.ts`, `src/domain/srs/dates.test.ts`

**Interfaces:**
- Consumes: `LessonId` from Task 3.
- Produces:

```ts
export type Grade = 'again' | 'good' | 'easy';
export interface CardState { interval: number; ease: number; due: string; reps: number; }
export interface SrsCard { key: string; lessonId: LessonId; front: string; back: string; state: CardState; graded: boolean; }
export type SrsState = Record<string, SrsCard>;
export function cardKey(lessonId: LessonId, index: number): string;          // `${lessonId}#${index}`
export function newCardState(today: string): CardState;                       // interval 0, ease 2.5, due today, reps 0
export function gradeCard(state: CardState, grade: Grade, today: string): CardState;
export function isDue(state: CardState, today: string): boolean;
export function dueCards(cards: SrsState, completed: Record<LessonId, string>, today: string): SrsCard[];
export function addDays(isoDate: string, days: number): string;
export function toIsoDate(date: Date): string;
```

- [ ] **Step 1: Write failing tests**

`src/domain/srs/dates.test.ts`:
```ts
import { addDays, toIsoDate } from './dates';

describe('dates', () => {
  it('adds days across month boundaries', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('formats a Date as YYYY-MM-DD in local time', () => {
    expect(toIsoDate(new Date(2026, 8, 26, 23, 30))).toBe('2026-09-26');
  });
});
```

`src/domain/srs/gradeCard.test.ts`:
```ts
import { gradeCard, newCardState } from './gradeCard';

const today = '2026-09-26';

describe('gradeCard (SM-2 lite)', () => {
  it('again resets interval and reps and lowers ease with a floor of 1.3', () => {
    const s = gradeCard({ interval: 10, ease: 1.4, due: today, reps: 3 }, 'again', today);
    expect(s).toEqual({ interval: 0, ease: 1.3, due: today, reps: 0 });
  });

  it('good on a new card schedules 1 day and keeps ease', () => {
    const s = gradeCard(newCardState(today), 'good', today);
    expect(s).toEqual({ interval: 1, ease: 2.5, due: '2026-09-27', reps: 1 });
  });

  it('good on a seen card multiplies interval by ease', () => {
    const s = gradeCard({ interval: 4, ease: 2.5, due: today, reps: 2 }, 'good', today);
    expect(s.interval).toBe(10);
    expect(s.due).toBe('2026-10-06');
    expect(s.reps).toBe(3);
  });

  it('easy on a new card schedules 3 days and raises ease by 0.15', () => {
    const s = gradeCard(newCardState(today), 'easy', today);
    expect(s).toEqual({ interval: 3, ease: 2.65, due: '2026-09-29', reps: 1 });
  });

  it('easy on a seen card multiplies by ease and 1.3', () => {
    const s = gradeCard({ interval: 4, ease: 2.5, due: today, reps: 2 }, 'easy', today);
    expect(s.interval).toBe(13);
    expect(s.ease).toBeCloseTo(2.65);
  });
});
```

`src/domain/srs/dueCards.test.ts`:
```ts
import { dueCards, isDue } from './dueCards';
import { cardKey, newCardState } from './gradeCard';
import type { SrsState } from './types';

const today = '2026-09-26';

const cards: SrsState = {
  [cardKey('01-js/00-a', 0)]: {
    key: cardKey('01-js/00-a', 0),
    lessonId: '01-js/00-a',
    front: 'q1',
    back: 'a1',
    state: newCardState(today),
    graded: false,
  },
  [cardKey('01-js/00-b', 0)]: {
    key: cardKey('01-js/00-b', 0),
    lessonId: '01-js/00-b',
    front: 'q2',
    back: 'a2',
    state: newCardState(today),
    graded: false,
  },
  [cardKey('01-js/00-c', 0)]: {
    key: cardKey('01-js/00-c', 0),
    lessonId: '01-js/00-c',
    front: 'q3',
    back: 'a3',
    state: { interval: 5, ease: 2.5, due: '2026-09-30', reps: 1 },
    graded: true,
  },
};

describe('isDue', () => {
  it('is due when due date is today or earlier', () => {
    expect(isDue({ interval: 1, ease: 2.5, due: '2026-09-26', reps: 1 }, today)).toBe(true);
    expect(isDue({ interval: 1, ease: 2.5, due: '2026-09-25', reps: 1 }, today)).toBe(true);
    expect(isDue({ interval: 1, ease: 2.5, due: '2026-09-27', reps: 1 }, today)).toBe(false);
  });
});

describe('dueCards', () => {
  it('includes new cards only from completed lessons and graded cards only when due', () => {
    const due = dueCards(cards, { '01-js/00-a': today }, today);
    expect(due.map((c) => c.lessonId)).toEqual(['01-js/00-a']);
  });

  it('includes graded cards once their due date arrives', () => {
    const due = dueCards(cards, {}, '2026-09-30');
    expect(due.map((c) => c.lessonId)).toEqual(['01-js/00-c']);
  });

  it('returns an empty list when nothing is due', () => {
    expect(dueCards({}, {}, today)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/domain/srs`
Expected: FAIL, modules not found.

- [ ] **Step 3: Create `src/domain/srs/dates.ts`**

```ts
function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}
```

- [ ] **Step 4: Create `src/domain/srs/types.ts`**

```ts
import type { LessonId } from '@/domain/course/types';

export type Grade = 'again' | 'good' | 'easy';

export interface CardState {
  interval: number;
  ease: number;
  due: string;
  reps: number;
}

export interface SrsCard {
  key: string;
  lessonId: LessonId;
  front: string;
  back: string;
  state: CardState;
  graded: boolean;
}

export type SrsState = Record<string, SrsCard>;
```

- [ ] **Step 5: Create `src/domain/srs/gradeCard.ts`**

```ts
import { addDays } from './dates';
import type { CardState, Grade } from './types';

const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;

export function cardKey(lessonId: string, index: number): string {
  return `${lessonId}#${index}`;
}

export function newCardState(today: string): CardState {
  return { interval: 0, ease: DEFAULT_EASE, due: today, reps: 0 };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function gradeCard(state: CardState, grade: Grade, today: string): CardState {
  if (grade === 'again') {
    return { interval: 0, ease: Math.max(MIN_EASE, round2(state.ease - 0.2)), due: today, reps: 0 };
  }
  if (grade === 'good') {
    const interval = state.reps === 0 ? 1 : Math.round(state.interval * state.ease);
    return { interval, ease: state.ease, due: addDays(today, interval), reps: state.reps + 1 };
  }
  const interval = state.reps === 0 ? 3 : Math.round(state.interval * state.ease * 1.3);
  return { interval, ease: round2(state.ease + 0.15), due: addDays(today, interval), reps: state.reps + 1 };
}
```

- [ ] **Step 6: Create `src/domain/srs/dueCards.ts` and `src/domain/srs/index.ts`**

`dueCards.ts`:
```ts
import type { CardState, SrsCard, SrsState } from './types';

export function isDue(state: CardState, today: string): boolean {
  return state.due <= today;
}

export function dueCards(cards: SrsState, completed: Record<string, string>, today: string): SrsCard[] {
  return Object.values(cards)
    .filter((card) => (card.graded ? isDue(card.state, today) : card.lessonId in completed))
    .sort((a, b) => a.key.localeCompare(b.key));
}
```

`index.ts`:
```ts
export * from './types';
export { addDays, toIsoDate, parseIsoDate } from './dates';
export { cardKey, newCardState, gradeCard } from './gradeCard';
export { isDue, dueCards } from './dueCards';
```

- [ ] **Step 7: Run tests**

Run: `pnpm format && pnpm vitest run src/domain/srs && pnpm lint && pnpm typecheck`
Expected: 11 tests pass, exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/domain/srs
git commit -m "feat(domain): add SM-2 lite spaced repetition scheduler"
```

---

### Task 5: Domain — progress, checklists and streak

**Files:**
- Create: `src/domain/progress/types.ts`, `src/domain/progress/progress.ts`, `src/domain/progress/streak.ts`, `src/domain/progress/stageProgress.ts`, `src/domain/progress/index.ts`
- Test: `src/domain/progress/progress.test.ts`, `src/domain/progress/streak.test.ts`, `src/domain/progress/stageProgress.test.ts`

**Interfaces:**
- Consumes: `LessonId`, `Stage` (Task 3); `addDays` (Task 4).
- Produces:

```ts
export interface ProgressState { completed: Record<LessonId, string>; quizScores: Record<LessonId, number>; checklists: Record<string, number[]>; lastOpened: LessonId | null; activityDays: string[]; }
export function emptyProgress(): ProgressState;
export function completeLesson(state: ProgressState, id: LessonId, today: string): ProgressState;
export function openLesson(state: ProgressState, id: LessonId): ProgressState;
export function recordQuizScore(state: ProgressState, id: LessonId, score: number): ProgressState;   // score 0..1
export function toggleChecklistItem(state: ProgressState, key: string, index: number): ProgressState;
export function recordReviewSession(state: ProgressState, gradesCount: number, today: string): ProgressState;
export function computeStreak(activityDays: string[], today: string): number;
export interface DayActivity { date: string; label: string; active: boolean; isToday: boolean; }
export function lastSevenDays(activityDays: string[], today: string): DayActivity[];
export interface StageProgress { done: number; total: number; pct: number; }
export function stageProgress(stage: Stage, completed: Record<LessonId, string>): StageProgress;
```

- [ ] **Step 1: Write failing tests**

`src/domain/progress/progress.test.ts`:
```ts
import {
  completeLesson,
  emptyProgress,
  openLesson,
  recordQuizScore,
  recordReviewSession,
  toggleChecklistItem,
} from './progress';

const today = '2026-09-26';

describe('progress', () => {
  it('completes a lesson once and records the activity day once', () => {
    let s = completeLesson(emptyProgress(), 'a/b', today);
    s = completeLesson(s, 'a/b', today);
    expect(s.completed).toEqual({ 'a/b': today });
    expect(s.activityDays).toEqual([today]);
  });

  it('tracks the last opened lesson', () => {
    expect(openLesson(emptyProgress(), 'a/b').lastOpened).toBe('a/b');
  });

  it('keeps the best quiz score clamped to 0..1', () => {
    let s = recordQuizScore(emptyProgress(), 'a/b', 0.66);
    s = recordQuizScore(s, 'a/b', 0.33);
    s = recordQuizScore(s, 'a/c', 4);
    expect(s.quizScores).toEqual({ 'a/b': 0.66, 'a/c': 1 });
  });

  it('toggles checklist items by index', () => {
    let s = toggleChecklistItem(emptyProgress(), 'a/b:release', 2);
    s = toggleChecklistItem(s, 'a/b:release', 0);
    expect(s.checklists['a/b:release']).toEqual([0, 2]);
    s = toggleChecklistItem(s, 'a/b:release', 2);
    expect(s.checklists['a/b:release']).toEqual([0]);
  });

  it('counts a review session as activity only with at least 5 grades', () => {
    expect(recordReviewSession(emptyProgress(), 4, today).activityDays).toEqual([]);
    expect(recordReviewSession(emptyProgress(), 5, today).activityDays).toEqual([today]);
  });
});
```

`src/domain/progress/streak.test.ts`:
```ts
import { computeStreak, lastSevenDays } from './streak';

const today = '2026-09-26';

describe('computeStreak', () => {
  it('is zero with no activity', () => {
    expect(computeStreak([], today)).toBe(0);
  });
  it('counts consecutive days ending today', () => {
    expect(computeStreak(['2026-09-24', '2026-09-25', '2026-09-26'], today)).toBe(3);
  });
  it('survives when today has no activity yet but yesterday did', () => {
    expect(computeStreak(['2026-09-24', '2026-09-25'], today)).toBe(2);
  });
  it('breaks after a missed calendar day', () => {
    expect(computeStreak(['2026-09-22', '2026-09-23', '2026-09-25'], today)).toBe(1);
    expect(computeStreak(['2026-09-22', '2026-09-23'], today)).toBe(0);
  });
});

describe('lastSevenDays', () => {
  it('returns Monday to Sunday labels for the current week with activity flags', () => {
    const week = lastSevenDays(['2026-09-22', '2026-09-26'], today);
    expect(week.map((d) => d.label)).toEqual(['L', 'M', 'X', 'J', 'V', 'S', 'D']);
    expect(week.map((d) => d.date)).toEqual([
      '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27',
    ]);
    expect(week.filter((d) => d.active).map((d) => d.date)).toEqual(['2026-09-22', '2026-09-26']);
    expect(week.find((d) => d.isToday)?.date).toBe(today);
  });
});
```

`src/domain/progress/stageProgress.test.ts`:
```ts
import { buildCourse } from '@/domain/course/buildCourse';
import { stageProgress } from './stageProgress';

const course = buildCourse(
  [{ id: 1, slug: '01-js', title: 'JS', mark: 'Js', bg: '#000', fg: '#111', project: 'p', hours: 1 }],
  [
    { id: '01-js/00-a', title: 'a', stage: 1, module: 'M', order: 0, minutes: 1, prereqs: [], summary: '' },
    { id: '01-js/01-b', title: 'b', stage: 1, module: 'M', order: 1, minutes: 1, prereqs: [], summary: '' },
    { id: '01-js/99-demo', title: 'd', stage: 1, module: 'M', order: 99, minutes: 1, prereqs: [], summary: '', hidden: true },
  ],
);

describe('stageProgress', () => {
  it('counts only visible lessons', () => {
    expect(stageProgress(course.stages[0]!, { '01-js/00-a': '2026-01-01' })).toEqual({ done: 1, total: 2, pct: 50 });
  });
  it('is 0% for a stage with no lessons', () => {
    expect(stageProgress({ ...course.stages[0]!, lessons: [] }, {})).toEqual({ done: 0, total: 0, pct: 0 });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/domain/progress`
Expected: FAIL, modules not found.

- [ ] **Step 3: Create `src/domain/progress/types.ts`**

```ts
import type { LessonId } from '@/domain/course/types';

export interface ProgressState {
  completed: Record<LessonId, string>;
  quizScores: Record<LessonId, number>;
  checklists: Record<string, number[]>;
  lastOpened: LessonId | null;
  activityDays: string[];
}

export interface DayActivity {
  date: string;
  label: string;
  active: boolean;
  isToday: boolean;
}

export interface StageProgress {
  done: number;
  total: number;
  pct: number;
}
```

- [ ] **Step 4: Create `src/domain/progress/progress.ts`**

```ts
import type { LessonId } from '@/domain/course/types';
import type { ProgressState } from './types';

const MIN_GRADES_FOR_ACTIVE_DAY = 5;

export function emptyProgress(): ProgressState {
  return { completed: {}, quizScores: {}, checklists: {}, lastOpened: null, activityDays: [] };
}

function withActivityDay(state: ProgressState, day: string): ProgressState {
  if (state.activityDays.includes(day)) return state;
  return { ...state, activityDays: [...state.activityDays, day].sort() };
}

export function completeLesson(state: ProgressState, id: LessonId, today: string): ProgressState {
  const completed = id in state.completed ? state.completed : { ...state.completed, [id]: today };
  return withActivityDay({ ...state, completed }, today);
}

export function openLesson(state: ProgressState, id: LessonId): ProgressState {
  return state.lastOpened === id ? state : { ...state, lastOpened: id };
}

export function recordQuizScore(state: ProgressState, id: LessonId, score: number): ProgressState {
  const clamped = Math.min(1, Math.max(0, score));
  const previous = state.quizScores[id] ?? 0;
  if (clamped <= previous && id in state.quizScores) return state;
  return { ...state, quizScores: { ...state.quizScores, [id]: Math.max(previous, clamped) } };
}

export function toggleChecklistItem(state: ProgressState, key: string, index: number): ProgressState {
  const current = state.checklists[key] ?? [];
  const next = current.includes(index)
    ? current.filter((i) => i !== index)
    : [...current, index].sort((a, b) => a - b);
  return { ...state, checklists: { ...state.checklists, [key]: next } };
}

export function recordReviewSession(state: ProgressState, gradesCount: number, today: string): ProgressState {
  if (gradesCount < MIN_GRADES_FOR_ACTIVE_DAY) return state;
  return withActivityDay(state, today);
}
```

- [ ] **Step 5: Create `src/domain/progress/streak.ts`**

```ts
import { addDays, parseIsoDate } from '@/domain/srs/dates';
import type { DayActivity } from './types';

const WEEK_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function computeStreak(activityDays: string[], today: string): number {
  const days = new Set(activityDays);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function lastSevenDays(activityDays: string[], today: string): DayActivity[] {
  const days = new Set(activityDays);
  const weekday = parseIsoDate(today).getDay();
  const offsetToMonday = weekday === 0 ? 6 : weekday - 1;
  const monday = addDays(today, -offsetToMonday);
  return WEEK_LABELS.map((label, i) => {
    const date = addDays(monday, i);
    return { date, label, active: days.has(date), isToday: date === today };
  });
}
```

- [ ] **Step 6: Create `src/domain/progress/stageProgress.ts` and `src/domain/progress/index.ts`**

`stageProgress.ts`:
```ts
import type { Stage } from '@/domain/course/types';
import type { StageProgress } from './types';

export function stageProgress(stage: Stage, completed: Record<string, string>): StageProgress {
  const total = stage.lessons.length;
  const done = stage.lessons.filter((l) => l.id in completed).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, pct };
}
```

`index.ts`:
```ts
export * from './types';
export * from './progress';
export { computeStreak, lastSevenDays } from './streak';
export { stageProgress } from './stageProgress';
```

- [ ] **Step 7: Run tests**

Run: `pnpm format && pnpm vitest run src/domain && pnpm lint && pnpm typecheck`
Expected: all domain tests pass, exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/domain/progress
git commit -m "feat(domain): add progress, checklist and streak rules"
```

---

### Task 6: Domain — notes

**Files:**
- Create: `src/domain/notes/types.ts`, `src/domain/notes/notes.ts`, `src/domain/notes/index.ts`
- Test: `src/domain/notes/notes.test.ts`

**Interfaces:**
- Produces:

```ts
export interface Note { lessonId: LessonId; text: string; updatedAt: string; }
export type NotesState = Record<LessonId, Note>;
export function emptyNotes(): NotesState;
export function upsertNote(state: NotesState, lessonId: LessonId, text: string, now: string): NotesState; // empty text removes
```

- [ ] **Step 1: Write failing test `src/domain/notes/notes.test.ts`**

```ts
import { emptyNotes, upsertNote } from './notes';

describe('upsertNote', () => {
  it('creates and updates a note with a timestamp', () => {
    let s = upsertNote(emptyNotes(), 'a/b', 'hola', '2026-09-26T10:00:00.000Z');
    expect(s['a/b']).toEqual({ lessonId: 'a/b', text: 'hola', updatedAt: '2026-09-26T10:00:00.000Z' });
    s = upsertNote(s, 'a/b', 'adiós', '2026-09-26T11:00:00.000Z');
    expect(s['a/b']?.text).toBe('adiós');
  });
  it('removes the note when text is blank', () => {
    const s = upsertNote(upsertNote(emptyNotes(), 'a/b', 'x', 't'), 'a/b', '   ', 't2');
    expect(s).toEqual({});
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/domain/notes`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`src/domain/notes/types.ts`:
```ts
import type { LessonId } from '@/domain/course/types';

export interface Note {
  lessonId: LessonId;
  text: string;
  updatedAt: string;
}

export type NotesState = Record<LessonId, Note>;
```

`src/domain/notes/notes.ts`:
```ts
import type { LessonId } from '@/domain/course/types';
import type { NotesState } from './types';

export function emptyNotes(): NotesState {
  return {};
}

export function upsertNote(state: NotesState, lessonId: LessonId, text: string, now: string): NotesState {
  if (text.trim() === '') {
    const { [lessonId]: _removed, ...rest } = state;
    void _removed;
    return rest;
  }
  return { ...state, [lessonId]: { lessonId, text, updatedAt: now } };
}
```

`src/domain/notes/index.ts`:
```ts
export * from './types';
export { emptyNotes, upsertNote } from './notes';
```

- [ ] **Step 4: Run tests and commit**

Run: `pnpm format && pnpm vitest run src/domain/notes && pnpm lint && pnpm typecheck`
Expected: 2 tests pass.

```bash
git add src/domain/notes
git commit -m "feat(domain): add lesson notes rules"
```

---

### Task 7: Application — ports, repositories context, use cases and hooks

**Files:**
- Create: `src/application/ports/Store.ts`, `src/application/ports/Clock.ts`, `src/application/ports/Repositories.ts`, `src/application/RepositoriesContext.tsx`, `src/application/useCases/completeLesson.ts`, `src/application/useCases/gradeCard.ts`, `src/application/useCases/registerCards.ts`, `src/application/useCases/dueCards.ts`, `src/application/useCases/continueLearning.ts`, `src/application/hooks/useStoreValue.ts`, `src/application/hooks/useProgress.ts`, `src/application/hooks/useStreak.ts`, `src/application/hooks/useNotes.ts`, `src/application/hooks/useSrs.ts`, `src/application/hooks/useChecklist.ts`, `src/application/hooks/useContinueLearning.ts`, `src/application/testing/memoryStore.ts`, `src/application/testing/fixedClock.ts`, `src/application/testing/renderWithRepositories.tsx`
- Test: `src/application/useCases/useCases.test.ts`, `src/application/hooks/hooks.test.tsx`

**Interfaces:**
- Consumes: everything exported by `@/domain/course`, `@/domain/srs`, `@/domain/progress`, `@/domain/notes`.
- Produces:

```ts
export interface Store<T> { get(): T; set(next: T): void; subscribe(listener: () => void): () => void; }
export interface Clock { today(): string; now(): string; }
export interface Repositories { progress: Store<ProgressState>; notes: Store<NotesState>; srs: Store<SrsState>; clock: Clock; }
export function RepositoriesProvider(props: { value: Repositories; children: ReactNode }): JSX.Element;
export function useRepositories(): Repositories;
export function useStoreValue<T>(store: Store<T>): T;
export function createMemoryStore<T>(initial: T): Store<T>;
export function fixedClock(today: string, now?: string): Clock;
export function renderWithRepositories(ui: ReactElement, opts?: { repos?: Partial<Repositories>; route?: string }): { repos: Repositories } & RenderResult;
// use cases
export function completeLessonUseCase(repos: Pick<Repositories, 'progress' | 'clock'>, id: LessonId): void;
export function gradeCardUseCase(repos: Pick<Repositories, 'srs' | 'clock'>, key: string, grade: Grade): void;
export function registerCardsUseCase(repos: Pick<Repositories, 'srs' | 'clock'>, lessonId: LessonId, cards: { front: string; back: string }[]): void;
export function dueCardsUseCase(repos: Pick<Repositories, 'srs' | 'progress' | 'clock'>): SrsCard[];
export function continueLearning(course: Course, progress: ProgressState): Lesson | null;
// hooks
export function useProgress(): { state: ProgressState; completeLesson(id: LessonId): void; openLesson(id: LessonId): void; recordQuizScore(id: LessonId, score: number): void; recordReviewSession(gradesCount: number): void; };
export function useStreak(): { streak: number; week: DayActivity[] };
export function useNotes(): { notes: NotesState; upsert(lessonId: LessonId, text: string): void };
export function useSrs(): { cards: SrsState; due: SrsCard[]; registerCards(lessonId: LessonId, cards: { front: string; back: string }[]): void; grade(key: string, grade: Grade): void };
export function useChecklist(lessonId: LessonId, id: string): { checked: number[]; toggle(index: number): void };
export function useContinueLearning(course: Course): Lesson | null;
```

- [ ] **Step 1: Write failing tests**

`src/application/useCases/useCases.test.ts`:
```ts
import { emptyProgress } from '@/domain/progress';
import { emptyNotes } from '@/domain/notes';
import { buildCourse } from '@/domain/course';
import type { SrsState } from '@/domain/srs';
import { createMemoryStore } from '@/application/testing/memoryStore';
import { fixedClock } from '@/application/testing/fixedClock';
import { completeLessonUseCase } from './completeLesson';
import { gradeCardUseCase } from './gradeCard';
import { registerCardsUseCase } from './registerCards';
import { dueCardsUseCase } from './dueCards';
import { continueLearning } from './continueLearning';

const today = '2026-09-26';

function repos() {
  return {
    progress: createMemoryStore(emptyProgress()),
    notes: createMemoryStore(emptyNotes()),
    srs: createMemoryStore<SrsState>({}),
    clock: fixedClock(today),
  };
}

describe('use cases', () => {
  it('registers cards idempotently and only exposes them once the lesson is completed', () => {
    const r = repos();
    registerCardsUseCase(r, 'a/b', [{ front: 'q', back: 'a' }]);
    registerCardsUseCase(r, 'a/b', [{ front: 'q', back: 'a' }]);
    expect(Object.keys(r.srs.get())).toEqual(['a/b#0']);
    expect(dueCardsUseCase(r)).toEqual([]);
    completeLessonUseCase(r, 'a/b');
    expect(dueCardsUseCase(r).map((c) => c.key)).toEqual(['a/b#0']);
  });

  it('grading marks the card as graded and reschedules it', () => {
    const r = repos();
    registerCardsUseCase(r, 'a/b', [{ front: 'q', back: 'a' }]);
    gradeCardUseCase(r, 'a/b#0', 'good');
    expect(r.srs.get()['a/b#0']).toMatchObject({ graded: true, state: { due: '2026-09-27', reps: 1 } });
    expect(dueCardsUseCase(r)).toEqual([]);
  });

  it('ignores grades for unknown cards', () => {
    const r = repos();
    gradeCardUseCase(r, 'nope', 'good');
    expect(r.srs.get()).toEqual({});
  });
});

describe('continueLearning', () => {
  const course = buildCourse(
    [{ id: 0, slug: 's', title: 'S', mark: 'S', bg: '#000', fg: '#111', project: '', hours: 1 }],
    [
      { id: 's/00-a', title: 'a', stage: 0, module: 'M', order: 0, minutes: 1, prereqs: [], summary: '' },
      { id: 's/01-b', title: 'b', stage: 0, module: 'M', order: 1, minutes: 1, prereqs: [], summary: '' },
    ],
  );
  it('prefers the last opened lesson', () => {
    expect(continueLearning(course, { ...emptyProgress(), lastOpened: 's/01-b' })?.id).toBe('s/01-b');
  });
  it('falls back to the first incomplete lesson', () => {
    expect(continueLearning(course, { ...emptyProgress(), completed: { 's/00-a': today } })?.id).toBe('s/01-b');
  });
  it('returns null when everything is complete', () => {
    expect(continueLearning(course, { ...emptyProgress(), completed: { 's/00-a': today, 's/01-b': today } })).toBeNull();
  });
});
```

`src/application/hooks/hooks.test.tsx`:
```tsx
import { act, screen } from '@testing-library/react';
import { renderWithRepositories } from '@/application/testing/renderWithRepositories';
import { useProgress } from './useProgress';
import { useStreak } from './useStreak';
import { useNotes } from './useNotes';
import { useChecklist } from './useChecklist';
import { useSrs } from './useSrs';

function Probe() {
  const progress = useProgress();
  const { streak } = useStreak();
  const notes = useNotes();
  const checklist = useChecklist('a/b', 'release');
  const srs = useSrs();
  return (
    <div>
      <span data-testid="streak">{streak}</span>
      <span data-testid="completed">{Object.keys(progress.state.completed).join(',')}</span>
      <span data-testid="note">{notes.notes['a/b']?.text ?? ''}</span>
      <span data-testid="checked">{checklist.checked.join(',')}</span>
      <span data-testid="due">{srs.due.length}</span>
      <button onClick={() => progress.completeLesson('a/b')}>complete</button>
      <button onClick={() => notes.upsert('a/b', 'nota')}>note</button>
      <button onClick={() => checklist.toggle(1)}>toggle</button>
      <button onClick={() => srs.registerCards('a/b', [{ front: 'q', back: 'a' }])}>register</button>
    </div>
  );
}

describe('application hooks', () => {
  it('re-render on store changes and route actions through the domain', () => {
    renderWithRepositories(<Probe />);
    expect(screen.getByTestId('streak')).toHaveTextContent('0');
    act(() => screen.getByText('register').click());
    expect(screen.getByTestId('due')).toHaveTextContent('0');
    act(() => screen.getByText('complete').click());
    expect(screen.getByTestId('completed')).toHaveTextContent('a/b');
    expect(screen.getByTestId('streak')).toHaveTextContent('1');
    expect(screen.getByTestId('due')).toHaveTextContent('1');
    act(() => screen.getByText('note').click());
    expect(screen.getByTestId('note')).toHaveTextContent('nota');
    act(() => screen.getByText('toggle').click());
    expect(screen.getByTestId('checked')).toHaveTextContent('1');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/application`
Expected: FAIL, modules not found.

- [ ] **Step 3: Create ports**

`src/application/ports/Store.ts`:
```ts
export interface Store<T> {
  get(): T;
  set(next: T): void;
  subscribe(listener: () => void): () => void;
}
```

`src/application/ports/Clock.ts`:
```ts
export interface Clock {
  /** Local calendar date as YYYY-MM-DD. */
  today(): string;
  /** Full ISO timestamp. */
  now(): string;
}
```

`src/application/ports/Repositories.ts`:
```ts
import type { ProgressState } from '@/domain/progress';
import type { NotesState } from '@/domain/notes';
import type { SrsState } from '@/domain/srs';
import type { Clock } from './Clock';
import type { Store } from './Store';

export interface Repositories {
  progress: Store<ProgressState>;
  notes: Store<NotesState>;
  srs: Store<SrsState>;
  clock: Clock;
}
```

- [ ] **Step 4: Create `src/application/RepositoriesContext.tsx` and `src/application/hooks/useStoreValue.ts`**

`RepositoriesContext.tsx`:
```tsx
import { createContext, useContext, type ReactNode } from 'react';
import type { Repositories } from './ports/Repositories';

const RepositoriesContext = createContext<Repositories | null>(null);

export function RepositoriesProvider({ value, children }: { value: Repositories; children: ReactNode }) {
  return <RepositoriesContext.Provider value={value}>{children}</RepositoriesContext.Provider>;
}

export function useRepositories(): Repositories {
  const repos = useContext(RepositoriesContext);
  if (!repos) throw new Error('RepositoriesProvider is missing above this component');
  return repos;
}
```

`useStoreValue.ts`:
```ts
import { useSyncExternalStore } from 'react';
import type { Store } from '@/application/ports/Store';

export function useStoreValue<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
```

- [ ] **Step 5: Create testing helpers**

`src/application/testing/memoryStore.ts`:
```ts
import type { Store } from '@/application/ports/Store';

export function createMemoryStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next) => {
      value = next;
      listeners.forEach((l) => l());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
```

`src/application/testing/fixedClock.ts`:
```ts
import type { Clock } from '@/application/ports/Clock';

export function fixedClock(today: string, now = `${today}T12:00:00.000Z`): Clock {
  return { today: () => today, now: () => now };
}
```

`src/application/testing/renderWithRepositories.tsx`:
```tsx
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { emptyProgress } from '@/domain/progress';
import { emptyNotes } from '@/domain/notes';
import type { SrsState } from '@/domain/srs';
import { RepositoriesProvider } from '@/application/RepositoriesContext';
import type { Repositories } from '@/application/ports/Repositories';
import { createMemoryStore } from './memoryStore';
import { fixedClock } from './fixedClock';

export function testRepositories(over: Partial<Repositories> = {}): Repositories {
  return {
    progress: createMemoryStore(emptyProgress()),
    notes: createMemoryStore(emptyNotes()),
    srs: createMemoryStore<SrsState>({}),
    clock: fixedClock('2026-09-26'),
    ...over,
  };
}

export function renderWithRepositories(
  ui: ReactElement,
  opts: { repos?: Partial<Repositories>; route?: string } = {},
): { repos: Repositories } & RenderResult {
  const repos = testRepositories(opts.repos);
  const result = render(
    <RepositoriesProvider value={repos}>
      <MemoryRouter initialEntries={[opts.route ?? '/']}>{ui}</MemoryRouter>
    </RepositoriesProvider>,
  );
  return { repos, ...result };
}
```

- [ ] **Step 6: Create use cases**

`src/application/useCases/completeLesson.ts`:
```ts
import { completeLesson } from '@/domain/progress';
import type { LessonId } from '@/domain/course';
import type { Repositories } from '@/application/ports/Repositories';

export function completeLessonUseCase(repos: Pick<Repositories, 'progress' | 'clock'>, id: LessonId): void {
  repos.progress.set(completeLesson(repos.progress.get(), id, repos.clock.today()));
}
```

`src/application/useCases/gradeCard.ts`:
```ts
import { gradeCard, type Grade } from '@/domain/srs';
import type { Repositories } from '@/application/ports/Repositories';

export function gradeCardUseCase(repos: Pick<Repositories, 'srs' | 'clock'>, key: string, grade: Grade): void {
  const cards = repos.srs.get();
  const card = cards[key];
  if (!card) return;
  const state = gradeCard(card.state, grade, repos.clock.today());
  repos.srs.set({ ...cards, [key]: { ...card, state, graded: true } });
}
```

`src/application/useCases/registerCards.ts`:
```ts
import { cardKey, newCardState, type SrsCard } from '@/domain/srs';
import type { LessonId } from '@/domain/course';
import type { Repositories } from '@/application/ports/Repositories';

export function registerCardsUseCase(
  repos: Pick<Repositories, 'srs' | 'clock'>,
  lessonId: LessonId,
  cards: { front: string; back: string }[],
): void {
  const current = repos.srs.get();
  const today = repos.clock.today();
  let changed = false;
  const next: Record<string, SrsCard> = { ...current };
  cards.forEach((card, index) => {
    const key = cardKey(lessonId, index);
    if (key in next) return;
    next[key] = { key, lessonId, front: card.front, back: card.back, state: newCardState(today), graded: false };
    changed = true;
  });
  if (changed) repos.srs.set(next);
}
```

`src/application/useCases/dueCards.ts`:
```ts
import { dueCards, type SrsCard } from '@/domain/srs';
import type { Repositories } from '@/application/ports/Repositories';

export function dueCardsUseCase(repos: Pick<Repositories, 'srs' | 'progress' | 'clock'>): SrsCard[] {
  return dueCards(repos.srs.get(), repos.progress.get().completed, repos.clock.today());
}
```

`src/application/useCases/continueLearning.ts`:
```ts
import type { Course, Lesson } from '@/domain/course';
import type { ProgressState } from '@/domain/progress';

export function continueLearning(course: Course, progress: ProgressState): Lesson | null {
  if (progress.lastOpened) {
    const last = course.byId[progress.lastOpened];
    if (last && !last.hidden) return last;
  }
  return course.lessons.find((l) => !l.hidden && !(l.id in progress.completed)) ?? null;
}
```

- [ ] **Step 7: Create hooks**

`src/application/hooks/useProgress.ts`:
```ts
import { useCallback } from 'react';
import { openLesson, recordQuizScore, recordReviewSession, type ProgressState } from '@/domain/progress';
import type { LessonId } from '@/domain/course';
import { useRepositories } from '@/application/RepositoriesContext';
import { completeLessonUseCase } from '@/application/useCases/completeLesson';
import { useStoreValue } from './useStoreValue';

export function useProgress(): {
  state: ProgressState;
  completeLesson(id: LessonId): void;
  openLesson(id: LessonId): void;
  recordQuizScore(id: LessonId, score: number): void;
  recordReviewSession(gradesCount: number): void;
} {
  const repos = useRepositories();
  const state = useStoreValue(repos.progress);
  return {
    state,
    completeLesson: useCallback((id: LessonId) => completeLessonUseCase(repos, id), [repos]),
    openLesson: useCallback((id: LessonId) => repos.progress.set(openLesson(repos.progress.get(), id)), [repos]),
    recordQuizScore: useCallback(
      (id: LessonId, score: number) => repos.progress.set(recordQuizScore(repos.progress.get(), id, score)),
      [repos],
    ),
    recordReviewSession: useCallback(
      (gradesCount: number) =>
        repos.progress.set(recordReviewSession(repos.progress.get(), gradesCount, repos.clock.today())),
      [repos],
    ),
  };
}
```

`src/application/hooks/useStreak.ts`:
```ts
import { computeStreak, lastSevenDays, type DayActivity } from '@/domain/progress';
import { useRepositories } from '@/application/RepositoriesContext';
import { useStoreValue } from './useStoreValue';

export function useStreak(): { streak: number; week: DayActivity[] } {
  const repos = useRepositories();
  const { activityDays } = useStoreValue(repos.progress);
  const today = repos.clock.today();
  return { streak: computeStreak(activityDays, today), week: lastSevenDays(activityDays, today) };
}
```

`src/application/hooks/useNotes.ts`:
```ts
import { useCallback } from 'react';
import { upsertNote, type NotesState } from '@/domain/notes';
import type { LessonId } from '@/domain/course';
import { useRepositories } from '@/application/RepositoriesContext';
import { useStoreValue } from './useStoreValue';

export function useNotes(): { notes: NotesState; upsert(lessonId: LessonId, text: string): void } {
  const repos = useRepositories();
  const notes = useStoreValue(repos.notes);
  const upsert = useCallback(
    (lessonId: LessonId, text: string) =>
      repos.notes.set(upsertNote(repos.notes.get(), lessonId, text, repos.clock.now())),
    [repos],
  );
  return { notes, upsert };
}
```

`src/application/hooks/useSrs.ts`:
```ts
import { useCallback, useMemo } from 'react';
import { dueCards, type Grade, type SrsCard, type SrsState } from '@/domain/srs';
import type { LessonId } from '@/domain/course';
import { useRepositories } from '@/application/RepositoriesContext';
import { gradeCardUseCase } from '@/application/useCases/gradeCard';
import { registerCardsUseCase } from '@/application/useCases/registerCards';
import { useStoreValue } from './useStoreValue';

export function useSrs(): {
  cards: SrsState;
  due: SrsCard[];
  registerCards(lessonId: LessonId, cards: { front: string; back: string }[]): void;
  grade(key: string, grade: Grade): void;
} {
  const repos = useRepositories();
  const cards = useStoreValue(repos.srs);
  const { completed } = useStoreValue(repos.progress);
  const today = repos.clock.today();
  const due = useMemo(() => dueCards(cards, completed, today), [cards, completed, today]);
  return {
    cards,
    due,
    registerCards: useCallback(
      (lessonId: LessonId, list: { front: string; back: string }[]) => registerCardsUseCase(repos, lessonId, list),
      [repos],
    ),
    grade: useCallback((key: string, grade: Grade) => gradeCardUseCase(repos, key, grade), [repos]),
  };
}
```

`src/application/hooks/useChecklist.ts`:
```ts
import { useCallback } from 'react';
import { toggleChecklistItem } from '@/domain/progress';
import type { LessonId } from '@/domain/course';
import { useRepositories } from '@/application/RepositoriesContext';
import { useStoreValue } from './useStoreValue';

export function checklistKey(lessonId: LessonId, id: string): string {
  return `${lessonId}:${id}`;
}

export function useChecklist(lessonId: LessonId, id: string): { checked: number[]; toggle(index: number): void } {
  const repos = useRepositories();
  const { checklists } = useStoreValue(repos.progress);
  const key = checklistKey(lessonId, id);
  const toggle = useCallback(
    (index: number) => repos.progress.set(toggleChecklistItem(repos.progress.get(), key, index)),
    [repos, key],
  );
  return { checked: checklists[key] ?? [], toggle };
}
```

`src/application/hooks/useContinueLearning.ts`:
```ts
import type { Course, Lesson } from '@/domain/course';
import { useRepositories } from '@/application/RepositoriesContext';
import { continueLearning } from '@/application/useCases/continueLearning';
import { useStoreValue } from './useStoreValue';

export function useContinueLearning(course: Course): Lesson | null {
  const repos = useRepositories();
  const progress = useStoreValue(repos.progress);
  return continueLearning(course, progress);
}
```

- [ ] **Step 8: Run tests**

Run: `pnpm format && pnpm vitest run src/application && pnpm lint && pnpm typecheck`
Expected: 7 tests pass, lint clean (the application layer imports only domain and react).

- [ ] **Step 9: Commit**

```bash
git add src/application
git commit -m "feat(application): add ports, use cases and hooks over repositories"
```

---

### Task 8: Infrastructure — persisted stores and system clock

**Files:**
- Create: `src/infrastructure/storage/createPersistedStore.ts`, `src/infrastructure/storage/systemClock.ts`, `src/infrastructure/storage/createRepositories.ts`
- Test: `src/infrastructure/storage/createPersistedStore.test.ts`

**Interfaces:**
- Consumes: `Store<T>`, `Clock`, `Repositories` (Task 7); `emptyProgress`, `emptyNotes` (Tasks 5, 6); `toIsoDate` (Task 4).
- Produces:

```ts
export function createPersistedStore<T>(name: string, initial: T): Store<T>;   // localStorage key `saber:<name>`
export const systemClock: Clock;
export function createRepositories(): Repositories;
```

- [ ] **Step 1: Write failing test `src/infrastructure/storage/createPersistedStore.test.ts`**

```ts
import { createPersistedStore } from './createPersistedStore';

describe('createPersistedStore', () => {
  beforeEach(() => localStorage.clear());

  it('starts from the initial value and persists updates under a namespaced key', () => {
    const store = createPersistedStore('t', { n: 1 });
    expect(store.get()).toEqual({ n: 1 });
    store.set({ n: 2 });
    expect(JSON.parse(localStorage.getItem('saber:t') ?? '{}').state.value).toEqual({ n: 2 });
    expect(createPersistedStore('t', { n: 0 }).get()).toEqual({ n: 2 });
  });

  it('notifies subscribers and allows unsubscribing', () => {
    const store = createPersistedStore('u', 0);
    const listener = vi.fn();
    const off = store.subscribe(listener);
    store.set(1);
    off();
    store.set(2);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('falls back to the initial value when stored JSON is corrupt', () => {
    localStorage.setItem('saber:c', '{not json');
    expect(createPersistedStore('c', { ok: true }).get()).toEqual({ ok: true });
  });

  it('works in memory when localStorage is unavailable', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('denied');
      },
    });
    try {
      const store = createPersistedStore('m', 5);
      store.set(6);
      expect(store.get()).toBe(6);
    } finally {
      if (original) Object.defineProperty(window, 'localStorage', original);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/infrastructure`
Expected: FAIL, module not found.

- [ ] **Step 3: Create `src/infrastructure/storage/createPersistedStore.ts`**

```ts
import { createStore } from 'zustand/vanilla';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { Store } from '@/application/ports/Store';

interface Slice<T> {
  value: T;
}

function safeLocalStorage(): StateStorage | null {
  try {
    const ls = window.localStorage;
    ls.getItem('saber:probe');
    return ls;
  } catch {
    return null;
  }
}

function memoryStorage(): StateStorage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

export function createPersistedStore<T>(name: string, initial: T): Store<T> {
  const backend = safeLocalStorage() ?? memoryStorage();
  const store = createStore<Slice<T>>()(
    persist(() => ({ value: initial }), {
      name: `saber:${name}`,
      storage: createJSONStorage(() => backend),
      merge: (persisted, current) => {
        const p = persisted as Partial<Slice<T>> | undefined;
        return p && typeof p === 'object' && 'value' in p && p.value !== undefined ? { value: p.value as T } : current;
      },
    }),
  );
  return {
    get: () => store.getState().value,
    set: (next) => store.setState({ value: next }),
    subscribe: (listener) => store.subscribe(listener),
  };
}
```

- [ ] **Step 4: Create `systemClock.ts` and `createRepositories.ts`**

`src/infrastructure/storage/systemClock.ts`:
```ts
import { toIsoDate } from '@/domain/srs';
import type { Clock } from '@/application/ports/Clock';

export const systemClock: Clock = {
  today: () => toIsoDate(new Date()),
  now: () => new Date().toISOString(),
};
```

`src/infrastructure/storage/createRepositories.ts`:
```ts
import { emptyProgress, type ProgressState } from '@/domain/progress';
import { emptyNotes, type NotesState } from '@/domain/notes';
import type { SrsState } from '@/domain/srs';
import type { Repositories } from '@/application/ports/Repositories';
import { createPersistedStore } from './createPersistedStore';
import { systemClock } from './systemClock';

export function createRepositories(): Repositories {
  return {
    progress: createPersistedStore<ProgressState>('progress', emptyProgress()),
    notes: createPersistedStore<NotesState>('notes', emptyNotes()),
    srs: createPersistedStore<SrsState>('srs', {}),
    clock: systemClock,
  };
}
```

- [ ] **Step 5: Run tests and commit**

Run: `pnpm format && pnpm vitest run src/infrastructure && pnpm lint && pnpm typecheck`
Expected: 4 tests pass. If the corrupt-JSON test fails because zustand logs an error and still merges, confirm `store.get()` equals the initial value; the console error is acceptable.

```bash
git add src/infrastructure/storage
git commit -m "feat(infrastructure): persist repositories in localStorage with zustand"
```

---

### Task 9: Infrastructure — MDX types, stages, course loader and the first real lesson

**Files:**
- Create: `src/types/mdx.d.ts`, `content/stages.json`, `src/infrastructure/content/lessonModules.ts`, `src/infrastructure/content/loadCourse.ts`, `content/00-aprender-a-programar/00-que-es-un-programa.mdx`
- Test: `src/infrastructure/content/loadCourse.test.ts`

**Interfaces:**
- Consumes: `buildCourse`, `Course`, `LessonMeta`, `StageMeta`, `LessonComponent`, `LessonLoader` (Task 3).
- Produces:

```ts
export function loadCourse(): Course;   // synchronous, built once at module load; every Lesson.load() resolves its MDX component
```

- [ ] **Step 1: Write failing test `src/infrastructure/content/loadCourse.test.ts`**

```ts
import { loadCourse } from './loadCourse';

describe('loadCourse', () => {
  const course = loadCourse();

  it('exposes the twelve stages in order', () => {
    expect(course.stages.map((s) => s.id)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(course.stages[0]?.slug).toBe('00-aprender-a-programar');
  });

  it('includes the first lesson with frontmatter from the MDX file', () => {
    const lesson = course.byId['00-aprender-a-programar/00-que-es-un-programa'];
    expect(lesson).toMatchObject({ title: 'Qué es un programa', stage: 0, order: 0, stageSlug: '00-aprender-a-programar' });
    expect(course.stages[0]?.lessons[0]?.id).toBe(lesson?.id);
  });

  it('every lesson id matches its file path', () => {
    for (const lesson of course.lessons) {
      expect(lesson.id).toBe(`${lesson.stageSlug}/${lesson.slug}`);
    }
  });

  it('loads a lesson component lazily through lesson.load()', async () => {
    const lesson = course.byId['00-aprender-a-programar/00-que-es-un-programa'];
    const Component = await lesson?.load();
    expect(typeof Component).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/infrastructure/content`
Expected: FAIL, module not found.

- [ ] **Step 3: Create `src/types/mdx.d.ts`**

```ts
declare module '*.mdx' {
  import type { ComponentType } from 'react';
  import type { MDXComponents } from 'mdx/types';
  import type { LessonMeta } from '@/domain/course/types';

  export const frontmatter: LessonMeta;
  const MDXContent: ComponentType<{ components?: MDXComponents }>;
  export default MDXContent;
}
```

`mdx/types` resolves through the `@types/mdx` devDependency added in Task 1.

- [ ] **Step 4: Create `content/stages.json`**

```json
[
  { "id": 0, "slug": "00-aprender-a-programar", "title": "Cómo aprender a programar", "mark": "Ap", "bg": "#022a2a", "fg": "#10484a", "project": "Repositorio propio con README", "hours": 8 },
  { "id": 1, "slug": "01-javascript", "title": "JavaScript desde cero", "mark": "Js", "bg": "#ff3d00", "fg": "#ff6a3a", "project": "App de tareas en consola", "hours": 25 },
  { "id": 2, "slug": "02-typescript", "title": "TypeScript", "mark": "Ts", "bg": "#10484a", "fg": "#1d6b6e", "project": "Migrar la app de tareas a TypeScript", "hours": 10 },
  { "id": 3, "slug": "03-react", "title": "React", "mark": "Re", "bg": "#9bc62b", "fg": "#b3d85a", "project": "Tablero de tareas web", "hours": 18 },
  { "id": 4, "slug": "04-react-native-expo", "title": "React Native + Expo", "mark": "Rn", "bg": "#022a2a", "fg": "#10484a", "project": "App de notas local", "hours": 18 },
  { "id": 5, "slug": "05-estado-datos-arquitectura", "title": "Estado, datos y arquitectura", "mark": "Ar", "bg": "#efe6da", "fg": "#e2d5c3", "project": "App conectada a una API pública", "hours": 18 },
  { "id": 6, "slug": "06-calidad-ci", "title": "Calidad y CI", "mark": "Ci", "bg": "#ff3d00", "fg": "#ff6a3a", "project": "Pipeline de CI en verde", "hours": 12 },
  { "id": 7, "slug": "07-nativo-ux-avanzada", "title": "Nativo y UX avanzada", "mark": "Ux", "bg": "#10484a", "fg": "#1d6b6e", "project": "Módulo nativo en la app", "hours": 16 },
  { "id": 8, "slug": "08-autenticacion-backend", "title": "Autenticación y backend", "mark": "Au", "bg": "#9bc62b", "fg": "#b3d85a", "project": "App con usuarios", "hours": 14 },
  { "id": 9, "slug": "09-seguridad-movil", "title": "Seguridad móvil (OWASP MASVS)", "mark": "Se", "bg": "#022a2a", "fg": "#10484a", "project": "Auditoría de la propia app", "hours": 14 },
  { "id": 10, "slug": "10-build-release-operaciones", "title": "Build, release y operaciones", "mark": "Rl", "bg": "#ff3d00", "fg": "#ff6a3a", "project": "App publicada en ambas tiendas", "hours": 14 },
  { "id": 11, "slug": "11-capstone", "title": "Capstone", "mark": "Cp", "bg": "#efe6da", "fg": "#e2d5c3", "project": "App propia publicada", "hours": 20 }
]
```

- [ ] **Step 5: Create `src/infrastructure/content/lessonModules.ts` and `loadCourse.ts`**

`lessonModules.ts`:
```ts
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
```

`loadCourse.ts`:
```ts
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
  return Object.entries(lessonFrontmatter).map(([path, meta]) => ({ ...meta, id: idFromPath(path) }));
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
```

The loader overrides `id` with the path-derived id so a mistyped frontmatter `id` can never desynchronize the sidebar from the route; the validator (Task 21) still reports the mismatch.

- [ ] **Step 6: Create `content/00-aprender-a-programar/00-que-es-un-programa.mdx`**

```mdx
---
id: "00-aprender-a-programar/00-que-es-un-programa"
title: "Qué es un programa"
stage: 0
module: "Antes de escribir código"
order: 0
minutes: 10
prereqs: []
summary: "Entiende qué hace una computadora cuando ejecuta un programa y por qué el orden importa."
---

## Objetivo

Al terminar esta lección vas a poder explicar con tus palabras qué es un programa, qué es una instrucción y por qué la computadora necesita que todo esté escrito en orden y sin ambigüedad.

**Prerrequisitos:** ninguno. Esta es la primera lección del curso.

## Concepto

Una computadora no piensa. Solo sigue instrucciones, una detrás de otra, exactamente como están escritas. Un **programa** es esa lista de instrucciones.

Piensa en una receta de cocina. La receta dice "bate tres huevos, agrega una taza de harina, mezcla durante dos minutos". Quien cocina no decide nada: sigue los pasos. Si la receta dice "agrega harina" antes de "rompe los huevos", el resultado es un desastre, aunque cada paso por separado sea correcto. Programar es escribir recetas para una cocinera que obedece al pie de la letra y nunca improvisa.

Tres ideas que vas a usar todos los días:

- **Instrucción**: un paso concreto. "Muestra el texto Hola en pantalla" es una instrucción.
- **Secuencia**: las instrucciones se ejecutan en orden, de arriba hacia abajo, salvo que una instrucción diga lo contrario.
- **Ambigüedad**: la computadora no entiende "más o menos". Si una instrucción puede interpretarse de dos formas, el programa no funciona o hace algo inesperado.

Todo lo que vas a aprender en este curso, desde una variable hasta una app publicada en la tienda, se construye sobre estas tres ideas. Cuando algo falle, y va a fallar muchas veces, la primera pregunta siempre es la misma: ¿qué instrucción se ejecutó, en qué orden, y qué entendió la computadora?

<Callout kind="tip">
  La palabra "código" es solo otra forma de decir "programa escrito en un lenguaje que la computadora entiende". En este curso el lenguaje será JavaScript.
</Callout>

## Práctica

Este es tu primer programa. Cada línea es una instrucción que muestra un texto. Pulsa "Ejecutar" y observa la salida. Después cambia el orden de las líneas y vuelve a ejecutar: la salida cambia porque la secuencia cambió.

<Playground
  lang="js"
  code={`console.log("Rompe tres huevos");
console.log("Agrega una taza de harina");
console.log("Mezcla dos minutos");`}
  expected={`Rompe tres huevos
Agrega una taza de harina
Mezcla dos minutos`}
/>

## Ejercicio

<Challenge
  title="Tu primera receta como programa"
  solution={
    <Playground
      lang="js"
      code={`console.log("Hierve el agua");
console.log("Pon la bolsita en la taza");
console.log("Vierte el agua en la taza");
console.log("Espera tres minutos");`}
    />
  }
>
  Escribe un programa de cuatro instrucciones que muestre, en orden, los pasos para preparar un té: hervir agua, poner la bolsita en la taza, verter el agua, esperar tres minutos. Usa una línea `console.log` por paso.

  <Playground lang="js" code={`// Escribe aquí tus cuatro instrucciones`} />
</Challenge>

## Errores comunes

- **Pensar que la computadora "sabe lo que quisiste decir".** No lo sabe. Si escribes `console.log(Hola)` sin comillas, la computadora busca algo llamado `Hola` que no existe y falla. Cómo detectarlo: el mensaje de error menciona "is not defined".
- **Cambiar el orden y esperar el mismo resultado.** Dos programas con las mismas instrucciones en distinto orden son programas distintos. Cómo detectarlo: compara la salida línea por línea con lo que esperabas.

<Flashcards
  cards={[
    { front: "¿Qué es un programa?", back: "Una lista de instrucciones que la computadora ejecuta en orden." },
    { front: "¿Qué es una instrucción?", back: "Un paso concreto y sin ambigüedad, como mostrar un texto en pantalla." },
    { front: "¿Por qué importa el orden de las instrucciones?", back: "Porque la computadora las ejecuta de arriba hacia abajo y no corrige el orden por ti." },
    { front: "¿Qué pasa con una instrucción ambigua?", back: "El programa falla o hace algo inesperado; la computadora no interpreta intenciones." },
  ]}
/>

<Quiz
  questions={[
    {
      prompt: "¿Qué hace una computadora cuando ejecuta un programa?",
      options: [
        { text: "Interpreta la intención de quien lo escribió", correct: false, feedback: "No. La computadora no interpreta intenciones, solo sigue instrucciones." },
        { text: "Sigue las instrucciones en orden, tal como están escritas", correct: true, feedback: "Correcto. Esa es la definición de ejecutar un programa." },
        { text: "Elige el mejor orden para las instrucciones", correct: false, feedback: "No. El orden lo decide quien programa." },
      ],
    },
    {
      prompt: "Si intercambias dos líneas de un programa, ¿qué ocurre?",
      options: [
        { text: "Nada, el resultado es el mismo", correct: false, feedback: "Solo si las líneas no dependen entre sí; en general el resultado cambia." },
        { text: "El programa deja de ser válido siempre", correct: false, feedback: "Puede seguir siendo válido, pero hacer otra cosa." },
        { text: "Puede cambiar el resultado, porque la secuencia cambió", correct: true, feedback: "Correcto. El orden forma parte del programa." },
      ],
    },
    {
      prompt: "¿Cuál de estas es una instrucción sin ambigüedad?",
      options: [
        { text: "Muestra un saludo bonito", correct: false, feedback: "\"Bonito\" es ambiguo; la computadora no puede decidir qué significa." },
        { text: "Muestra el texto Hola en pantalla", correct: true, feedback: "Correcto. Es concreto y solo tiene una interpretación." },
        { text: "Haz algo útil", correct: false, feedback: "Demasiado vago para ser una instrucción." },
      ],
    },
  ]}
/>
```

Note the `solution` prop on `Challenge`: writers pass any JSX there (usually a `Playground` or `Snack` holding the answer). `Challenge` is defined in Task 10.

- [ ] **Step 7: Run tests**

Run: `pnpm format && pnpm vitest run src/infrastructure/content && pnpm lint && pnpm typecheck`
Expected: 4 tests pass. If `import.meta.glob` with `import: 'frontmatter'` yields `undefined`, confirm `remarkMdxFrontmatter` is configured with `{ name: 'frontmatter' }` in `vite.config.ts`.

- [ ] **Step 8: Commit**

```bash
git add src/types/mdx.d.ts content/stages.json src/infrastructure/content content/00-aprender-a-programar/00-que-es-un-programa.mdx
git commit -m "feat(content): load MDX lessons into the course model and add first lesson"
```

---

### Task 10: Interactive — LessonContext, Callout and Challenge

**Files:**
- Create: `src/ui/organisms/interactive/LessonContext.tsx`, `src/ui/organisms/interactive/Callout.tsx`, `src/ui/organisms/interactive/Callout.module.css`, `src/ui/organisms/interactive/Challenge.tsx`, `src/ui/organisms/interactive/Challenge.module.css`
- Test: `src/ui/organisms/interactive/Callout.test.tsx`, `src/ui/organisms/interactive/Challenge.test.tsx`

**Interfaces:**
- Produces:

```ts
export function LessonProvider(props: { lessonId: LessonId; children: ReactNode }): JSX.Element;
export function useLessonId(): LessonId;                       // throws outside a LessonProvider
export function Callout(props: { kind?: 'tip' | 'warning' | 'danger'; children: ReactNode }): JSX.Element;
export function Challenge(props: { title: string; children: ReactNode; solution: ReactNode }): JSX.Element;   // solution rendered only after "Ver solución"
```

- Provider composition for any test that renders lesson content (Quiz, Flashcards, Checklist, Challenge, the demo lesson, page smoke tests over real MDX). `MdxProvider` comes from Task 14; `renderWithRepositories` (Task 7) already wraps `RepositoriesProvider` and `MemoryRouter`, so a lesson smoke test is:

```tsx
import { renderWithRepositories } from '@/application/testing/renderWithRepositories';
import { LessonProvider } from '@/ui/organisms/interactive/LessonContext';
import { MdxProvider } from '@/ui/organisms/interactive/MdxProvider';

const Content = await lesson.load(); // Lesson.load(): Promise<LessonComponent>, no `.default`
renderWithRepositories(
  <LessonProvider lessonId={lesson.id}>
    <MdxProvider>
      <Content />
    </MdxProvider>
  </LessonProvider>,
  { route: `/etapa/${lesson.stageSlug}/${lesson.slug}` },
);
```

Without `renderWithRepositories`, the explicit tree is `<RepositoriesProvider value={testRepositories()}><MemoryRouter><LessonProvider lessonId="..."><MdxProvider>...</MdxProvider></LessonProvider></MemoryRouter></RepositoriesProvider>`.

- [ ] **Step 1: Write failing tests**

`Callout.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { Callout } from './Callout';

describe('Callout', () => {
  it('renders children with a role of note and the kind label', () => {
    render(<Callout kind="warning">Cuidado</Callout>);
    const note = screen.getByRole('note');
    expect(note).toHaveTextContent('Cuidado');
    expect(note).toHaveAttribute('data-kind', 'warning');
  });
  it('defaults to tip', () => {
    render(<Callout>Idea</Callout>);
    expect(screen.getByRole('note')).toHaveAttribute('data-kind', 'tip');
  });
});
```

`Challenge.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Challenge } from './Challenge';

describe('Challenge', () => {
  it('hides the solution until the learner asks for it', async () => {
    render(
      <Challenge title="Reto" solution={<p>La respuesta</p>}>
        <p>Enunciado</p>
      </Challenge>,
    );
    expect(screen.getByRole('heading', { name: 'Reto' })).toBeInTheDocument();
    expect(screen.getByText('Enunciado')).toBeInTheDocument();
    expect(screen.queryByText('La respuesta')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ver solución' }));
    expect(screen.getByText('La respuesta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ocultar solución' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/ui/organisms/interactive`
Expected: FAIL, modules not found.

- [ ] **Step 3: Create `LessonContext.tsx`**

```tsx
import { createContext, useContext, type ReactNode } from 'react';
import type { LessonId } from '@/domain/course';

const LessonContext = createContext<LessonId | null>(null);

export function LessonProvider({ lessonId, children }: { lessonId: LessonId; children: ReactNode }) {
  return <LessonContext.Provider value={lessonId}>{children}</LessonContext.Provider>;
}

export function useLessonId(): LessonId {
  const id = useContext(LessonContext);
  if (!id) throw new Error('useLessonId must be used inside a LessonProvider');
  return id;
}
```

- [ ] **Step 4: Create `Callout.tsx` and `Callout.module.css`**

`Callout.tsx`:
```tsx
import type { ReactNode } from 'react';
import styles from './Callout.module.css';

export type CalloutKind = 'tip' | 'warning' | 'danger';

const ICON: Record<CalloutKind, string> = { tip: 'i', warning: '!', danger: '×' };

export function Callout({ kind = 'tip', children }: { kind?: CalloutKind; children: ReactNode }) {
  return (
    <aside role="note" data-kind={kind} className={styles.root}>
      <span className={styles.icon} aria-hidden="true">
        {ICON[kind]}
      </span>
      <div className={styles.body}>{children}</div>
    </aside>
  );
}
```

`Callout.module.css`:
```css
.root {
  display: flex;
  gap: 16px;
  background: var(--color-sand);
  border-radius: 20px;
  padding: 20px 24px;
  margin: 24px 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--color-teal);
}

.root[data-kind='warning'] {
  background: #fff4e5;
}

.root[data-kind='danger'] {
  background: #ffe8e0;
}

.icon {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 600;
  font-size: 14px;
  color: #fff;
  background: var(--color-teal);
}

.root[data-kind='warning'] .icon,
.root[data-kind='danger'] .icon {
  background: var(--color-accent);
}

.body > :first-child {
  margin-top: 0;
}

.body > :last-child {
  margin-bottom: 0;
}
```

- [ ] **Step 5: Create `Challenge.tsx` and `Challenge.module.css`**

`Challenge.tsx`:
```tsx
import { useState, type ReactNode } from 'react';
import styles from './Challenge.module.css';

export function Challenge({
  title,
  children,
  solution,
}: {
  title: string;
  children: ReactNode;
  solution: ReactNode;
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <section className={styles.root}>
      <div className={styles.head}>
        <span className={styles.badge}>Ejercicio</span>
        <h3 className={styles.title}>{title}</h3>
      </div>
      <div>{children}</div>
      <button type="button" className={styles.toggle} onClick={() => setRevealed((r) => !r)}>
        {revealed ? 'Ocultar solución' : 'Ver solución'}
      </button>
      {revealed && (
        <div className={styles.solution}>
          <div className={styles.solutionLabel}>Solución</div>
          {solution}
        </div>
      )}
    </section>
  );
}
```

`Challenge.module.css`:
```css
.root {
  border: 1.5px solid var(--ink-10);
  border-radius: var(--radius-l);
  padding: 24px 26px;
  margin: 24px 0;
}

.head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.badge {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--color-accent);
}

.title {
  font-size: 20px;
}

.toggle {
  margin-top: 12px;
  height: 40px;
  padding: 0 20px;
  border-radius: 20px;
  background: var(--color-ink);
  color: var(--color-sand);
  font-weight: 600;
  font-size: 14px;
}

.solution {
  margin-top: 16px;
  padding: 16px 20px;
  border-radius: var(--radius-m);
  background: var(--color-paper);
}

.solutionLabel {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--color-lime);
  margin-bottom: 6px;
}
```

- [ ] **Step 6: Run tests and commit**

Run: `pnpm format && pnpm vitest run src/ui/organisms/interactive && pnpm lint && pnpm typecheck`
Expected: 3 tests pass.

```bash
git add src/ui/organisms/interactive
git commit -m "feat(ui): add lesson context, callout and challenge components"
```

---

### Task 11: Interactive — Terminal and Checklist

**Files:**
- Create: `src/ui/organisms/interactive/Terminal.tsx`, `src/ui/organisms/interactive/Terminal.module.css`, `src/ui/organisms/interactive/Checklist.tsx`, `src/ui/organisms/interactive/Checklist.module.css`
- Test: `src/ui/organisms/interactive/Terminal.test.tsx`, `src/ui/organisms/interactive/Checklist.test.tsx`

**Interfaces:**
- Consumes: `useChecklist` (Task 7), `useLessonId` (Task 10), `renderWithRepositories` (Task 7).
- Produces:

```ts
export function Terminal(props: { steps: { cmd: string; out: string }[] }): JSX.Element;
export function Checklist(props: { id: string; items: string[] }): JSX.Element;
```

- [ ] **Step 1: Write failing tests**

`Terminal.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Terminal } from './Terminal';

const steps = [
  { cmd: 'node --version', out: 'v22.11.0' },
  { cmd: 'git --version', out: 'git version 2.47.0' },
];

describe('Terminal', () => {
  it('reveals one step at a time and can restart', async () => {
    render(<Terminal steps={steps} />);
    expect(screen.getByText('node --version')).toBeInTheDocument();
    expect(screen.getByText('v22.11.0')).toBeInTheDocument();
    expect(screen.queryByText('git --version')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente paso' }));
    expect(screen.getByText('git version 2.47.0')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reiniciar' }));
    expect(screen.queryByText('git --version')).not.toBeInTheDocument();
  });
});
```

`Checklist.test.tsx`:
```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRepositories } from '@/application/testing/renderWithRepositories';
import { LessonProvider } from './LessonContext';
import { Checklist } from './Checklist';

describe('Checklist', () => {
  it('persists checked items per lesson and checklist id', async () => {
    const { repos } = renderWithRepositories(
      <LessonProvider lessonId="09-seguridad-movil/00-x">
        <Checklist id="release" items={['Sin secretos en el bundle', 'HTTPS obligatorio']} />
      </LessonProvider>,
    );
    await userEvent.click(screen.getByLabelText('HTTPS obligatorio'));
    expect(screen.getByLabelText('HTTPS obligatorio')).toBeChecked();
    expect(repos.progress.get().checklists['09-seguridad-movil/00-x:release']).toEqual([1]);
    expect(screen.getByText('1 de 2 completados')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/ui/organisms/interactive/Terminal src/ui/organisms/interactive/Checklist`
Expected: FAIL, modules not found.

- [ ] **Step 3: Create `Terminal.tsx` and `Terminal.module.css`**

`Terminal.tsx`:
```tsx
import { useState } from 'react';
import styles from './Terminal.module.css';

export interface TerminalStep {
  cmd: string;
  out: string;
}

export function Terminal({ steps }: { steps: TerminalStep[] }) {
  const [visible, setVisible] = useState(1);
  const finished = visible >= steps.length;
  return (
    <div className={styles.root}>
      <div className={styles.bar}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.barTitle}>terminal</span>
      </div>
      <pre className={styles.screen}>
        {steps.slice(0, visible).map((step, i) => (
          <div key={i} className={styles.step}>
            <div>
              <span className={styles.prompt}>$ </span>
              <span className={styles.cmd}>{step.cmd}</span>
            </div>
            {step.out !== '' && <div className={styles.out}>{step.out}</div>}
          </div>
        ))}
      </pre>
      <div className={styles.actions}>
        {finished ? (
          <button type="button" className={styles.button} onClick={() => setVisible(1)}>
            Reiniciar
          </button>
        ) : (
          <button type="button" className={styles.button} onClick={() => setVisible((v) => v + 1)}>
            Siguiente paso
          </button>
        )}
        <span className={styles.counter}>
          {Math.min(visible, steps.length)} / {steps.length}
        </span>
      </div>
    </div>
  );
}
```

`Terminal.module.css`:
```css
.root {
  margin: 24px 0;
  border-radius: var(--radius-m);
  overflow: hidden;
  background: var(--color-ink);
  color: var(--color-sand);
  font-family: var(--font-mono);
  font-size: 13px;
}

.bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: var(--color-teal);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--sand-70);
}

.barTitle {
  margin-left: 8px;
  font-family: var(--font);
  font-size: 12px;
  color: var(--sand-70);
}

.screen {
  margin: 0;
  padding: 16px;
  min-height: 120px;
  white-space: pre-wrap;
}

.step + .step {
  margin-top: 10px;
}

.prompt {
  color: var(--color-lime);
}

.cmd {
  color: #fff;
}

.out {
  color: var(--sand-70);
  margin-top: 4px;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-top: 1px solid var(--sand-15);
}

.button {
  font-family: var(--font);
  font-size: 13px;
  font-weight: 600;
  height: 34px;
  padding: 0 16px;
  border-radius: 17px;
  background: var(--color-accent);
  color: #fff;
}

.counter {
  font-family: var(--font);
  font-size: 12px;
  color: var(--sand-70);
}
```

- [ ] **Step 4: Create `Checklist.tsx` and `Checklist.module.css`**

`Checklist.tsx`:
```tsx
import { useChecklist } from '@/application/hooks/useChecklist';
import { useLessonId } from './LessonContext';
import styles from './Checklist.module.css';

export function Checklist({ id, items }: { id: string; items: string[] }) {
  const lessonId = useLessonId();
  const { checked, toggle } = useChecklist(lessonId, id);
  return (
    <div className={styles.root}>
      <ul className={styles.list}>
        {items.map((item, index) => {
          const inputId = `${lessonId}:${id}:${index}`;
          return (
            <li key={index} className={styles.item}>
              <input
                id={inputId}
                type="checkbox"
                className={styles.checkbox}
                checked={checked.includes(index)}
                onChange={() => toggle(index)}
              />
              <label htmlFor={inputId} className={styles.label}>
                {item}
              </label>
            </li>
          );
        })}
      </ul>
      <div className={styles.summary}>
        {checked.length} de {items.length} completados
      </div>
    </div>
  );
}
```

`Checklist.module.css`:
```css
.root {
  margin: 24px 0;
  padding: 20px 24px;
  border-radius: var(--radius-l);
  background: var(--color-white);
  border: 1.5px solid var(--ink-10);
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.checkbox {
  width: 18px;
  height: 18px;
  margin-top: 3px;
  accent-color: var(--color-lime);
}

.label {
  font-size: 15px;
  color: var(--color-ink);
  cursor: pointer;
}

.summary {
  margin-top: 14px;
  font-size: 12px;
  color: var(--ink-55);
}
```

- [ ] **Step 5: Run tests and commit**

Run: `pnpm format && pnpm vitest run src/ui/organisms/interactive && pnpm lint && pnpm typecheck`
Expected: 5 tests pass.

```bash
git add src/ui/organisms/interactive
git commit -m "feat(ui): add simulated terminal and persistent checklist"
```

---

### Task 12: Interactive — Quiz and Flashcards

**Files:**
- Create: `src/ui/organisms/interactive/Quiz.tsx`, `src/ui/organisms/interactive/Quiz.module.css`, `src/ui/organisms/interactive/Flashcards.tsx`, `src/ui/organisms/interactive/Flashcards.module.css`
- Test: `src/ui/organisms/interactive/Quiz.test.tsx`, `src/ui/organisms/interactive/Flashcards.test.tsx`

**Interfaces:**
- Consumes: `useProgress`, `useSrs` (Task 7), `useLessonId` (Task 10).
- Produces:

```ts
export interface QuizOption { text: string; correct: boolean; feedback: string; }
export interface QuizQuestion { prompt: string; options: QuizOption[]; }
export function Quiz(props: { questions: QuizQuestion[] }): JSX.Element;
export interface Flashcard { front: string; back: string; }
export function Flashcards(props: { cards: Flashcard[] }): JSX.Element;
```

- [ ] **Step 1: Write failing tests**

`Quiz.test.tsx`:
```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRepositories } from '@/application/testing/renderWithRepositories';
import { LessonProvider } from './LessonContext';
import { Quiz } from './Quiz';

const questions = [
  {
    prompt: '¿2 + 2?',
    options: [
      { text: '3', correct: false, feedback: 'No, revisa la suma.' },
      { text: '4', correct: true, feedback: 'Correcto.' },
    ],
  },
  {
    prompt: '¿Capital de Francia?',
    options: [
      { text: 'París', correct: true, feedback: 'Correcto.' },
      { text: 'Roma', correct: false, feedback: 'Roma es la capital de Italia.' },
    ],
  },
];

describe('Quiz', () => {
  it('shows feedback per answer, locks the question and records the best score', async () => {
    const { repos } = renderWithRepositories(
      <LessonProvider lessonId="a/b">
        <Quiz questions={questions} />
      </LessonProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: '3' }));
    expect(screen.getByText('No, revisa la suma.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4' })).toBeDisabled();
    expect(screen.queryByText(/Resultado/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'París' }));
    expect(screen.getByText('Resultado: 1 de 2 correctas')).toBeInTheDocument();
    expect(repos.progress.get().quizScores['a/b']).toBe(0.5);
  });
});
```

`Flashcards.test.tsx`:
```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRepositories } from '@/application/testing/renderWithRepositories';
import { LessonProvider } from './LessonContext';
import { Flashcards } from './Flashcards';

describe('Flashcards', () => {
  it('registers the cards for review and flips on click', async () => {
    const { repos } = renderWithRepositories(
      <LessonProvider lessonId="a/b">
        <Flashcards cards={[{ front: 'Pregunta 1', back: 'Respuesta 1' }]} />
      </LessonProvider>,
    );
    expect(Object.keys(repos.srs.get())).toEqual(['a/b#0']);
    expect(screen.getByText('Pregunta 1')).toBeInTheDocument();
    expect(screen.queryByText('Respuesta 1')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Pregunta 1/ }));
    expect(screen.getByText('Respuesta 1')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/ui/organisms/interactive/Quiz src/ui/organisms/interactive/Flashcards`
Expected: FAIL, modules not found.

- [ ] **Step 3: Create `Quiz.tsx` and `Quiz.module.css`**

`Quiz.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { useProgress } from '@/application/hooks/useProgress';
import { useLessonId } from './LessonContext';
import styles from './Quiz.module.css';

export interface QuizOption {
  text: string;
  correct: boolean;
  feedback: string;
}

export interface QuizQuestion {
  prompt: string;
  options: QuizOption[];
}

export function Quiz({ questions }: { questions: QuizQuestion[] }) {
  const lessonId = useLessonId();
  const { recordQuizScore } = useProgress();
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const answered = Object.keys(answers).length;
  const finished = questions.length > 0 && answered === questions.length;
  const correct = questions.filter((q, i) => {
    const pick = answers[i];
    return pick !== undefined && q.options[pick]?.correct === true;
  }).length;

  useEffect(() => {
    if (finished) recordQuizScore(lessonId, correct / questions.length);
  }, [finished, correct, questions.length, lessonId, recordQuizScore]);

  return (
    <section className={styles.root} aria-label="Cuestionario">
      <div className={styles.badge}>Quiz</div>
      {questions.map((question, qi) => {
        const pick = answers[qi];
        return (
          <div key={qi} className={styles.question}>
            <div className={styles.prompt}>
              {qi + 1}. {question.prompt}
            </div>
            <div className={styles.options}>
              {question.options.map((option, oi) => {
                const state = pick === undefined ? 'idle' : option.correct ? 'correct' : pick === oi ? 'wrong' : 'idle';
                return (
                  <button
                    key={oi}
                    type="button"
                    className={styles.option}
                    data-state={state}
                    disabled={pick !== undefined}
                    onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                  >
                    {option.text}
                  </button>
                );
              })}
            </div>
            {pick !== undefined && <p className={styles.feedback}>{question.options[pick]?.feedback}</p>}
          </div>
        );
      })}
      {finished && (
        <div className={styles.result}>
          Resultado: {correct} de {questions.length} correctas
        </div>
      )}
    </section>
  );
}
```

`Quiz.module.css`:
```css
.root {
  margin: 32px 0;
  padding: 28px;
  border-radius: var(--radius-l);
  background: var(--color-ink);
  color: var(--color-sand);
}

.badge {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--color-lime);
  margin-bottom: 16px;
}

.question + .question {
  margin-top: 24px;
}

.prompt {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
}

.options {
  display: grid;
  gap: 8px;
}

.option {
  text-align: left;
  padding: 12px 16px;
  border-radius: var(--radius-s);
  background: var(--sand-15);
  color: var(--color-sand);
  font-size: 14px;
}

.option:disabled {
  cursor: default;
}

.option[data-state='correct'] {
  background: var(--color-lime);
  color: var(--color-ink);
}

.option[data-state='wrong'] {
  background: var(--color-accent);
  color: #fff;
}

.feedback {
  margin: 10px 0 0;
  font-size: 14px;
  color: var(--sand-70);
}

.result {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--sand-15);
  font-weight: 600;
}
```

- [ ] **Step 4: Create `Flashcards.tsx` and `Flashcards.module.css`**

`Flashcards.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { useSrs } from '@/application/hooks/useSrs';
import { useLessonId } from './LessonContext';
import styles from './Flashcards.module.css';

export interface Flashcard {
  front: string;
  back: string;
}

export function Flashcards({ cards }: { cards: Flashcard[] }) {
  const lessonId = useLessonId();
  const { registerCards } = useSrs();
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  useEffect(() => {
    registerCards(lessonId, cards);
  }, [lessonId, cards, registerCards]);

  return (
    <section className={styles.root} aria-label="Tarjetas de repaso">
      <div className={styles.badge}>Tarjetas de repaso</div>
      <div className={styles.grid}>
        {cards.map((card, i) => {
          const isBack = flipped[i] === true;
          return (
            <button
              key={i}
              type="button"
              className={styles.card}
              data-side={isBack ? 'back' : 'front'}
              onClick={() => setFlipped((f) => ({ ...f, [i]: !isBack }))}
            >
              <span className={styles.side}>{isBack ? 'Respuesta' : 'Pregunta'}</span>
              <span className={styles.text}>{isBack ? card.back : card.front}</span>
              <span className={styles.hint}>Toca para girar</span>
            </button>
          );
        })}
      </div>
      <p className={styles.note}>Estas tarjetas se suman a tu repaso cuando completes la lección.</p>
    </section>
  );
}
```

`Flashcards.module.css`:
```css
.root {
  margin: 32px 0;
}

.badge {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--color-accent);
  margin-bottom: 12px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.card {
  min-height: 150px;
  padding: 18px;
  border-radius: var(--radius-l);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: left;
  background: var(--color-ink);
  color: var(--color-sand);
  transition: background 0.3s;
}

.card[data-side='back'] {
  background: var(--color-sand);
  color: var(--color-ink);
}

.side {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--color-lime);
}

.card[data-side='back'] .side {
  color: var(--color-accent);
}

.text {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.35;
}

.hint {
  font-size: 11px;
  opacity: 0.7;
}

.note {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--ink-55);
}
```

- [ ] **Step 5: Run tests and commit**

Run: `pnpm format && pnpm vitest run src/ui/organisms/interactive && pnpm lint && pnpm typecheck`
Expected: 7 tests pass.

```bash
git add src/ui/organisms/interactive
git commit -m "feat(ui): add quiz with score tracking and flashcards registration"
```

---

### Task 13: Interactive — Playground (Sucrase + sandboxed iframe)

**Files:**
- Create: `src/ui/organisms/interactive/playground/transpile.ts`, `src/ui/organisms/interactive/playground/buildSrcdoc.ts`, `src/ui/organisms/interactive/playground/Playground.tsx`, `src/ui/organisms/interactive/playground/Playground.module.css`, `src/ui/organisms/interactive/Playground.ts` (re-export)
- Test: `src/ui/organisms/interactive/playground/transpile.test.ts`, `src/ui/organisms/interactive/playground/buildSrcdoc.test.ts`, `src/ui/organisms/interactive/playground/Playground.test.tsx`

**Interfaces:**
- Produces:

```ts
export type PlaygroundLang = 'js' | 'ts';
export function transpile(code: string, lang: PlaygroundLang): { code: string } | { error: string };
export function buildSrcdoc(code: string, instanceId: string): string;
export interface PlaygroundMessage { type: 'saber-playground'; id: string; level: 'log' | 'info' | 'warn' | 'error' | 'done'; args: string[]; }
export function Playground(props: { code: string; lang?: PlaygroundLang; expected?: string }): JSX.Element;
```

Behavior: the editor is a `<textarea>` seeded with `code`; "Ejecutar" transpiles, mounts a fresh `<iframe sandbox="allow-scripts">` with `srcdoc`, and appends console lines received by `postMessage` whose `id` matches this instance; a `done` message ends the run; if no `done` arrives within 5000 ms the output shows `Tiempo de espera agotado (5 s)`; when `expected` is given, the run ends with `Salida correcta` or `La salida no coincide con lo esperado`.

- [ ] **Step 1: Write failing tests**

`transpile.test.ts`:
```ts
import { transpile } from './transpile';

describe('transpile', () => {
  it('returns JS untouched', () => {
    expect(transpile('console.log(1)', 'js')).toEqual({ code: 'console.log(1)' });
  });
  it('strips TypeScript types', () => {
    const result = transpile('const n: number = 1; console.log(n)', 'ts');
    expect('code' in result && result.code).toContain('const n = 1');
  });
  it('reports syntax errors instead of throwing', () => {
    const result = transpile('const = ;', 'ts');
    expect('error' in result).toBe(true);
  });
});
```

`buildSrcdoc.test.ts`:
```ts
import { buildSrcdoc } from './buildSrcdoc';

describe('buildSrcdoc', () => {
  it('embeds the instance id and the learner code', () => {
    const html = buildSrcdoc('console.log("hi")', 'pg-1');
    expect(html).toContain('"pg-1"');
    expect(html).toContain('console.log("hi")');
    expect(html).toContain('saber-playground');
  });
  it('neutralizes closing script tags inside learner code', () => {
    const html = buildSrcdoc('const s = "</script><b>x</b>";', 'pg-2');
    expect(html).not.toContain('</script><b>');
    expect(html).toContain('<\\/script><b>');
  });
});
```

`Playground.test.tsx`:
```tsx
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Playground } from './Playground';

function post(id: string, level: string, args: string[]) {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data: { type: 'saber-playground', id, level, args } }));
  });
}

describe('Playground', () => {
  it('runs code in a sandboxed iframe and shows console output', async () => {
    render(<Playground code={'console.log("hola")'} expected="hola" />);
    expect(screen.queryByTitle('Resultado del código')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ejecutar' }));
    const iframe = screen.getByTitle('Resultado del código');
    expect(iframe).toHaveAttribute('sandbox', 'allow-scripts');
    const id = screen.getByTestId('playground').getAttribute('data-playground-id') ?? '';
    post(id, 'log', ['hola']);
    post(id, 'done', []);
    expect(screen.getByText('hola')).toBeInTheDocument();
    expect(screen.getByText('Salida correcta')).toBeInTheDocument();
  });

  it('shows errors and mismatches', async () => {
    render(<Playground code={'throw new Error("boom")'} expected="hola" />);
    await userEvent.click(screen.getByRole('button', { name: 'Ejecutar' }));
    const id = screen.getByTestId('playground').getAttribute('data-playground-id') ?? '';
    post(id, 'error', ['Error: boom']);
    post(id, 'done', []);
    expect(screen.getByText('Error: boom')).toBeInTheDocument();
    expect(screen.getByText('La salida no coincide con lo esperado')).toBeInTheDocument();
  });

  it('ignores messages from other instances', async () => {
    render(<Playground code="1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Ejecutar' }));
    post('someone-else', 'log', ['intruso']);
    expect(screen.queryByText('intruso')).not.toBeInTheDocument();
  });

  it('times out when the sandbox never reports done', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      render(<Playground code="while(true){}" />);
      await userEvent.click(screen.getByRole('button', { name: 'Ejecutar' }));
      act(() => {
        vi.advanceTimersByTime(5001);
      });
      expect(screen.getByText('Tiempo de espera agotado (5 s)')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows transpile errors without mounting the iframe', async () => {
    render(<Playground code="const = ;" lang="ts" />);
    await userEvent.click(screen.getByRole('button', { name: 'Ejecutar' }));
    expect(screen.queryByTitle('Resultado del código')).not.toBeInTheDocument();
    expect(screen.getByText(/Error de sintaxis/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/ui/organisms/interactive/playground`
Expected: FAIL, modules not found.

- [ ] **Step 3: Create `transpile.ts`**

```ts
import { transform } from 'sucrase';

export type PlaygroundLang = 'js' | 'ts';

export function transpile(code: string, lang: PlaygroundLang): { code: string } | { error: string } {
  if (lang === 'js') return { code };
  try {
    return { code: transform(code, { transforms: ['typescript'] }).code };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
```

- [ ] **Step 4: Create `buildSrcdoc.ts`**

```ts
export interface PlaygroundMessage {
  type: 'saber-playground';
  id: string;
  level: 'log' | 'info' | 'warn' | 'error' | 'done';
  args: string[];
}

export function buildSrcdoc(code: string, instanceId: string): string {
  const safeCode = code.replace(/<\/script/gi, '<\\/script');
  return `<!doctype html><html><body><script>
(function () {
  var id = ${JSON.stringify(instanceId)};
  function fmt(a) {
    if (typeof a === 'string') return a;
    try { return JSON.stringify(a); } catch (e) { return String(a); }
  }
  function send(level, args) {
    parent.postMessage({ type: 'saber-playground', id: id, level: level, args: Array.prototype.map.call(args, fmt) }, '*');
  }
  ['log', 'info', 'warn', 'error'].forEach(function (level) {
    console[level] = function () { send(level, arguments); };
  });
  window.onerror = function (message) { send('error', [String(message)]); };
  (async function () {
    try {
      ${safeCode}
    } catch (e) {
      send('error', [String(e)]);
    }
    send('done', []);
  })();
})();
</script></body></html>`;
}
```

- [ ] **Step 5: Create `Playground.tsx`, `Playground.module.css` and the re-export**

`Playground.tsx`:
```tsx
import { useEffect, useId, useRef, useState } from 'react';
import { transpile, type PlaygroundLang } from './transpile';
import { buildSrcdoc, type PlaygroundMessage } from './buildSrcdoc';
import styles from './Playground.module.css';

const TIMEOUT_MS = 5000;

interface OutputLine {
  level: PlaygroundMessage['level'];
  text: string;
}

type Verdict = 'idle' | 'running' | 'ok' | 'mismatch' | 'timeout';

function isPlaygroundMessage(data: unknown): data is PlaygroundMessage {
  return typeof data === 'object' && data !== null && (data as { type?: string }).type === 'saber-playground';
}

export function Playground({ code, lang = 'js', expected }: { code: string; lang?: PlaygroundLang; expected?: string }) {
  const instanceId = useId();
  const [source, setSource] = useState(code);
  const [srcdoc, setSrcdoc] = useState<string | null>(null);
  const [run, setRun] = useState(0);
  const [lines, setLines] = useState<OutputLine[]>([]);
  const linesRef = useRef<OutputLine[]>([]);
  const [syntaxError, setSyntaxError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!isPlaygroundMessage(event.data) || event.data.id !== instanceId) return;
      const { level, args } = event.data;
      if (level === 'done') {
        clearTimer();
        const output = linesRef.current.filter((l) => l.level !== 'error').map((l) => l.text).join('\n');
        setVerdict(expected === undefined ? 'idle' : output.trim() === expected.trim() ? 'ok' : 'mismatch');
        return;
      }
      linesRef.current = [...linesRef.current, { level, text: args.join(' ') }];
      setLines(linesRef.current);
    }
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      clearTimer();
    };
  }, [instanceId, expected]);

  const execute = () => {
    const result = transpile(source, lang);
    if ('error' in result) {
      setSyntaxError(result.error);
      setSrcdoc(null);
      return;
    }
    setSyntaxError(null);
    linesRef.current = [];
    setLines([]);
    setVerdict('running');
    setSrcdoc(buildSrcdoc(result.code, instanceId));
    setRun((r) => r + 1);
    clearTimer();
    timer.current = setTimeout(() => setVerdict('timeout'), TIMEOUT_MS);
  };

  return (
    <div className={styles.root} data-testid="playground" data-playground-id={instanceId}>
      <div className={styles.head}>
        <span className={styles.lang}>{lang === 'ts' ? 'TypeScript' : 'JavaScript'}</span>
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => setSource(code)}>
            Restablecer
          </button>
          <button type="button" className={styles.primary} onClick={execute}>
            Ejecutar
          </button>
        </div>
      </div>
      <textarea
        className={styles.editor}
        aria-label="Editor de código"
        spellCheck={false}
        value={source}
        onChange={(e) => setSource(e.target.value)}
        rows={Math.max(4, source.split('\n').length + 1)}
      />
      {syntaxError && <div className={styles.error}>Error de sintaxis: {syntaxError}</div>}
      {srcdoc && (
        <iframe key={run} title="Resultado del código" sandbox="allow-scripts" srcDoc={srcdoc} className={styles.frame} />
      )}
      <div className={styles.console} aria-label="Consola">
        {lines.length === 0 && verdict === 'idle' && <span className={styles.muted}>La salida aparecerá aquí.</span>}
        {lines.map((line, i) => (
          <div key={i} className={styles.line} data-level={line.level}>
            {line.text}
          </div>
        ))}
        {verdict === 'timeout' && <div className={styles.line} data-level="error">Tiempo de espera agotado (5 s)</div>}
        {verdict === 'ok' && <div className={styles.verdictOk}>Salida correcta</div>}
        {verdict === 'mismatch' && <div className={styles.verdictBad}>La salida no coincide con lo esperado</div>}
      </div>
    </div>
  );
}
```

`Playground.module.css`:
```css
.root {
  margin: 24px 0;
  border-radius: var(--radius-m);
  overflow: hidden;
  border: 1.5px solid var(--ink-10);
  background: var(--color-white);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--color-paper);
  border-bottom: 1px solid var(--ink-08);
}

.lang {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-teal);
}

.actions {
  display: flex;
  gap: 8px;
}

.primary,
.secondary {
  height: 32px;
  padding: 0 14px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 600;
}

.primary {
  background: var(--color-accent);
  color: #fff;
}

.secondary {
  background: var(--ink-06);
  color: var(--color-ink);
}

.editor {
  display: block;
  width: 100%;
  border: 0;
  resize: vertical;
  padding: 14px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-ink);
  background: var(--color-white);
  outline: none;
}

.error {
  padding: 10px 14px;
  background: #ffe8e0;
  color: #9a2a00;
  font-size: 13px;
}

.frame {
  display: none;
}

.console {
  padding: 12px 14px;
  min-height: 56px;
  background: var(--color-ink);
  color: var(--color-sand);
  font-family: var(--font-mono);
  font-size: 13px;
  white-space: pre-wrap;
}

.muted {
  opacity: 0.5;
  font-family: var(--font);
}

.line[data-level='error'] {
  color: #ff8a65;
}

.line[data-level='warn'] {
  color: #ffd166;
}

.verdictOk,
.verdictBad {
  margin-top: 8px;
  font-family: var(--font);
  font-weight: 600;
}

.verdictOk {
  color: var(--color-lime);
}

.verdictBad {
  color: #ff8a65;
}
```

`src/ui/organisms/interactive/Playground.ts`:
```ts
export { Playground } from './playground/Playground';
export type { PlaygroundLang } from './playground/transpile';
```

- [ ] **Step 6: Run tests and commit**

Run: `pnpm format && pnpm vitest run src/ui/organisms/interactive && pnpm lint && pnpm typecheck`
Expected: 17 tests pass. If the timeout test is flaky under fake timers, replace `shouldAdvanceTime: true` with awaiting `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`.

```bash
git add src/ui/organisms/interactive
git commit -m "feat(ui): add sandboxed JS/TS playground with console capture"
```

---

### Task 14: Interactive — Sandpack, Snack and the MDX component map

**Files:**
- Create: `src/ui/organisms/interactive/Sandpack.tsx`, `src/ui/organisms/interactive/Snack.tsx`, `src/ui/organisms/interactive/Snack.module.css`, `src/ui/organisms/interactive/mdxComponents.ts`, `src/ui/organisms/interactive/MdxProvider.tsx`
- Test: `src/ui/organisms/interactive/Sandpack.test.tsx`, `src/ui/organisms/interactive/Snack.test.tsx`

**Interfaces:**
- Produces:

```ts
export function Sandpack(props: { files: Record<string, string>; height?: number }): JSX.Element;
export type SnackPlatform = 'ios' | 'android' | 'web';
export function buildSnackUrl(opts: { code: string; dependencies?: Record<string, string>; platform: SnackPlatform }): string;
export function Snack(props: { code: string; dependencies?: Record<string, string>; platform?: SnackPlatform }): JSX.Element;
// dependencies are serialized as `name@version` joined by commas, e.g. { 'expo-camera': '~15.0.0' } -> 'expo-camera@~15.0.0'
export const mdxComponents: MDXComponents;   // Playground, Sandpack, Snack, Quiz, Flashcards, Challenge, Terminal, Checklist, Callout
export function MdxProvider(props: { children: ReactNode }): JSX.Element;   // MDXProvider preloaded with mdxComponents
```

- [ ] **Step 1: Write failing tests**

`Sandpack.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { Sandpack } from './Sandpack';

vi.mock('@codesandbox/sandpack-react', () => ({
  Sandpack: (props: { template: string; files: Record<string, string> }) => (
    <div data-testid="sandpack" data-template={props.template}>
      {Object.keys(props.files).join(',')}
    </div>
  ),
}));

describe('Sandpack', () => {
  it('uses the react-ts template and forwards files', () => {
    render(<Sandpack files={{ '/App.tsx': 'export default () => null' }} />);
    const el = screen.getByTestId('sandpack');
    expect(el).toHaveAttribute('data-template', 'react-ts');
    expect(el).toHaveTextContent('/App.tsx');
  });
});
```

`Snack.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { buildSnackUrl, Snack } from './Snack';

describe('buildSnackUrl', () => {
  it('encodes code, dependencies and platform', () => {
    const url = new URL(
      buildSnackUrl({
        code: 'const a = 1;',
        dependencies: { 'expo-camera': '~15.0.0', 'expo-image': '*' },
        platform: 'android',
      }),
    );
    expect(url.origin + url.pathname).toBe('https://snack.expo.dev/embedded');
    expect(url.searchParams.get('platform')).toBe('android');
    expect(url.searchParams.get('code')).toBe('const a = 1;');
    expect(url.searchParams.get('dependencies')).toBe('expo-camera@~15.0.0,expo-image@*');
    expect(url.searchParams.get('preview')).toBe('true');
    expect(url.searchParams.get('theme')).toBe('light');
  });

  it('omits the dependencies param when none are given', () => {
    const url = new URL(buildSnackUrl({ code: 'x', platform: 'ios' }));
    expect(url.searchParams.has('dependencies')).toBe(false);
  });
});

describe('Snack', () => {
  it('renders an iframe to Expo Snack defaulting to ios', () => {
    render(<Snack code="export default function App() { return null }" />);
    const frame = screen.getByTitle('Expo Snack');
    expect(frame.getAttribute('src')).toContain('https://snack.expo.dev/embedded?');
    expect(frame.getAttribute('src')).toContain('platform=ios');
    expect(screen.getByText(/necesita conexión/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/ui/organisms/interactive/Sandpack src/ui/organisms/interactive/Snack`
Expected: FAIL, modules not found.

- [ ] **Step 3: Create `Sandpack.tsx`**

```tsx
import { Sandpack as SandpackEditor } from '@codesandbox/sandpack-react';

export function Sandpack({ files, height = 380 }: { files: Record<string, string>; height?: number }) {
  return (
    <div style={{ margin: '24px 0' }}>
      <SandpackEditor
        template="react-ts"
        files={files}
        theme="light"
        options={{ editorHeight: height, showTabs: true, showLineNumbers: true }}
      />
      <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--ink-55)' }}>
        Este editor necesita conexión a internet para compilar.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Create `Snack.tsx` and `Snack.module.css`**

`Snack.tsx`:
```tsx
import styles from './Snack.module.css';

export type SnackPlatform = 'ios' | 'android' | 'web';

export function serializeDependencies(dependencies: Record<string, string>): string {
  return Object.entries(dependencies)
    .map(([name, version]) => `${name}@${version}`)
    .join(',');
}

export function buildSnackUrl({
  code,
  dependencies,
  platform,
}: {
  code: string;
  dependencies?: Record<string, string>;
  platform: SnackPlatform;
}): string {
  const params = new URLSearchParams({ platform, preview: 'true', theme: 'light', code });
  if (dependencies && Object.keys(dependencies).length > 0) {
    params.set('dependencies', serializeDependencies(dependencies));
  }
  return `https://snack.expo.dev/embedded?${params.toString()}`;
}

export function Snack({
  code,
  dependencies,
  platform = 'ios',
}: {
  code: string;
  dependencies?: Record<string, string>;
  platform?: SnackPlatform;
}) {
  return (
    <div className={styles.root}>
      <iframe
        title="Expo Snack"
        className={styles.frame}
        src={buildSnackUrl({ code, dependencies, platform })}
        loading="lazy"
        allow="geolocation; camera; microphone"
      />
      <p className={styles.note}>
        Este ejemplo se ejecuta en Expo Snack y necesita conexión a internet. Puedes abrirlo en tu teléfono con Expo Go
        escaneando el código QR desde la pestaña "My Device".
      </p>
    </div>
  );
}
```

`Snack.module.css`:
```css
.root {
  margin: 24px 0;
}

.frame {
  width: 100%;
  height: 560px;
  border: 1.5px solid var(--ink-10);
  border-radius: var(--radius-m);
  background: var(--color-white);
}

.note {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--ink-55);
}
```

- [ ] **Step 5: Create `mdxComponents.ts`**

```ts
import type { MDXComponents } from 'mdx/types';
import { Playground } from './Playground';
import { Sandpack } from './Sandpack';
import { Snack } from './Snack';
import { Quiz } from './Quiz';
import { Flashcards } from './Flashcards';
import { Challenge } from './Challenge';
import { Terminal } from './Terminal';
import { Checklist } from './Checklist';
import { Callout } from './Callout';

export const mdxComponents: MDXComponents = {
  Playground,
  Sandpack,
  Snack,
  Quiz,
  Flashcards,
  Challenge,
  Terminal,
  Checklist,
  Callout,
};
```

`MdxProvider.tsx`:
```tsx
import { MDXProvider } from '@mdx-js/react';
import type { ReactNode } from 'react';
import { mdxComponents } from './mdxComponents';

export function MdxProvider({ children }: { children: ReactNode }) {
  return <MDXProvider components={mdxComponents}>{children}</MDXProvider>;
}
```

- [ ] **Step 6: Run tests and commit**

Run: `pnpm format && pnpm vitest run src/ui/organisms/interactive && pnpm lint && pnpm typecheck`
Expected: 21 tests pass.

```bash
git add src/ui/organisms/interactive
git commit -m "feat(ui): add Sandpack and Expo Snack embeds and the MDX component map"
```

---

### Task 15: UI atoms

**Files:**
- Create: `src/ui/atoms/Button.tsx`, `src/ui/atoms/Button.module.css`, `src/ui/atoms/Chip.tsx`, `src/ui/atoms/Chip.module.css`, `src/ui/atoms/ProgressBar.tsx`, `src/ui/atoms/ProgressBar.module.css`, `src/ui/atoms/StatusDot.tsx`, `src/ui/atoms/StatusDot.module.css`, `src/ui/atoms/Brand.tsx`, `src/ui/atoms/Brand.module.css`
- Test: `src/ui/atoms/atoms.test.tsx`

**Interfaces:**
- Produces:

```ts
export function Button(props: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'dark' | 'ghost' }): JSX.Element;
export function ButtonLink(props: { to: string; variant?: 'primary' | 'dark' | 'ghost'; children: ReactNode }): JSX.Element;
export function Chip(props: { active: boolean; onClick(): void; children: ReactNode }): JSX.Element;
export function ProgressBar(props: { pct: number; tone?: 'lime' | 'teal'; onDark?: boolean; label?: string }): JSX.Element;
export type LessonState = 'done' | 'active' | 'pending';
export function StatusDot(props: { state: LessonState }): JSX.Element;
export function Brand(): JSX.Element;
```

- [ ] **Step 1: Write failing test `src/ui/atoms/atoms.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Button, ButtonLink } from './Button';
import { Chip } from './Chip';
import { ProgressBar } from './ProgressBar';
import { StatusDot } from './StatusDot';
import { Brand } from './Brand';

describe('atoms', () => {
  it('Button forwards props and variant', () => {
    render(<Button variant="dark" onClick={() => undefined}>Ir</Button>);
    expect(screen.getByRole('button', { name: 'Ir' })).toHaveAttribute('data-variant', 'dark');
  });
  it('ButtonLink renders a router link', () => {
    render(
      <MemoryRouter>
        <ButtonLink to="/repaso">Repasar</ButtonLink>
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Repasar' })).toHaveAttribute('href', '/repaso');
  });
  it('Chip exposes pressed state', () => {
    render(<Chip active onClick={() => undefined}>Todos</Chip>);
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('ProgressBar clamps and exposes aria values', () => {
    render(<ProgressBar pct={140} label="Progreso" />);
    const bar = screen.getByRole('progressbar', { name: 'Progreso' });
    expect(bar).toHaveAttribute('aria-valuenow', '100');
  });
  it('StatusDot shows a check when done', () => {
    render(<StatusDot state="done" />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });
  it('Brand shows the name and links home', () => {
    render(
      <MemoryRouter>
        <Brand />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Saber' })).toHaveAttribute('href', '/');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/ui/atoms`
Expected: FAIL, modules not found.

- [ ] **Step 3: Create `Button.tsx` and `Button.module.css`**

`Button.tsx`:
```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'dark' | 'ghost';

export function Button({
  variant = 'primary',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button type="button" {...rest} data-variant={variant} className={[styles.root, className].filter(Boolean).join(' ')}>
      {children}
    </button>
  );
}

export function ButtonLink({ to, variant = 'primary', children }: { to: string; variant?: ButtonVariant; children: ReactNode }) {
  return (
    <Link to={to} data-variant={variant} className={styles.root}>
      {children}
    </Link>
  );
}
```

`Button.module.css`:
```css
.root {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  padding: 0 24px;
  border-radius: 22px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.15s;
}

.root:hover {
  transform: translateY(-1px);
}

.root[data-variant='primary'] {
  background: var(--color-accent);
  color: #fff;
}

.root[data-variant='dark'] {
  background: var(--color-ink);
  color: var(--color-sand);
}

.root[data-variant='ghost'] {
  background: var(--ink-06);
  color: var(--color-ink);
}

.root:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

- [ ] **Step 4: Create `Chip.tsx`, `ProgressBar.tsx`, `StatusDot.tsx`, `Brand.tsx` with their CSS**

`Chip.tsx`:
```tsx
import type { ReactNode } from 'react';
import styles from './Chip.module.css';

export function Chip({ active, onClick, children }: { active: boolean; onClick(): void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={styles.root} data-active={active}>
      {children}
    </button>
  );
}
```

`Chip.module.css`:
```css
.root {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 400;
  color: var(--color-ink);
}

.root[data-active='true'] {
  background: var(--color-white);
  font-weight: 500;
  box-shadow: var(--shadow-chip);
}
```

`ProgressBar.tsx`:
```tsx
import styles from './ProgressBar.module.css';

export function ProgressBar({
  pct,
  tone = 'teal',
  onDark = false,
  label = 'Progreso',
}: {
  pct: number;
  tone?: 'lime' | 'teal';
  onDark?: boolean;
  label?: string;
}) {
  const value = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className={styles.track}
      data-on-dark={onDark}
    >
      <div className={styles.fill} data-tone={tone} style={{ width: `${value}%` }} />
    </div>
  );
}
```

`ProgressBar.module.css`:
```css
.track {
  height: 6px;
  border-radius: 3px;
  background: var(--ink-10);
  overflow: hidden;
}

.track[data-on-dark='true'] {
  background: var(--sand-15);
}

.fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s;
}

.fill[data-tone='lime'] {
  background: var(--color-lime);
}

.fill[data-tone='teal'] {
  background: var(--color-teal);
}
```

`StatusDot.tsx`:
```tsx
import styles from './StatusDot.module.css';

export type LessonState = 'done' | 'active' | 'pending';

export function StatusDot({ state }: { state: LessonState }) {
  return (
    <span className={styles.root} data-state={state} aria-hidden="true">
      {state === 'done' ? '✓' : ''}
    </span>
  );
}
```

`StatusDot.module.css`:
```css
.root {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  flex: none;
  display: grid;
  place-items: center;
  font-size: 10px;
  color: var(--color-ink);
  border: 1.5px solid var(--ink-25);
}

.root[data-state='done'] {
  background: var(--color-lime);
  border-color: transparent;
}

.root[data-state='active'] {
  background: var(--color-accent);
  border-color: transparent;
}
```

`Brand.tsx`:
```tsx
import { Link } from 'react-router-dom';
import styles from './Brand.module.css';

export function Brand() {
  return (
    <Link to="/" className={styles.root}>
      <span className={styles.square} aria-hidden="true" />
      Saber
    </Link>
  );
}
```

`Brand.module.css`:
```css
.root {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 17px;
  color: var(--color-ink);
  text-decoration: none;
}

.square {
  width: 22px;
  height: 22px;
  border-radius: 7px;
  background: var(--color-accent);
}
```

- [ ] **Step 5: Run tests and commit**

Run: `pnpm format && pnpm vitest run src/ui/atoms && pnpm lint && pnpm typecheck`
Expected: 6 tests pass.

```bash
git add src/ui/atoms
git commit -m "feat(ui): add atoms (button, chip, progress bar, status dot, brand)"
```

---

### Task 16: UI molecules

**Files:**
- Create: `src/ui/molecules/StageCard.tsx`, `src/ui/molecules/StageCard.module.css`, `src/ui/molecules/LessonRow.tsx`, `src/ui/molecules/LessonRow.module.css`, `src/ui/molecules/StreakBars.tsx`, `src/ui/molecules/StreakBars.module.css`, `src/ui/molecules/ContinueCard.tsx`, `src/ui/molecules/ContinueCard.module.css`, `src/ui/molecules/ReviewTodayCard.tsx`, `src/ui/molecules/ReviewTodayCard.module.css`, `src/ui/molecules/NoteBox.tsx`, `src/ui/molecules/NoteBox.module.css`, `src/ui/routes.ts`
- Test: `src/ui/molecules/molecules.test.tsx`

**Interfaces:**
- Consumes: `Stage`, `Lesson` (Task 3), `StageProgress`, `DayActivity` (Task 5), atoms (Task 15).
- Produces:

```ts
export function lessonPath(lesson: Pick<Lesson, 'stageSlug' | 'slug'>): string;   // `/etapa/${stageSlug}/${slug}`
export function StageCard(props: { stage: Stage; progress: StageProgress }): JSX.Element;
export function LessonRow(props: { lesson: Lesson; state: LessonState; onNavigate?(): void }): JSX.Element;
export function StreakBars(props: { week: DayActivity[]; streak: number }): JSX.Element;
export function ContinueCard(props: { lesson: Lesson | null; stage: Stage | null; progress: StageProgress }): JSX.Element;
export function ReviewTodayCard(props: { count: number }): JSX.Element;
export function NoteBox(props: { value: string; onChange(text: string): void }): JSX.Element;
```

- [ ] **Step 1: Write failing test `src/ui/molecules/molecules.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { buildCourse } from '@/domain/course';
import { lastSevenDays } from '@/domain/progress';
import { StageCard } from './StageCard';
import { LessonRow } from './LessonRow';
import { StreakBars } from './StreakBars';
import { ContinueCard } from './ContinueCard';
import { ReviewTodayCard } from './ReviewTodayCard';
import { NoteBox } from './NoteBox';
import { lessonPath } from '@/ui/routes';

const course = buildCourse(
  [
    { id: 0, slug: '00-intro', title: 'Intro', mark: 'In', bg: '#022a2a', fg: '#10484a', project: 'Repo', hours: 4 },
    { id: 1, slug: '01-js', title: 'JS', mark: 'Js', bg: '#ff3d00', fg: '#ff6a3a', project: 'Todo', hours: 20 },
  ],
  [
    { id: '00-intro/00-a', title: 'Qué es un programa', stage: 0, module: 'Base', order: 0, minutes: 8, prereqs: [], summary: '' },
    { id: '00-intro/01-b', title: 'La terminal', stage: 0, module: 'Base', order: 1, minutes: 12, prereqs: [], summary: '' },
  ],
);
const stage0 = course.stages[0]!;
const lesson = course.lessons[0]!;

const wrap = (ui: ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('molecules', () => {
  it('lessonPath builds the route', () => {
    expect(lessonPath(lesson)).toBe('/etapa/00-intro/00-a');
  });
  it('StageCard links to the first lesson and shows meta', () => {
    wrap(<StageCard stage={stage0} progress={{ done: 1, total: 2, pct: 50 }} />);
    expect(screen.getByRole('link', { name: /Intro/ })).toHaveAttribute('href', '/etapa/00-intro/00-a');
    expect(screen.getByText('2 lecciones · 1 módulo · 4 h')).toBeInTheDocument();
  });
  it('StageCard without lessons is not a link', () => {
    wrap(<StageCard stage={course.stages[1]!} progress={{ done: 0, total: 0, pct: 0 }} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Próximamente')).toBeInTheDocument();
  });
  it('LessonRow renders title, minutes and state', () => {
    wrap(<LessonRow lesson={lesson} state="active" />);
    const link = screen.getByRole('link', { name: /Qué es un programa/ });
    expect(link).toHaveAttribute('data-state', 'active');
    expect(link).toHaveTextContent('8 min');
  });
  it('StreakBars shows the streak count and seven days', () => {
    wrap(<StreakBars week={lastSevenDays(['2026-09-26'], '2026-09-26')} streak={3} />);
    expect(screen.getByText('3 días')).toBeInTheDocument();
    expect(screen.getAllByTestId('streak-day')).toHaveLength(7);
  });
  it('ContinueCard shows the resume link or the finished state', () => {
    wrap(<ContinueCard lesson={lesson} stage={stage0} progress={{ done: 1, total: 2, pct: 50 }} />);
    expect(screen.getByRole('link', { name: 'Reanudar lección' })).toHaveAttribute('href', '/etapa/00-intro/00-a');
    expect(screen.getByText('50% · 1 de 2 lecciones')).toBeInTheDocument();
  });
  it('ContinueCard without a lesson invites to start', () => {
    wrap(<ContinueCard lesson={null} stage={null} progress={{ done: 0, total: 0, pct: 0 }} />);
    expect(screen.getByText('Completaste todo el curso')).toBeInTheDocument();
  });
  it('ReviewTodayCard links to review', () => {
    wrap(<ReviewTodayCard count={24} />);
    expect(screen.getByRole('link', { name: /24/ })).toHaveAttribute('href', '/repaso');
  });
  it('NoteBox edits text', async () => {
    const onChange = vi.fn();
    wrap(<NoteBox value="" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Mi nota'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/ui/molecules`
Expected: FAIL, modules not found.

- [ ] **Step 3: Create `src/ui/routes.ts`**

```ts
import type { Lesson } from '@/domain/course';

export function lessonPath(lesson: Pick<Lesson, 'stageSlug' | 'slug'>): string {
  return `/etapa/${lesson.stageSlug}/${lesson.slug}`;
}

export const ROUTES = { library: '/', review: '/repaso', notes: '/notas' } as const;
```

- [ ] **Step 4: Create `StageCard.tsx` and CSS**

`StageCard.tsx`:
```tsx
import { Link } from 'react-router-dom';
import type { Stage } from '@/domain/course';
import type { StageProgress } from '@/domain/progress';
import { ProgressBar } from '@/ui/atoms/ProgressBar';
import { lessonPath } from '@/ui/routes';
import styles from './StageCard.module.css';

function pluralize(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function StageCard({ stage, progress }: { stage: Stage; progress: StageProgress }) {
  const first = stage.lessons[0];
  const meta = `${pluralize(stage.lessons.length, 'lección', 'lecciones')} · ${pluralize(stage.modules.length, 'módulo', 'módulos')} · ${stage.hours} h`;
  const body = (
    <>
      <div className={styles.cover} style={{ background: stage.bg }}>
        <span className={styles.mark} style={{ color: stage.fg }}>
          {stage.mark}
        </span>
      </div>
      <div className={styles.body}>
        <div className={styles.meta}>{first ? meta : 'Próximamente'}</div>
        <div className={styles.title}>{stage.title}</div>
        <div className={styles.bar}>
          <ProgressBar pct={progress.pct} label={`Progreso de ${stage.title}`} />
        </div>
      </div>
    </>
  );
  if (!first) return <div className={styles.root}>{body}</div>;
  return (
    <Link to={lessonPath(first)} className={styles.root} aria-label={`${stage.title}, ${progress.pct}% completado`}>
      {body}
    </Link>
  );
}
```

`StageCard.module.css`:
```css
.root {
  display: block;
  background: var(--color-white);
  border-radius: var(--radius-l);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: transform 0.3s;
}

a.root:hover {
  transform: translateY(-4px);
}

.cover {
  height: 150px;
  position: relative;
  overflow: hidden;
}

.mark {
  position: absolute;
  left: 20px;
  bottom: -26px;
  font-size: 110px;
  font-weight: 700;
  letter-spacing: -0.05em;
  line-height: 1;
}

.body {
  padding: 18px 20px 22px;
}

.meta {
  font-size: 11px;
  color: var(--ink-55);
  margin-bottom: 4px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-ink);
  letter-spacing: -0.01em;
  line-height: 1.3;
  min-height: 42px;
}

.bar {
  margin-top: 16px;
}
```

- [ ] **Step 5: Create `LessonRow.tsx`, `StreakBars.tsx`, `ContinueCard.tsx`, `ReviewTodayCard.tsx`, `NoteBox.tsx` and CSS**

`LessonRow.tsx`:
```tsx
import { Link } from 'react-router-dom';
import type { Lesson } from '@/domain/course';
import { StatusDot, type LessonState } from '@/ui/atoms/StatusDot';
import { lessonPath } from '@/ui/routes';
import styles from './LessonRow.module.css';

export function LessonRow({ lesson, state, onNavigate }: { lesson: Lesson; state: LessonState; onNavigate?(): void }) {
  return (
    <Link to={lessonPath(lesson)} className={styles.root} data-state={state} onClick={onNavigate}>
      <StatusDot state={state} />
      <span className={styles.title}>{lesson.title}</span>
      <span className={styles.minutes}>{lesson.minutes} min</span>
    </Link>
  );
}
```

`LessonRow.module.css`:
```css
.root {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: var(--radius-s);
  font-size: 13px;
  color: var(--color-ink);
  text-decoration: none;
}

.root:hover {
  background: var(--ink-06);
  color: var(--color-ink);
}

.root[data-state='active'] {
  background: var(--color-ink);
  color: var(--color-sand);
}

.title {
  flex: 1;
}

.minutes {
  font-size: 11px;
  opacity: 0.6;
}
```

`StreakBars.tsx`:
```tsx
import type { DayActivity } from '@/domain/progress';
import styles from './StreakBars.module.css';

export function StreakBars({ week, streak }: { week: DayActivity[]; streak: number }) {
  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <span className={styles.label}>Racha</span>
        <span className={styles.count}>{streak} días</span>
      </div>
      <div className={styles.bars}>
        {week.map((day) => (
          <div key={day.date} className={styles.day} data-testid="streak-day">
            <div className={styles.bar} data-active={day.active} data-today={day.isToday} />
            <span className={styles.dayLabel}>{day.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

`StreakBars.module.css`:
```css
.root {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  padding: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-teal);
}

.count {
  font-size: 20px;
  font-weight: 600;
}

.bars {
  display: flex;
  gap: 6px;
  align-items: flex-end;
}

.day {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.bar {
  width: 100%;
  height: 20px;
  border-radius: 6px;
  background: var(--ink-10);
}

.bar[data-active='true'] {
  height: 52px;
  background: var(--color-teal);
}

.bar[data-today='true'][data-active='true'] {
  background: var(--color-accent);
}

.dayLabel {
  font-size: 10px;
  color: var(--ink-55);
}
```

`ContinueCard.tsx`:
```tsx
import type { Lesson, Stage } from '@/domain/course';
import type { StageProgress } from '@/domain/progress';
import { ButtonLink } from '@/ui/atoms/Button';
import { ProgressBar } from '@/ui/atoms/ProgressBar';
import { lessonPath } from '@/ui/routes';
import styles from './ContinueCard.module.css';

export function ContinueCard({ lesson, stage, progress }: { lesson: Lesson | null; stage: Stage | null; progress: StageProgress }) {
  return (
    <section className={styles.root}>
      <span className={styles.circleBig} aria-hidden="true" />
      <span className={styles.circleSmall} aria-hidden="true" />
      <div className={styles.kicker}>Continuar aprendiendo</div>
      <div className={styles.content}>
        {lesson && stage ? (
          <>
            <div className={styles.meta}>
              {stage.title} · {lesson.module}
            </div>
            <div className={styles.title}>{lesson.title}</div>
            <div className={styles.actions}>
              <ButtonLink to={lessonPath(lesson)}>Reanudar lección</ButtonLink>
              <div className={styles.progress}>
                <ProgressBar pct={progress.pct} tone="lime" onDark label={`Progreso de ${stage.title}`} />
                <div className={styles.progressText}>
                  {progress.pct}% · {progress.done} de {progress.total} lecciones
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.title}>Completaste todo el curso</div>
        )}
      </div>
    </section>
  );
}
```

`ContinueCard.module.css`:
```css
.root {
  position: relative;
  overflow: hidden;
  background: var(--color-ink);
  border-radius: var(--radius-xl);
  padding: 40px;
  color: var(--color-sand);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 340px;
}

.circleBig,
.circleSmall {
  position: absolute;
  border-radius: 50%;
}

.circleBig {
  right: -60px;
  top: -60px;
  width: 320px;
  height: 320px;
  background: var(--color-teal);
}

.circleSmall {
  right: 60px;
  top: 80px;
  width: 120px;
  height: 120px;
  background: var(--color-accent);
}

.kicker {
  position: relative;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-lime);
  font-weight: 500;
}

.content {
  position: relative;
}

.meta {
  font-size: 14px;
  color: var(--sand-70);
  margin-bottom: 6px;
}

.title {
  font-size: 36px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.15;
  max-width: 460px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 28px;
  flex-wrap: wrap;
}

.progress {
  flex: 1;
  min-width: 160px;
  max-width: 260px;
}

.progressText {
  font-size: 12px;
  margin-top: 8px;
  color: var(--sand-70);
}

@media (max-width: 900px) {
  .root {
    padding: 28px;
    min-height: 0;
  }
  .title {
    font-size: 26px;
  }
}
```

`ReviewTodayCard.tsx`:
```tsx
import { Link } from 'react-router-dom';
import { ROUTES } from '@/ui/routes';
import styles from './ReviewTodayCard.module.css';

export function ReviewTodayCard({ count }: { count: number }) {
  return (
    <Link to={ROUTES.review} className={styles.root} aria-label={`Repaso de hoy: ${count} tarjetas`}>
      <span className={styles.label}>Repaso de hoy</span>
      <span className={styles.row}>
        <span className={styles.count}>
          {count}
          <span className={styles.unit}>tarjetas</span>
        </span>
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
      </span>
    </Link>
  );
}
```

`ReviewTodayCard.module.css`:
```css
.root {
  background: var(--color-lime);
  border-radius: var(--radius-xl);
  padding: 28px;
  color: var(--color-ink);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  text-decoration: none;
}

.label {
  font-size: 13px;
  font-weight: 500;
}

.row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.count {
  font-size: 56px;
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1;
}

.unit {
  font-size: 18px;
  font-weight: 500;
  margin-left: 6px;
}

.arrow {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-ink);
  color: var(--color-lime);
  display: grid;
  place-items: center;
  font-size: 18px;
}
```

`NoteBox.tsx`:
```tsx
import styles from './NoteBox.module.css';

export function NoteBox({ value, onChange }: { value: string; onChange(text: string): void }) {
  return (
    <div className={styles.root}>
      <span className={styles.icon} aria-hidden="true">
        !
      </span>
      <div className={styles.body}>
        <label htmlFor="lesson-note" className={styles.label}>
          Mi nota
        </label>
        <textarea
          id="lesson-note"
          className={styles.textarea}
          value={value}
          placeholder="Escribe aquí lo que quieras recordar de esta lección."
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}
```

`NoteBox.module.css`:
```css
.root {
  display: flex;
  gap: 16px;
  background: var(--color-sand);
  border-radius: 20px;
  padding: 24px 26px;
  margin: 40px 0;
}

.icon {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-accent);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 600;
  font-size: 14px;
}

.body {
  flex: 1;
}

.label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
}

.textarea {
  width: 100%;
  border: 0;
  background: transparent;
  resize: vertical;
  font: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-teal);
  outline: none;
}
```

- [ ] **Step 6: Run tests and commit**

Run: `pnpm format && pnpm vitest run src/ui/molecules && pnpm lint && pnpm typecheck`
Expected: 9 tests pass.

```bash
git add src/ui/routes.ts src/ui/molecules
git commit -m "feat(ui): add molecules for library, sidebar and lesson notes"
```

---

### Task 17: UI organisms — TopNav, Sidebar, ReviewCard

**Files:**
- Create: `src/ui/organisms/TopNav.tsx`, `src/ui/organisms/TopNav.module.css`, `src/ui/organisms/Sidebar.tsx`, `src/ui/organisms/Sidebar.module.css`, `src/ui/organisms/ReviewCard.tsx`, `src/ui/organisms/ReviewCard.module.css`
- Test: `src/ui/organisms/organisms.test.tsx`

**Interfaces:**
- Consumes: `Stage`, `LessonId` (Task 3), `SrsCard`, `Grade` (Task 4), `StageProgress` (Task 5), atoms and molecules.
- Produces:

```ts
export function TopNav(): JSX.Element;
export function Sidebar(props: { stage: Stage; currentLessonId: LessonId; completed: Record<LessonId, string>; progress: StageProgress; open: boolean; onClose(): void }): JSX.Element;
export function ReviewCard(props: { card: SrsCard; flipped: boolean; onFlip(): void; onGrade(grade: Grade): void }): JSX.Element;
```

- [ ] **Step 1: Write failing test `src/ui/organisms/organisms.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { buildCourse } from '@/domain/course';
import { newCardState } from '@/domain/srs';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { ReviewCard } from './ReviewCard';

const course = buildCourse(
  [{ id: 0, slug: '00-intro', title: 'Intro', mark: 'In', bg: '#022a2a', fg: '#10484a', project: 'Repo', hours: 4 }],
  [
    { id: '00-intro/00-a', title: 'Uno', stage: 0, module: 'Base', order: 0, minutes: 5, prereqs: [], summary: '' },
    { id: '00-intro/01-b', title: 'Dos', stage: 0, module: 'Base', order: 1, minutes: 5, prereqs: [], summary: '' },
    { id: '00-intro/02-c', title: 'Tres', stage: 0, module: 'Herramientas', order: 2, minutes: 5, prereqs: [], summary: '' },
  ],
);
const stage = course.stages[0]!;

describe('TopNav', () => {
  it('links to the three sections', () => {
    render(
      <MemoryRouter>
        <TopNav />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Biblioteca' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Repaso' })).toHaveAttribute('href', '/repaso');
    expect(screen.getByRole('link', { name: 'Notas' })).toHaveAttribute('href', '/notas');
  });
});

describe('Sidebar', () => {
  it('renders modules with lesson states and the stage progress', () => {
    render(
      <MemoryRouter>
        <Sidebar
          stage={stage}
          currentLessonId="00-intro/01-b"
          completed={{ '00-intro/00-a': '2026-09-26' }}
          progress={{ done: 1, total: 3, pct: 33 }}
          open={false}
          onClose={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Base')).toBeInTheDocument();
    expect(screen.getByText('Herramientas')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Uno/ })).toHaveAttribute('data-state', 'done');
    expect(screen.getByRole('link', { name: /Dos/ })).toHaveAttribute('data-state', 'active');
    expect(screen.getByRole('link', { name: /Tres/ })).toHaveAttribute('data-state', 'pending');
    expect(screen.getByText('33% completado')).toBeInTheDocument();
    expect(screen.getByRole('complementary')).toHaveAttribute('data-open', 'false');
  });
});

describe('ReviewCard', () => {
  const card = { key: 'a/b#0', lessonId: 'a/b', front: 'Pregunta', back: 'Respuesta', state: newCardState('2026-09-26'), graded: false };
  it('shows the front, flips and grades', async () => {
    const onFlip = vi.fn();
    const onGrade = vi.fn();
    const { rerender } = render(<ReviewCard card={card} flipped={false} onFlip={onFlip} onGrade={onGrade} />);
    expect(screen.getByText('Pregunta')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Bien/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Toca para girar/ }));
    expect(onFlip).toHaveBeenCalled();
    rerender(<ReviewCard card={card} flipped onFlip={onFlip} onGrade={onGrade} />);
    expect(screen.getByText('Respuesta')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Fácil/ }));
    expect(onGrade).toHaveBeenCalledWith('easy');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/ui/organisms/organisms.test.tsx`
Expected: FAIL, modules not found.

- [ ] **Step 3: Create `TopNav.tsx` and CSS**

`TopNav.tsx`:
```tsx
import { NavLink } from 'react-router-dom';
import { Brand } from '@/ui/atoms/Brand';
import { ROUTES } from '@/ui/routes';
import styles from './TopNav.module.css';

const LINKS = [
  { to: ROUTES.library, label: 'Biblioteca', end: true },
  { to: ROUTES.review, label: 'Repaso', end: false },
  { to: ROUTES.notes, label: 'Notas', end: false },
];

export function TopNav() {
  return (
    <header className={styles.root}>
      <Brand />
      <nav className={styles.nav} aria-label="Principal">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => (isActive ? styles.active : styles.link)}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
```

`TopNav.module.css`:
```css
.root {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--page-gutter);
  height: var(--topbar-height);
  background: rgba(246, 241, 234, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--ink-08);
}

.nav {
  display: flex;
  gap: 32px;
  font-size: 13px;
}

.link,
.active {
  text-decoration: none;
  color: var(--color-teal);
}

.active {
  color: var(--color-ink);
  font-weight: 500;
}

@media (max-width: 900px) {
  .nav {
    gap: 18px;
  }
}
```

- [ ] **Step 4: Create `Sidebar.tsx` and CSS**

`Sidebar.tsx`:
```tsx
import { Link } from 'react-router-dom';
import type { LessonId, Stage } from '@/domain/course';
import type { StageProgress } from '@/domain/progress';
import { ProgressBar } from '@/ui/atoms/ProgressBar';
import type { LessonState } from '@/ui/atoms/StatusDot';
import { LessonRow } from '@/ui/molecules/LessonRow';
import { ROUTES } from '@/ui/routes';
import styles from './Sidebar.module.css';

export function Sidebar({
  stage,
  currentLessonId,
  completed,
  progress,
  open,
  onClose,
}: {
  stage: Stage;
  currentLessonId: LessonId;
  completed: Record<LessonId, string>;
  progress: StageProgress;
  open: boolean;
  onClose(): void;
}) {
  const stateOf = (id: LessonId): LessonState => (id === currentLessonId ? 'active' : id in completed ? 'done' : 'pending');
  return (
    <aside className={styles.root} data-open={open}>
      <Link to={ROUTES.library} className={styles.back}>
        ‹ Biblioteca
      </Link>
      <div className={styles.kicker}>Etapa {stage.id}</div>
      <h2 className={styles.title}>{stage.title}</h2>
      <ProgressBar pct={progress.pct} tone="lime" label={`Progreso de ${stage.title}`} />
      <div className={styles.pct}>{progress.pct}% completado</div>
      <nav aria-label="Lecciones de la etapa">
        {stage.modules.map((module) => (
          <div key={module.name} className={styles.module}>
            <div className={styles.moduleName}>{module.name}</div>
            {module.lessons.map((lesson) => (
              <LessonRow key={lesson.id} lesson={lesson} state={stateOf(lesson.id)} onNavigate={onClose} />
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
```

`Sidebar.module.css`:
```css
.root {
  background: var(--color-paper);
  border-right: 1px solid var(--ink-08);
  padding: 28px 20px;
  min-height: calc(100vh - var(--topbar-height));
}

.back {
  display: inline-block;
  font-size: 12px;
  color: var(--color-teal);
  margin-bottom: 22px;
  text-decoration: none;
}

.kicker {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-accent);
  font-weight: 600;
}

.title {
  font-size: 22px;
  margin: 4px 0 16px;
  line-height: 1.2;
}

.pct {
  font-size: 11px;
  color: var(--ink-65);
  margin: 8px 0 28px;
}

.module {
  margin-bottom: 18px;
}

.moduleName {
  font-size: 12px;
  font-weight: 600;
  padding: 0 10px 8px;
}

@media (max-width: 900px) {
  .root {
    position: fixed;
    top: var(--topbar-height);
    left: 0;
    bottom: 0;
    width: min(85vw, var(--sidebar-width));
    overflow-y: auto;
    z-index: 20;
    transform: translateX(-100%);
    transition: transform 0.25s;
    box-shadow: var(--shadow-card);
  }
  .root[data-open='true'] {
    transform: translateX(0);
  }
}
```

- [ ] **Step 5: Create `ReviewCard.tsx` and CSS**

`ReviewCard.tsx`:
```tsx
import type { Grade, SrsCard } from '@/domain/srs';
import styles from './ReviewCard.module.css';

const GRADES: { grade: Grade; label: string; when: string }[] = [
  { grade: 'again', label: 'Otra vez', when: 'hoy' },
  { grade: 'good', label: 'Bien', when: 'próximos días' },
  { grade: 'easy', label: 'Fácil', when: 'más adelante' },
];

export function ReviewCard({
  card,
  flipped,
  onFlip,
  onGrade,
}: {
  card: SrsCard;
  flipped: boolean;
  onFlip(): void;
  onGrade(grade: Grade): void;
}) {
  return (
    <div className={styles.root}>
      <button type="button" className={styles.card} data-side={flipped ? 'back' : 'front'} onClick={onFlip}>
        <span className={styles.side}>{flipped ? 'Respuesta' : 'Pregunta'}</span>
        <span className={styles.text}>{flipped ? card.back : card.front}</span>
        <span className={styles.hint}>Toca para girar</span>
      </button>
      {flipped && (
        <div className={styles.grades}>
          {GRADES.map((g) => (
            <button key={g.grade} type="button" className={styles.grade} data-grade={g.grade} onClick={() => onGrade(g.grade)}>
              <span className={styles.gradeLabel}>{g.label}</span>
              <span className={styles.gradeWhen}>{g.when}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

`ReviewCard.module.css`:
```css
.root {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}

.card {
  width: min(640px, 100%);
  min-height: 380px;
  border-radius: 32px;
  padding: 48px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: left;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.3);
  transition: background 0.3s;
  background: var(--color-ink);
  color: var(--color-sand);
}

.card[data-side='back'] {
  background: var(--color-sand);
  color: var(--color-ink);
}

.side,
.hint {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--color-lime);
}

.card[data-side='back'] .side,
.card[data-side='back'] .hint {
  color: var(--color-accent);
}

.hint {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 400;
}

.text {
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.grades {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
}

.grade {
  width: 160px;
  height: 56px;
  border-radius: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.grade[data-grade='again'] {
  background: var(--color-accent);
  color: #fff;
}

.grade[data-grade='good'] {
  background: var(--color-sand);
  color: var(--color-ink);
}

.grade[data-grade='easy'] {
  background: var(--color-lime);
  color: var(--color-ink);
}

.gradeLabel {
  font-size: 14px;
  font-weight: 600;
}

.gradeWhen {
  font-size: 11px;
  opacity: 0.75;
}

@media (max-width: 900px) {
  .card {
    padding: 28px;
    min-height: 280px;
  }
  .text {
    font-size: 24px;
  }
}
```

- [ ] **Step 6: Run tests and commit**

Run: `pnpm format && pnpm vitest run src/ui/organisms/organisms.test.tsx && pnpm lint && pnpm typecheck`
Expected: 3 tests pass.

```bash
git add src/ui/organisms
git commit -m "feat(ui): add top navigation, stage sidebar and review card"
```

---

### Task 18: App composition, router, shell and the Library page

**Files:**
- Create: `src/application/CourseContext.tsx`, `src/ui/templates/AppShell.tsx`, `src/ui/templates/AppShell.module.css`, `src/ui/pages/LibraryPage.tsx`, `src/ui/pages/LibraryPage.module.css`, `src/ui/pages/NotFoundPage.tsx`, `src/router.tsx`, `src/test/fixtures/testCourse.tsx`, `src/test/renderApp.tsx`
- Modify: `src/App.tsx`, `src/App.test.tsx`
- Test: `src/ui/pages/LibraryPage.test.tsx`

**Interfaces:**
- Consumes: `loadCourse` (Task 9), `createRepositories` (Task 8), hooks (Task 7), molecules (Task 16), `TopNav` (Task 17).
- Produces:

```ts
export function CourseProvider(props: { value: Course; children: ReactNode }): JSX.Element;
export function useCourse(): Course;
export const routes: RouteObject[];          // '/', 'etapa/:stageSlug/:lessonSlug', 'repaso', 'notas', '*' under AppShell
export function AppRoutes(): JSX.Element;    // useRoutes(routes), for tests inside a MemoryRouter
export function App(): JSX.Element;          // RepositoriesProvider + CourseProvider + RouterProvider(createBrowserRouter)
export const testCourse: Course;             // 2 stages, 3 visible lessons + 1 hidden, stub loaders rendering `<p>Cuerpo de <title></p>`
export function renderApp(route: string, opts?: { repos?: Partial<Repositories> }): { repos: Repositories } & RenderResult;
```

Routes for `LessonPage`, `ReviewPage`, `NotesPage` are registered here with placeholder components that render only their heading; Tasks 19 and 20 replace them with the real pages in the same files.

- [ ] **Step 1: Write failing tests**

`src/ui/pages/LibraryPage.test.tsx`:
```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '@/test/renderApp';
import { emptyProgress } from '@/domain/progress';
import { createMemoryStore } from '@/application/testing/memoryStore';

describe('LibraryPage', () => {
  it('shows greeting, continue card, review card, streak and one card per stage', () => {
    renderApp('/');
    expect(screen.getByRole('heading', { name: 'Todo lo que aprendes, en un solo lugar.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reanudar lección' })).toHaveAttribute('href', '/etapa/00-intro/00-a');
    expect(screen.getByRole('link', { name: /Repaso de hoy: 0 tarjetas/ })).toBeInTheDocument();
    expect(screen.getByText('0 días')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /% completado/ })).toHaveLength(2);
  });

  it('filters stages by progress', async () => {
    renderApp('/', {
      repos: {
        progress: createMemoryStore({
          ...emptyProgress(),
          completed: { '00-intro/00-a': '2026-09-26', '00-intro/01-b': '2026-09-26' },
        }),
      },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Terminados' }));
    expect(screen.getAllByRole('link', { name: /% completado/ })).toHaveLength(1);
    expect(screen.getByRole('link', { name: /Intro, 100% completado/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'En curso' }));
    expect(screen.getByRole('link', { name: /JS, 0% completado/ })).toBeInTheDocument();
  });
});
```

Update `src/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('boots with real repositories and the loaded course', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Todo lo que aprendes, en un solo lugar.' })).toBeInTheDocument();
    expect(screen.getByText('Cómo aprender a programar')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/ui/pages src/App.test.tsx`
Expected: FAIL, modules not found / heading not found.

- [ ] **Step 3: Create `src/application/CourseContext.tsx`**

```tsx
import { createContext, useContext, type ReactNode } from 'react';
import type { Course } from '@/domain/course';

const CourseContext = createContext<Course | null>(null);

export function CourseProvider({ value, children }: { value: Course; children: ReactNode }) {
  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}

export function useCourse(): Course {
  const course = useContext(CourseContext);
  if (!course) throw new Error('CourseProvider is missing above this component');
  return course;
}
```

- [ ] **Step 4: Create `src/test/fixtures/testCourse.tsx` and `src/test/renderApp.tsx`**

`testCourse.tsx`:
```tsx
import { buildCourse, type LessonComponent, type LessonMeta, type StageMeta } from '@/domain/course';

const stages: StageMeta[] = [
  { id: 0, slug: '00-intro', title: 'Intro', mark: 'In', bg: '#022a2a', fg: '#10484a', project: 'Repo', hours: 4 },
  { id: 1, slug: '01-js', title: 'JS', mark: 'Js', bg: '#ff3d00', fg: '#ff6a3a', project: 'Todo', hours: 20 },
];

const metas: LessonMeta[] = [
  { id: '00-intro/00-a', title: 'Qué es un programa', stage: 0, module: 'Base', order: 0, minutes: 8, prereqs: [], summary: 'Primera' },
  { id: '00-intro/01-b', title: 'La terminal', stage: 0, module: 'Base', order: 1, minutes: 12, prereqs: ['00-intro/00-a'], summary: 'Segunda' },
  { id: '00-intro/99-demo', title: 'Demo', stage: 0, module: 'Base', order: 99, minutes: 1, prereqs: [], summary: '', hidden: true },
  { id: '01-js/00-a', title: 'Variables', stage: 1, module: 'Fundamentos', order: 0, minutes: 10, prereqs: [], summary: 'Tercera' },
];

function stub(title: string): () => Promise<LessonComponent> {
  const Body: LessonComponent = () => <p>Cuerpo de {title}</p>;
  return () => Promise.resolve(Body);
}

export const testCourse = buildCourse(
  stages,
  metas,
  Object.fromEntries(metas.map((m) => [m.id, stub(m.title)])),
);
```

`renderApp.tsx`:
```tsx
import type { RenderResult } from '@testing-library/react';
import { CourseProvider } from '@/application/CourseContext';
import type { Repositories } from '@/application/ports/Repositories';
import { renderWithRepositories } from '@/application/testing/renderWithRepositories';
import { AppRoutes } from '@/router';
import { testCourse } from './fixtures/testCourse';

export function renderApp(route: string, opts: { repos?: Partial<Repositories> } = {}): { repos: Repositories } & RenderResult {
  return renderWithRepositories(
    <CourseProvider value={testCourse}>
      <AppRoutes />
    </CourseProvider>,
    { route, repos: opts.repos },
  );
}
```

- [ ] **Step 5: Create `AppShell.tsx`, `NotFoundPage.tsx`, `LibraryPage.tsx` and CSS**

`src/ui/templates/AppShell.tsx`:
```tsx
import { Outlet } from 'react-router-dom';
import { TopNav } from '@/ui/organisms/TopNav';
import styles from './AppShell.module.css';

export function AppShell() {
  return (
    <div className={styles.root}>
      <TopNav />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
```

`AppShell.module.css`:
```css
.root {
  min-height: 100vh;
  background: var(--color-paper);
}

.main {
  min-height: calc(100vh - var(--topbar-height));
}
```

`src/ui/pages/NotFoundPage.tsx`:
```tsx
import { Link } from 'react-router-dom';
import { ROUTES } from '@/ui/routes';

export function NotFoundPage() {
  return (
    <section style={{ padding: 'var(--page-gutter)' }}>
      <h1>No encontramos esa página</h1>
      <p>
        <Link to={ROUTES.library}>Volver a la biblioteca</Link>
      </p>
    </section>
  );
}
```

`src/ui/pages/LibraryPage.tsx`:
```tsx
import { useState } from 'react';
import { useCourse } from '@/application/CourseContext';
import { useContinueLearning } from '@/application/hooks/useContinueLearning';
import { useProgress } from '@/application/hooks/useProgress';
import { useSrs } from '@/application/hooks/useSrs';
import { useStreak } from '@/application/hooks/useStreak';
import { stageProgress } from '@/domain/progress';
import { Chip } from '@/ui/atoms/Chip';
import { ContinueCard } from '@/ui/molecules/ContinueCard';
import { ReviewTodayCard } from '@/ui/molecules/ReviewTodayCard';
import { StageCard } from '@/ui/molecules/StageCard';
import { StreakBars } from '@/ui/molecules/StreakBars';
import styles from './LibraryPage.module.css';

type Filter = 'all' | 'inProgress' | 'finished';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'inProgress', label: 'En curso' },
  { key: 'finished', label: 'Terminados' },
];

function greeting(hour: number): string {
  if (hour < 12) return 'Buenos días';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export function LibraryPage() {
  const course = useCourse();
  const { state } = useProgress();
  const { streak, week } = useStreak();
  const { due } = useSrs();
  const next = useContinueLearning(course);
  const [filter, setFilter] = useState<Filter>('all');

  const nextStage = next ? (course.stages.find((s) => s.id === next.stage) ?? null) : null;
  const nextProgress = nextStage ? stageProgress(nextStage, state.completed) : { done: 0, total: 0, pct: 0 };

  const cards = course.stages
    .map((stage) => ({ stage, progress: stageProgress(stage, state.completed) }))
    .filter(({ progress }) => {
      if (filter === 'inProgress') return progress.pct < 100;
      if (filter === 'finished') return progress.total > 0 && progress.pct === 100;
      return true;
    });

  return (
    <div className={styles.root}>
      <section className={styles.hero}>
        <div className={styles.greeting}>{greeting(new Date().getHours())}</div>
        <h1 className={styles.headline}>Todo lo que aprendes, en un solo lugar.</h1>
      </section>
      <section className={styles.dashboard}>
        <ContinueCard lesson={next} stage={nextStage} progress={nextProgress} />
        <div className={styles.side}>
          <ReviewTodayCard count={due.length} />
          <StreakBars week={week} streak={streak} />
        </div>
      </section>
      <section className={styles.coursesHead}>
        <h2 className={styles.coursesTitle}>Tus etapas</h2>
        <div className={styles.filters}>
          {FILTERS.map((f) => (
            <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
            </Chip>
          ))}
        </div>
      </section>
      <section className={styles.grid}>
        {cards.map(({ stage, progress }) => (
          <StageCard key={stage.id} stage={stage} progress={progress} />
        ))}
      </section>
    </div>
  );
}
```

`LibraryPage.module.css`:
```css
.root {
  padding: 0 var(--page-gutter) 72px;
}

.hero {
  padding: 72px 0 40px;
}

.greeting {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-accent);
  margin-bottom: 10px;
}

.headline {
  font-size: 64px;
  line-height: 1.05;
  letter-spacing: -0.035em;
  max-width: 820px;
  text-wrap: pretty;
}

.dashboard {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 20px;
}

.side {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 20px;
}

.coursesHead {
  padding: 64px 0 24px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.coursesTitle {
  font-size: 28px;
}

.filters {
  display: flex;
  gap: 4px;
  padding: 3px;
  background: var(--ink-06);
  border-radius: var(--radius-s);
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

@media (max-width: 1200px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .hero {
    padding: 40px 0 24px;
  }
  .headline {
    font-size: 36px;
  }
  .dashboard,
  .side {
    grid-template-columns: 1fr;
    grid-template-rows: none;
  }
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 6: Create `src/router.tsx` and rewrite `src/App.tsx`**

`src/router.tsx`:
```tsx
import { useRoutes, type RouteObject } from 'react-router-dom';
import { AppShell } from '@/ui/templates/AppShell';
import { LibraryPage } from '@/ui/pages/LibraryPage';
import { NotFoundPage } from '@/ui/pages/NotFoundPage';

function LessonPlaceholder() {
  return <h1>Lección</h1>;
}
function ReviewPlaceholder() {
  return <h1>Repaso</h1>;
}
function NotesPlaceholder() {
  return <h1>Notas</h1>;
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <LibraryPage /> },
      { path: 'etapa/:stageSlug/:lessonSlug', element: <LessonPlaceholder /> },
      { path: 'repaso', element: <ReviewPlaceholder /> },
      { path: 'notas', element: <NotesPlaceholder /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function AppRoutes() {
  return useRoutes(routes);
}
```

`src/App.tsx`:
```tsx
import { useMemo } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { CourseProvider } from '@/application/CourseContext';
import { RepositoriesProvider } from '@/application/RepositoriesContext';
import { loadCourse } from '@/infrastructure/content/loadCourse';
import { createRepositories } from '@/infrastructure/storage/createRepositories';
import { routes } from '@/router';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

export function App() {
  const repositories = useMemo(() => createRepositories(), []);
  const course = useMemo(() => loadCourse(), []);
  const router = useMemo(() => createBrowserRouter(routes, { basename }), []);
  return (
    <RepositoriesProvider value={repositories}>
      <CourseProvider value={course}>
        <RouterProvider router={router} />
      </CourseProvider>
    </RepositoriesProvider>
  );
}
```

- [ ] **Step 7: Run tests and commit**

Run: `pnpm format && pnpm vitest run && pnpm lint && pnpm typecheck && pnpm build`
Expected: all tests pass (App test included), build succeeds.

```bash
git add src/application/CourseContext.tsx src/ui/templates src/ui/pages src/router.tsx src/App.tsx src/App.test.tsx src/test
git commit -m "feat(ui): compose app with router, shell and library page"
```

---

### Task 19: Lesson page

**Files:**
- Create: `src/ui/templates/LessonLayout.tsx`, `src/ui/templates/LessonLayout.module.css`, `src/ui/organisms/LessonArticle.tsx`, `src/ui/organisms/LessonArticle.module.css`, `src/ui/pages/LessonPage.tsx`, `src/ui/pages/LessonPage.module.css`
- Modify: `src/router.tsx` (replace `LessonPlaceholder` with `LessonPage`)
- Test: `src/ui/pages/LessonPage.test.tsx`

**Interfaces:**
- Consumes: `findLesson`, `Lesson.load()` (Task 3), `useProgress`, `useNotes` (Task 7), `Sidebar` (Task 17), `NoteBox` (Task 16), `MdxProvider`, `LessonProvider` (Tasks 10, 14), `lessonPath` (Task 16).
- Produces:

```ts
export function LessonLayout(props: { sidebar: ReactNode; children: ReactNode; sidebarOpen: boolean; onToggleSidebar(): void }): JSX.Element;
export function LessonArticle(props: { lesson: Lesson; stageTitle: string; prev: Lesson | null; note: string; onNoteChange(text: string): void; showNote: boolean; onToggleNote(): void; onComplete(): void; children: ReactNode }): JSX.Element;
export function LessonPage(): JSX.Element;
```

- [ ] **Step 1: Write failing test `src/ui/pages/LessonPage.test.tsx`**

```tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '@/test/renderApp';

describe('LessonPage', () => {
  it('renders sidebar, lazily loaded body and marks the lesson as opened', async () => {
    const { repos } = renderApp('/etapa/00-intro/00-a');
    expect(await screen.findByText('Cuerpo de Qué es un programa')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Qué es un programa' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /La terminal/ })).toHaveAttribute('data-state', 'pending');
    expect(repos.progress.get().lastOpened).toBe('00-intro/00-a');
  });

  it('completes the lesson and navigates to the next one', async () => {
    const { repos } = renderApp('/etapa/00-intro/00-a');
    await screen.findByText('Cuerpo de Qué es un programa');
    await userEvent.click(screen.getByRole('button', { name: 'Completar y seguir ›' }));
    expect(repos.progress.get().completed['00-intro/00-a']).toBe('2026-09-26');
    expect(await screen.findByText('Cuerpo de La terminal')).toBeInTheDocument();
  });

  it('on the last lesson the button returns to the library', async () => {
    renderApp('/etapa/01-js/00-a');
    await screen.findByText('Cuerpo de Variables');
    await userEvent.click(screen.getByRole('button', { name: 'Completar y terminar' }));
    expect(await screen.findByRole('heading', { name: 'Todo lo que aprendes, en un solo lugar.' })).toBeInTheDocument();
  });

  it('saves a note for the lesson', async () => {
    const { repos } = renderApp('/etapa/00-intro/00-a');
    await screen.findByText('Cuerpo de Qué es un programa');
    await userEvent.click(screen.getByRole('button', { name: 'Añadir nota' }));
    await userEvent.type(screen.getByLabelText('Mi nota'), 'Recordar');
    await waitFor(() => expect(repos.notes.get()['00-intro/00-a']?.text).toBe('Recordar'));
  });

  it('shows a not-found state for unknown lessons', () => {
    renderApp('/etapa/00-intro/zzz');
    expect(screen.getByText('Lección no encontrada')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver a la biblioteca' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/ui/pages/LessonPage.test.tsx`
Expected: FAIL (placeholder renders "Lección" only).

- [ ] **Step 3: Create `LessonLayout.tsx` and CSS**

`LessonLayout.tsx`:
```tsx
import type { ReactNode } from 'react';
import styles from './LessonLayout.module.css';

export function LessonLayout({
  sidebar,
  children,
  sidebarOpen,
  onToggleSidebar,
}: {
  sidebar: ReactNode;
  children: ReactNode;
  sidebarOpen: boolean;
  onToggleSidebar(): void;
}) {
  return (
    <div className={styles.root}>
      <button type="button" className={styles.toggle} aria-expanded={sidebarOpen} onClick={onToggleSidebar}>
        {sidebarOpen ? 'Cerrar índice' : 'Ver índice'}
      </button>
      {sidebar}
      {sidebarOpen && <div className={styles.scrim} onClick={onToggleSidebar} aria-hidden="true" />}
      <div className={styles.main}>{children}</div>
    </div>
  );
}
```

`LessonLayout.module.css`:
```css
.root {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  background: var(--color-white);
}

.main {
  min-width: 0;
  padding-bottom: 64px;
}

.toggle {
  display: none;
}

.scrim {
  display: none;
}

@media (max-width: 900px) {
  .root {
    grid-template-columns: 1fr;
  }
  .toggle {
    display: inline-flex;
    margin: 12px var(--page-gutter) 0;
    height: 36px;
    padding: 0 16px;
    border-radius: 18px;
    background: var(--ink-06);
    font-size: 13px;
    font-weight: 600;
  }
  .scrim {
    display: block;
    position: fixed;
    inset: var(--topbar-height) 0 0 0;
    background: rgba(2, 42, 42, 0.35);
    z-index: 15;
  }
}
```

- [ ] **Step 4: Create `LessonArticle.tsx` and CSS**

`LessonArticle.tsx`:
```tsx
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Lesson } from '@/domain/course';
import { Button } from '@/ui/atoms/Button';
import { NoteBox } from '@/ui/molecules/NoteBox';
import { lessonPath } from '@/ui/routes';
import styles from './LessonArticle.module.css';

export function LessonArticle({
  lesson,
  stageTitle,
  prev,
  note,
  onNoteChange,
  showNote,
  onToggleNote,
  onComplete,
  children,
}: {
  lesson: Lesson;
  stageTitle: string;
  prev: Lesson | null;
  note: string;
  onNoteChange(text: string): void;
  showNote: boolean;
  onToggleNote(): void;
  onComplete(): void;
  children: ReactNode;
}) {
  return (
    <>
      <div className={styles.topbar}>
        <span>
          {stageTitle} · {lesson.module}
        </span>
        <Button variant="ghost" onClick={onToggleNote} className={styles.noteButton}>
          {showNote ? 'Ocultar nota' : 'Añadir nota'}
        </Button>
      </div>
      <article className={styles.article}>
        <div className={styles.minutes}>{lesson.minutes} min de lectura y práctica</div>
        <h1 className={styles.title}>{lesson.title}</h1>
        <p className={styles.summary}>{lesson.summary}</p>
        {showNote && <NoteBox value={note} onChange={onNoteChange} />}
        <div className={styles.body}>{children}</div>
        <footer className={styles.footer}>
          {prev ? (
            <Link to={lessonPath(prev)} className={styles.prev}>
              ‹ Anterior
            </Link>
          ) : (
            <span />
          )}
          <Button onClick={onComplete}>{lesson.next ? 'Completar y seguir ›' : 'Completar y terminar'}</Button>
        </footer>
      </article>
    </>
  );
}
```

`LessonArticle.module.css`:
```css
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 56px;
  height: var(--topbar-height);
  border-bottom: 1px solid var(--ink-06);
  font-size: 12px;
  color: var(--ink-65);
}

.noteButton {
  height: 32px;
  padding: 0 14px;
  font-size: 12px;
}

.article {
  max-width: 680px;
  margin: 0 auto;
  padding: 64px 24px 0;
}

.minutes {
  font-size: 13px;
  color: var(--color-accent);
  font-weight: 500;
  margin-bottom: 10px;
}

.title {
  font-size: 48px;
  line-height: 1.08;
  letter-spacing: -0.03em;
  margin-bottom: 20px;
}

.summary {
  margin: 0 0 36px;
  font-size: 19px;
  line-height: 1.6;
  color: var(--color-teal);
  font-weight: 300;
}

.body {
  font-size: 16px;
  line-height: 1.75;
  color: var(--color-teal);
}

.body h2 {
  font-size: 24px;
  color: var(--color-ink);
  margin: 40px 0 12px;
}

.body h3 {
  font-size: 18px;
  color: var(--color-ink);
  margin: 28px 0 8px;
}

.body p {
  margin: 0 0 20px;
}

.body pre {
  background: var(--color-ink);
  color: var(--color-sand);
  padding: 16px 18px;
  border-radius: var(--radius-m);
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
}

.body :not(pre) > code {
  background: var(--ink-06);
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 0.92em;
}

.body table {
  border-collapse: collapse;
  width: 100%;
  margin: 0 0 20px;
  font-size: 14px;
}

.body th,
.body td {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid var(--ink-10);
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 28px;
  margin-top: 40px;
  border-top: 1px solid var(--ink-08);
}

.prev {
  font-size: 14px;
  text-decoration: none;
}

@media (max-width: 900px) {
  .topbar {
    padding: 0 var(--page-gutter);
  }
  .article {
    padding-top: 32px;
  }
  .title {
    font-size: 32px;
  }
}
```

- [ ] **Step 5: Create `LessonPage.tsx` and CSS, then wire it in `src/router.tsx`**

`LessonPage.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCourse } from '@/application/CourseContext';
import { useNotes } from '@/application/hooks/useNotes';
import { useProgress } from '@/application/hooks/useProgress';
import { findLesson, type LessonComponent } from '@/domain/course';
import { stageProgress } from '@/domain/progress';
import { LessonProvider } from '@/ui/organisms/interactive/LessonContext';
import { MdxProvider } from '@/ui/organisms/interactive/MdxProvider';
import { LessonArticle } from '@/ui/organisms/LessonArticle';
import { Sidebar } from '@/ui/organisms/Sidebar';
import { LessonLayout } from '@/ui/templates/LessonLayout';
import { lessonPath, ROUTES } from '@/ui/routes';
import styles from './LessonPage.module.css';

export function LessonPage() {
  const { stageSlug = '', lessonSlug = '' } = useParams();
  const course = useCourse();
  const navigate = useNavigate();
  const { state, openLesson, completeLesson } = useProgress();
  const { notes, upsert } = useNotes();
  const lesson = findLesson(course, stageSlug, lessonSlug);
  const stage = lesson ? course.stages.find((s) => s.id === lesson.stage) : undefined;

  const [Body, setBody] = useState<LessonComponent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNote, setShowNote] = useState(false);

  useEffect(() => {
    if (!lesson) return;
    openLesson(lesson.id);
    setShowNote(Boolean(notes[lesson.id]?.text));
    let cancelled = false;
    setBody(null);
    setLoadError(null);
    lesson
      .load()
      .then((component) => {
        if (!cancelled) setBody(() => component);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : String(error));
      });
    return () => {
      cancelled = true;
    };
    // notes is intentionally not a dependency: it only seeds the initial visibility of the note box
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id, openLesson]);

  if (!lesson || !stage) {
    return (
      <section className={styles.notFound}>
        <h1>Lección no encontrada</h1>
        <Link to={ROUTES.library}>Volver a la biblioteca</Link>
      </section>
    );
  }

  const prev = lesson.prev ? (course.byId[lesson.prev] ?? null) : null;
  const next = lesson.next ? (course.byId[lesson.next] ?? null) : null;

  const complete = () => {
    completeLesson(lesson.id);
    navigate(next ? lessonPath(next) : ROUTES.library);
  };

  return (
    <LessonLayout
      sidebarOpen={sidebarOpen}
      onToggleSidebar={() => setSidebarOpen((o) => !o)}
      sidebar={
        <Sidebar
          stage={stage}
          currentLessonId={lesson.id}
          completed={state.completed}
          progress={stageProgress(stage, state.completed)}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      }
    >
      <LessonArticle
        lesson={lesson}
        stageTitle={stage.title}
        prev={prev}
        note={notes[lesson.id]?.text ?? ''}
        onNoteChange={(text) => upsert(lesson.id, text)}
        showNote={showNote}
        onToggleNote={() => setShowNote((s) => !s)}
        onComplete={complete}
      >
        <LessonProvider lessonId={lesson.id}>
          <MdxProvider>
            {loadError && <p className={styles.error}>No pudimos cargar esta lección: {loadError}</p>}
            {!Body && !loadError && <p className={styles.loading}>Cargando lección…</p>}
            {Body && <Body />}
          </MdxProvider>
        </LessonProvider>
      </LessonArticle>
    </LessonLayout>
  );
}
```

`LessonPage.module.css`:
```css
.notFound {
  padding: var(--page-gutter);
}

.loading {
  color: var(--ink-55);
}

.error {
  color: #9a2a00;
}
```

In `src/router.tsx` delete `LessonPlaceholder`, add `import { LessonPage } from '@/ui/pages/LessonPage';` and set `{ path: 'etapa/:stageSlug/:lessonSlug', element: <LessonPage /> }`.

- [ ] **Step 6: Run tests and commit**

Run: `pnpm format && pnpm vitest run && pnpm lint && pnpm typecheck`
Expected: all tests pass, including the 5 LessonPage tests.

```bash
git add src/ui/templates/LessonLayout.tsx src/ui/templates/LessonLayout.module.css src/ui/organisms/LessonArticle.tsx src/ui/organisms/LessonArticle.module.css src/ui/pages/LessonPage.tsx src/ui/pages/LessonPage.module.css src/ui/pages/LessonPage.test.tsx src/router.tsx
git commit -m "feat(ui): add lesson page with sidebar, lazy MDX body, notes and completion"
```

---

### Task 20: Review and Notes pages

**Files:**
- Create: `src/ui/pages/ReviewPage.tsx`, `src/ui/pages/ReviewPage.module.css`, `src/ui/pages/NotesPage.tsx`, `src/ui/pages/NotesPage.module.css`
- Modify: `src/router.tsx` (replace the two placeholders)
- Test: `src/ui/pages/ReviewPage.test.tsx`, `src/ui/pages/NotesPage.test.tsx`

**Interfaces:**
- Consumes: `useSrs`, `useProgress`, `useNotes` (Task 7), `ReviewCard` (Task 17), `ProgressBar` (Task 15), `lessonPath` (Task 16).
- Produces: `ReviewPage(): JSX.Element`, `NotesPage(): JSX.Element`.

Review session rules: the session deck is a snapshot of `due` taken when the page mounts; grading advances to the next card; a card graded `again` is appended back to the end of the session deck; after 5 grades in the session `recordReviewSession(5)` is called once; when the deck is empty the page shows `No tienes tarjetas pendientes` and a link back to the library.

- [ ] **Step 1: Write failing tests**

`ReviewPage.test.tsx`:
```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '@/test/renderApp';
import { createMemoryStore } from '@/application/testing/memoryStore';
import { emptyProgress } from '@/domain/progress';
import { cardKey, newCardState, type SrsState } from '@/domain/srs';

const today = '2026-09-26';

function deck(n: number): SrsState {
  const cards: SrsState = {};
  for (let i = 0; i < n; i += 1) {
    const key = cardKey('00-intro/00-a', i);
    cards[key] = { key, lessonId: '00-intro/00-a', front: `P${i}`, back: `R${i}`, state: newCardState(today), graded: false };
  }
  return cards;
}

describe('ReviewPage', () => {
  it('shows the empty state when nothing is due', () => {
    renderApp('/repaso');
    expect(screen.getByText('No tienes tarjetas pendientes')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver a la biblioteca' })).toBeInTheDocument();
  });

  it('walks through due cards, reschedules them and counts the session as activity', async () => {
    const { repos } = renderApp('/repaso', {
      repos: {
        srs: createMemoryStore(deck(5)),
        progress: createMemoryStore({ ...emptyProgress(), completed: { '00-intro/00-a': today } }),
      },
    });
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
    for (let i = 0; i < 5; i += 1) {
      await userEvent.click(screen.getByRole('button', { name: /Toca para girar/ }));
      await userEvent.click(screen.getByRole('button', { name: /Bien/ }));
    }
    expect(screen.getByText('Sesión terminada')).toBeInTheDocument();
    expect(repos.srs.get()['00-intro/00-a#0']?.state.due).toBe('2026-09-27');
    expect(repos.progress.get().activityDays).toEqual([today]);
  });

  it('re-queues a card graded again', async () => {
    renderApp('/repaso', {
      repos: {
        srs: createMemoryStore(deck(1)),
        progress: createMemoryStore({ ...emptyProgress(), completed: { '00-intro/00-a': today } }),
      },
    });
    await userEvent.click(screen.getByRole('button', { name: /Toca para girar/ }));
    await userEvent.click(screen.getByRole('button', { name: /Otra vez/ }));
    expect(screen.getByText('P0')).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });
});
```

`NotesPage.test.tsx`:
```tsx
import { screen } from '@testing-library/react';
import { renderApp } from '@/test/renderApp';
import { createMemoryStore } from '@/application/testing/memoryStore';

describe('NotesPage', () => {
  it('shows an empty state', () => {
    renderApp('/notas');
    expect(screen.getByText('Todavía no escribiste ninguna nota')).toBeInTheDocument();
  });

  it('groups notes by stage with a link to the lesson', () => {
    renderApp('/notas', {
      repos: {
        notes: createMemoryStore({
          '00-intro/00-a': { lessonId: '00-intro/00-a', text: 'Primera nota', updatedAt: '2026-09-26T10:00:00.000Z' },
          '01-js/00-a': { lessonId: '01-js/00-a', text: 'Otra nota', updatedAt: '2026-09-26T11:00:00.000Z' },
        }),
      },
    });
    expect(screen.getByRole('heading', { name: 'Intro' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'JS' })).toBeInTheDocument();
    expect(screen.getByText('Primera nota')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Qué es un programa' })).toHaveAttribute('href', '/etapa/00-intro/00-a');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/ui/pages/ReviewPage.test.tsx src/ui/pages/NotesPage.test.tsx`
Expected: FAIL (placeholders).

- [ ] **Step 3: Create `ReviewPage.tsx` and CSS**

`ReviewPage.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '@/application/hooks/useProgress';
import { useSrs } from '@/application/hooks/useSrs';
import type { Grade, SrsCard } from '@/domain/srs';
import { ProgressBar } from '@/ui/atoms/ProgressBar';
import { ReviewCard } from '@/ui/organisms/ReviewCard';
import { ROUTES } from '@/ui/routes';
import styles from './ReviewPage.module.css';

const GRADES_FOR_ACTIVITY = 5;

export function ReviewPage() {
  const { due, cards, grade } = useSrs();
  const { recordReviewSession } = useProgress();
  const [queue, setQueue] = useState<SrsCard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [graded, setGraded] = useState(0);
  const recorded = useRef(false);

  useEffect(() => {
    if (queue === null) setQueue(due);
  }, [due, queue]);

  useEffect(() => {
    if (graded >= GRADES_FOR_ACTIVITY && !recorded.current) {
      recorded.current = true;
      recordReviewSession(graded);
    }
  }, [graded, recordReviewSession]);

  if (queue === null) return null;

  if (queue.length === 0) {
    return (
      <section className={styles.empty}>
        <h1>No tienes tarjetas pendientes</h1>
        <p>Completa lecciones para sumar tarjetas a tu repaso.</p>
        <Link to={ROUTES.library}>Volver a la biblioteca</Link>
      </section>
    );
  }

  if (index >= queue.length) {
    return (
      <section className={styles.empty}>
        <h1>Sesión terminada</h1>
        <p>Repasaste {graded} tarjetas. Vuelve mañana para mantener la racha.</p>
        <Link to={ROUTES.library}>Volver a la biblioteca</Link>
      </section>
    );
  }

  const current = queue[index]!;
  const live = cards[current.key] ?? current;

  const onGrade = (g: Grade) => {
    grade(current.key, g);
    setGraded((n) => n + 1);
    setFlipped(false);
    if (g === 'again') setQueue((q) => (q ? [...q, current] : q));
    setIndex((i) => i + 1);
  };

  return (
    <section className={styles.root}>
      <div className={styles.bar}>
        <Link to={ROUTES.library} className={styles.exit}>
          ✕ Salir
        </Link>
        <span className={styles.barTitle}>Repaso</span>
        <span>
          {index + 1} / {queue.length}
        </span>
      </div>
      <ProgressBar pct={((index + 1) / queue.length) * 100} tone="lime" onDark label="Progreso del repaso" />
      <div className={styles.stage}>
        <ReviewCard card={live} flipped={flipped} onFlip={() => setFlipped((f) => !f)} onGrade={onGrade} />
      </div>
    </section>
  );
}
```

`ReviewPage.module.css`:
```css
.root {
  min-height: calc(100vh - var(--topbar-height));
  background: var(--color-teal);
  color: var(--color-sand);
  padding: 0 var(--page-gutter) 56px;
  display: flex;
  flex-direction: column;
}

.bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: var(--topbar-height);
  font-size: 13px;
}

.exit {
  color: var(--color-sand);
  text-decoration: none;
}

.barTitle {
  font-weight: 500;
}

.stage {
  flex: 1;
  display: grid;
  place-items: center;
  padding: 56px 0 0;
}

.empty {
  padding: 72px var(--page-gutter);
  max-width: 600px;
}

.empty h1 {
  font-size: 36px;
  margin-bottom: 12px;
}
```

- [ ] **Step 4: Create `NotesPage.tsx` and CSS**

`NotesPage.tsx`:
```tsx
import { Link } from 'react-router-dom';
import { useCourse } from '@/application/CourseContext';
import { useNotes } from '@/application/hooks/useNotes';
import { lessonPath } from '@/ui/routes';
import styles from './NotesPage.module.css';

export function NotesPage() {
  const course = useCourse();
  const { notes } = useNotes();
  const groups = course.stages
    .map((stage) => ({
      stage,
      items: stage.lessons.filter((l) => notes[l.id]).map((l) => ({ lesson: l, note: notes[l.id]! })),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <section className={styles.root}>
      <h1 className={styles.title}>Notas</h1>
      {groups.length === 0 && <p className={styles.empty}>Todavía no escribiste ninguna nota</p>}
      {groups.map(({ stage, items }) => (
        <div key={stage.id} className={styles.group}>
          <h2 className={styles.stage}>{stage.title}</h2>
          {items.map(({ lesson, note }) => (
            <article key={lesson.id} className={styles.note}>
              <Link to={lessonPath(lesson)} className={styles.lesson}>
                {lesson.title}
              </Link>
              <p className={styles.text}>{note.text}</p>
              <time className={styles.time} dateTime={note.updatedAt}>
                {new Date(note.updatedAt).toLocaleDateString('es')}
              </time>
            </article>
          ))}
        </div>
      ))}
    </section>
  );
}
```

`NotesPage.module.css`:
```css
.root {
  padding: 56px var(--page-gutter) 72px;
  max-width: 820px;
}

.title {
  font-size: 40px;
  margin-bottom: 32px;
}

.empty {
  color: var(--ink-55);
}

.group {
  margin-bottom: 40px;
}

.stage {
  font-size: 20px;
  margin-bottom: 14px;
}

.note {
  background: var(--color-sand);
  border-radius: 20px;
  padding: 20px 24px;
  margin-bottom: 12px;
}

.lesson {
  font-weight: 600;
  text-decoration: none;
}

.text {
  margin: 8px 0;
  white-space: pre-wrap;
  color: var(--color-teal);
}

.time {
  font-size: 12px;
  color: var(--ink-55);
}
```

- [ ] **Step 5: Wire pages in `src/router.tsx`**

Delete `ReviewPlaceholder` and `NotesPlaceholder`; import `ReviewPage` and `NotesPage` and use them for `repaso` and `notas`.

- [ ] **Step 6: Run tests and commit**

Run: `pnpm format && pnpm vitest run && pnpm lint && pnpm typecheck`
Expected: all pass.

```bash
git add src/ui/pages src/router.tsx
git commit -m "feat(ui): add spaced repetition review session and notes pages"
```

---

### Task 21: Content validator (script + test)

**Files:**
- Create: `scripts/lib/validateContent.ts`, `scripts/validate-content.ts`
- Test: `scripts/lib/validateContent.test.ts`

**Interfaces:**
- Consumes: `content/stages.json` shape (`StageMeta[]`, Task 3), frontmatter schema (Task 9).
- Produces:

```ts
export interface ValidationResult { ok: boolean; errors: string[] }
export interface LessonValidation { id: string | null; stage: number | null; hidden: boolean; prereqs: string[]; links: string[]; errors: string[] }
export function validateLesson(source: string, relPath: string, stages: StageMeta[]): LessonValidation;
export function validateContent(rootDir: string): ValidationResult;      // rootDir is the `content/` directory
export function extractBlock(source: string, tag: string, from?: number): { start: number; end: number; text: string } | null;   // self-closing JSX block `<Tag ... />`, braces balanced
export function extractProp(source: string, component: string, prop: string): string | null;   // raw text of `prop={...}` or `prop="..."` inside the first `<component` block
export function extractQuizQuestions(source: string): { prompt: string; options: { text: string; correct: boolean; feedback: string }[] }[];   // parsed from the first <Quiz questions={[...]} /> block
// scripts/validate-content.ts re-exports validateContent, validateLesson, extractBlock, extractProp, extractQuizQuestions and, when run with tsx, prints errors and exits 1 on failure
```

Rules (every error string starts with the file path relative to `content/`):

1. Frontmatter parses (gray-matter) and has: `id` string, `title` string, `stage` number, `module` string, `order` number, `minutes` number, `prereqs` string array, `summary` string; `hidden` absent or boolean.
2. `id` equals the relative path without `.mdx`; the directory equals a stage slug from `stages.json` and `stage` equals that stage's numeric id.
3. Unless `hidden: true`, the markers `## Objetivo`, `## Concepto`, `## Práctica`, `## Ejercicio`, `## Errores comunes`, `<Flashcards`, `<Quiz` all exist and appear in that order.
4. Unless hidden: at least one of `<Playground`, `<Sandpack`, `<Snack`, `<Terminal`, `<Checklist` appears after `## Práctica`; `<Challenge` appears after `## Ejercicio`.
5. Exactly one `<Quiz` whose block has exactly 3 `prompt:` entries; exactly one `<Flashcards` whose block has 3 to 5 `front:` entries. Hidden lessons skip the "exactly one" requirement but any present block is still counted.
6. Cross-file: `id` unique; every `prereqs` entry exists; every internal link `](/etapa/<stage>/<lesson>...)` resolves to an existing id.
7. Stage limits (spec section 4): stages 0, 1 and 2 must not use `<Sandpack` or `<Snack`; stage 3 must not use `<Snack`. Any other component is allowed in any stage. Hidden lessons are exempt.

- [ ] **Step 1: Write failing test `scripts/lib/validateContent.test.ts`**

```ts
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  extractProp,
  extractQuizQuestions,
  validateContent,
  validateLesson,
} from './validateContent';
import stagesJson from '../../content/stages.json';
import type { StageMeta } from '@/domain/course';

const stages = stagesJson as StageMeta[];

const good = `---
id: "01-javascript/00-variables"
title: "Variables"
stage: 1
module: "Base"
order: 0
minutes: 8
prereqs: []
summary: "Resumen."
---

## Objetivo

Texto.

## Concepto

Texto.

## Práctica

<Playground lang="js" code={\`console.log(1)\`} />

## Ejercicio

<Challenge title="Reto" solution={<p>sol</p>}>
  Enunciado. Ver [la siguiente](/etapa/01-javascript/01-tipos).
</Challenge>

## Errores comunes

- Uno.
- Dos.

<Flashcards cards={[
  { front: "a", back: "b" },
  { front: "c", back: "d" },
  { front: "e", back: "f" },
]} />

<Quiz questions={[
  { prompt: "1", options: [{ text: "x", correct: true, feedback: "ok" }] },
  { prompt: "2", options: [{ text: "x", correct: true, feedback: "ok" }] },
  { prompt: "3", options: [{ text: "x", correct: true, feedback: "ok" }] },
]} />
`;

describe('validateLesson', () => {
  it('accepts a complete lesson and extracts id, stage, prereqs and links', () => {
    const result = validateLesson(good, '01-javascript/00-variables.mdx', stages);
    expect(result.errors).toEqual([]);
    expect(result.id).toBe('01-javascript/00-variables');
    expect(result.stage).toBe(1);
    expect(result.hidden).toBe(false);
    expect(result.links).toEqual(['01-javascript/01-tipos']);
  });

  it('rejects Sandpack and Snack in stages 0 to 2 and Snack in stage 3', () => {
    const withSnack = good.replace(
      '<Playground lang="js" code={`console.log(1)`} />',
      '<Snack code={`x`} />\n\n<Sandpack files={{ "/App.tsx": "x" }} />',
    );
    const { errors } = validateLesson(withSnack, '01-javascript/00-variables.mdx', stages);
    expect(errors).toContain('01-javascript/00-variables.mdx: Snack is not allowed in stage 1 (stages 0 to 3)');
    expect(errors).toContain('01-javascript/00-variables.mdx: Sandpack is not allowed in stage 1 (stages 0 to 2)');

    const stage3 = withSnack
      .replace('id: "01-javascript/00-variables"', 'id: "03-react/00-variables"')
      .replace('stage: 1', 'stage: 3');
    const s3 = validateLesson(stage3, '03-react/00-variables.mdx', stages).errors;
    expect(s3).toContain('03-react/00-variables.mdx: Snack is not allowed in stage 3 (stages 0 to 3)');
    expect(s3.some((e) => e.includes('Sandpack is not allowed'))).toBe(false);

    const stage4 = withSnack
      .replace('id: "01-javascript/00-variables"', 'id: "04-react-native-expo/00-variables"')
      .replace('stage: 1', 'stage: 4');
    const s4 = validateLesson(stage4, '04-react-native-expo/00-variables.mdx', stages).errors;
    expect(s4.some((e) => e.includes('is not allowed in stage'))).toBe(false);
  });

  it('extracts raw props and parsed quiz questions', () => {
    expect(extractProp(good, 'Playground', 'lang')).toBe('js');
    expect(extractProp(good, 'Playground', 'code')).toBe('`console.log(1)`');
    expect(extractProp(good, 'Playground', 'missing')).toBeNull();
    const questions = extractQuizQuestions(good);
    expect(questions).toHaveLength(3);
    expect(questions[0]).toEqual({
      prompt: '1',
      options: [{ text: 'x', correct: true, feedback: 'ok' }],
    });
    expect(extractQuizQuestions('no quiz here')).toEqual([]);
  });

  it('reports missing frontmatter fields and wrong types by name', () => {
    const src = good.replace('order: 0\n', '').replace('stage: 1', 'stage: "1"');
    const { errors } = validateLesson(src, '01-javascript/00-variables.mdx', stages);
    expect(errors).toContain('01-javascript/00-variables.mdx: frontmatter.order is required (number)');
    expect(errors).toContain('01-javascript/00-variables.mdx: frontmatter.stage must be a number');
  });

  it('reports id/path and stage/dir mismatches', () => {
    const { errors } = validateLesson(good, '02-typescript/00-variables.mdx', stages);
    expect(errors).toContain('02-typescript/00-variables.mdx: frontmatter.id must be "02-typescript/00-variables"');
    expect(errors).toContain('02-typescript/00-variables.mdx: frontmatter.stage must be 2 to match directory 02-typescript');
  });

  it('reports sections out of order and missing', () => {
    const src = good.replace('## Concepto\n\nTexto.\n\n', '').replace('## Práctica', '## Práctica\n\n## Concepto');
    const { errors } = validateLesson(src, '01-javascript/00-variables.mdx', stages);
    expect(errors.some((e) => e.includes('"## Concepto" must appear after "## Objetivo" and before "## Práctica"'))).toBe(true);
  });

  it('counts quiz questions and flashcards', () => {
    const src = good.replace('  { prompt: "3", options: [{ text: "x", correct: true, feedback: "ok" }] },\n', '');
    const { errors } = validateLesson(src, '01-javascript/00-variables.mdx', stages);
    expect(errors).toContain('01-javascript/00-variables.mdx: Quiz must have exactly 3 questions, found 2');
    const src2 = good.replace('  { front: "e", back: "f" },\n', '');
    expect(validateLesson(src2, '01-javascript/00-variables.mdx', stages).errors).toContain(
      '01-javascript/00-variables.mdx: Flashcards must have 3 to 5 cards, found 2',
    );
  });

  it('requires an interactive component in Práctica and a Challenge in Ejercicio', () => {
    const src = good.replace('<Playground lang="js" code={`console.log(1)`} />', 'Sin componente.').replace(/<Challenge[\s\S]*?<\/Challenge>/, 'Sin reto.');
    const { errors } = validateLesson(src, '01-javascript/00-variables.mdx', stages);
    expect(errors).toContain('01-javascript/00-variables.mdx: "## Práctica" needs at least one of Playground, Sandpack, Snack, Terminal, Checklist');
    expect(errors).toContain('01-javascript/00-variables.mdx: "## Ejercicio" needs a Challenge');
  });

  it('skips section and stage checks for hidden lessons', () => {
    const src = good
      .replace('summary: "Resumen."', 'summary: "Resumen."\nhidden: true')
      .replace(/## Concepto[\s\S]*/, '<Snack code={`x`} />\n');
    const result = validateLesson(src, '01-javascript/00-variables.mdx', stages);
    expect(result.errors).toEqual([]);
    expect(result.hidden).toBe(true);
  });
});

describe('validateContent', () => {
  it('passes on the real content directory', () => {
    const result = validateContent(path.resolve(__dirname, '../../content'));
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('reports duplicate ids, missing prereqs and broken links across files', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'saber-content-'));
    mkdirSync(path.join(root, '01-javascript'));
    writeFileSync(path.join(root, 'stages.json'), JSON.stringify(stages));
    writeFileSync(path.join(root, '01-javascript', '00-variables.mdx'), good);
    writeFileSync(
      path.join(root, '01-javascript', '01-tipos.mdx'),
      good.replace('id: "01-javascript/00-variables"', 'id: "01-javascript/00-variables"').replace('prereqs: []', 'prereqs: ["01-javascript/99-nope"]'),
    );
    const result = validateContent(root);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('01-javascript/01-tipos.mdx: frontmatter.id must be "01-javascript/01-tipos"');
    expect(result.errors).toContain('01-javascript/01-tipos.mdx: prereq "01-javascript/99-nope" does not exist');
    expect(result.errors.some((e) => e.includes('duplicate id "01-javascript/00-variables"'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run scripts`
Expected: FAIL, module not found.

- [ ] **Step 3: Create `scripts/lib/validateContent.ts`**

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { StageMeta } from '@/domain/course';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export interface LessonValidation {
  id: string | null;
  stage: number | null;
  hidden: boolean;
  prereqs: string[];
  links: string[];
  errors: string[];
}

export interface QuizOptionSource {
  text: string;
  correct: boolean;
  feedback: string;
}

export interface QuizQuestionSource {
  prompt: string;
  options: QuizOptionSource[];
}

const SECTION_MARKERS = [
  '## Objetivo',
  '## Concepto',
  '## Práctica',
  '## Ejercicio',
  '## Errores comunes',
  '<Flashcards',
  '<Quiz',
];
const PRACTICE_COMPONENTS = ['Playground', 'Sandpack', 'Snack', 'Terminal', 'Checklist'];
/** Components forbidden per stage id (spec section 4); the label is used in the error message. */
const STAGE_LIMITS: { component: string; maxStage: number; label: string }[] = [
  { component: 'Sandpack', maxStage: 2, label: 'stages 0 to 2' },
  { component: 'Snack', maxStage: 3, label: 'stages 0 to 3' },
];

type Field = { name: string; type: 'string' | 'number' | 'string[]' | 'boolean'; optional?: boolean };

const FIELDS: Field[] = [
  { name: 'id', type: 'string' },
  { name: 'title', type: 'string' },
  { name: 'stage', type: 'number' },
  { name: 'module', type: 'string' },
  { name: 'order', type: 'number' },
  { name: 'minutes', type: 'number' },
  { name: 'prereqs', type: 'string[]' },
  { name: 'summary', type: 'string' },
  { name: 'hidden', type: 'boolean', optional: true },
];

function hasType(value: unknown, type: Field['type']): boolean {
  if (type === 'string[]') return Array.isArray(value) && value.every((v) => typeof v === 'string');
  return typeof value === type;
}

/**
 * Walks `source` from `from` and returns the index just past the `{...}` group that starts at
 * `from`, ignoring braces inside '...', "..." and `...` strings. Returns -1 when unbalanced.
 */
function skipBraceGroup(source: string, from: number): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = from; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (ch === '\\') i += 1;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') quote = ch;
    else if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

/** Returns the source slice of a self-closing JSX block starting at `<Tag`, balancing `{}` braces. */
export function extractBlock(
  source: string,
  tag: string,
  from = 0,
): { start: number; end: number; text: string } | null {
  const start = source.indexOf(`<${tag}`, from);
  if (start === -1) return null;
  let i = start;
  while (i < source.length - 1) {
    const ch = source[i];
    if (ch === '{') {
      const next = skipBraceGroup(source, i);
      if (next === -1) break;
      i = next;
      continue;
    }
    if (ch === '/' && source[i + 1] === '>') {
      return { start, end: i + 2, text: source.slice(start, i + 2) };
    }
    i += 1;
  }
  return { start, end: source.length, text: source.slice(start) };
}

/**
 * Raw text of `prop="..."` (without quotes) or `prop={...}` (without the outer braces) inside the
 * first `<component ... />` block. Returns null when the block or the prop is absent.
 */
export function extractProp(source: string, component: string, prop: string): string | null {
  const block = extractBlock(source, component);
  if (!block) return null;
  const match = new RegExp(`[\\s]${prop}=`).exec(block.text);
  if (!match) return null;
  const valueStart = match.index + match[0].length;
  const first = block.text[valueStart];
  if (first === '"') {
    const close = block.text.indexOf('"', valueStart + 1);
    return close === -1 ? null : block.text.slice(valueStart + 1, close);
  }
  if (first === '{') {
    const end = skipBraceGroup(block.text, valueStart);
    return end === -1 ? null : block.text.slice(valueStart + 1, end - 1);
  }
  return null;
}

/**
 * Parses the `questions={[...]}` literal of the first `<Quiz` block. The literal is trusted repo
 * content, so it is evaluated as a JavaScript array expression. Returns [] when absent or invalid.
 */
export function extractQuizQuestions(source: string): QuizQuestionSource[] {
  const raw = extractProp(source, 'Quiz', 'questions');
  if (!raw) return [];
  try {
    const value = new Function(`return (${raw});`)() as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter(
      (q): q is QuizQuestionSource =>
        typeof q === 'object' && q !== null && typeof (q as QuizQuestionSource).prompt === 'string',
    );
  } catch {
    return [];
  }
}

function countOccurrences(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

export function validateLesson(source: string, relPath: string, stages: StageMeta[]): LessonValidation {
  const errors: string[] = [];
  const err = (msg: string) => errors.push(`${relPath}: ${msg}`);
  let data: Record<string, unknown> = {};
  let body = source;
  try {
    const parsed = matter(source);
    data = parsed.data as Record<string, unknown>;
    body = parsed.content;
  } catch (e) {
    err(`frontmatter could not be parsed (${e instanceof Error ? e.message : String(e)})`);
    return { id: null, stage: null, hidden: false, prereqs: [], links: [], errors };
  }

  for (const field of FIELDS) {
    const value = data[field.name];
    if (value === undefined) {
      if (!field.optional) err(`frontmatter.${field.name} is required (${field.type})`);
      continue;
    }
    if (!hasType(value, field.type)) err(`frontmatter.${field.name} must be a ${field.type}`);
  }

  const expectedId = relPath.replace(/\.mdx$/, '');
  const dir = expectedId.split('/')[0] ?? '';
  const stage = stages.find((s) => s.slug === dir);
  if (data.id !== expectedId) err(`frontmatter.id must be "${expectedId}"`);
  if (!stage) err(`directory "${dir}" is not a stage slug in stages.json`);
  else if (typeof data.stage === 'number' && data.stage !== stage.id) {
    err(`frontmatter.stage must be ${stage.id} to match directory ${dir}`);
  }

  const hidden = data.hidden === true;

  if (!hidden) {
    const positions = SECTION_MARKERS.map((marker) => body.indexOf(marker));
    positions.forEach((pos, i) => {
      const marker = SECTION_MARKERS[i]!;
      if (pos === -1) {
        err(`missing section "${marker}"`);
        return;
      }
      const before = SECTION_MARKERS[i - 1];
      const after = SECTION_MARKERS[i + 1];
      const prevPos = positions[i - 1] ?? -1;
      const nextPos = positions[i + 1] ?? Number.MAX_SAFE_INTEGER;
      if ((before !== undefined && prevPos !== -1 && pos < prevPos) || (after !== undefined && nextPos !== -1 && pos > nextPos)) {
        err(`"${marker}" must appear after "${before ?? 'start'}" and before "${after ?? 'end'}"`);
      }
    });

    const practice = body.indexOf('## Práctica');
    const exercise = body.indexOf('## Ejercicio');
    const mistakes = body.indexOf('## Errores comunes');
    if (practice !== -1) {
      const section = body.slice(practice, exercise === -1 ? undefined : exercise);
      if (!PRACTICE_COMPONENTS.some((c) => section.includes(`<${c}`))) {
        err(`"## Práctica" needs at least one of ${PRACTICE_COMPONENTS.join(', ')}`);
      }
    }
    if (exercise !== -1) {
      const section = body.slice(exercise, mistakes === -1 ? undefined : mistakes);
      if (!section.includes('<Challenge')) err(`"## Ejercicio" needs a Challenge`);
    }

    if (stage) {
      for (const limit of STAGE_LIMITS) {
        if (stage.id <= limit.maxStage && body.includes(`<${limit.component}`)) {
          err(`${limit.component} is not allowed in stage ${stage.id} (${limit.label})`);
        }
      }
    }
  }

  const quizCount = countOccurrences(body, '<Quiz');
  if (!hidden && quizCount !== 1) err(`lesson must have exactly one Quiz, found ${quizCount}`);
  const quiz = extractBlock(body, 'Quiz');
  if (quiz) {
    const prompts = countOccurrences(quiz.text, 'prompt:');
    if (prompts !== 3) err(`Quiz must have exactly 3 questions, found ${prompts}`);
  }

  const cardsCount = countOccurrences(body, '<Flashcards');
  if (!hidden && cardsCount !== 1) err(`lesson must have exactly one Flashcards, found ${cardsCount}`);
  const cards = extractBlock(body, 'Flashcards');
  if (cards) {
    const fronts = countOccurrences(cards.text, 'front:');
    if (fronts < 3 || fronts > 5) err(`Flashcards must have 3 to 5 cards, found ${fronts}`);
  }

  const links: string[] = [];
  for (const match of body.matchAll(/\]\(\/etapa\/([^)#?\s]+)/g)) {
    links.push(match[1]!.replace(/\/$/, ''));
  }

  const prereqs = Array.isArray(data.prereqs) ? (data.prereqs as string[]) : [];
  return {
    id: typeof data.id === 'string' ? data.id : null,
    stage: stage ? stage.id : null,
    hidden,
    prereqs,
    links,
    errors,
  };
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.mdx')) out.push(full);
  }
  return out.sort();
}

export function validateContent(rootDir: string): ValidationResult {
  const errors: string[] = [];
  const stages = JSON.parse(readFileSync(path.join(rootDir, 'stages.json'), 'utf8')) as StageMeta[];
  const files = walk(rootDir);
  const seen = new Map<string, string>();
  const results = files.map((file) => {
    const relPath = path.relative(rootDir, file).split(path.sep).join('/');
    const result = validateLesson(readFileSync(file, 'utf8'), relPath, stages);
    errors.push(...result.errors);
    return { relPath, ...result };
  });
  const ids = new Set<string>();
  for (const r of results) {
    if (!r.id) continue;
    const previous = seen.get(r.id);
    if (previous) errors.push(`${r.relPath}: duplicate id "${r.id}" already used by ${previous}`);
    seen.set(r.id, r.relPath);
    ids.add(r.id);
  }
  for (const r of results) {
    for (const p of r.prereqs) if (!ids.has(p)) errors.push(`${r.relPath}: prereq "${p}" does not exist`);
    for (const l of r.links) if (!ids.has(l)) errors.push(`${r.relPath}: link "/etapa/${l}" does not resolve to a lesson`);
  }
  return { ok: errors.length === 0, errors };
}
```

- [ ] **Step 4: Create `scripts/validate-content.ts`**

```ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContent } from './lib/validateContent';

export {
  extractBlock,
  extractProp,
  extractQuizQuestions,
  validateContent,
  validateLesson,
} from './lib/validateContent';
export type { LessonValidation, QuizQuestionSource, ValidationResult } from './lib/validateContent';

const isMain = process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const root = path.resolve(process.cwd(), process.argv[2] ?? 'content');
  const result = validateContent(root);
  if (result.ok) {
    console.log(`Content OK (${root})`);
  } else {
    console.error(`Content validation failed with ${result.errors.length} error(s):`);
    for (const e of result.errors) console.error(`  - ${e}`);
    process.exit(1);
  }
}
```

Also add to `tsconfig.json` `compilerOptions.paths` nothing new; `scripts` is already in `include`. The `@/domain/course` type import from `scripts/` resolves through the same alias in Vitest; for `tsx` it is a type-only import and is erased.

- [ ] **Step 5: Run tests, run the CLI, commit**

Run: `pnpm format && pnpm vitest run scripts && pnpm validate:content && pnpm lint && pnpm typecheck`
Expected: 11 tests pass; CLI prints `Content OK`. If ESLint flags `new Function` (`no-new-func` or `@typescript-eslint/no-implied-eval`), add `// eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func` above that line: the input is repository content, not user input.

```bash
git add scripts
git commit -m "feat(content): add lesson validator script and tests"
```

---

### Task 22: Hidden demo lesson exercising every component

**Files:**
- Create: `content/00-aprender-a-programar/99-demo-componentes.mdx`
- Test: `src/ui/pages/DemoLesson.test.tsx`

**Interfaces:**
- Consumes: `loadCourse` (Task 9), `MdxProvider`, `LessonProvider` (Tasks 10, 14), `renderWithRepositories` (Task 7).

- [ ] **Step 1: Write failing test `src/ui/pages/DemoLesson.test.tsx`**

```tsx
import { screen } from '@testing-library/react';
import { renderWithRepositories } from '@/application/testing/renderWithRepositories';
import { loadCourse } from '@/infrastructure/content/loadCourse';
import { LessonProvider } from '@/ui/organisms/interactive/LessonContext';
import { MdxProvider } from '@/ui/organisms/interactive/MdxProvider';

vi.mock('@codesandbox/sandpack-react', () => ({
  Sandpack: (props: { files: Record<string, string> }) => <div data-testid="sandpack">{Object.keys(props.files).join(',')}</div>,
}));

const DEMO_ID = '00-aprender-a-programar/99-demo-componentes';

describe('demo lesson', () => {
  it('is hidden from the sidebar but still loadable', () => {
    const course = loadCourse();
    expect(course.byId[DEMO_ID]?.hidden).toBe(true);
    expect(course.stages[0]?.lessons.some((l) => l.id === DEMO_ID)).toBe(false);
  });

  it('renders all nine interactive components', async () => {
    const Body = await loadCourse().byId[DEMO_ID]!.load();
    renderWithRepositories(
      <LessonProvider lessonId={DEMO_ID}>
        <MdxProvider>
          <Body />
        </MdxProvider>
      </LessonProvider>,
    );
    expect(screen.getAllByRole('note')).toHaveLength(3);                                    // Callout
    expect(screen.getAllByRole('button', { name: 'Ejecutar' }).length).toBeGreaterThan(0);  // Playground
    expect(screen.getByTestId('sandpack')).toHaveTextContent('/App.tsx');                  // Sandpack
    expect(screen.getByTitle('Expo Snack')).toBeInTheDocument();                             // Snack
    expect(screen.getByRole('button', { name: 'Siguiente paso' })).toBeInTheDocument();      // Terminal
    expect(screen.getByLabelText('Instalé Node.js')).toBeInTheDocument();                    // Checklist
    expect(screen.getByRole('button', { name: 'Ver solución' })).toBeInTheDocument();        // Challenge
    expect(screen.getByRole('region', { name: 'Tarjetas de repaso' })).toBeInTheDocument();  // Flashcards
    expect(screen.getByRole('region', { name: 'Cuestionario' })).toBeInTheDocument();        // Quiz
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/ui/pages/DemoLesson.test.tsx`
Expected: FAIL, demo lesson id not found.

- [ ] **Step 3: Create `content/00-aprender-a-programar/99-demo-componentes.mdx`**

```mdx
---
id: "00-aprender-a-programar/99-demo-componentes"
title: "Demostración de componentes"
stage: 0
module: "Interno"
order: 99
minutes: 5
prereqs: []
summary: "Lección oculta que muestra cada componente interactivo de la plataforma."
hidden: true
---

## Objetivo

Verificar que cada componente interactivo se renderiza. Esta lección no aparece en el índice.

## Concepto

<Callout kind="tip">Este es un aviso de tipo consejo.</Callout>

<Callout kind="warning">Este es un aviso de advertencia.</Callout>

<Callout kind="danger">Este es un aviso de peligro.</Callout>

## Práctica

<Playground lang="ts" code={`const saludo: string = "Hola";
console.log(saludo);`} expected="Hola" />

<Sandpack files={{ '/App.tsx': `export default function App() {
  return <h1>Hola desde React</h1>;
}` }} />

<Snack platform="ios" code={`import { Text, View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Hola desde React Native</Text>
    </View>
  );
}`} />

<Terminal steps={[
  { cmd: 'node --version', out: 'v22.11.0' },
  { cmd: 'pnpm --version', out: '9.12.0' },
]} />

<Checklist id="setup" items={['Instalé Node.js', 'Instalé pnpm', 'Instalé Git']} />

## Ejercicio

<Challenge title="Reto de prueba" solution={<Playground lang="js" code={`console.log("solución");`} />}>
  Escribe un programa que muestre la palabra solución.

  <Playground lang="js" code={`// tu código`} />
</Challenge>

## Errores comunes

- Olvidar cerrar las comillas. Cómo detectarlo: el error dice "Unterminated string".
- Usar una variable antes de declararla. Cómo detectarlo: el error dice "is not defined".

<Flashcards cards={[
  { front: "¿Qué muestra console.log?", back: "El valor que recibe, en la consola." },
  { front: "¿Qué es Expo Snack?", back: "Un entorno en línea para ejecutar React Native." },
  { front: "¿Para qué sirve una checklist?", back: "Para no olvidar pasos operativos." },
]} />

<Quiz questions={[
  { prompt: "¿Cuál componente ejecuta JavaScript sin conexión?", options: [
    { text: "Playground", correct: true, feedback: "Correcto." },
    { text: "Snack", correct: false, feedback: "Snack necesita conexión." },
  ] },
  { prompt: "¿Cuál componente muestra React Native real?", options: [
    { text: "Snack", correct: true, feedback: "Correcto." },
    { text: "Terminal", correct: false, feedback: "La terminal es simulada." },
  ] },
  { prompt: "¿Qué guarda la Checklist?", options: [
    { text: "Los ítems marcados por lección", correct: true, feedback: "Correcto." },
    { text: "Nada", correct: false, feedback: "Persiste en el navegador." },
  ] },
]} />
```

- [ ] **Step 4: Run the demo test, the validator and the whole suite**

Run: `pnpm format && pnpm vitest run src/ui/pages/DemoLesson.test.tsx && pnpm validate:content && pnpm vitest run && pnpm lint && pnpm typecheck && pnpm build`
Expected: all pass; validator still prints `Content OK` (the hidden lesson skips section checks but its Quiz and Flashcards counts are valid).

- [ ] **Step 5: Commit**

```bash
git add content/00-aprender-a-programar/99-demo-componentes.mdx src/ui/pages/DemoLesson.test.tsx
git commit -m "test(content): add hidden demo lesson covering every interactive component"
```

---

### Task 23: CI, GitHub Pages deploy and README

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `README.md`
- Modify: `package.json` (add `"check": "pnpm lint && pnpm typecheck && pnpm test && pnpm validate:content && pnpm build"`)

**Interfaces:**
- Consumes: every script from Task 1 and `validate:content` (Task 21).

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm validate:content
      - run: pnpm build
```

- [ ] **Step 2: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          VITE_BASE: /${{ github.event.repository.name }}/
      - run: cp dist/index.html dist/404.html
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

The `404.html` copy makes GitHub Pages serve the SPA for deep links such as `/etapa/01-javascript/00-variables`; the router's `basename` comes from `VITE_BASE` through `import.meta.env.BASE_URL` (Task 18).

- [ ] **Step 3: Create `README.md`**

This README is a stub in English (technical artifact); the content plan's final task extends it with the lesson-authoring guide and component reference.

````markdown
# Saber

Self-paced learning platform that takes a learner from zero programming knowledge to publishing a React Native app with Expo and EAS. Static site built with Vite, React and MDX; progress is stored in the browser.

## Requirements

- Node.js 22
- pnpm 9

## Run

```bash
pnpm install
pnpm dev      # development server
pnpm check    # format check, lint, typecheck, tests, content validation, build
```

Every push to `main` deploys `dist/` to GitHub Pages through `.github/workflows/deploy.yml` (enable Pages with the "GitHub Actions" source in the repository settings).
````

- [ ] **Step 4: Add the `check` script and run everything**

In `package.json` scripts add:
```json
"check": "pnpm lint && pnpm typecheck && pnpm test && pnpm validate:content && pnpm build"
```

Run: `pnpm format && pnpm check`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add .github README.md package.json
git commit -m "ci: add CI and GitHub Pages deploy workflows with README"
```

---

## Self-review notes

- Spec coverage: sections 5 (Tasks 9, 21), 6 (Tasks 10 to 14, 22), 7 (Tasks 18 to 20), 8 (Tasks 3 to 8, 15 to 17), 8.1 (Task 4), 8.2 (Task 5), 8.3 (Task 2), 9 (Tasks 21, 23). Section 10 waves 2 to 4 are content work covered by the separate content plan.
- Every `Lesson` carries `load()`; the loader is attached by `loadCourse()` and stubbed in `testCourse`.
- `Challenge` takes `solution` as a prop; there is no `Solution` component.
- `MdxProvider` (Task 14) is the single place where MDX names are bound to components; `LessonPage` and the demo test both use it.
- Review Focus items map to: 1 → Tasks 3 and 21; 2 → Tasks 3 and 21; 3 → Task 8; 4 → Tasks 4, 7 and 20; 5 → Task 13.
