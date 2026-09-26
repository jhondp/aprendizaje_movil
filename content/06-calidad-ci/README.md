# Etapa 6 — Calidad y CI

Slug: `06-calidad-ci` · `stage: 6` · Prerrequisito de entrada: `05-estado-datos-arquitectura/10-proyecto-app-con-api`.

Proyecto de cierre: el repositorio de la app de notas con ESLint y Prettier configurados, `tsc --noEmit` limpio, al menos cinco pruebas unitarias con React Native Testing Library (un hook, un mock de repositorio, una pantalla), un flujo de Maestro y un workflow de GitHub Actions que ejecuta todo en cada pull request.

| Módulo       | Archivo                              | Título                                                 | Min | Práctica                                                    |
| ------------ | ------------------------------------ | ------------------------------------------------------ | --- | ----------------------------------------------------------- |
| Herramientas | `00-eslint-prettier-y-ts-strict.mdx` | ESLint, Prettier y TypeScript strict                   | 12  | Terminal (`expo lint`, `prettier --check`, `tsc`), Snack    |
| Herramientas | `01-git-avanzado.mdx`                | Git avanzado: ramas, rebase y resolución de conflictos | 15  | Terminal (`switch -c`, `rebase`, conflicto), Checklist      |
| Herramientas | `02-conventional-commits-y-prs.mdx`  | Conventional commits y pull requests                   | 10  | Terminal (`git commit`, `gh pr create`), Checklist, Playground |
| Testing      | `03-jest-y-rntl.mdx`                 | Jest y React Native Testing Library                    | 15  | Snack (componente bajo prueba), Terminal (`npx jest`)       |
| Testing      | `04-testing-hooks-y-mocks.mdx`       | Testing de hooks y mocks                               | 15  | Snack (pantalla con repositorio), Terminal                  |
| Testing      | `05-e2e-con-maestro.mdx`             | E2E con Maestro                                        | 12  | Terminal (`maestro test`), Checklist                        |
| CI           | `06-github-actions.mdx`              | GitHub Actions                                         | 15  | Terminal (`gh run`), Checklist                              |
| CI           | `07-proyecto-pipeline-verde.mdx`     | Proyecto: pipeline verde                               | 25  | Checklist, Terminal                                         |
