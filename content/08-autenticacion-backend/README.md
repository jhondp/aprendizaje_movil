# Etapa 8 — Autenticación y backend

Aprendes a distinguir autenticación de autorización, a leer los tokens de OAuth2 y OpenID Connect, y a conectar la app de notas con Supabase: usuarios con email y contraseña, base de datos protegida con Row Level Security, fotos en un bucket privado, sesión guardada en SecureStore y bloqueo biométrico al volver a la app.

Requisito previo: haber terminado la etapa 7 (Nativo y UX avanzada), en particular `07-nativo-ux-avanzada/11-proyecto-modulo-nativo`.

Componente de práctica principal: `Snack` con `sdkVersion="55.0.0"`. `Playground` se usa para lógica pura (decodificar un JWT, trocear valores para SecureStore, calcular el bloqueo por inactividad).

Postura de seguridad de toda la etapa: las lecciones solo usan marcadores como `YOUR_SUPABASE_ANON_KEY`; la anon key es pública por diseño y lo que protege los datos es RLS; la service role key nunca entra en la app; los tokens nunca se guardan en AsyncStorage.

## Módulo 1 — Conceptos

| Archivo | Título | Minutos | Práctica |
| --- | --- | --- | --- |
| `00-auth-vs-authz.mdx` | Autenticación vs autorización | 10 | `Snack` con una puerta de login simulada y permisos por rol; `Quiz` sobre identidad vs permiso |
| `01-oauth2-oidc-y-jwt.mdx` | OAuth2, OIDC y JWT | 15 | `Playground lang="ts"` que decodifica el payload de un JWT con `atob` (y explica que no es verificar); `Checklist` de higiene de tokens |

## Módulo 2 — Supabase

| Archivo | Título | Minutos | Práctica |
| --- | --- | --- | --- |
| `02-supabase-setup-y-auth.mdx` | Supabase: proyecto y autenticación | 15 | `Terminal` con `npx expo install @supabase/supabase-js`; `Snack` de inicio de sesión con email y contraseña contra una URL y anon key de marcador |
| `03-base-de-datos-y-rls.mdx` | Base de datos y Row Level Security | 15 | Políticas SQL en bloques de código; `Snack` que lee `notes` filtradas por `auth.uid()`; `Checklist` de RLS activo en cada tabla |
| `04-storage.mdx` | Storage de archivos | 12 | `Snack` que sube una foto a un bucket; política de Storage en bloque de código |

## Módulo 3 — Login seguro

| Archivo | Título | Minutos | Práctica |
| --- | --- | --- | --- |
| `05-securestore-y-refresh-tokens.mdx` | SecureStore y refresh tokens | 15 | `Snack` con un adaptador de `SecureStore` pasado a `createClient` en `auth.storage`; `Callout kind="danger"` sobre AsyncStorage |
| `06-biometria.mdx` | Biometría | 12 | `Snack` con `expo-local-authentication` que bloquea la app al volver del segundo plano |
| `07-proyecto-app-con-usuarios.mdx` | Proyecto: app con usuarios | 35 | `Checklist`: registro, inicio y cierre de sesión, notas por usuario con RLS, fotos en Storage, bloqueo biométrico |

## Proyecto de cierre

La app de notas de las etapas anteriores gana usuarios reales con Supabase Auth (email y contraseña, más Google OAuth con PKCE en código de referencia), notas guardadas por usuario con políticas RLS, fotos en un bucket privado, la sesión en SecureStore y un bloqueo biométrico al volver a la app.
