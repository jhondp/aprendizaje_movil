# Etapa 5 — Estado, datos y arquitectura

Slug: `05-estado-datos-arquitectura` · `stage: 5` · Snack pinned to `sdkVersion="56.0.0"` (the newest SDK Expo Snack supports on 2026-09-26).

Builds on `04-react-native-expo/11-proyecto-app-de-notas`.

| Module                 | File                                    | Title                                            | Min | Practice                                                                                             |
| ---------------------- | --------------------------------------- | ------------------------------------------------ | --- | ---------------------------------------------------------------------------------------------------- |
| Estado                 | `00-estado-global.mdx`                  | Estado global: Context vs Zustand vs Redux       | 12  | `Snack`: same counter with Context and with Zustand; `Quiz` on when each fits                        |
| Estado                 | `01-zustand.mdx`                        | Zustand                                          | 15  | `Snack` with `create` store, selectors, actions                                                      |
| Datos                  | `02-tanstack-query.mdx`                 | TanStack Query                                   | 15  | `Snack`: `useQuery` against jsonplaceholder posts with `QueryClientProvider`                         |
| Datos                  | `03-errores-loading-y-reintentos.mdx`   | Errores, loading y reintentos                    | 12  | `Snack`: `isPending`, `isError`, `refetch`, retry config                                             |
| Datos                  | `04-persistencia-asyncstorage-mmkv.mdx` | Persistencia: AsyncStorage y MMKV                | 12  | `Snack` with AsyncStorage; MMKV in fenced code (needs a development build)                           |
| Datos                  | `05-sqlite-y-securestore.mdx`           | SQLite y SecureStore                             | 15  | `Snack` with `expo-sqlite` notes table and `expo-secure-store` token; `Callout` warning and danger   |
| Arquitectura           | `06-arquitectura-hexagonal.mdx`         | Arquitectura hexagonal                           | 15  | `Snack`: `NotesRepository` port, in-memory adapter, use case, screen; `Checklist` dependency rules   |
| Arquitectura           | `07-screaming-architecture.mdx`         | Screaming architecture y carpetas por feature    | 10  | `Terminal` with `tree` of `src/features/notes`; `Checklist`                                          |
| Arquitectura           | `08-atomic-design.mdx`                  | Atomic design en React Native                    | 12  | `Snack`: `Button` atom, `NoteRow` molecule, `NoteList` organism                                      |
| Formularios y proyecto | `09-react-hook-form-y-zod.mdx`          | react-hook-form y zod                            | 15  | `Snack` with `react-hook-form`, `zod`, `@hookform/resolvers`; validated note form                    |
| Formularios y proyecto | `10-proyecto-app-con-api.mdx`           | Proyecto: app conectada a una API pública        | 35  | `Snack` skeleton; `Checklist` of layers, persistence, forms                                          |

Total: 168 minutes.

## Closing project

The stage 4 notes app refactored into `src/features/notes/{domain,application,infrastructure,ui}`, notes persisted in `expo-sqlite`, a `quotes` feature fetching a random quote with TanStack Query and cached with `PersistQueryClientProvider` + AsyncStorage, and a note form validated with zod.

Note: the brief named `https://api.quotable.io/random`, but its TLS certificate is expired (checked 2026-09-26), so the project uses `https://dummyjson.com/quotes/random` (same shape idea: `quote`, `author`).

## Notes for maintainers

- Snack embeds receive the code through the `code` URL parameter, which Snack treats as a JavaScript `App.js` entry. Snack code in this stage therefore avoids TypeScript-only syntax; typed versions live in the fenced blocks of each `## Concepto`.
