# Saber — React Native learning platform

Self-paced learning platform that takes a learner from zero programming knowledge to publishing a React Native app with Expo and EAS. Twelve stages, approximately 120 lessons, all in Spanish. Static site built with Vite, React, and MDX; progress is stored in the browser with no backend.

## Requirements

- Node.js 22
- pnpm 12 (install with `npm i -g pnpm`)

## Run

```bash
pnpm install
pnpm dev        # development server; Vite prints the local URL
pnpm build      # production build
pnpm preview    # preview production build locally
```

## Quality assurance

```bash
pnpm lint              # ESLint and Prettier checks
pnpm typecheck         # TypeScript type checking
pnpm test              # Vitest unit tests
pnpm validate:content  # Lesson structure and correctness
pnpm check             # run all above plus build
```

## Scripts reference

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Start development server on `http://localhost:5173` |
| `pnpm build` | Compile TypeScript and bundle for production to `dist/` |
| `pnpm preview` | Serve the production build locally for testing |
| `pnpm lint` | Check code style with ESLint and Prettier |
| `pnpm typecheck` | Run TypeScript type checker |
| `pnpm test` | Run unit tests with Vitest |
| `pnpm validate:content` | Validate lesson files: frontmatter, sections, components, links |
| `pnpm check` | Run lint, typecheck, test, validate:content, and build |

## Curriculum

| Stage | Title | Closing Project | Hours |
| --- | --- | --- | --- |
| 0 | Cómo aprender a programar | Repositorio propio con README | 8 |
| 1 | JavaScript desde cero | App de tareas en consola | 25 |
| 2 | TypeScript | Migrar la app de tareas a TypeScript | 10 |
| 3 | React | Tablero de tareas web | 18 |
| 4 | React Native + Expo | App de notas local | 18 |
| 5 | Estado, datos y arquitectura | App conectada a una API pública | 18 |
| 6 | Calidad y CI | Pipeline de CI en verde | 12 |
| 7 | Nativo y UX avanzada | Módulo nativo en la app | 16 |
| 8 | Autenticación y backend | App con usuarios | 14 |
| 9 | Seguridad móvil (OWASP MASVS) | Auditoría de la propia app | 14 |
| 10 | Build, release y operaciones | App publicada en ambas tiendas | 14 |
| 11 | Capstone | App propia publicada | 20 |

## Architecture

The codebase follows a layered architecture:

- **`src/domain/`** — Core business logic and types. Models and interfaces defining what the app does.
- **`src/application/`** — Use cases and orchestration. Coordinates domain logic and state management with Zustand.
- **`src/infrastructure/`** — External integrations: file loaders, API clients, browser storage.
- **`src/ui/`** — React components organized by atomic design (atoms → molecules → organisms → templates → pages).
- **`content/`** — Lesson files in MDX format, grouped by stage directory.

### Lesson pipeline

Lessons are authored as `.mdx` files in `content/<stage-slug>/`. The build process:

1. Each lesson file is loaded via a Vite virtual module (`virtual:lesson-index`).
2. The MDX compiler extracts frontmatter (id, title, stage, order, etc.) and renders lesson content.
3. An in-browser component tree loads lessons on demand via `Course.loadLesson()`.
4. Progress (completed sections, quiz scores) is stored in `localStorage` under the `saber:` key prefix.

### Interactive components

Nine reusable components for lesson content:

| Component | Purpose | Where |
| --- | --- | --- |
| **Playground** | Run JavaScript or TypeScript code in a sandboxed environment; shows console output. | Stages 0–11 (preferred 0–2) |
| **Sandpack** | Live React preview with hot reload. Needs network. | Stages 0–11 (preferred stage 3) |
| **Snack** | Real React Native preview via Expo. Needs network and mobile device. | Stages 4–11 |
| **Quiz** | Multiple-choice assessment; exactly 3 questions per lesson. | All stages |
| **Challenge** | Exercise with a hidden solution snippet. | All stages |
| **Flashcards** | Review cards (3–5) stored in a global review deck. | All stages |
| **Terminal** | Simulated terminal walkthrough; learner clicks to reveal steps. | All stages (operational topics) |
| **Checklist** | Persistent checklist; state stored per lesson. | All stages (security/operations) |
| **Callout** | Highlighted note box (tip, warning, danger). | All stages |

## Progress storage

Learner progress is stored entirely in the browser:

- Quiz and flashcard scores in `localStorage`.
- Completed sections tracked by lesson and user interaction.
- No backend, no accounts, no data collection.
- Progress persists across browser sessions but is local to each device.

## Deployment

Every push to the `main` branch triggers `.github/workflows/deploy.yml`, which:

1. Installs dependencies and runs quality checks (`lint`, `typecheck`, `test`, `validate:content`).
2. Builds the app with `pnpm build` and sets the `VITE_BASE` environment variable to the repository name (e.g., `/aprendizaje_movil/`).
3. Uploads the `dist/` directory to GitHub Pages.

Enable Pages in repository settings (Settings → Pages → Source: "GitHub Actions").

## License

MIT

---

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidance on adding or editing lessons.
