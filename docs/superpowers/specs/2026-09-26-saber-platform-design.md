# Saber — React Native Learning Platform — Design Spec

Date: 2026-09-26
Status: approved in conversation, pending written review

## 1. Intent

Build a self-paced learning platform that takes a person with zero programming
knowledge to shipping a React Native app to the App Store and Google Play with
high security standards.

The platform is a static web app that reproduces the visual design found in
`template/Curso Conocimiento.dc.html` (brand "Saber"). Course content is written
as MDX lessons, each with interactive practice, a quiz and flashcards.

Success criteria:

- A learner can go from stage 0 to stage 11 inside the platform without
  external material, except for the official docs the lessons link to.
- Every lesson follows the fixed lesson template (section 4) and passes the
  automated content validator.
- Progress, notes, streak and spaced-repetition state survive page reloads.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass in CI.

## 2. Decisions already made

| Topic | Decision |
| --- | --- |
| Platform stack | Vite + React 18 + TypeScript (strict), React Router, MDX, Zustand (persist), Vitest + Testing Library, pnpm, ESLint + Prettier |
| Hosting | Static build deployed to GitHub Pages via GitHub Actions. No backend. |
| Content language | Neutral professional Spanish for prose, UI copy, quizzes and flashcards. English for identifiers, code comments, file names and commit messages. |
| Toolchain taught | Expo (Expo Router, Expo Go / dev client) + EAS Build, Submit and Update. Bare React Native CLI is covered only in a "leaving the managed workflow" module. |
| Authoring model | ~20 subagents write content in parallel on disjoint directories; the orchestrator never writes lessons. |

## 3. Curriculum

Philosophy: concepts before code, foundations before frameworks. Nobody touches
React Native before understanding JavaScript; nobody deploys before passing a
security checklist. Each stage ends with a project that accumulates into the
final app.

Roughly 100 lessons, 140 to 180 hours.

| # | Stage (Spanish title) | Topics | Closing project |
| --- | --- | --- | --- |
| 0 | Cómo aprender a programar | What a program is, terminal, VS Code, Node, Git/GitHub, reading docs, using AI with judgment | Own repo with README |
| 1 | JavaScript desde cero | Variables, types, conditionals, functions, arrays/objects, loops, scope and closures, errors, modules, async and fetch | Console todo app |
| 2 | TypeScript | Why types, basics, interfaces/types, unions, generics, narrowing, strict mode | Migrate todo app to TS |
| 3 | React | Declarative UI, JSX, props/state, hooks, lists, composition, container/presentational, custom hooks, Context, forms | Web task board |
| 4 | React Native + Expo | How RN works (JSI, Fabric, Hermes), Expo Go, core components, Flexbox, Expo Router, images/fonts, iOS vs Android | Local notes app |
| 5 | Estado, datos y arquitectura | Zustand, TanStack Query, AsyncStorage/MMKV/SQLite/SecureStore, hexagonal and screaming architecture, atomic design, react-hook-form + zod | App connected to a public API |
| 6 | Calidad y CI | ESLint/Prettier, Jest + RNTL, mocks, E2E with Maestro, advanced Git, conventional commits, GitHub Actions | Green CI pipeline |
| 7 | Nativo y UX avanzada | Permissions, camera, notifications, Reanimated and gestures, FlashList, accessibility, i18n, deep links, offline-first, performance | Native module in the app |
| 8 | Autenticación y backend | Auth vs authz, OAuth2/OIDC, JWT, Supabase (auth, DB, storage, RLS), secure login with SecureStore and biometrics | App with users |
| 9 | Seguridad móvil (OWASP MASVS) | Threat model, Mobile Top 10, secrets out of the bundle, HTTPS and pinning, input validation, supply chain, privacy, crash reporting without leaks | Audit of own app |
| 10 | Build, release y operaciones | app.config and environments, EAS Build/Submit/Update, iOS/Android signing, TestFlight and Play internal testing, store listing, OTA and rollback, Sentry, when to leave managed | App published on both stores |
| 11 | Capstone | Full rubric: architecture, tests, security, release | Own app published |

Each stage is split into 2 to 4 modules; each module has 2 to 5 lessons.
The exact module/lesson breakdown is produced by each stage writer within
these bounds and must respect the topics above.

## 4. Lesson template (fixed)

Every lesson MDX file contains, in this order:

1. Frontmatter (see section 5.2).
2. `## Objetivo` — one sentence plus prerequisites (lesson ids).
3. `## Concepto` — explanation with at least one analogy, 5 to 10 minutes of reading.
4. `## Práctica` — at least one interactive component appropriate to the stage
   (`Playground` for stages 0 to 2, `Sandpack` for stage 3, `Snack` for stages
   4 to 11, plus `Terminal` or `Checklist` where the topic is operational).
