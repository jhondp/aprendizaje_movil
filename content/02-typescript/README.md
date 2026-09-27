# Etapa 2 — TypeScript

Aprende a agregar un sistema de tipos estático sobre el JavaScript de la etapa anterior: qué problema resuelve, cómo anotar variables, funciones y objetos, y cómo migrar un proyecto real a TypeScript con `strict` activado.

## Módulos

### Por qué tipos

| Archivo | Título | Minutos | Práctica |
| --- | --- | --- | --- |
| `00-por-que-tipos.mdx` | Por qué tipos | 10 | `Playground lang="js"` con un bug en tiempo de ejecución vs `Playground lang="ts"` con anotación de tipo, y `Terminal` con el error real de `tsc` |
| `01-tipos-basicos.mdx` | Tipos básicos | 12 | `Playground lang="ts"`: `string`, `number`, `boolean`, arrays, tuplas, `any` vs `unknown` |
| `02-interfaces-y-types.mdx` | Interfaces y types | 12 | `Playground lang="ts"`: `interface Task`, campos opcionales, alias `type` |

### Tipos avanzados

| Archivo | Título | Minutos | Práctica |
| --- | --- | --- | --- |
| `03-unions-y-literales.mdx` | Unions y literales | 12 | `Playground lang="ts"`: `type Status = "todo" \| "done"`, union discriminada |
| `04-genericos.mdx` | Genéricos | 15 | `Playground lang="ts"`: `function first<T>(items: T[]): T \| undefined` |
| `05-narrowing.mdx` | Narrowing | 12 | `Playground lang="ts"`: `typeof`, `in`, `switch` exhaustivo sobre el discriminante |
| `06-utility-types.mdx` | Utility types | 12 | `Playground lang="ts"`: `Partial`, `Pick`, `Omit`, `Record`, `ReturnType` |

### Proyecto

| Archivo | Título | Minutos | Práctica |
| --- | --- | --- | --- |
| `07-strict-mode-y-tsconfig.mdx` | strict mode y tsconfig | 10 | `Terminal`: `npm init -y`, `npm i -D typescript`, `npx tsc --init`, `npx tsc`; `Checklist` de flags de `strict` |
| `08-proyecto-migrar-a-ts.mdx` | Proyecto: migrar la app de tareas a TS | 25 | `Playground lang="ts"` con la app de tareas tipada; `Checklist` de pasos de migración |

**Proyecto de cierre:** migrar la app de tareas en consola de la etapa 1 a `todo.ts`, con `interface Task`, `type Filter = "all" | "pending" | "done"` y compilación con `tsc` bajo `strict: true` sin errores.

**Duración total estimada:** 120 minutos.
