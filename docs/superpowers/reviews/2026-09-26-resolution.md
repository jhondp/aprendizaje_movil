# Wave-3 review resolution (2026-09-26)

Findings from `2026-09-26-technical.json` (47), `-security.json` (12), `-pedagogy.json` (4) and `-style.json` (20), merged and sorted by severity then file. Controller rulings for Task 17 override individual fixes where noted.

- blocker: applied 5, skipped 1
- major: applied 26, skipped 0
- minor: applied 51, skipped 0

| # | Severity | File | Line | Lens | Category | Action |
|---|---|---|---|---|---|---|
| 1 | blocker | `00-aprender-a-programar/03-vs-code-y-node.mdx` | 90 | technical | node-cli-resolution | applied: common mistake replaced with wrong-folder case; quiz distractor `node app` replaced by `open app.js` |
| 2 | blocker | `00-aprender-a-programar/04-git-y-github.mdx` | 26 | technical | git-default-branch | applied: git init -b main, init.defaultBranch and git branch -M main in 00-04 and 00-07 (concept, Terminal, Checklist, flashcard, new common mistake) |
| 3 | blocker | `00-aprender-a-programar/99-demo-componentes.mdx` | 27 | style | component_restricted | skipped: false positive per controller ruling; 99-demo is hidden and exercises every component by design |
| 4 | blocker | `02-typescript/06-utility-types.mdx` | 36 | pedagogy | forward-reference | applied: sentence explaining `{ ...task, ...changes }` pointing back to 01-07, where spread is now taught |
| 5 | blocker | `04-react-native-expo/00-como-funciona-react-native.mdx` | 88 | technical | snack-typescript-in-app-js | applied via platform change: Snack now sends code as App.tsx through files=; the 20 listed Snacks keep their TypeScript |
| 6 | blocker | `10-build-release-operaciones/07-eas-update-y-rollback.mdx` | 72 | technical | eas-update-environment | applied: --environment on every eas update in 10-07, 10-11, 11-03; flag explained once in 10-07; outputs updated |
| 7 | major | `01-javascript/06-bucles.mdx` | 59 | pedagogy | forward-reference | applied per controller ruling: template literal subsection with analogy, MDN link, Playground and flashcard in 01-06 |
| 8 | major | `01-javascript/07-metodos-de-array.mdx` | 138 | pedagogy | forward-reference | applied per controller ruling (teach, not remove): spread subsection with analogy, MDN link and Playground in 01-07; solution kept; no flashcard (lesson already has 5) |
| 9 | major | `01-javascript/10-modulos.mdx` | 64 | technical | node-esm-detection | applied: Node 22 LTS detection warning vs older SyntaxError; quiz now asks for the recommended fix |
| 10 | major | `01-javascript/10-modulos.mdx` | 155 | technical | esm-default-import | applied: real SyntaxError about missing default export (verified on Node 22.22) |
| 11 | major | `01-javascript/11-callbacks-y-promesas.mdx` | 73 | technical | promise-executor | applied: executor runs synchronously |
| 12 | major | `01-javascript/13-proyecto-app-de-tareas.mdx` | 62 | technical | closure-encapsulation | applied: store functions return copies in all three listings; privacy sentence explains why |
| 13 | major | `02-typescript/05-narrowing.mdx` | 167 | technical | ts-exhaustiveness | applied: TS2366 with explicit return type; never pattern for void functions and naming the missing member |
| 14 | major | `02-typescript/07-strict-mode-y-tsconfig.mdx` | 20 | technical | typescript-defaults | applied: strict on by default since TS 6.0, `tsc --init` output from TypeScript 7.0.2, sample tsconfig aligned; also fixed the noEmitOnError default |
| 15 | major | `04-react-native-expo/07-dimensiones-y-safearea.mdx` | 225 | technical | safe-area-hook | applied |
| 16 | major | `04-react-native-expo/08-imagenes-fuentes-iconos.mdx` | 87 | technical | vector-icons-sdk56 | applied: install explicitly on SDK 56+, callout moved next to it, @react-native-vector-icons/* and expo-symbols mentioned |
| 17 | major | `05-estado-datos-arquitectura/02-tanstack-query.mdx` | 66 | technical | router-layout-path | applied in 05-02, 06-00, 06-01, 09-08, 10-07, 10-09, 11-01; 04-09 got one sentence on the src/app choice |
| 18 | major | `05-estado-datos-arquitectura/README.md` | 23 | style | english_prose | applied: 'Proyecto de cierre' (section body translated too) |
| 19 | major | `05-estado-datos-arquitectura/README.md` | 29 | style | english_prose | applied: 'Notas para mantenedores' (body updated for the files=/App.tsx change) |
| 20 | major | `06-calidad-ci/06-github-actions.mdx` | 62 | technical | package-manager-switch | applied: explicit npm to pnpm migration (`pnpm import`) in 06-06 with an `npm ci` alternative; 06-07 points to it |
| 21 | major | `08-autenticacion-backend/07-proyecto-app-con-usuarios.mdx` | 306 | security | oauth-pkce | applied: flowType pkce in lesson 05 client and Snack, project client item, checklist item, comment |
| 22 | major | `09-seguridad-movil/04-https-y-certificate-pinning.mdx` | 186 | security | pinning-rotation | applied: ACME key rotation, reuse-key vs CA/intermediate pin, common mistakes, quiz precondition, checklist item |
| 23 | major | `09-seguridad-movil/05-validacion-de-entrada.mdx` | 112 | technical | zod-version-mismatch | applied: zod ^4.0.0 and z.email(); schema verified with zod 4.6.5 |
| 24 | major | `09-seguridad-movil/08-crash-reporting-sin-fugas.mdx` | 84 | security | pii-scrubbing | applied: exception values, frame vars, tags, contexts, request, breadcrumbs and crumb.message; Snack and checklist updated |
| 25 | major | `10-build-release-operaciones/01-secrets-en-eas.mdx` | 48 | security | config-extra-leak | applied: danger callout, checklist item, `extra` is public note in 10-00 |
| 26 | major | `10-build-release-operaciones/07-eas-update-y-rollback.mdx` | 75 | security | ota-security | applied: new 'Seguridad de las OTA' subsection (2FA, roles, robot tokens, CI origin, code signing) and checklist items |
| 27 | major | `10-build-release-operaciones/09-monitoreo-sentry.mdx` | 56 | security | pii-scrubbing | applied: scrubEvent/dropSensitiveBreadcrumb/enabled reused in 10-09, sentence and checklist item |
| 28 | major | `10-build-release-operaciones/09-monitoreo-sentry.mdx` | 81 | technical | sentry-ota-sourcemaps | applied: `npx @sentry/expo-upload-sourcemaps dist` after eas update in 10-09 and the 10-11 runbook |
| 29 | major | `10-build-release-operaciones/11-proyecto-publicar.mdx` | 100 | technical | runtime-version-bump | applied: app.config.ts reads `version` from package.json (10-00); 10-11 shows the resolved version |
| 30 | major | `11-capstone/01-arquitectura-y-plan.mdx` | 30 | technical | architecture-inconsistency | applied: ports live in application (as 05-06/05-07/05-10); 06-04 split into domain/Note.ts + application/NotesRepository.ts; 11-01 table, tree, checklist, code comment and quiz feedback aligned |
| 31 | major | `11-capstone/01-arquitectura-y-plan.mdx` | 42 | technical | router-layout-path | applied: routes under src/app in tree, prose, checklist and quiz |
| 32 | major | `11-capstone/02-rubrica-y-checklist-final.mdx` | 58 | technical | secret-scan-false-assurance | applied: `sb_secret_`/private-key grep plus JWT role decode (pipeline tested locally) |
| 33 | minor | `00-aprender-a-programar/07-proyecto-tu-primer-repo.mdx` | 50 | technical | terminal-output | applied |
| 34 | minor | `00-aprender-a-programar/07-proyecto-tu-primer-repo.mdx` | 117 | technical | git-status-semantics | applied (also fixed the matching common mistake) |
| 35 | minor | `01-javascript/12-async-await-y-fetch.mdx` | 95 | technical | playground-network | applied: offline wording |
| 36 | minor | `02-typescript/00-por-que-tipos.mdx` | 49 | technical | doc-link-label | applied: link to typescript-from-scratch |
| 37 | minor | `02-typescript/01-tipos-basicos.mdx` | 79 | technical | ts-error-text | applied: TS18046 in both places |
| 38 | minor | `02-typescript/02-interfaces-y-types.mdx` | 145 | technical | ts-strict-null | applied: TS18048 |
| 39 | minor | `02-typescript/05-narrowing.mdx` | 163 | technical | ts-error-text | applied: TS2367 |
| 40 | minor | `02-typescript/08-proyecto-migrar-a-ts.mdx` | 114 | technical | consistency | applied |
| 41 | minor | `03-react/01-jsx.mdx` | 176 | technical | react-dom-class | applied |
| 42 | minor | `03-react/04-useeffect.mdx` | 74 | technical | react-version | applied |
| 43 | minor | `03-react/07-custom-hooks.mdx` | 27 | pedagogy | forward-reference | applied: one sentence on default parameters |
| 44 | minor | `03-react/08-composicion-y-container-presentational.mdx` | 9 | style | summary_length | applied: summary shortened to <=160 chars |
| 45 | minor | `03-react/10-formularios.mdx` | 9 | style | summary_length | applied: summary shortened to <=160 chars |
| 46 | minor | `03-react/11-proyecto-tablero-de-tareas.mdx` | 9 | style | summary_length | applied: summary shortened to <=160 chars |
| 47 | minor | `05-estado-datos-arquitectura/04-persistencia-asyncstorage-mmkv.mdx` | 26 | technical | broken-link | applied: dead link removed |
| 48 | minor | `05-estado-datos-arquitectura/09-react-hook-form-y-zod.mdx` | 270 | technical | rn-warning | applied |
| 49 | minor | `06-calidad-ci/00-eslint-prettier-y-ts-strict.mdx` | 133 | technical | router-layout-path | applied (same normalization as the src/app major) |
| 50 | minor | `06-calidad-ci/03-jest-y-rntl.mdx` | 28 | technical | rntl-peer | applied: test-renderer installed explicitly with React-minor note |
| 51 | minor | `06-calidad-ci/06-github-actions.mdx` | 59 | technical | outdated-actions | applied: checkout@v7, setup-node@v7, pnpm/action-setup@v6, setup-java@v6 (verified via GitHub releases API) |
| 52 | minor | `07-nativo-ux-avanzada/06-accesibilidad.mdx` | 9 | style | summary_length | applied: summary shortened to <=160 chars |
| 53 | minor | `07-nativo-ux-avanzada/06-accesibilidad.mdx` | 24 | technical | broken-link | applied: Expo link dropped |
| 54 | minor | `07-nativo-ux-avanzada/09-offline-first.mdx` | 9 | style | summary_length | applied: summary shortened to <=160 chars |
| 55 | minor | `07-nativo-ux-avanzada/10-performance.mdx` | 57 | technical | prereq-claim | applied: memo introduced in one sentence |
| 56 | minor | `07-nativo-ux-avanzada/11-proyecto-modulo-nativo.mdx` | 9 | style | summary_length | applied: summary shortened to <=160 chars |
| 57 | minor | `08-autenticacion-backend/06-biometria.mdx` | 32 | security | masvs-auth-2 | applied: paragraph on bypass and requireAuthentication trade-off, plus flashcard |
| 58 | minor | `08-autenticacion-backend/07-proyecto-app-con-usuarios.mdx` | 9 | style | summary_length | applied: summary shortened to <=160 chars |
| 59 | minor | `09-seguridad-movil/02-secretos-fuera-del-bundle.mdx` | 71 | technical | consistency | applied |
| 60 | minor | `09-seguridad-movil/03-almacenamiento-seguro.mdx` | 54 | security | keychain-accessibility | applied: WHEN_UNLOCKED_THIS_DEVICE_ONLY in both snippets, bullet and quiz |
| 61 | minor | `09-seguridad-movil/03-almacenamiento-seguro.mdx` | 78 | technical | expo-config | applied |
| 62 | minor | `09-seguridad-movil/03-almacenamiento-seguro.mdx` | 78 | security | android-backup | applied (same change as the technical allowBackup minor) |
| 63 | minor | `09-seguridad-movil/04-https-y-certificate-pinning.mdx` | 9 | style | summary_length | applied: summary shortened to <=160 chars |
| 64 | minor | `09-seguridad-movil/05-validacion-de-entrada.mdx` | 9 | style | summary_length | applied: summary shortened to <=160 chars |
| 65 | minor | `09-seguridad-movil/06-supply-chain.mdx` | 9 | style | summary_length | applied: summary shortened to <=160 chars |
| 66 | minor | `09-seguridad-movil/06-supply-chain.mdx` | 20 | security | masvs-mapping | applied: CODE-3 only in 09-06 (with Top 10 M2); 09-09 RESILIENCE-2 reworded, lockfile/EAS evidence moved to CODE-3 |
| 67 | minor | `09-seguridad-movil/06-supply-chain.mdx` | 33 | technical | pnpm-lifecycle-scripts | applied |
| 68 | minor | `09-seguridad-movil/06-supply-chain.mdx` | 94 | technical | stale-version-output | applied: expo-secure-store 57.0.2 -> ~57.0.4 (expo@57.0.25 bundledNativeModules) |
| 69 | minor | `09-seguridad-movil/07-privacidad-y-permisos-minimos.mdx` | 9 | style | summary_length | applied: summary shortened to <=160 chars |
| 70 | minor | `09-seguridad-movil/08-crash-reporting-sin-fugas.mdx` | 41 | technical | router-layout-path | applied |
| 71 | minor | `09-seguridad-movil/09-proyecto-auditoria.mdx` | 60 | security | masvs-auth-2 | applied: AUTH-2 applies because of the stage 8 biometric lock; checklist item updated |
| 72 | minor | `10-build-release-operaciones/00-app-config-y-entornos.mdx` | 123 | technical | stale-version-output | applied: expo-dev-client ~57.0.19, expo-constants ~57.0.19, expo-updates ~57.0.23 (expo@57.0.25 bundledNativeModules) |
| 73 | minor | `10-build-release-operaciones/06-store-listing-y-revision.mdx` | 32 | technical | store-requirements | applied: 6.9" (6.5" fallback) and support URL |
| 74 | minor | `10-build-release-operaciones/07-eas-update-y-rollback.mdx` | 162 | technical | router-layout-path | applied |
| 75 | minor | `10-build-release-operaciones/09-monitoreo-sentry.mdx` | 9 | style | summary_length | applied: summary shortened to <=160 chars |
| 76 | minor | `10-build-release-operaciones/09-monitoreo-sentry.mdx` | 57 | security | config-consistency | applied: EXPO_PUBLIC_SENTRY_DSN and EXPO_PUBLIC_ENVIRONMENT |
| 77 | minor | `10-build-release-operaciones/09-monitoreo-sentry.mdx` | 126 | technical | stale-version-output | applied: ~7.11.0 and src/app/_layout.tsx |
| 78 | minor | `10-build-release-operaciones/10-salir-de-managed.mdx` | 9 | style | summary_length | applied: summary shortened to <=160 chars |
| 79 | minor | `10-build-release-operaciones/11-proyecto-publicar.mdx` | 9 | style | summary_length | applied: summary shortened to <=160 chars |
| 80 | minor | `11-capstone/01-arquitectura-y-plan.mdx` | 9 | style | summary_length | applied: summary shortened to <=160 chars |
| 81 | minor | `11-capstone/02-rubrica-y-checklist-final.mdx` | 9 | style | summary_length | applied: summary shortened to <=160 chars |
| 82 | minor | `11-capstone/03-publicar-y-presentar.mdx` | 9 | style | summary_length | applied: summary shortened to <=160 chars |
| 83 | minor | `11-capstone/03-publicar-y-presentar.mdx` | 39 | technical | eas-update-flag-consistency | applied |
