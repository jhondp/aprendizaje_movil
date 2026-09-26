# Etapa 3 — React

Aprendes a construir interfaces con React: componentes, JSX, props, estado, los hooks principales y cómo componerlos en una aplicación real. El proyecto de cierre es un tablero de tareas web que reutiliza la lógica de la app de consola migrada a TypeScript en la etapa anterior.

Requisito previo: haber terminado la etapa 2 (TypeScript), en particular `02-typescript/08-proyecto-migrar-a-ts`.

Componente de práctica principal: `Sandpack` (plantilla `react-ts`, con vista previa en vivo). Esta etapa no usa `Snack`: React Native llega en la etapa 4.

## Módulo 1 — Pensar en componentes

| Archivo | Título | Minutos | Práctica |
| --- | --- | --- | --- |
| `00-ui-declarativa.mdx` | UI declarativa | 10 | `Sandpack`: mismo contador imperativo (DOM) vs. declarativo (React) lado a lado |
| `01-jsx.mdx` | JSX | 10 | `Sandpack`: expresiones, condicionales, atributos, fragments |
| `02-props.mdx` | Props | 12 | `Sandpack`: `TaskCard` con props tipadas y children |
| `03-state-y-eventos.mdx` | State y eventos | 15 | `Sandpack`: `useState` en un toggle y un input; se explica el re-render |

## Módulo 2 — Hooks

| Archivo | Título | Minutos | Práctica |
| --- | --- | --- | --- |
| `04-useeffect.mdx` | useEffect | 15 | `Sandpack`: sincronizar el título del documento, cleanup con un intervalo |
| `05-useref-usememo-usecallback.mdx` | useRef, useMemo y useCallback | 15 | `Sandpack`: foco de un input con ref, filtro costoso memoizado |
| `06-listas-y-keys.mdx` | Listas y keys | 12 | `Sandpack`: lista de tareas con keys estables; se demuestra el bug de usar el índice |
| `07-custom-hooks.mdx` | Custom hooks | 12 | `Sandpack`: `useToggle`, `useLocalStorage` |

## Módulo 3 — Composición

| Archivo | Título | Minutos | Práctica |
| --- | --- | --- | --- |
| `08-composicion-y-container-presentational.mdx` | Composición y container/presentational | 15 | `Sandpack`: `TaskListContainer` (estado) + `TaskList` (solo props) |
| `09-context.mdx` | Context | 12 | `Sandpack`: `ThemeContext` con provider y hook consumidor |
| `10-formularios.mdx` | Formularios | 12 | `Sandpack`: formulario controlado con mensaje de validación |
| `11-proyecto-tablero-de-tareas.mdx` | Proyecto: tablero de tareas web | 30 | `Sandpack` con el tablero completo (columnas todo/doing/done, agregar, mover, filtrar); `Checklist` de requisitos |

## Proyecto de cierre

Un tablero de tareas web en React + TypeScript con tres columnas (todo, doing, done), formulario para agregar tareas, botones para mover una tarea entre columnas, un filtro por texto, el estado elevado a un componente contenedor y al menos un custom hook.
