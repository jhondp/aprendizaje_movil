# Etapa 5 — Estado, datos y arquitectura

Slug: `05-estado-datos-arquitectura` · `stage: 5` · Snack fijado en `sdkVersion="55.0.0"` (el SDK más reciente que Expo Snack sirve el 2026-09-26).

Parte de `04-react-native-expo/11-proyecto-app-de-notas`.

| Módulo                 | Archivo                                 | Título                                           | Min | Práctica                                                                                             |
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

Total: 168 minutos.

## Proyecto de cierre

La app de notas de la etapa 4 refactorizada en `src/features/notes/{domain,application,infrastructure,ui}`, con las notas persistidas en `expo-sqlite`, una feature `quotes` que obtiene una cita aleatoria con TanStack Query y la guarda en caché con `PersistQueryClientProvider` + AsyncStorage, y un formulario de nota validado con zod.

Nota: el brief nombraba `https://api.quotable.io/random`, pero su certificado TLS está vencido (comprobado el 2026-09-26), así que el proyecto usa `https://dummyjson.com/quotes/random` (misma idea de forma: `quote`, `author`).

## Notas para mantenedores

- Los embeds de Snack reciben el código como archivo `App.tsx` a través del parámetro `files` de la URL, así que la sintaxis de TypeScript funciona dentro de los Snacks. Los bloques de código de cada `## Concepto` siguen mostrando las versiones tipadas completas.