5. `## Ejercicio` — a `Challenge` with a hidden solution.
6. `## Errores comunes` — at least two mistakes and how to detect them.
7. `<Flashcards>` — 3 to 5 cards.
8. `<Quiz>` — exactly 3 questions with feedback per option.

Any lesson missing one of these fails the content validator.

## 5. Content model

### 5.1 Layout

```
content/
  stages.json                  # stage metadata, ordered
  00-aprender-a-programar/
    00-que-es-un-programa.mdx
    01-la-terminal.mdx
    ...
  01-javascript/
  ...
  11-capstone/
```

Each stage directory is owned by exactly one writer agent. Lesson order within a
stage is the numeric file prefix.

### 5.2 Frontmatter schema

```yaml
id: "01-javascript/03-funciones"   # stage-dir/file-name without extension
title: "Funciones"
stage: 1
module: "Fundamentos"              # module name shown in the sidebar
order: 3                           # lesson order inside the stage
minutes: 12                        # estimated reading + practice time
prereqs: ["01-javascript/02-condicionales"]
summary: "Una frase que aparece en la tarjeta de la lección."
hidden: false   # optional; hidden lessons are excluded from sidebar, progress and section checks
```

`content/stages.json` entries:

```json
{ "id": 1, "slug": "01-javascript", "title": "JavaScript desde cero",
  "mark": "Js", "bg": "#FF3D00", "fg": "#ff6a3a",
  "project": "App de tareas en consola", "hours": 25 }
```

### 5.3 Loading

`src/infrastructure/content/loadCourse.ts` uses `import.meta.glob` on
`content/**/*.mdx` (eager for frontmatter, lazy for the component) and
`stages.json` to build a typed `Course` value: stages, modules, lessons, with
prev/next links resolved. Frontmatter is extracted at build time with
`remark-frontmatter` + `remark-mdx-frontmatter`.

## 6. Interactive components (MDX scope)

All live in `src/ui/organisms/interactive/` and are injected through
`MDXProvider`.

| Component | Purpose | Notes |
| --- | --- | --- |
| `Playground` | Run JS/TS in the browser, show console output | Transpile with Sucrase, execute inside a sandboxed `iframe` (`sandbox="allow-scripts"`), capture `console.*` via `postMessage`. Works offline. Props: `code`, `lang` (`js` \| `ts`), optional `expected`. |
| `Sandpack` | React examples with live preview | `@codesandbox/sandpack-react`, template `react-ts`. Needs network. Props: `files`. |
| `Snack` | Real React Native code with device preview | `iframe` to `https://snack.expo.dev/embedded` with `platform`, `theme` and code encoded in the URL. Needs network. Props: `code`, `dependencies`, `platform`. |
| `Quiz` | 3 multiple-choice questions | Props: `questions[{ prompt, options[{ text, correct, feedback }] }]`. Records score in progress store. |
| `Flashcards` | Lesson cards fed into the review deck | Props: `cards[{ front, back }]`. Registers cards under the lesson id. |
| `Challenge` | Exercise with hidden solution | Props: `title`, children as statement, `solution` as MDX slot. |
| `Terminal` | Simulated terminal walkthrough | Props: `steps[{ cmd, out }]`. Learner clicks to advance. |
| `Checklist` | Persistent checklist (security, release) | Props: `id`, `items[]`. State stored per lesson. |
| `Callout` | Tip / warning / danger box | Props: `kind`. |

Every interactive component has a unit test and a Storybook-free demo lesson in
`content/00-aprender-a-programar/99-demo-componentes.mdx` (`hidden: true` in frontmatter, so it is
excluded from the sidebar, progress and the section-order check) used to
smoke-test rendering.

## 7. Screens

Mirrors the three template screens plus Notes.

1. **Biblioteca** (`/`): greeting, "Continuar aprendiendo" card (last open
   lesson with progress), "Repaso de hoy" card (cards due), streak bars for the
   last 7 days, filter chips (Todos / En curso / Terminados), one card per stage
   with mark, meta and progress bar.
2. **Etapa / Lección** (`/etapa/:stageSlug/:lessonSlug`): left sidebar with
   stage title, progress, modules and lessons (done / active / pending dots);
   main article rendering the MDX; top bar with "Añadir nota"; footer with
   Anterior / Completar y seguir.
3. **Repaso** (`/repaso`): flashcard session over cards due today, flip on
   click, grades Otra vez / Bien / Fácil, progress bar and position.
4. **Notas** (`/notas`): all notes grouped by stage with a link back to the
   lesson.

Layout is responsive: sidebar collapses into a drawer under 900px.

## 8. Application architecture

Hexagonal-lite with atomic design in the UI layer.

```
src/
  domain/
    progress/        # Lesson completion, quiz scores, streak rules (pure)
    srs/             # SM-2 lite scheduler (pure)
    notes/
    course/          # Course, Stage, Module, Lesson types and navigation rules
  application/
    ports/           # ProgressRepository, NotesRepository, Clock
    useCases/        # completeLesson, gradeCard, dueCards, streak, ...
    hooks/           # React hooks binding use cases to stores
  infrastructure/
    storage/         # Zustand persist stores implementing the ports (localStorage)
    content/         # loadCourse, MDX glob, frontmatter types
  ui/
    tokens.css       # Design tokens from the template
    atoms/           # Button, Chip, ProgressBar, Dot, Mark, ...
    molecules/       # LessonRow, StageCard, StreakBars, NoteBox, ...
    organisms/       # Sidebar, LessonArticle, ReviewCard, interactive/*
    templates/       # LibraryLayout, LessonLayout, ReviewLayout
    pages/           # Library, Lesson, Review, Notes
  main.tsx, router.tsx
```

Rules:

- `domain` imports nothing from React or the browser.
- `application` depends on `domain` and its own ports only.
- `infrastructure` implements ports; `ui` consumes hooks from `application`.
- Components are presentational; containers live in `pages` and `hooks`.

### 8.1 SRS (SM-2 lite)

Card state: `{ interval: days, ease: number, due: ISO date, reps }`.
Grades: `again` → interval 0 (due today), ease −0.2 (min 1.3), reps 0;
`good` → interval = reps === 0 ? 1 : round(interval × ease), reps + 1;
`easy` → interval = reps === 0 ? 3 : round(interval × ease × 1.3), ease + 0.15.
Due cards = cards with `due <= today`, plus new cards from completed lessons.

### 8.2 Streak

A day counts when at least one lesson is completed or one review session with
at least 5 grades happens. Streak breaks after a missed calendar day.

### 8.3 Design tokens

```
--color-ink: #022A2A;  --color-teal: #10484A;  --color-accent: #FF3D00;
--color-lime: #9BC62B; --color-sand: #EFE6DA;  --color-paper: #F6F1EA;
--color-canvas: #e4ddd2; font-family: Poppins; radii 10/14/22/28px.
```

Light theme only for now; tokens make a dark theme a later addition.

## 9. Quality gates

- **Content validator** (`scripts/validate-content.ts`, also run as a Vitest
  test): every MDX file has valid frontmatter, unique `id`, existing `prereqs`,
  the eight sections in order, at least one interactive component, exactly one
  `Quiz` with 3 questions, one `Flashcards` with 3 to 5 cards, and all internal
  links resolve. Writers must pass it before handing off.
- **Unit tests**: domain (SRS, streak, progress), content loader, each
  interactive component, page smoke tests.
- **CI** (`.github/workflows/ci.yml`): pnpm install, lint, typecheck, test,
  build on every push and PR. `deploy.yml` publishes `dist/` to GitHub Pages on
  `main`.
- **Formal review**: the repository's bounded review lifecycle runs once after
  implementation, before the first commit of the platform.

## 10. Orchestration plan (20 subagents)

Every agent receives: this spec, the lesson template, the list of available
components with prop signatures, the language contract, and the exact
directories it may write to.

| Wave | Agents | Model | Scope |
| --- | --- | --- | --- |
| 1 | 1 scaffolder | Opus | Vite project, tokens, screens, interactive components, domain + tests, loader, validator, demo lesson, sample lesson. Must build and pass tests before wave 2. |
| 2 | 12 stage writers (one per stage) | Sonnet: stages 0-3. Opus: 4, 5, 6, 7, 8, 11. Fable: 9, 10. | Only `content/<stage>/`. Run the validator before finishing. |
| 3 | 4 reviewers (read-only) | Pedagogy: Sonnet. Technical accuracy: Opus. Security (stages 8-10): Fable. Style/consistency: Haiku. | Return findings as a structured list; never edit. |
| 4 | 3 closers | Fix pass: Opus. Platform tests + CI: Sonnet. README + contributing guide: Haiku. | Fix pass touches only files named in findings. |

Waves are sequential; agents inside a wave run in parallel. Wave 2 agents share
the working tree safely because their write scopes are disjoint directories.

## 11. Out of scope (YAGNI)

- Accounts, backend, multi-user sync.
- Authoring UI for lessons.
- Dark theme (tokens ready, not implemented).
- Certificates, gamification beyond streak.
- Bilingual content.

## 12. Open risks

- `Snack` and `Sandpack` require network; offline learners still get
  `Playground`, quizzes and flashcards. Lessons must not put the only
  explanation inside an embed.
- Expo/EAS APIs move fast; the technical reviewer must check against current
  official docs and lessons must link to them.
- Content volume (~100 lessons) may exceed one agent's output in a single run;
  writers may be re-invoked with the same scope until the validator passes.
