# Saber Content Authoring and Review Implementation Plan (Plan B)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author the ~120 MDX lessons of the 12-stage React Native curriculum, review them with four independent lenses, apply the findings, and harden tests, CI and docs so the platform ships with complete content.

**Architecture:** Content is data: one MDX file per lesson under `content/<stage-slug>/`, validated by `scripts/validate-content.ts`. Twelve writer agents work in parallel on disjoint stage directories (wave 2), four read-only reviewers emit JSON findings (wave 3), and three closers apply fixes, harden tests/CI and write docs (wave 4). This plan assumes Plan A (platform scaffold, `docs/superpowers/plans/2026-09-26-saber-platform.md`) is merged.

**Tech Stack:** MDX 3 (`@mdx-js/rollup`, `remark-frontmatter`, `remark-mdx-frontmatter`), Vite + React 18 + TypeScript strict, Vitest + Testing Library, pnpm, GitHub Actions. Interactive components: `Playground`, `Sandpack`, `Snack`, `Quiz`, `Flashcards`, `Challenge`, `Terminal`, `Checklist`, `Callout`.

**Spec:** `docs/superpowers/specs/2026-09-26-saber-platform-design.md` (sections 3, 4, 5, 6, 9, 10).

## Global Constraints

- Prose, UI copy, quiz and flashcard text: neutral professional Spanish. No regional slang, no voseo.
- Identifiers, code comments, file names, commit messages: English.
- Lesson file name: `NN-slug.mdx` where `NN` is two digits starting at `00` and equals the `order` frontmatter field. Slug is lowercase ASCII with hyphens.
- Frontmatter fields, all required unless noted: `id` (`<stage-slug>/<NN-slug>`), `title`, `stage` (number), `module`, `order` (number), `minutes` (number), `prereqs` (array of existing ids), `summary` (one sentence), `hidden` (optional boolean, default false).
- Section order inside every lesson: `## Objetivo`, `## Concepto`, `## Práctica`, `## Ejercicio`, `## Errores comunes`, `<Flashcards>`, `<Quiz>`.
- `## Práctica` must contain at least one of `Playground`, `Sandpack`, `Snack`, `Terminal`, `Checklist`. Preferred by stage: `Playground` for stages 0-2, `Sandpack` for stage 3, `Snack` for stages 4-11. `Terminal` or `Checklist` alone is fine for operational topics (installing tools, release steps); `Playground` is valid in any stage for pure logic. Hard limits enforced by the validator: no `Sandpack` or `Snack` in stages 0-2, no `Snack` in stage 3.
- `<Quiz>` has exactly 3 questions, each with 2-4 options, exactly one `correct: true`, and a non-empty `feedback` on every option.
- `<Flashcards>` has 3 to 5 cards.
- Every stage writer writes only inside `content/<its-stage-slug>/`. Nothing else.
- Every stage directory gets a `README.md` outline (modules, lessons, minutes) written before the lessons.
- Handoff rule for every writer: `pnpm format && pnpm lint && pnpm validate:content && pnpm test` passes. A writer does not finish before that.
- `pnpm format` (Prettier) runs before every commit in every task. Never hand-edit formatting Prettier produced.
- Conventional commits, no `Co-Authored-By` trailer.
- Course toolchain taught: Expo SDK with Expo Router, EAS Build/Submit/Update. Bare React Native CLI appears only in stage 10 lesson "Salir del workflow managed".

## Review Focus

Failure modes the spec implies but no writer's validator run exercises. Each line is pinned to the task whose checklist or test owns it.

1. A lesson references a `prereqs` id from a stage that is ordered later, so the sidebar shows a locked lesson before its prerequisite. Pinned to Task 18 (test `prereqs point backwards only`) and Task 14 (technical reviewer checklist item 5).
2. A `Snack` code prop is a fragment instead of a complete `App.tsx` with a default export, so the embed renders a red screen. Pinned to Task 18 (test `snack code has default export`) and Task 14 (technical reviewer checklist item 2).
3. A `Quiz` option marked `correct: true` twice, or none, so the score is undefined. Pinned to Task 18 (test `quiz has exactly one correct option`).
4. A lesson explains a concept only inside a `Snack` or `Sandpack` embed, so an offline learner has no explanation. Pinned to Task 13 (pedagogy reviewer checklist item 3).
5. Stage 8-10 code stores a token in `AsyncStorage` or hardcodes an API key in `app.json`, contradicting stage 9. Pinned to Task 15 (security reviewer checklist items 1 and 2) and Task 18 (test `no hardcoded secrets in content`).

---

## PART 1 — Shared writer brief

Every wave-2 task (Tasks 1-12) includes this brief verbatim in its executor prompt. Executors see only their own task, so copy the whole section.

### 1.1 Lesson template

Every lesson file has, in this exact order:

1. YAML frontmatter.
2. `## Objetivo` — one sentence stating what the learner can do after the lesson, then one line `**Prerrequisitos:** ` followed by the prerequisite lesson ids in backticks separated by commas, or the word `ninguno`. The ids are the same strings as the frontmatter `prereqs`.
3. `## Concepto` — the explanation. At least one analogy from daily life. 5 to 10 minutes of reading (600 to 1200 words). Code samples are fenced blocks with a language tag. No forward references to concepts taught in later lessons.
4. `## Práctica` — at least one interactive component the learner runs or manipulates. Preferred by stage: `Playground` (stages 0-2), `Sandpack` (stage 3), `Snack` (stages 4-11). `Terminal` for shell walkthroughs and `Checklist` for operational or security topics may be the only component when the lesson is operational. `Playground` is allowed in any stage for pure JS/TS logic. Hard limits: no `Sandpack` or `Snack` in stages 0-2, no `Snack` in stage 3.
5. `## Ejercicio` — one `Challenge` with a statement as children and a runnable solution in the `solution` prop.
6. `## Errores comunes` — at least two mistakes. Each has: what it looks like, why it happens, how to detect it.
7. `<Flashcards cards={[...]} />` — 3 to 5 cards. Front is a question, back is a short answer.
8. `<Quiz questions={[...]} />` — exactly 3 questions.

Nothing after the quiz.

### 1.2 Complete example lesson

File: `content/01-javascript/03-funciones.mdx`

````mdx
---
id: "01-javascript/03-funciones"
title: "Funciones"
stage: 1
module: "Fundamentos"
order: 3
minutes: 14
prereqs: ["01-javascript/02-condicionales"]
summary: "Aprende a encapsular pasos en funciones reutilizables con parámetros y valores de retorno."
---

## Objetivo

Al terminar esta lección podrás escribir funciones con parámetros y valor de retorno, y explicar por qué evitan repetir código.

**Prerrequisitos:** `01-javascript/02-condicionales`

## Concepto

Una función es una receta con nombre. Cuando cocinas, no describes cada paso cada vez que quieres preparar un café: dices "preparar café" y todos entienden la secuencia. En programación, una función agrupa una secuencia de pasos bajo un nombre para ejecutarla cuantas veces quieras.

### Declarar y llamar

```js
function greet(name) {
  return "Hola, " + name;
}

const message = greet("Ana");
console.log(message); // Hola, Ana
```

Tres partes importan:

- `function greet(name)` declara la función. `name` es un **parámetro**: una variable que recibe un valor cuando la función se ejecuta.
- `return` entrega un valor a quien llamó a la función. Después de `return` no se ejecuta nada más dentro de la función.
- `greet("Ana")` es la **llamada**. `"Ana"` es el **argumento**, el valor concreto que viaja al parámetro `name`.

### Funciones sin retorno

Si una función no tiene `return`, devuelve `undefined`. Es útil cuando la función solo produce un efecto, como imprimir en consola.

```js
function logTwice(text) {
  console.log(text);
  console.log(text);
}

const result = logTwice("hola");
console.log(result); // undefined
```

### Funciones flecha

JavaScript ofrece una sintaxis más corta llamada función flecha. Hace lo mismo con menos texto y es la forma más común en código moderno.

```js
const double = (n) => n * 2;
console.log(double(4)); // 8
```

Cuando el cuerpo tiene una sola expresión, esa expresión se devuelve automáticamente. Si necesitas varias líneas, usa llaves y `return` explícito.

### Por qué importan

Sin funciones, cada vez que quisieras saludar a alguien copiarías la misma línea. Si mañana cambias el saludo, tendrías que corregir todas las copias. Con una función, cambias un solo lugar. Este principio se llama "no te repitas" (DRY, por sus siglas en inglés) y lo vas a ver en todo el curso.

## Práctica

Ejecuta el código y observa la consola. Luego cambia el argumento de `area` y vuelve a ejecutar.

<Playground
  lang="js"
  code={`function area(width, height) {
  return width * height;
}

console.log(area(3, 4));
console.log(area(10, 2));`}
  expected={`12
20`}
/>

## Ejercicio

<Challenge
  title="Convertir temperaturas"
  solution={
    <Playground
      lang="js"
      code={`function toFahrenheit(celsius) {
  return celsius * 9 / 5 + 32;
}

console.log(toFahrenheit(0));   // 32
console.log(toFahrenheit(100)); // 212`}
    />
  }
>
  Escribe una función `toFahrenheit` que reciba grados Celsius y devuelva grados Fahrenheit. La fórmula es `celsius * 9 / 5 + 32`. Comprueba que `toFahrenheit(0)` devuelve `32` y `toFahrenheit(100)` devuelve `212`.
</Challenge>

## Errores comunes

**Olvidar `return`.** La función calcula el valor pero nadie lo recibe: `console.log(area(3, 4))` imprime `undefined`. Se detecta porque el resultado es `undefined` aunque el cálculo parece correcto. Solución: agregar `return` delante del valor.

**Confundir parámetro con argumento.** El parámetro es el nombre en la declaración (`width`); el argumento es el valor en la llamada (`3`). Si intentas usar `3` dentro de la función en lugar de `width`, la función deja de ser reutilizable. Se detecta porque cambiar el argumento no cambia el resultado.

**Llamar sin paréntesis.** `greet` sin `()` no ejecuta la función, solo la nombra. `console.log(greet)` imprime el código de la función en lugar de su resultado.

<Flashcards
  cards={[
    { front: "¿Qué palabra clave devuelve un valor desde una función?", back: "return" },
    { front: "¿Qué devuelve una función sin return?", back: "undefined" },
    { front: "Diferencia entre parámetro y argumento", back: "El parámetro es el nombre en la declaración; el argumento es el valor en la llamada." },
    { front: "¿Qué significa DRY?", back: "Don't Repeat Yourself: no repetir código, encapsularlo en funciones." }
  ]}
/>

<Quiz
  questions={[
    {
      prompt: "¿Qué imprime console.log(double(5)) si const double = (n) => n * 2?",
      options: [
        { text: "10", correct: true, feedback: "Correcto: la función flecha devuelve n * 2." },
        { text: "undefined", correct: false, feedback: "La función flecha de una sola expresión devuelve esa expresión automáticamente." },
        { text: "n * 2", correct: false, feedback: "La expresión se evalúa con n = 5, no se imprime como texto." }
      ]
    },
    {
      prompt: "¿Qué ocurre con el código escrito después de un return dentro de la misma función?",
      options: [
        { text: "Se ejecuta normalmente", correct: false, feedback: "return termina la ejecución de la función." },
        { text: "No se ejecuta", correct: true, feedback: "Correcto: return sale de la función de inmediato." },
        { text: "Produce un error", correct: false, feedback: "No es un error, simplemente nunca se alcanza." }
      ]
    },
    {
      prompt: "¿Cuál es el argumento en la llamada greet(\"Ana\")?",
      options: [
        { text: "greet", correct: false, feedback: "greet es el nombre de la función." },
        { text: "name", correct: false, feedback: "name es el parámetro, definido en la declaración." },
        { text: "\"Ana\"", correct: true, feedback: "Correcto: el argumento es el valor concreto que se pasa." }
      ]
    }
  ]}
/>
````

### 1.3 Component reference (MDX syntax)

Multi-line code always goes in a JS template literal inside braces: `code={`...`}`. Never put a fenced code block inside a JSX prop.

**Playground** — runs JS or TS in a sandboxed iframe and shows console output. Works offline.

```mdx
<Playground
  lang="ts"
  code={`const total: number = [1, 2, 3].reduce((a, b) => a + b, 0);
console.log(total);`}
  expected={`6`}
/>
```

Props: `lang` (`"js"` | `"ts"`), `code` (string), `expected` (optional string; shown as the expected console output).

**Sandpack** — React with live preview (template `react-ts`). Needs network.

```mdx
<Sandpack
  files={{
    "/App.tsx": `import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Clicks: {count}</button>;
}`
  }}
/>
```

Props: `files` (object mapping absolute file paths to file contents; `/App.tsx` is required).

**Snack** — real React Native code with device preview. Needs network. `code` must be a complete `App.tsx` with a default export.

```mdx
<Snack
  platform="ios"
  dependencies={{ 'expo-image': '*' }}
  code={`import { View, Text, StyleSheet } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hola, React Native</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "600" }
});`}
/>
```

Props: `code` (string, complete `App.tsx`), `dependencies` (optional object mapping package name to version, for example `{ 'expo-image': '*' }`; the component serializes it as `name@version` joined by commas), `platform` (optional `'ios'` | `'android'` | `'web'`, default `'ios'`).

**Quiz** — exactly 3 multiple-choice questions. Records score.

```mdx
<Quiz
  questions={[
    {
      prompt: "¿Qué componente reemplaza a div en React Native?",
      options: [
        { text: "View", correct: true, feedback: "Correcto." },
        { text: "Div", correct: false, feedback: "No existe Div en React Native." }
      ]
    }
  ]}
/>
```

Props: `questions` (array of `{ prompt, options: [{ text, correct, feedback }] }`).

**Flashcards** — 3 to 5 cards fed into the review deck.

```mdx
<Flashcards
  cards={[
    { front: "¿Qué hace StyleSheet.create?", back: "Valida y agrupa estilos para un componente." }
  ]}
/>
```

Props: `cards` (array of `{ front, back }`).

**Challenge** — exercise with a hidden solution. Children are the statement (markdown allowed). `solution` receives JSX, usually a `Playground` or `Snack` with the working code.

```mdx
<Challenge
  title="Contador con límite"
  solution={<Playground lang="js" code={`let n = 0;
while (n < 3) { n++; }
console.log(n);`} />}
>
  Escribe un bucle que incremente `n` hasta 3 e imprima el resultado.
</Challenge>
```

Props: `title` (string), `solution` (JSX), children (statement).

**Terminal** — simulated terminal walkthrough; the learner clicks to reveal each step.

```mdx
<Terminal
  steps={[
    { cmd: "npx create-expo-app@latest my-app", out: "✔ Downloaded and extracted project files.\n✔ Installed JavaScript dependencies." },
    { cmd: "cd my-app && npx expo start", out: "› Metro waiting on exp://192.168.1.10:8081" }
  ]}
/>
```

Props: `steps` (array of `{ cmd, out }`).

**Checklist** — persistent checklist; state stored per `id`.

```mdx
<Checklist
  id="09-seguridad-movil/02-secretos"
  items={[
    "No hay claves privadas en app.json ni en el código",
    "Los tokens viven en SecureStore",
    "El archivo .env está en .gitignore"
  ]}
/>
```

Props: `id` (string, unique; use the lesson id plus a suffix), `items` (array of strings).

**Callout** — highlighted box.

```mdx
<Callout kind="warning">
  Nunca guardes un token de sesión en AsyncStorage: no está cifrado.
</Callout>
```

Props: `kind` (`"tip"` | `"warning"` | `"danger"`), children.

### 1.4 Language contract

- Prose, headings, quiz, flashcards, checklist items, callouts: neutral professional Spanish. Use "tú" as the address form. No regional slang, no voseo, no exclamation-heavy tone.
- Code, identifiers, comments inside code, file and directory names: English.
- Technical terms keep their English name when the industry does (hook, state, props, bundle, build, commit). Write them in plain text, not in quotes.
- Titles use sentence case: "Funciones flecha", not "Funciones Flecha".

### 1.5 Pedagogical rules

- One analogy per new concept, drawn from daily life, before the code.
- No forward references: do not use a concept the curriculum teaches later. If unavoidable, name it in one sentence and say which stage covers it.
- Every code sample runs as written. Test it mentally line by line; for `Playground`, `expected` must match the real console output.
- `Snack` code is always a complete `App.tsx` with `export default function App()`. Import only from `react`, `react-native`, or a package declared in `dependencies`.
- Link to official documentation with full URLs in the `## Concepto` section, at least one per lesson.
- The `## Concepto` section explains the concept fully in prose and fenced code; embeds are practice, never the only explanation.
- Each lesson has one purpose. If you need two, split into two lessons and renumber.
- The closing project lesson of each stage tells the learner exactly what to build, what "done" looks like, and links to the previous project the app builds on.

### 1.6 Handoff checklist

A writer finishes only when all are true:

1. `content/<slug>/README.md` exists with the module and lesson table.
2. Every planned lesson file exists with the eight sections in order.
3. `pnpm format && pnpm lint && pnpm validate:content && pnpm test` passes (`pnpm validate:content` prints `OK` with zero errors).
4. No file outside `content/<slug>/` was modified (`git status --short` shows only that directory).
5. Changes are committed with `content: add stage N lessons` (N is the stage number).

---

## PART 2 — Wave 2: stage writers (Tasks 1-12)

All twelve tasks run in parallel. Each executor prompt = Part 1 (verbatim) + its task below. Executors write only in their stage directory.

Common steps for every stage task (repeated in each task so executors can read them standalone).

### Task 1: Stage 0 — Cómo aprender a programar

**Model:** Sonnet
**Write scope:** `content/00-aprender-a-programar/` only.

**Files:**
- Create: `content/00-aprender-a-programar/README.md`
- Create: the 7 lesson files `01` to `07` listed below.
- Do not touch: `content/00-aprender-a-programar/00-que-es-un-programa.mdx` (module "Antes de escribir código", created by Plan A Task 9) and `content/00-aprender-a-programar/99-demo-componentes.mdx` (hidden demo lesson, Plan A Task 22).

**Interfaces:**
- Consumes: components from Part 1.3; stage slug `00-aprender-a-programar`, `stage: 0` in frontmatter.
- Consumes: existing lesson id `00-aprender-a-programar/00-que-es-un-programa` as the prereq of lesson 01.
- Produces: lesson ids `00-aprender-a-programar/01-como-piensa-una-computadora` … `00-aprender-a-programar/07-proyecto-tu-primer-repo`, used as `prereqs` by stage 1.

**Outline (module / file / title / minutes / practice):**

| Module | File | Title | Min | Practice |
| --- | --- | --- | --- | --- |
| Antes de escribir código | `00-que-es-un-programa.mdx` (exists, do not edit) | Qué es un programa | 10 | already written by Plan A |
| Antes de escribir código | `01-como-piensa-una-computadora.mdx` | Cómo piensa una computadora | 10 | `Playground` with a step-by-step sum; `Quiz` on sequence/decision/repetition |
| Tu entorno | `02-la-terminal.mdx` | La terminal | 15 | `Terminal` walkthrough: `pwd`, `ls`, `cd`, `mkdir`, `touch` |
| Tu entorno | `03-vs-code-y-node.mdx` | VS Code y Node.js | 15 | `Terminal`: install check `node -v`, `npm -v`; `Playground` running first script |
| Tu entorno | `04-git-y-github.mdx` | Git y GitHub | 20 | `Terminal`: `git init`, `add`, `commit`, `remote add`, `push`; `Checklist` "mi primer commit" |
| Aprender a aprender | `05-leer-documentacion.mdx` | Cómo leer documentación | 10 | `Playground` using `Array.prototype.includes` after reading its MDN page; `Checklist` reading strategy |
| Aprender a aprender | `06-ia-con-criterio.mdx` | Usar IA con criterio | 10 | `Playground` with a buggy AI-generated snippet the learner must spot; `Checklist` verification habits |
| Aprender a aprender | `07-proyecto-tu-primer-repo.mdx` | Proyecto: tu primer repositorio | 20 | `Terminal` full flow; `Checklist` "README, .gitignore, primer push" |

**Closing project:** a GitHub repository with a README in Spanish describing what the learner wants to build, a `.gitignore`, and at least two commits.

**Official docs to consult:**
- https://developer.mozilla.org/es/docs/Learn/Getting_started_with_the_web
- https://nodejs.org/en/download
- https://code.visualstudio.com/docs
- https://git-scm.com/book/es/v2
- https://docs.github.com/es/get-started

**Stage pitfalls:**
- Do not assume the learner knows what a file path or an extension is; define them.
- Show macOS, Windows (PowerShell) and Linux commands when they differ.
- Node version: recommend the current LTS and say to check https://nodejs.org for the number; do not hardcode a version.
- Git lesson teaches `main` as default branch and HTTPS remote with a personal access token, not SSH.
- AI lesson: the message is "AI is a tool that can be wrong; verify against docs", never "do not use AI".

- [ ] **Step 1: Write the outline**

Create `content/00-aprender-a-programar/README.md` with the table above (module, file, title, minutes), including the existing lesson 00 row, and one line per lesson describing the closing project link.

- [ ] **Step 2: Write lessons 01 to 07**

Each lesson follows Part 1.1 exactly. `prereqs` chain: lesson `NN` requires `NN-1` within the stage; lesson 01 has `prereqs: ["00-aprender-a-programar/00-que-es-un-programa"]`. Lesson 00 already exists and is not rewritten; if its module name or summary conflicts with the outline, adapt the outline, not the file.

- [ ] **Step 3: Run the validator**

Run: `pnpm validate:content`
Expected: `OK` and zero errors. If errors, fix the named file and rerun.

- [ ] **Step 4: Run format, lint and tests**

Run: `pnpm format && pnpm lint && pnpm test`
Expected: all PASS. Then `git status --short` shows only files under `content/00-aprender-a-programar/`.

- [ ] **Step 5: Commit**

```bash
pnpm format
git add content/00-aprender-a-programar
git commit -m "content: add stage 0 lessons"
```

### Task 2: Stage 1 — JavaScript desde cero

**Model:** Sonnet
**Write scope:** `content/01-javascript/` only.

**Files:**
- Create: `content/01-javascript/README.md`
- Create: the 14 lesson files listed below. Lesson `03-funciones.mdx` is the Part 1.2 example and is written exactly as given there.

**Interfaces:**
- Consumes: Part 1.3 components; stage slug `01-javascript`, `stage: 1`. Lesson 00 `prereqs: ["00-aprender-a-programar/07-proyecto-tu-primer-repo"]`.
- Produces: ids `01-javascript/00-variables-y-tipos` … `01-javascript/13-proyecto-app-de-tareas`.

**Outline:**

| Module | File | Title | Min | Practice |
| --- | --- | --- | --- | --- |
| Fundamentos | `00-variables-y-tipos.mdx` | Variables y tipos | 12 | `Playground`: `let`/`const`, `typeof` on string, number, boolean, undefined, null |
| Fundamentos | `01-operadores.mdx` | Operadores | 10 | `Playground`: arithmetic, comparison `===` vs `==`, logical |
| Fundamentos | `02-condicionales.mdx` | Condicionales | 12 | `Playground`: `if/else if/else`, ternary; grade calculator |
| Fundamentos | `03-funciones.mdx` | Funciones | 14 | Part 1.2 example verbatim |
| Estructuras | `04-arrays.mdx` | Arrays | 12 | `Playground`: index, `push`, `pop`, `length`, `slice` |
| Estructuras | `05-objetos.mdx` | Objetos | 12 | `Playground`: dot/bracket access, nested objects, `Object.keys` |
| Estructuras | `06-bucles.mdx` | Bucles | 12 | `Playground`: `for`, `while`, `for...of`; sum of array |
| Estructuras | `07-metodos-de-array.mdx` | Métodos de array | 15 | `Playground`: `map`, `filter`, `reduce`, `find` on a task list |
| Profundizando | `08-scope-y-closures.mdx` | Scope y closures | 15 | `Playground`: block scope, counter closure |
| Profundizando | `09-errores-y-debugging.mdx` | Errores y debugging | 12 | `Playground`: `try/catch`, `throw new Error`, reading a stack trace |
| Profundizando | `10-modulos.mdx` | Módulos | 10 | `Playground` (single file simulating export/import with comments) + `Terminal` running two files with Node ESM |
| Asincronía | `11-callbacks-y-promesas.mdx` | Callbacks y promesas | 15 | `Playground`: `setTimeout`, `new Promise`, `.then/.catch` |
| Asincronía | `12-async-await-y-fetch.mdx` | async/await y fetch | 15 | `Playground`: `async` function awaiting a resolved promise; fetch shown in fenced code against https://jsonplaceholder.typicode.com/todos/1 |
| Asincronía | `13-proyecto-app-de-tareas.mdx` | Proyecto: app de tareas en consola | 25 | `Playground` with full todo CLI (add, complete, list, filter) using arrays, functions, closures; `Checklist` of features |

**Closing project:** console todo app in a single `todo.js`, run with `node todo.js`, functions `addTask`, `completeTask`, `listTasks`, `pendingTasks`, state in an array of objects `{ id, title, done }`.

**Official docs to consult:**
- https://developer.mozilla.org/es/docs/Web/JavaScript/Guide
- https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Array
- https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Promise
- https://developer.mozilla.org/es/docs/Web/API/Fetch_API/Using_Fetch
- https://nodejs.org/api/esm.html

**Stage pitfalls:**
- Teach `const` by default, `let` when reassigning, never `var`.
- Always `===`; explain `==` only as something to avoid.
- Do not introduce classes, `this`, prototypes or generators; they are out of scope.
- The `Playground` iframe has no network access: fetch examples appear in fenced code and in the `Terminal`, not in `Playground`.
- Arrow functions appear in lesson 03 and are used from lesson 07 on.

- [ ] **Step 1: Write the outline** — `content/01-javascript/README.md` with the table above.
- [ ] **Step 2: Write lessons 00 to 13** following Part 1.1; `prereqs` chain within the stage; lesson 03 verbatim from Part 1.2.
- [ ] **Step 3: Run** `pnpm validate:content` — expected `OK`, zero errors; fix and rerun.
- [ ] **Step 4: Run** `pnpm format && pnpm lint && pnpm test` — expected all PASS. Then `git status --short` shows only files under this stage directory.
- [ ] **Step 5: Commit**

```bash
pnpm format
git add content/01-javascript
git commit -m "content: add stage 1 lessons"
```

### Task 3: Stage 2 — TypeScript

**Model:** Sonnet
**Write scope:** `content/02-typescript/` only.

**Files:**
- Create: `content/02-typescript/README.md`
- Create: the 9 lesson files below.

**Interfaces:**
- Consumes: Part 1.3; slug `02-typescript`, `stage: 2`. Lesson 00 `prereqs: ["01-javascript/13-proyecto-app-de-tareas"]`.
- Produces: ids `02-typescript/00-por-que-tipos` … `02-typescript/08-proyecto-migrar-a-ts`.

**Outline:**

| Module | File | Title | Min | Practice |
| --- | --- | --- | --- | --- |
| Por qué tipos | `00-por-que-tipos.mdx` | Por qué tipos | 10 | `Playground lang="js"` with a runtime bug (`"5" + 3`) vs `Playground lang="ts"` same code with a type annotation |
| Por qué tipos | `01-tipos-basicos.mdx` | Tipos básicos | 12 | `Playground lang="ts"`: `string`, `number`, `boolean`, arrays, tuples, `any` vs `unknown` |
| Por qué tipos | `02-interfaces-y-types.mdx` | Interfaces y types | 12 | `Playground lang="ts"`: `interface Task`, optional fields, `type` alias |
| Tipos avanzados | `03-unions-y-literales.mdx` | Unions y literales | 12 | `Playground lang="ts"`: `type Status = "todo" \| "done"`, discriminated union |
| Tipos avanzados | `04-genericos.mdx` | Genéricos | 15 | `Playground lang="ts"`: `function first<T>(items: T[]): T \| undefined` |
| Tipos avanzados | `05-narrowing.mdx` | Narrowing | 12 | `Playground lang="ts"`: `typeof`, `in`, discriminant switch with exhaustive check |
| Tipos avanzados | `06-utility-types.mdx` | Utility types | 12 | `Playground lang="ts"`: `Partial`, `Pick`, `Omit`, `Record`, `ReturnType` |
| Proyecto | `07-strict-mode-y-tsconfig.mdx` | strict mode y tsconfig | 10 | `Terminal`: `npm init -y`, `npm i -D typescript`, `npx tsc --init`, `npx tsc`; `Checklist` of strict flags |
| Proyecto | `08-proyecto-migrar-a-ts.mdx` | Proyecto: migrar la app de tareas a TS | 25 | `Playground lang="ts"` with the typed todo app; `Checklist` migration steps |

**Closing project:** the stage-1 todo app as `todo.ts` with `interface Task`, `type Filter = "all" | "pending" | "done"`, compiled with `tsc` under `strict: true` and zero errors.

**Official docs to consult:**
- https://www.typescriptlang.org/docs/handbook/2/basic-types.html
- https://www.typescriptlang.org/docs/handbook/2/everyday-types.html
- https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- https://www.typescriptlang.org/docs/handbook/2/generics.html
- https://www.typescriptlang.org/docs/handbook/utility-types.html
- https://www.typescriptlang.org/tsconfig

**Stage pitfalls:**
- The `Playground` strips types with Sucrase and does not type-check. State this in lesson 00 and show the compiler error text in a fenced block instead of pretending the playground reports it.
- No `enum`, no decorators, no namespaces.
- `any` is presented as an escape hatch to avoid; `unknown` as the safe alternative.
- Use `interface` for object shapes and `type` for unions; say that both are fine and the team convention decides.

- [ ] **Step 1: Write the outline** — `content/02-typescript/README.md`.
- [ ] **Step 2: Write lessons 00 to 08** following Part 1.1.
- [ ] **Step 3: Run** `pnpm validate:content` — expected `OK`.
- [ ] **Step 4: Run** `pnpm format && pnpm lint && pnpm test` — expected all PASS. Then `git status --short` shows only files under this stage directory.
- [ ] **Step 5: Commit**

```bash
pnpm format
git add content/02-typescript
git commit -m "content: add stage 2 lessons"
```

### Task 4: Stage 3 — React

**Model:** Sonnet
**Write scope:** `content/03-react/` only.

**Files:**
- Create: `content/03-react/README.md`
- Create: the 12 lesson files below.

**Interfaces:**
- Consumes: Part 1.3; slug `03-react`, `stage: 3`. Lesson 00 `prereqs: ["02-typescript/08-proyecto-migrar-a-ts"]`.
- Produces: ids `03-react/00-ui-declarativa` … `03-react/11-proyecto-tablero-de-tareas`.

**Outline:**

| Module | File | Title | Min | Practice |
| --- | --- | --- | --- | --- |
| Pensar en componentes | `00-ui-declarativa.mdx` | UI declarativa | 10 | `Sandpack`: same counter imperative (DOM) vs declarative (React) side by side |
| Pensar en componentes | `01-jsx.mdx` | JSX | 10 | `Sandpack`: expressions, conditionals, attributes, fragments |
| Pensar en componentes | `02-props.mdx` | Props | 12 | `Sandpack`: `TaskCard` with typed props, children |
| Pensar en componentes | `03-state-y-eventos.mdx` | State y eventos | 15 | `Sandpack`: `useState` toggle and input; re-render explained |
| Hooks | `04-useeffect.mdx` | useEffect | 15 | `Sandpack`: document title sync, cleanup with interval |
| Hooks | `05-useref-usememo-usecallback.mdx` | useRef, useMemo y useCallback | 15 | `Sandpack`: focus input with ref, expensive filter memoized |
| Hooks | `06-listas-y-keys.mdx` | Listas y keys | 12 | `Sandpack`: task list with stable keys; bug with index keys demonstrated |
| Hooks | `07-custom-hooks.mdx` | Custom hooks | 12 | `Sandpack`: `useToggle`, `useLocalStorage` |
| Composición | `08-composicion-y-container-presentational.mdx` | Composición y container/presentational | 15 | `Sandpack`: `TaskListContainer` (state) + `TaskList` (props only) |
| Composición | `09-context.mdx` | Context | 12 | `Sandpack`: `ThemeContext` with provider and consumer hook |
| Composición | `10-formularios.mdx` | Formularios | 12 | `Sandpack`: controlled form with validation message |
| Composición | `11-proyecto-tablero-de-tareas.mdx` | Proyecto: tablero de tareas web | 30 | `Sandpack` with full board (columns todo/doing/done, add, move, filter); `Checklist` of requirements |

**Closing project:** a web task board in React + TS with three columns, add task, move task between columns, filter by text, state lifted to a container component, at least one custom hook.

**Official docs to consult:**
- https://react.dev/learn
- https://react.dev/learn/thinking-in-react
- https://react.dev/reference/react/useState
- https://react.dev/reference/react/useEffect
- https://react.dev/learn/rendering-lists
- https://react.dev/learn/passing-data-deeply-with-context

**Stage pitfalls:**
- React 18 function components only. No class components, no legacy lifecycle methods.
- Follow react.dev guidance: `useEffect` is for synchronizing with external systems, not for deriving state.
- Do not introduce routers, state libraries or CSS frameworks; stage 5 covers state.
- Every `Sandpack` includes `/App.tsx`; extra files use absolute paths like `/TaskCard.tsx`.
- Container/presentational is taught as a separation of concerns, not as a rigid rule; say hooks made it lighter.

- [ ] **Step 1: Write the outline** — `content/03-react/README.md`.
- [ ] **Step 2: Write lessons 00 to 11** following Part 1.1.
- [ ] **Step 3: Run** `pnpm validate:content` — expected `OK`.
- [ ] **Step 4: Run** `pnpm format && pnpm lint && pnpm test` — expected all PASS. Then `git status --short` shows only files under this stage directory.
- [ ] **Step 5: Commit**

```bash
pnpm format
git add content/03-react
git commit -m "content: add stage 3 lessons"
```

### Task 5: Stage 4 — React Native + Expo

**Model:** Opus
**Write scope:** `content/04-react-native-expo/` only.

**Files:**
- Create: `content/04-react-native-expo/README.md`
- Create: the 12 lesson files below.

**Interfaces:**
- Consumes: Part 1.3; slug `04-react-native-expo`, `stage: 4`. Lesson 00 `prereqs: ["03-react/11-proyecto-tablero-de-tareas"]`.
- Produces: ids `04-react-native-expo/00-como-funciona-react-native` … `04-react-native-expo/11-proyecto-app-de-notas`.

**Outline:**

| Module | File | Title | Min | Practice |
| --- | --- | --- | --- | --- |
| Cómo funciona React Native | `00-como-funciona-react-native.mdx` | Cómo funciona React Native | 15 | `Snack`: minimal app; `Quiz` on JSI, Fabric, Hermes, New Architecture |
| Cómo funciona React Native | `01-crear-proyecto-con-expo.mdx` | Crear un proyecto con Expo | 15 | `Terminal`: `npx create-expo-app@latest`, `npx expo start`; `Checklist` Expo Go installed on phone |
| Cómo funciona React Native | `02-expo-go-y-dev-client.mdx` | Expo Go y development builds | 12 | `Terminal`: `npx expo install expo-dev-client`, `npx expo run:ios`; `Checklist` when each is needed |
| Componentes core | `03-view-text-image.mdx` | View, Text e Image | 12 | `Snack`: profile card |
| Componentes core | `04-scrollview-y-flatlist.mdx` | ScrollView y FlatList | 15 | `Snack`: list of 50 notes with `keyExtractor` and `renderItem` |
| Componentes core | `05-pressable-y-textinput.mdx` | Pressable y TextInput | 12 | `Snack`: add-note input with button |
| Estilos | `06-stylesheet-y-flexbox.mdx` | StyleSheet y Flexbox | 15 | `Snack`: flex layout playground with `flexDirection`, `justifyContent`, `alignItems` |
| Estilos | `07-dimensiones-y-safearea.mdx` | Dimensiones y SafeArea | 12 | `Snack`: `useWindowDimensions`, `SafeAreaView` from `react-native-safe-area-context` |
| Estilos | `08-imagenes-fuentes-iconos.mdx` | Imágenes, fuentes e íconos | 12 | `Snack` with `expo-image`, `@expo/vector-icons`, `expo-font` |
| Navegación | `09-expo-router-basico.mdx` | Expo Router: rutas por archivos | 15 | `Terminal` creating `app/index.tsx`, `app/note/[id].tsx`; `Snack` with a two-screen stack |
| Navegación | `10-tabs-stack-y-plataformas.mdx` | Tabs, Stack y diferencias iOS/Android | 15 | `Snack`: tabs layout; `Platform.select` for platform-specific styles |
| Navegación | `11-proyecto-app-de-notas.mdx` | Proyecto: app de notas local | 30 | `Snack` with notes list, detail route, add/edit; `Checklist` requirements |

**Closing project:** notes app with Expo Router: list screen, detail screen with dynamic route, add and edit note, state in a top-level provider, styles with `StyleSheet`, safe areas handled. No persistence yet (stage 5).

**Official docs to consult:**
- https://reactnative.dev/docs/getting-started
- https://reactnative.dev/architecture/overview
- https://reactnative.dev/docs/hermes
- https://docs.expo.dev/get-started/create-a-project/
- https://docs.expo.dev/develop/development-builds/introduction/
- https://docs.expo.dev/router/introduction/
- https://docs.expo.dev/versions/latest/sdk/image/
- https://reactnative.dev/docs/flexbox

**Stage pitfalls:**
- The New Architecture (Fabric + TurboModules + JSI) is the default in current React Native and Expo SDKs; explain it as the present, mention the old bridge only as history.
- Hermes is the default engine; do not present JSC as an option.
- Use `Pressable`, not `TouchableOpacity`, as the primary touchable.
- Use `expo-image`, not React Native `Image`, for remote images; explain why (caching, performance).
- Expo Router `app/` directory conventions: `_layout.tsx`, `[id].tsx`, `(tabs)` groups. Verify against current docs.
- `Snack` code that needs Expo Router cannot run in a single `App.tsx`; for router lessons, show the file tree and code in fenced blocks and use `Snack` for the UI parts that fit in one file.

- [ ] **Step 1: Write the outline** — `content/04-react-native-expo/README.md`.
- [ ] **Step 2: Write lessons 00 to 11** following Part 1.1.
- [ ] **Step 3: Run** `pnpm validate:content` — expected `OK`.
- [ ] **Step 4: Run** `pnpm format && pnpm lint && pnpm test` — expected all PASS. Then `git status --short` shows only files under this stage directory.
- [ ] **Step 5: Commit**

```bash
pnpm format
git add content/04-react-native-expo
git commit -m "content: add stage 4 lessons"
```

### Task 6: Stage 5 — Estado, datos y arquitectura

**Model:** Opus
**Write scope:** `content/05-estado-datos-arquitectura/` only.

**Files:**
- Create: `content/05-estado-datos-arquitectura/README.md`
- Create: the 11 lesson files below.

**Interfaces:**
- Consumes: Part 1.3; slug `05-estado-datos-arquitectura`, `stage: 5`. Lesson 00 `prereqs: ["04-react-native-expo/11-proyecto-app-de-notas"]`.
- Produces: ids `05-estado-datos-arquitectura/00-estado-global` … `05-estado-datos-arquitectura/10-proyecto-app-con-api`.

**Outline:**

| Module | File | Title | Min | Practice |
| --- | --- | --- | --- | --- |
| Estado | `00-estado-global.mdx` | Estado global: Context vs Zustand vs Redux | 12 | `Snack`: same counter with Context and with Zustand; `Quiz` on when each fits |
| Estado | `01-zustand.mdx` | Zustand | 15 | `Snack` with `create` store, selectors, actions; dependency `zustand` |
| Datos | `02-tanstack-query.mdx` | TanStack Query | 15 | `Snack`: `useQuery` against https://jsonplaceholder.typicode.com/posts with `QueryClientProvider` |
| Datos | `03-errores-loading-y-reintentos.mdx` | Errores, loading y reintentos | 12 | `Snack`: `isPending`, `isError`, `refetch`, retry config |
| Datos | `04-persistencia-asyncstorage-mmkv.mdx` | Persistencia: AsyncStorage y MMKV | 12 | `Snack` with `@react-native-async-storage/async-storage`; MMKV shown in fenced code (needs dev build) |
| Datos | `05-sqlite-y-securestore.mdx` | SQLite y SecureStore | 15 | `Snack` with `expo-sqlite` creating a notes table; `expo-secure-store` for a token; `Callout kind="warning"` on what belongs where |
| Arquitectura | `06-arquitectura-hexagonal.mdx` | Arquitectura hexagonal | 15 | `Snack`: `NotesRepository` port, in-memory adapter, use case, screen; `Checklist` dependency rules |
| Arquitectura | `07-screaming-architecture.mdx` | Screaming architecture y carpetas por feature | 10 | `Terminal` showing `tree` of `src/features/notes/{domain,application,infrastructure,ui}`; `Checklist` |
| Arquitectura | `08-atomic-design.mdx` | Atomic design en React Native | 12 | `Snack`: `Button` atom, `NoteRow` molecule, `NoteList` organism |
| Formularios y proyecto | `09-react-hook-form-y-zod.mdx` | react-hook-form y zod | 15 | `Snack` with `react-hook-form`, `zod`, `@hookform/resolvers`; validated note form |
| Formularios y proyecto | `10-proyecto-app-con-api.mdx` | Proyecto: app conectada a una API pública | 35 | `Snack` skeleton; `Checklist` of layers, persistence, forms |

**Closing project:** the notes app refactored into `src/features/notes/{domain,application,infrastructure,ui}`, notes persisted in `expo-sqlite`, a "quotes" feature fetching https://api.quotable.io/random with TanStack Query and cached with `persistQueryClient` to AsyncStorage, validated form with zod.

**Official docs to consult:**
- https://zustand.docs.pmnd.rs/getting-started/introduction
- https://tanstack.com/query/latest/docs/framework/react/overview
- https://react-native-async-storage.github.io/async-storage/docs/install
- https://github.com/mrousavy/react-native-mmkv
- https://docs.expo.dev/versions/latest/sdk/sqlite/
- https://docs.expo.dev/versions/latest/sdk/securestore/
- https://react-hook-form.com/get-started
- https://zod.dev/
- https://alistair.cockburn.us/hexagonal-architecture/

**Stage pitfalls:**
- Tokens and secrets go in `expo-secure-store`, never AsyncStorage or MMKV without encryption. Say it in lesson 05 with a `Callout kind="danger"`.
- Redux Toolkit is mentioned as an industry option in lesson 00 but not taught; Zustand is the course choice. Give the tradeoff in one paragraph.
- Hexagonal architecture is taught with one feature and three files, not with a 20-folder skeleton. Rule of thumb in prose: domain has no imports from React or Expo.
- `expo-sqlite` API changed across SDKs; use the current async API (`openDatabaseAsync`, `runAsync`, `getAllAsync`) and verify against the docs URL.
- TanStack Query v5 names: `isPending`, not `isLoading`, for the initial load.

- [ ] **Step 1: Write the outline** — `content/05-estado-datos-arquitectura/README.md`.
- [ ] **Step 2: Write lessons 00 to 10** following Part 1.1.
- [ ] **Step 3: Run** `pnpm validate:content` — expected `OK`.
- [ ] **Step 4: Run** `pnpm format && pnpm lint && pnpm test` — expected all PASS. Then `git status --short` shows only files under this stage directory.
- [ ] **Step 5: Commit**

```bash
pnpm format
git add content/05-estado-datos-arquitectura
git commit -m "content: add stage 5 lessons"
```

### Task 7: Stage 6 — Calidad y CI

**Model:** Opus
**Write scope:** `content/06-calidad-ci/` only.

**Files:**
- Create: `content/06-calidad-ci/README.md`
- Create: the 8 lesson files below.

**Interfaces:**
- Consumes: Part 1.3; slug `06-calidad-ci`, `stage: 6`. Lesson 00 `prereqs: ["05-estado-datos-arquitectura/10-proyecto-app-con-api"]`.
- Produces: ids `06-calidad-ci/00-eslint-prettier-y-ts-strict` … `06-calidad-ci/07-proyecto-pipeline-verde`.

**Outline:**

| Module | File | Title | Min | Practice |
| --- | --- | --- | --- | --- |
| Herramientas | `00-eslint-prettier-y-ts-strict.mdx` | ESLint, Prettier y TypeScript strict | 12 | `Terminal`: `npx expo lint`, `npx prettier --check .`, `npx tsc --noEmit`; `Snack` with a lint-violating component the learner fixes |
| Herramientas | `01-git-avanzado.mdx` | Git avanzado: ramas, rebase y resolución de conflictos | 15 | `Terminal`: `git switch -c`, `git rebase main`, conflict markers; `Checklist` |
| Herramientas | `02-conventional-commits-y-prs.mdx` | Conventional commits y pull requests | 10 | `Terminal`: `git commit -m "feat(notes): add search"`, `gh pr create`; `Checklist` PR template |
| Testing | `03-jest-y-rntl.mdx` | Jest y React Native Testing Library | 15 | `Snack` with the component under test; test file in fenced code; `Terminal` `npx jest` |
| Testing | `04-testing-hooks-y-mocks.mdx` | Testing de hooks y mocks | 15 | `Snack` component using a repository; test with `jest.mock` in fenced code; `Terminal` |
| Testing | `05-e2e-con-maestro.mdx` | E2E con Maestro | 12 | `Terminal`: `maestro test flows/add-note.yaml`; flow YAML in fenced code; `Checklist` |
| CI | `06-github-actions.mdx` | GitHub Actions | 15 | `Terminal` showing workflow run; full `ci.yml` in fenced code (install pnpm, lint, typecheck, test); `Checklist` |
| CI | `07-proyecto-pipeline-verde.mdx` | Proyecto: pipeline verde | 25 | `Checklist`: lint, typecheck, unit tests > 5, one Maestro flow, CI badge in README |

**Closing project:** the notes app repo with ESLint + Prettier configured, `tsc --noEmit` clean, at least five unit tests with React Native Testing Library (one hook, one repository mock, one screen), one Maestro flow, and a GitHub Actions workflow that runs all of it on every PR.

**Official docs to consult:**
- https://docs.expo.dev/guides/using-eslint/
- https://prettier.io/docs/en/
- https://git-scm.com/book/es/v2/Ramificaciones-en-Git-Procedimientos-B%C3%A1sicos-para-Ramificar-y-Fusionar
- https://www.conventionalcommits.org/es/v1.0.0/
- https://docs.expo.dev/develop/unit-testing/
- https://callstack.github.io/react-native-testing-library/
- https://docs.maestro.dev/
- https://docs.github.com/es/actions

**Stage pitfalls:**
- Use `jest-expo` preset per Expo docs; do not hand-configure Babel.
- Testing philosophy: test behavior through what the user sees (`getByText`, `getByRole`), not implementation details; say why snapshot tests of whole screens are brittle.
- Maestro is the E2E choice; Detox is mentioned in one sentence as an alternative.
- The CI workflow uses `pnpm/action-setup` and caches; show the full file, not a fragment.
- Do not cover EAS in CI here; stage 10 owns it.

- [ ] **Step 1: Write the outline** — `content/06-calidad-ci/README.md`.
- [ ] **Step 2: Write lessons 00 to 07** following Part 1.1.
- [ ] **Step 3: Run** `pnpm validate:content` — expected `OK`.
- [ ] **Step 4: Run** `pnpm format && pnpm lint && pnpm test` — expected all PASS. Then `git status --short` shows only files under this stage directory.
- [ ] **Step 5: Commit**

```bash
pnpm format
git add content/06-calidad-ci
git commit -m "content: add stage 6 lessons"
```

### Task 8: Stage 7 — Nativo y UX avanzada

**Model:** Opus
**Write scope:** `content/07-nativo-ux-avanzada/` only.

**Files:**
- Create: `content/07-nativo-ux-avanzada/README.md`
- Create: the 12 lesson files below.

**Interfaces:**
- Consumes: Part 1.3; slug `07-nativo-ux-avanzada`, `stage: 7`. Lesson 00 `prereqs: ["06-calidad-ci/07-proyecto-pipeline-verde"]`.
- Produces: ids `07-nativo-ux-avanzada/00-permisos` … `07-nativo-ux-avanzada/11-proyecto-modulo-nativo`.

**Outline:**

| Module | File | Title | Min | Practice |
| --- | --- | --- | --- | --- |
| Nativo | `00-permisos.mdx` | Permisos | 12 | `Snack` requesting location with `expo-location`; `Checklist` permission copy in `app.json` |
| Nativo | `01-camara.mdx` | Cámara | 15 | `Snack` with `expo-camera` `CameraView` and `useCameraPermissions` |
| Nativo | `02-notificaciones.mdx` | Notificaciones | 15 | `Snack` scheduling a local notification with `expo-notifications`; push flow in fenced code |
| Movimiento | `03-reanimated.mdx` | Animaciones con Reanimated | 15 | `Snack` with `react-native-reanimated` `useSharedValue`, `withSpring` |
| Movimiento | `04-gestos.mdx` | Gestos | 15 | `Snack` with `react-native-gesture-handler` `Gesture.Pan` dragging a card |
| Movimiento | `05-flashlist.mdx` | Listas de alto rendimiento con FlashList | 12 | `Snack` with `@shopify/flash-list` and `estimatedItemSize` |
| Inclusión | `06-accesibilidad.mdx` | Accesibilidad | 12 | `Snack` with `accessibilityLabel`, `accessibilityRole`, dynamic font sizes; `Checklist` |
| Inclusión | `07-i18n.mdx` | Internacionalización | 12 | `Snack` with `expo-localization` + `i18n-js` switching es/en |
| Robustez | `08-deep-links.mdx` | Deep links y universal links | 12 | `Terminal`: `npx uri-scheme open`; `app.json` scheme in fenced code; `Snack` reading `useLocalSearchParams` |
| Robustez | `09-offline-first.mdx` | Offline-first | 15 | `Snack` with `@react-native-community/netinfo` and a queue of pending mutations |
| Robustez | `10-performance.mdx` | Performance | 15 | `Snack` with a slow list fixed with `memo` and `useCallback`; `Checklist` profiling steps with React DevTools |
| Robustez | `11-proyecto-modulo-nativo.mdx` | Proyecto: módulo nativo en la app | 30 | `Checklist`: camera capture attached to a note, animated list, accessible, es/en |

**Closing project:** the notes app gains photo attachment via camera, a spring animation when a note is added, FlashList for the list, accessibility labels on all interactive elements, and Spanish/English strings.

**Official docs to consult:**
- https://docs.expo.dev/guides/permissions/
- https://docs.expo.dev/versions/latest/sdk/camera/
- https://docs.expo.dev/versions/latest/sdk/notifications/
- https://docs.swmansion.com/react-native-reanimated/
- https://docs.swmansion.com/react-native-gesture-handler/
- https://shopify.github.io/flash-list/
- https://reactnative.dev/docs/accessibility
- https://docs.expo.dev/versions/latest/sdk/localization/
- https://docs.expo.dev/linking/overview/
- https://reactnative.dev/docs/performance

**Stage pitfalls:**
- Permissions: always explain the purpose string shown to the user and where it lives in `app.json` (`ios.infoPlist`, `android.permissions`).
- `expo-camera` current API is `CameraView` + `useCameraPermissions`; the legacy `Camera` component is deprecated. Verify.
- Push notifications require a physical device and EAS project id; show the local notification in `Snack` and the push token flow in fenced code with a `Callout kind="warning"`.
- Reanimated worklets: explain the `"worklet"` directive only if the current version still needs it; check docs.
- Offline-first: the lesson teaches the pattern (optimistic update + queue + reconciliation), not a library.

- [ ] **Step 1: Write the outline** — `content/07-nativo-ux-avanzada/README.md`.
- [ ] **Step 2: Write lessons 00 to 11** following Part 1.1.
- [ ] **Step 3: Run** `pnpm validate:content` — expected `OK`.
- [ ] **Step 4: Run** `pnpm format && pnpm lint && pnpm test` — expected all PASS. Then `git status --short` shows only files under this stage directory.
- [ ] **Step 5: Commit**

```bash
pnpm format
git add content/07-nativo-ux-avanzada
git commit -m "content: add stage 7 lessons"
```

### Task 9: Stage 8 — Autenticación y backend

**Model:** Opus
**Write scope:** `content/08-autenticacion-backend/` only.

**Files:**
- Create: `content/08-autenticacion-backend/README.md`
- Create: the 8 lesson files below.

**Interfaces:**
- Consumes: Part 1.3; slug `08-autenticacion-backend`, `stage: 8`. Lesson 00 `prereqs: ["07-nativo-ux-avanzada/11-proyecto-modulo-nativo"]`.
- Produces: ids `08-autenticacion-backend/00-auth-vs-authz` … `08-autenticacion-backend/07-proyecto-app-con-usuarios`.

**Outline:**

| Module | File | Title | Min | Practice |
| --- | --- | --- | --- | --- |
| Conceptos | `00-auth-vs-authz.mdx` | Autenticación vs autorización | 10 | `Snack` with a fake login gate; `Quiz` on identity vs permission |
| Conceptos | `01-oauth2-oidc-y-jwt.mdx` | OAuth2, OIDC y JWT | 15 | `Playground lang="ts"` decoding a JWT payload with `atob` (and explaining it is not verification); `Checklist` token hygiene |
| Supabase | `02-supabase-setup-y-auth.mdx` | Supabase: proyecto y autenticación | 15 | `Terminal`: `npx expo install @supabase/supabase-js`; `Snack` with email/password sign-in against a placeholder URL and anon key from env |
| Supabase | `03-base-de-datos-y-rls.mdx` | Base de datos y Row Level Security | 15 | SQL policies in fenced code; `Snack` reading `notes` filtered by `auth.uid()`; `Checklist` RLS enabled on every table |
| Supabase | `04-storage.mdx` | Storage de archivos | 12 | `Snack` uploading a photo to a bucket; policy in fenced code |
| Login seguro | `05-securestore-y-refresh-tokens.mdx` | SecureStore y refresh tokens | 15 | `Snack` with a `SecureStore` adapter passed to `createClient` `auth.storage`; `Callout kind="danger"` about AsyncStorage |
| Login seguro | `06-biometria.mdx` | Biometría | 12 | `Snack` with `expo-local-authentication` gating the app on resume |
| Login seguro | `07-proyecto-app-con-usuarios.mdx` | Proyecto: app con usuarios | 35 | `Checklist`: sign-up, sign-in, sign-out, per-user notes with RLS, photo storage, biometric lock |

**Closing project:** the notes app with Supabase auth (email + password, plus Google OAuth in fenced code), notes stored per user with RLS policies, photos in a private bucket, session in SecureStore, biometric lock on resume.

**Official docs to consult:**
- https://supabase.com/docs/guides/auth
- https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/storage
- https://docs.expo.dev/versions/latest/sdk/securestore/
- https://docs.expo.dev/versions/latest/sdk/local-authentication/
- https://oauth.net/2/
- https://openid.net/developers/how-connect-works/
- https://datatracker.ietf.org/doc/html/rfc8725 (JWT best practices)

**Stage pitfalls:**
- The Supabase anon key is public by design; explain that RLS is what protects data, and that the service role key never goes in the app.
- Keys come from `process.env.EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`; explain `EXPO_PUBLIC_` visibility (bundled, readable by anyone).
- Session storage: pass a SecureStore-backed adapter to `createClient`; never leave the default AsyncStorage for tokens. Note SecureStore value size limit (2048 bytes on some platforms) and the documented chunking workaround.
- Decoding a JWT is not verifying it; the app never trusts claims without the server.
- OAuth on mobile uses PKCE with `expo-auth-session` or Supabase's built-in flow; no implicit flow.

- [ ] **Step 1: Write the outline** — `content/08-autenticacion-backend/README.md`.
- [ ] **Step 2: Write lessons 00 to 07** following Part 1.1.
- [ ] **Step 3: Run** `pnpm validate:content` — expected `OK`.
- [ ] **Step 4: Run** `pnpm format && pnpm lint && pnpm test` — expected all PASS. Then `git status --short` shows only files under this stage directory.
- [ ] **Step 5: Commit**

```bash
pnpm format
git add content/08-autenticacion-backend
git commit -m "content: add stage 8 lessons"
```

### Task 10: Stage 9 — Seguridad móvil (OWASP MASVS)

**Model:** Fable
**Write scope:** `content/09-seguridad-movil/` only.

**Files:**
- Create: `content/09-seguridad-movil/README.md`
- Create: the 10 lesson files below.

**Interfaces:**
- Consumes: Part 1.3; slug `09-seguridad-movil`, `stage: 9`. Lesson 00 `prereqs: ["08-autenticacion-backend/07-proyecto-app-con-usuarios"]`.
- Produces: ids `09-seguridad-movil/00-modelo-de-amenazas-movil` … `09-seguridad-movil/09-proyecto-auditoria`.

**Outline (each lesson states its MASVS category in the `## Concepto` intro):**

| Module | File | Title | Min | MASVS | Practice |
| --- | --- | --- | --- | --- | --- |
| Modelo | `00-modelo-de-amenazas-movil.mdx` | Modelo de amenazas móvil | 15 | — | `Checklist` STRIDE-lite over the notes app; `Quiz` |
| Modelo | `01-owasp-mobile-top-10-y-masvs.mdx` | OWASP Mobile Top 10 y MASVS | 15 | all | `Checklist` mapping each Top 10 item to a course lesson; `Snack` showing an insecure logging example |
| Datos y secretos | `02-secretos-fuera-del-bundle.mdx` | Secretos fuera del bundle | 15 | MASVS-STORAGE, MASVS-CODE | `Terminal`: extracting strings from a built bundle; `Checklist`; `Snack` reading `EXPO_PUBLIC_` vs server-side secret |
| Datos y secretos | `03-almacenamiento-seguro.mdx` | Almacenamiento seguro | 15 | MASVS-STORAGE | `Snack` comparing AsyncStorage vs SecureStore; `Checklist` data classification |
| Red y entrada | `04-https-y-certificate-pinning.mdx` | HTTPS y certificate pinning | 15 | MASVS-NETWORK | `Terminal`: `openssl s_client` to read a cert; pinning config in fenced code; `Checklist` |
| Red y entrada | `05-validacion-de-entrada.mdx` | Validación de entrada | 12 | MASVS-CODE | `Snack` with zod schema rejecting malformed input; injection example in fenced SQL |
| Cadena y privacidad | `06-supply-chain.mdx` | Supply chain: dependencias y lockfiles | 12 | MASVS-CODE, MASVS-RESILIENCE | `Terminal`: `pnpm audit`, `npm view <pkg>`, lockfile diff; `Checklist` |
| Cadena y privacidad | `07-privacidad-y-permisos-minimos.mdx` | Privacidad y permisos mínimos | 12 | MASVS-PRIVACY, MASVS-PLATFORM | `Checklist` data inventory, App Privacy labels, Google Data safety |
| Cadena y privacidad | `08-crash-reporting-sin-fugas.mdx` | Crash reporting sin fugas | 12 | MASVS-STORAGE, MASVS-PRIVACY | `Snack` with `sentry-expo`-style `beforeSend` scrubbing; `Checklist` |
| Proyecto | `09-proyecto-auditoria.mdx` | Proyecto: auditoría de tu app | 35 | all | `Checklist` full MASVS-L1 self-audit of the notes app with evidence column |

**Closing project:** a written audit (`SECURITY_AUDIT.md` in the learner's repo) of the notes app against MASVS L1: for each control, status, evidence, and fix applied; secrets moved out of the bundle, storage classified, pinning decision documented, dependencies audited, privacy labels drafted, crash reporting scrubbing configured.

**Official docs to consult:**
- https://mas.owasp.org/MASVS/
- https://mas.owasp.org/MASTG/
- https://owasp.org/www-project-mobile-top-10/
- https://docs.expo.dev/guides/environment-variables/
- https://docs.expo.dev/versions/latest/sdk/securestore/
- https://reactnative.dev/docs/security
- https://docs.expo.dev/guides/using-sentry/
- https://developer.apple.com/app-store/app-privacy-details/
- https://support.google.com/googleplay/android-developer/answer/10787469

**Stage pitfalls:**
- Every lesson names its MASVS category (STORAGE, CRYPTO, AUTH, NETWORK, PLATFORM, CODE, RESILIENCE, PRIVACY) in the first paragraph of `## Concepto`.
- Certificate pinning: present it with its operational cost (cert rotation bricks the app if done wrong) and say when it is worth it; Expo managed needs a config plugin or a dev build for native pinning. Do not promise a pure-JS pinning solution.
- Root/jailbreak detection and obfuscation are presented as defense-in-depth with limits, not as security guarantees.
- The `Terminal` "extract strings from bundle" lesson is defensive: show that `EXPO_PUBLIC_` values are visible, not how to attack third-party apps.
- Crash reporting: `beforeSend` must scrub emails, tokens and note contents; show the code.
- Use OWASP MASVS v2 naming; do not use the old MSTG-STORAGE-1 style ids.

- [ ] **Step 1: Write the outline** — `content/09-seguridad-movil/README.md` including the MASVS column.
- [ ] **Step 2: Write lessons 00 to 09** following Part 1.1.
- [ ] **Step 3: Run** `pnpm validate:content` — expected `OK`.
- [ ] **Step 4: Run** `pnpm format && pnpm lint && pnpm test` — expected all PASS. Then `git status --short` shows only files under this stage directory.
- [ ] **Step 5: Commit**

```bash
pnpm format
git add content/09-seguridad-movil
git commit -m "content: add stage 9 lessons"
```

### Task 11: Stage 10 — Build, release y operaciones

**Model:** Fable
**Write scope:** `content/10-build-release-operaciones/` only.

**Files:**
- Create: `content/10-build-release-operaciones/README.md`
- Create: the 12 lesson files below.

**Interfaces:**
- Consumes: Part 1.3; slug `10-build-release-operaciones`, `stage: 10`. Lesson 00 `prereqs: ["09-seguridad-movil/09-proyecto-auditoria"]`.
- Produces: ids `10-build-release-operaciones/00-app-config-y-entornos` … `10-build-release-operaciones/11-proyecto-publicar`.

**Outline:**

| Module | File | Title | Min | Practice |
| --- | --- | --- | --- | --- |
| Configuración | `00-app-config-y-entornos.mdx` | app.config.ts y entornos | 15 | `app.config.ts` in fenced code with `APP_VARIANT`; `Terminal`: `APP_VARIANT=preview npx expo start`; `Checklist` |
| Configuración | `01-secrets-en-eas.mdx` | Secrets y variables en EAS | 12 | `Terminal`: `eas env:create`, `eas env:list`; `Checklist` what is secret vs public |
| Build | `02-eas-build-perfiles.mdx` | EAS Build y perfiles en eas.json | 15 | full `eas.json` (development, preview, production) in fenced code; `Terminal`: `eas build --profile preview --platform android` |
| Build | `03-firma-ios-android.mdx` | Firma: certificados, provisioning y keystore | 15 | `Terminal`: `eas credentials`; `Checklist` backup of keystore; `Quiz` |
| Build | `04-cuentas-apple-google.mdx` | Cuentas de Apple Developer y Google Play Console | 12 | `Checklist` enrollment steps, costs, identifiers (bundle id, package name) |
| Publicar | `05-eas-submit-testflight-internal.mdx` | EAS Submit, TestFlight e Internal testing | 15 | `Terminal`: `eas submit --platform ios`, `--platform android`; `Checklist` |
| Publicar | `06-store-listing-y-revision.mdx` | Ficha de la tienda y proceso de revisión | 12 | `Checklist` screenshots, description, privacy policy URL, review guidelines pitfalls |
| Operar | `07-eas-update-y-rollback.mdx` | EAS Update (OTA) y rollback | 15 | `Terminal`: `eas update --branch production --message`, `eas update:rollback`; `Checklist` what OTA can and cannot change |
| Operar | `08-versionado-y-changelog.mdx` | Versionado, runtimeVersion y changelog | 10 | `Checklist` semver, `runtimeVersion` policy, `CHANGELOG.md`; `Terminal` `eas build:version:set` |
| Operar | `09-monitoreo-sentry.mdx` | Monitoreo con Sentry y métricas | 12 | `Terminal`: `npx @sentry/wizard@latest -i reactNative`; `Snack` capturing a handled error; `Checklist` crash-free rate target |
| Operar | `10-salir-de-managed.mdx` | Salir del workflow managed: prebuild, config plugins y módulos nativos | 15 | `Terminal`: `npx expo prebuild`; config plugin skeleton in fenced code; `Checklist` when it is needed |
| Proyecto | `11-proyecto-publicar.mdx` | Proyecto: publicar la app en ambas tiendas | 45 | `Checklist` end-to-end release runbook |

**Closing project:** the notes app published to TestFlight and Google Play internal testing (store review not required to pass), with `eas.json` profiles, secrets in EAS, credentials backed up, Sentry active, one OTA update shipped and rolled back, `CHANGELOG.md`, and a written release runbook.

**Official docs to consult:**
- https://docs.expo.dev/workflow/configuration/
- https://docs.expo.dev/eas/environment-variables/
- https://docs.expo.dev/build/introduction/
- https://docs.expo.dev/build/eas-json/
- https://docs.expo.dev/app-signing/managed-credentials/
- https://docs.expo.dev/submit/introduction/
- https://docs.expo.dev/eas-update/introduction/
- https://docs.expo.dev/eas-update/rollbacks/
- https://docs.expo.dev/eas-update/runtime-versions/
- https://docs.expo.dev/guides/using-sentry/
- https://docs.expo.dev/workflow/prebuild/
- https://docs.expo.dev/config-plugins/introduction/
- https://developer.apple.com/app-store/review/guidelines/
- https://play.google.com/console/about/guides/releasewithconfidence/

**Stage pitfalls:**
- `eas.json` must show the three canonical profiles with `distribution`, `developmentClient`, `channel` and `env`. Verify field names against the docs.
- EAS environment variables replaced the older `eas secret:*` commands; use `eas env:*` and verify the current CLI syntax.
- Credentials: say plainly that losing the Android upload keystore without Play App Signing means never updating the app; EAS stores it, but the learner backs it up.
- OTA updates cannot change native code or `app.json` native config; `runtimeVersion` explains why. Give the `"policy": "appVersion"` recommendation with its tradeoff.
- Do not present bare React Native CLI as the alternative path; lesson 10 explains prebuild and config plugins as the way to add native code while staying on Expo tooling.
- Store review: list the top rejection reasons (missing privacy policy, login without demo account, broken links).

- [ ] **Step 1: Write the outline** — `content/10-build-release-operaciones/README.md`.
- [ ] **Step 2: Write lessons 00 to 11** following Part 1.1.
- [ ] **Step 3: Run** `pnpm validate:content` — expected `OK`.
- [ ] **Step 4: Run** `pnpm format && pnpm lint && pnpm test` — expected all PASS. Then `git status --short` shows only files under this stage directory.
- [ ] **Step 5: Commit**

```bash
pnpm format
git add content/10-build-release-operaciones
git commit -m "content: add stage 10 lessons"
```

### Task 12: Stage 11 — Capstone

**Model:** Opus
**Write scope:** `content/11-capstone/` only.

**Files:**
- Create: `content/11-capstone/README.md`
- Create: the 4 lesson files below.

**Interfaces:**
- Consumes: Part 1.3; slug `11-capstone`, `stage: 11`. Lesson 00 `prereqs: ["10-build-release-operaciones/11-proyecto-publicar"]`.
- Produces: ids `11-capstone/00-elegir-y-definir-tu-app` … `11-capstone/03-publicar-y-presentar`.

**Outline:**

| Module | File | Title | Min | Practice |
| --- | --- | --- | --- | --- |
| Diseño | `00-elegir-y-definir-tu-app.mdx` | Elegir y definir tu app | 20 | `Checklist` problem statement, three user stories, out-of-scope list; `Snack` with a low-fidelity screen skeleton |
| Diseño | `01-arquitectura-y-plan.mdx` | Arquitectura y plan de trabajo | 20 | `Terminal` showing the feature-folder tree; `Checklist` domain/application/infrastructure/ui per feature, threat model, data classification |
| Entrega | `02-rubrica-y-checklist-final.mdx` | Rúbrica y checklist final | 20 | `Checklist` with the full rubric (architecture, tests, security, release), each item with its pass criterion |
| Entrega | `03-publicar-y-presentar.mdx` | Publicar y presentar | 25 | `Checklist` store submission, README with screenshots, 5-minute demo script; `Snack` with the app's "about" screen |

**Closing project:** the learner's own app, different from the notes app, published to at least internal testing on both stores, with the rubric passed: hexagonal feature folders, unit + E2E tests in CI, MASVS L1 self-audit, EAS profiles and OTA channel, Sentry, README.

**Rubric to embed in lesson 02 (each item is a `Checklist` entry with its criterion):**
- Architecture: domain has no React/Expo imports; each feature has the four layers; atomic design in `ui`.
- Quality: `lint`, `tsc --noEmit`, unit tests (≥ 10), one Maestro flow, green CI on the default branch.
- Security: no secrets in bundle; tokens in SecureStore; RLS on every table; dependencies audited; privacy labels filled; crash reports scrubbed.
- Release: `eas.json` with three profiles; credentials backed up; app on TestFlight and Play internal testing; one OTA update shipped; `CHANGELOG.md`.
- Product: README with problem, screenshots, how to run; demo script.

**Official docs to consult:**
- https://docs.expo.dev/
- https://mas.owasp.org/checklists/
- https://docs.github.com/es/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes

**Stage pitfalls:**
- The capstone must not be the notes app again; lesson 00 gives five suggested app ideas of similar size (habit tracker, expense log, reading list, workout timer, plant care).
- Every rubric item links back to the lesson that taught it (full lesson id in prose).
- Keep lessons short on new content; they orchestrate, they do not teach new APIs.

- [ ] **Step 1: Write the outline** — `content/11-capstone/README.md`.
- [ ] **Step 2: Write lessons 00 to 03** following Part 1.1.
- [ ] **Step 3: Run** `pnpm validate:content` — expected `OK`.
- [ ] **Step 4: Run** `pnpm format && pnpm lint && pnpm test` — expected all PASS. Then `git status --short` shows only files under this stage directory.
- [ ] **Step 5: Commit**

```bash
pnpm format
git add content/11-capstone
git commit -m "content: add stage 11 lessons"
```

---

## PART 3 — Wave 3: read-only reviewers (Tasks 13-16)

Run after all wave-2 commits are in. The four tasks run in parallel. Reviewers never edit content. Each writes exactly one JSON file. Create the directory with `mkdir -p docs/superpowers/reviews` before writing.

**Findings file format (all four tasks):**

```json
{
  "lens": "pedagogy",
  "reviewedAt": "2026-09-26",
  "filesReviewed": 120,
  "findings": [
    {
      "file": "content/01-javascript/08-scope-y-closures.mdx",
      "line": 42,
      "severity": "major",
      "summary": "Closure example uses setTimeout before asynchrony is taught (lesson 11).",
      "fix": "Replace with a counter factory example that needs no timers."
    }
  ]
}
```

`severity` is `"blocker"` (lesson is wrong or unusable), `"major"` (learner will be confused or code will not run), or `"minor"` (style, wording). `line` is the 1-indexed line in the file. `fix` is a concrete instruction the fix agent can apply without judgment.

### Task 13: Pedagogy review

**Model:** Sonnet
**Read scope:** all of `content/`. **Write scope:** `docs/superpowers/reviews/2026-09-26-pedagogy.json` only.

**Checklist (apply to every lesson):**
1. `## Concepto` opens with a daily-life analogy before any code.
2. No forward reference: no term used before the lesson that teaches it (check against the stage README tables and the frontmatter `prereqs` chain).
3. The explanation is complete outside embeds: a learner offline, reading only prose and fenced code, understands the concept.
4. `## Ejercicio` is solvable with only what was taught so far.
5. `## Errores comunes` items each say what it looks like, why, and how to detect it.
6. Flashcards ask one fact each; backs are under 25 words.
7. Quiz feedback explains why an option is wrong, not just "incorrect".
8. Reading time in `minutes` is plausible for the word count (about 200 words per minute plus practice).
9. The closing project lesson of each stage states what "done" looks like.

- [ ] **Step 1: Read every stage README** to build the concept order.
- [ ] **Step 2: Review every lesson** against the checklist; record findings.
- [ ] **Step 3: Write** `docs/superpowers/reviews/2026-09-26-pedagogy.json`.
- [ ] **Step 4: Validate JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('docs/superpowers/reviews/2026-09-26-pedagogy.json','utf8')); console.log('valid')"`
Expected: `valid`.

- [ ] **Step 5: Commit**

```bash
pnpm format
git add docs/superpowers/reviews/2026-09-26-pedagogy.json
git commit -m "docs: add pedagogy review findings"
```

### Task 14: Technical accuracy review

**Model:** Opus
**Read scope:** all of `content/`. **Write scope:** `docs/superpowers/reviews/2026-09-26-technical.json` only.

**Checklist:**
1. Every fenced code block and every `Playground` `code` runs as written; `expected` matches the real output.
2. Every `Snack` `code` is a complete `App.tsx` with `export default function App`, imports only `react`, `react-native` or a package listed in `dependencies`.
3. Every `Sandpack` has `/App.tsx` with a default export.
4. API names match current official docs (React 18, current Expo SDK, React Native New Architecture, TanStack Query v5 `isPending`, `expo-camera` `CameraView`, `expo-sqlite` async API, `eas env:*`). Open the URL cited in the lesson and confirm.
5. `prereqs` ids exist and belong to the same or an earlier stage.
6. Every `Terminal` command is valid on the shell it is shown for.
7. Every documentation URL returns a page (check with `curl -sI <url> | head -1` and expect a 2xx or 3xx).
8. Nothing states a version number that the docs no longer show as current.

- [ ] **Step 1: List all lessons** with `find content -name '*.mdx' | sort` (use `fd` if installed).
- [ ] **Step 2: Review every lesson** against the checklist, running code mentally and checking URLs.
- [ ] **Step 3: Write** `docs/superpowers/reviews/2026-09-26-technical.json`.
- [ ] **Step 4: Validate JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('docs/superpowers/reviews/2026-09-26-technical.json','utf8')); console.log('valid')"`
Expected: `valid`.

- [ ] **Step 5: Commit**

```bash
pnpm format
git add docs/superpowers/reviews/2026-09-26-technical.json
git commit -m "docs: add technical review findings"
```

### Task 15: Security review (stages 8, 9, 10)

**Model:** Fable
**Read scope:** `content/08-autenticacion-backend/`, `content/09-seguridad-movil/`, `content/10-build-release-operaciones/`, plus any code in other stages that stores tokens or keys. **Write scope:** `docs/superpowers/reviews/2026-09-26-security.json` only.

**Checklist:**
1. No secret, API key, service-role key or private cert appears in any `Snack`, fenced code, `app.json` or `eas.json` sample; only placeholders like `<YOUR_PROJECT_URL>` or `EXPO_PUBLIC_*` public values.
2. Tokens are stored only in `expo-secure-store`; any `AsyncStorage`/MMKV token example is marked as the wrong way with a `Callout kind="danger"`.
3. Every stage-9 lesson names its MASVS v2 category and the mapping is correct.
4. Supabase examples enable RLS on every table and policies use `auth.uid()`.
5. OAuth examples use PKCE; no implicit flow.
6. Certificate pinning lesson states rotation risk and Expo constraints.
7. Stage-10 `eas.json` and `app.config.ts` samples do not inline secrets; `eas env` usage is correct.
8. Crash reporting scrubbing code removes emails, tokens and user content.
9. Privacy lesson covers both App Privacy details and Google Data safety.
10. No lesson teaches attacking third-party apps; bundle inspection is framed on the learner's own app.

- [ ] **Step 1: Review stages 8, 9, 10** lesson by lesson against the checklist.
- [ ] **Step 2: Grep other stages** for `AsyncStorage`, `token`, `apiKey`, `secret` and check each hit.
- [ ] **Step 3: Write** `docs/superpowers/reviews/2026-09-26-security.json`.
- [ ] **Step 4: Validate JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('docs/superpowers/reviews/2026-09-26-security.json','utf8')); console.log('valid')"`
Expected: `valid`.

- [ ] **Step 5: Commit**

```bash
pnpm format
git add docs/superpowers/reviews/2026-09-26-security.json
git commit -m "docs: add security review findings"
```

### Task 16: Style and consistency review

**Model:** Haiku
**Read scope:** all of `content/`. **Write scope:** `docs/superpowers/reviews/2026-09-26-style.json` only.

**Checklist:**
1. Prose is neutral Spanish with "tú"; flag voseo, regional slang, exclamation-heavy tone.
2. Code, identifiers and comments are English.
3. Headings are exactly `## Objetivo`, `## Concepto`, `## Práctica`, `## Ejercicio`, `## Errores comunes` in that order; titles in sentence case.
4. Frontmatter `id` equals `<stage-slug>/<file-name-without-extension>`; `order` equals the two-digit file prefix; `module` names are consistent within a stage README.
5. Technical terms are spelled the same across lessons (hook, props, state, bundle, build, Expo Router, EAS Build).
6. Internal links use full lesson ids; external links are full URLs.
7. No trailing whitespace, no tabs, single blank line between sections.
8. `summary` is one sentence under 160 characters.
9. The line after the `## Objetivo` sentence starts with `**Prerrequisitos:**` and lists the same ids as the frontmatter `prereqs` (or `ninguno` when empty).

- [ ] **Step 1: Review every lesson** against the checklist.
- [ ] **Step 2: Write** `docs/superpowers/reviews/2026-09-26-style.json`.
- [ ] **Step 3: Validate JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('docs/superpowers/reviews/2026-09-26-style.json','utf8')); console.log('valid')"`
Expected: `valid`.

- [ ] **Step 4: Commit**

```bash
pnpm format
git add docs/superpowers/reviews/2026-09-26-style.json
git commit -m "docs: add style review findings"
```

---

## PART 4 — Wave 4: closers (Tasks 17-19)

Task 17 runs first (it edits content). Tasks 18 and 19 run in parallel after Task 17 commits.

### Task 17: Apply review findings

**Model:** Opus
**Read scope:** the four findings files and the content files they name. **Write scope:** only files named in a finding.

**Files:**
- Read: `docs/superpowers/reviews/2026-09-26-pedagogy.json`, `-technical.json`, `-security.json`, `-style.json`.
- Modify: every `content/**/*.mdx` or `content/**/README.md` named in a finding.
- Create: `docs/superpowers/reviews/2026-09-26-resolution.md`.

**Interfaces:**
- Consumes: findings format from Part 3.
- Produces: content that passes `pnpm validate:content` and the four checklists.

- [ ] **Step 1: Merge findings** into one list sorted by severity (blocker, major, minor) then file.
- [ ] **Step 2: Apply each finding's `fix`** to the named file at the named line. If two findings on the same file conflict, apply the higher severity and record the other as "superseded" in the resolution file.
- [ ] **Step 3: Write** `docs/superpowers/reviews/2026-09-26-resolution.md` with a table: file, line, lens, severity, action (applied / superseded / rejected with one-line reason). Rejected is allowed only when the fix would break a Global Constraint.
- [ ] **Step 4: Run** `pnpm validate:content` — expected `OK`.
- [ ] **Step 5: Run** `pnpm test` — expected PASS.
- [ ] **Step 6: Commit**

```bash
pnpm format
git add content docs/superpowers/reviews/2026-09-26-resolution.md
git commit -m "content: apply review findings"
```

### Task 18: Platform tests and CI hardening over real content

**Model:** Sonnet
**Write scope:** `src/ui/pages/Lesson.content.test.tsx`, `scripts/validate-content.test.ts`, `scripts/lib/validateContent.ts`, the `test` block of `vite.config.ts`, `.github/workflows/ci.yml`, `package.json` (scripts only). Never create `vitest.config.ts`: Plan A keeps the Vitest configuration inside `vite.config.ts`, and a separate `vitest.config.ts` would override it and drop the MDX plugin, the `@/` alias, the jsdom environment and the setup file.

**Files:**
- Create: `src/ui/pages/Lesson.content.test.tsx`
- Create: `scripts/validate-content.test.ts`
- Modify: `scripts/lib/validateContent.ts` (add the four checks below)
- Modify: `vite.config.ts` (`test.coverage` block only)
- Modify: `.github/workflows/ci.yml` (validator step, coverage flag)

**Interfaces:**
- Consumes (Plan A, exact names):
  - `loadCourse(): Course` from `src/infrastructure/content/loadCourse.ts` (import as `@/infrastructure/content/loadCourse`). `Course = { stages: Stage[]; lessons: Lesson[]; byId: Record<LessonId, Lesson> }`, `Stage = StageMeta & { modules: Module[]; lessons: Lesson[] }`, `Module = { name: string; lessons: Lesson[] }`, `Lesson = LessonMeta & { stageSlug: string; slug: string; prev: LessonId | null; next: LessonId | null; load: () => Promise<LessonComponent> }`, `LessonComponent = ComponentType<{ components?: MDXComponents }>`. `Course.lessons` excludes `hidden: true` lessons; `Course.byId` includes them.
  - `renderWithRepositories(ui, opts?)` from `@/application/testing/renderWithRepositories` (wraps in `RepositoriesProvider` with in-memory stores and `MemoryRouter`).
  - `LessonProvider({ lessonId, children })` from `@/ui/organisms/interactive/LessonContext`.
  - `MdxProvider({ children })` from `@/ui/organisms/interactive/MdxProvider`.
  - `validateContent(rootDir: string): { ok: boolean; errors: string[] }` re-exported by `scripts/validate-content.ts` from `scripts/lib/validateContent.ts`.
  - `validateLesson(source, relPath, stages): { id: string | null; stage: number | null; hidden: boolean; prereqs: string[]; links: string[]; errors: string[] }` and the helpers `extractBlock(source: string, tag: string, from?: number): { start: number; end: number; text: string } | null` (source slice of one self-closing `<Tag ... />` block), `extractProp(source: string, component: string, prop: string): string | null` (contents of the first `` prop={`...`} `` template literal on that component, or `null`) and `extractQuizQuestions(source: string): QuizQuestionSource[]` where `QuizQuestionSource = { prompt: string; options: { text: string; correct: boolean; feedback: string }[] }`, all exported from `scripts/lib/validateContent.ts`. Plan A's validator already enforces the per-stage component limits (no `Sandpack`/`Snack` in stages 0-2, no `Snack` in stage 3); do not duplicate that rule.
  - `@vitest/coverage-v8` is already a devDependency (Plan A Task 1).
- Produces: nothing consumed later.

- [ ] **Step 1: Write the failing smoke test that renders every real lesson**

```tsx
// src/ui/pages/Lesson.content.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderWithRepositories } from '@/application/testing/renderWithRepositories';
import { loadCourse } from '@/infrastructure/content/loadCourse';
import { LessonProvider } from '@/ui/organisms/interactive/LessonContext';
import { MdxProvider } from '@/ui/organisms/interactive/MdxProvider';

vi.mock('@codesandbox/sandpack-react', () => ({
  Sandpack: (props: { files: Record<string, string> }) => (
    <div data-testid="sandpack">{Object.keys(props.files).join(',')}</div>
  ),
}));

const course = loadCourse();
const cases = course.lessons.map((lesson) => [lesson.id, lesson] as const);

describe('every visible lesson renders', () => {
  it('has at least one lesson per stage', () => {
    for (const stage of course.stages) {
      expect(stage.lessons.length, `stage ${stage.slug}`).toBeGreaterThan(0);
    }
  });

  it.each(cases)('%s', async (_id, lesson) => {
    const Content = await lesson.load();
    const { container } = renderWithRepositories(
      <LessonProvider lessonId={lesson.id}>
        <MdxProvider>
          <Content />
        </MdxProvider>
      </LessonProvider>,
    );
    const headings = Array.from(container.querySelectorAll('h2')).map((h) => h.textContent);
    expect(headings.slice(0, 5)).toEqual([
      'Objetivo',
      'Concepto',
      'Práctica',
      'Ejercicio',
      'Errores comunes',
    ]);
    expect(container.querySelector('[aria-label="Tarjetas de repaso"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Cuestionario"]')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run it**

Run: `pnpm vitest run src/ui/pages/Lesson.content.test.tsx`
Expected: one `it.each` case per visible lesson (about 119). FAIL for any lesson whose headings are out of order or that throws while rendering; PASS if content is clean. Failures are content defects: record each in `docs/superpowers/reviews/2026-09-26-resolution.md` under "Found by smoke test" and fix the named lesson (this is one of the two cases where Task 18 edits `content/`).

- [ ] **Step 3: Write failing validator tests for the Review Focus checks**

```ts
// scripts/validate-content.test.ts
import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { validateContent } from './validate-content';

const STAGES = [
  { id: 0, slug: '00-a', title: 'A', mark: 'A', bg: '#000000', fg: '#111111', project: 'p', hours: 1 },
  { id: 1, slug: '01-b', title: 'B', mark: 'B', bg: '#000000', fg: '#111111', project: 'p', hours: 1 },
];

function tmpContent(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'saber-'));
  writeFileSync(join(root, 'stages.json'), JSON.stringify(STAGES));
  for (const [relPath, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, relPath)), { recursive: true });
    writeFileSync(join(root, relPath), body);
  }
  return root;
}

const PLAYGROUND = '<Playground lang="js" code={`console.log(1);`} />';
const SNACK_OK = '<Snack code={`export default function App() { return null; }`} />';

function lesson(id: string, stage: number, practice: string, prereqs = '[]', secondCorrect = 'false'): string {
  return `---
id: "${id}"
title: "T"
stage: ${stage}
module: "M"
order: 0
minutes: 5
prereqs: ${prereqs}
summary: "S."
---

## Objetivo

x

**Prerrequisitos:** ninguno

## Concepto

x

## Práctica

${practice}

## Ejercicio

<Challenge title="t" solution={<Playground lang="js" code={\`console.log(2);\`} />}>x</Challenge>

## Errores comunes

x

<Flashcards cards={[{ front: 'a', back: 'b' }, { front: 'c', back: 'd' }, { front: 'e', back: 'f' }]} />

<Quiz questions={[
  { prompt: 'q1', options: [{ text: 'a', correct: true, feedback: 'f' }, { text: 'b', correct: ${secondCorrect}, feedback: 'f' }] },
  { prompt: 'q2', options: [{ text: 'a', correct: true, feedback: 'f' }, { text: 'b', correct: false, feedback: 'f' }] },
  { prompt: 'q3', options: [{ text: 'a', correct: true, feedback: 'f' }, { text: 'b', correct: false, feedback: 'f' }] }
]} />
`;
}

describe('validateContent review-focus checks', () => {
  it('accepts a well-formed pair of lessons', () => {
    const root = tmpContent({
      '00-a/00-x.mdx': lesson('00-a/00-x', 0, PLAYGROUND),
      '01-b/00-y.mdx': lesson('01-b/00-y', 1, SNACK_OK, '["00-a/00-x"]'),
    });
    expect(validateContent(root)).toEqual({ ok: true, errors: [] });
  });

  it('prereqs point backwards only', () => {
    const root = tmpContent({
      '00-a/00-x.mdx': lesson('00-a/00-x', 0, PLAYGROUND, '["01-b/00-y"]'),
      '01-b/00-y.mdx': lesson('01-b/00-y', 1, SNACK_OK),
    });
    const result = validateContent(root);
    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toMatch(/prereq "01-b\/00-y" belongs to a later stage/);
  });

  it('snack code has default export', () => {
    const root = tmpContent({
      '01-b/00-y.mdx': lesson('01-b/00-y', 1, '<Snack code={`const a = 1;`} />'),
    });
    const result = validateContent(root);
    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toMatch(/Snack code is missing "export default function App"/);
  });

  it('quiz has exactly one correct option', () => {
    const root = tmpContent({
      '00-a/00-x.mdx': lesson('00-a/00-x', 0, PLAYGROUND, '[]', 'true'),
    });
    const result = validateContent(root);
    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toMatch(/quiz question "q1" must have exactly one correct option \(has 2\)/);
  });

  it('no hardcoded secrets in content', () => {
    const root = tmpContent({
      '01-b/00-y.mdx': lesson(
        '01-b/00-y',
        1,
        '<Snack code={`const key = "sk_live_ABCDEF1234567890";\nexport default function App() { return null; }`} />',
      ),
    });
    const result = validateContent(root);
    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toMatch(/possible hardcoded secret/);
  });

  it('does not flag a short sample JWT used for teaching', () => {
    const sample =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFuYSJ9.abc123';
    const root = tmpContent({
      '01-b/00-y.mdx': lesson('01-b/00-y', 1, `<Playground lang="ts" code={\`const token = '${sample}';\nconsole.log(atob(token.split('.')[1]));\`} />`),
    });
    expect(validateContent(root).ok).toBe(true);
  });
});
```

- [ ] **Step 4: Run to verify they fail**

Run: `pnpm vitest run scripts/validate-content.test.ts`
Expected: the first and last tests PASS; `prereqs point backwards only`, `snack code has default export`, `quiz has exactly one correct option` and `no hardcoded secrets in content` FAIL because the validator does not implement them yet.

- [ ] **Step 5: Add the four checks to `scripts/lib/validateContent.ts`**

Inside `validateLesson`, after the existing section and component rules and before `return`, add (uses the helpers `extractBlock`, `extractProp` and `extractQuizQuestions` already defined in the same file):

```ts
  // Every Snack block's code must be a complete App.tsx with a default export.
  let snackFrom = 0;
  for (;;) {
    const block = extractBlock(source, 'Snack', snackFrom);
    if (!block) break;
    const code = extractProp(block.text, 'Snack', 'code');
    if (code !== null && !/export\s+default\s+function\s+App\b/.test(code)) {
      errors.push(`${relPath}: Snack code is missing "export default function App"`);
    }
    snackFrom = block.end;
  }

  // Every quiz question has exactly one correct option.
  for (const question of extractQuizQuestions(source)) {
    const correct = question.options.filter((o) => o.correct).length;
    if (correct !== 1) {
      errors.push(
        `${relPath}: quiz question "${question.prompt}" must have exactly one correct option (has ${correct})`,
      );
    }
  }

  // No hardcoded secrets. Short sample JWTs are allowed for teaching; real ones are longer.
  const SECRET_PATTERNS: RegExp[] = [
    /sk_live_[A-Za-z0-9]{12,}/,
    /AKIA[0-9A-Z]{16}/,
    /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,
    /eyJ[A-Za-z0-9_-]{60,}\.[A-Za-z0-9_-]{100,}\.[A-Za-z0-9_-]{40,}/,
  ];
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(source)) errors.push(`${relPath}: possible hardcoded secret matching ${pattern}`);
  }
```

Inside `validateContent`, replace the existing prereq loop so that it also checks stage order. `results` entries carry `relPath`, `id`, `stage`, `hidden`, `prereqs`, `links` and `errors` from `validateLesson`:

```ts
  const stageById = new Map<string, number | null>();
  for (const r of results) if (r.id) stageById.set(r.id, r.stage);

  for (const r of results) {
    for (const p of r.prereqs) {
      if (!ids.has(p)) {
        errors.push(`${r.relPath}: prereq "${p}" does not exist`);
        continue;
      }
      const targetStage = stageById.get(p);
      if (r.stage !== null && targetStage !== null && targetStage !== undefined && targetStage > r.stage) {
        errors.push(`${r.relPath}: prereq "${p}" belongs to a later stage`);
      }
    }
    for (const l of r.links) {
      if (!ids.has(l)) errors.push(`${r.relPath}: link "/etapa/${l}" does not resolve to a lesson`);
    }
  }
```

- [ ] **Step 6: Run the validator tests**

Run: `pnpm vitest run scripts/validate-content.test.ts scripts/lib/validateContent.test.ts`
Expected: PASS (6 new tests plus all of Plan A's validator tests).

- [ ] **Step 7: Run the validator on real content**

Run: `pnpm validate:content`
Expected: `OK`. Any new error is a real content defect: record it in `docs/superpowers/reviews/2026-09-26-resolution.md` under "Found by validator hardening" and fix the named lesson (the second case where Task 18 edits `content/`).

- [ ] **Step 8: Set coverage thresholds**

In `vite.config.ts`, inside the existing `test: { ... }` block, add:

```ts
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/application/**', 'src/ui/organisms/interactive/**'],
      exclude: ['**/*.test.*', 'src/application/testing/**'],
      thresholds: { lines: 85, functions: 85, branches: 75, statements: 85 },
    },
```

Run: `pnpm test -- --coverage`
Expected: PASS with thresholds met. If a threshold fails, add tests for the uncovered domain or interactive file; do not lower thresholds.

- [ ] **Step 9: Make CI run the validator and coverage**

In `.github/workflows/ci.yml`, add after the typecheck step:

```yaml
      - name: Validate content
        run: pnpm validate:content
```

and change the test step to `run: pnpm test -- --coverage`.

- [ ] **Step 10: Run the full local pipeline**

Run: `pnpm format && pnpm lint && pnpm typecheck && pnpm validate:content && pnpm test -- --coverage && pnpm build`
Expected: all succeed.

- [ ] **Step 11: Commit**

```bash
pnpm format
git add src scripts vite.config.ts .github/workflows/ci.yml package.json docs/superpowers/reviews/2026-09-26-resolution.md content
git commit -m "test: add content smoke tests, validator checks and coverage gates"
```

### Task 19: README and contributing guide

**Model:** Haiku
**Write scope:** `README.md`, `CONTRIBUTING.md`.

**Files:**
- Modify: `README.md` (Plan A Task 23 leaves an English stub; replace its body with the sections below, keep the title)
- Create: `CONTRIBUTING.md`

**Interfaces:**
- Consumes: `package.json` scripts (`dev`, `build`, `test`, `lint`, `typecheck`, `validate:content`), component props from Part 1.3, stage list from `content/stages.json`.
- Produces: documentation only.

- [ ] **Step 1: Rewrite `README.md`** (English; overwrite the stub) with these sections and real content:
  - Title "Saber — React Native learning platform" and one-paragraph description (zero to store deployment, 12 stages, ~120 lessons, Spanish content).
  - Requirements: Node LTS, pnpm (with the install command `npm i -g pnpm`).
  - Run: `pnpm install`, `pnpm dev` (URL printed by Vite), `pnpm build`, `pnpm preview`.
  - Quality: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm validate:content`.
  - Curriculum table copied from `content/stages.json`: stage number, title, closing project, hours.
  - Architecture summary: `src/domain`, `src/application`, `src/infrastructure`, `src/ui` (atoms → pages), `content/`.
  - Deployment: GitHub Pages via `.github/workflows/deploy.yml` on `main`.
  - License line (MIT unless `package.json` says otherwise).
- [ ] **Step 2: Write `CONTRIBUTING.md`** (English) with:
  - "Adding a lesson": file naming `NN-slug.mdx`, frontmatter schema (copy from Global Constraints), the eight sections in order, then run `pnpm validate:content`.
  - "Component reference": one subsection per component with the MDX snippet from Part 1.3.
  - "Language contract": Part 1.4 verbatim.
  - "Commits": conventional commits, examples `content: add stage 3 lessons`, `fix(playground): capture console.error`.
  - "Review process": the four lenses and the findings JSON format from Part 3.
- [ ] **Step 3: Check links**

Run: `node -e "const fs=require('fs');for(const f of ['README.md','CONTRIBUTING.md']){const s=fs.readFileSync(f,'utf8');const m=s.match(/\]\((\.\/[^)]+)\)/g)||[];for(const l of m){const p=l.slice(3,-1);if(!fs.existsSync(p))console.log(f,'broken',p)}}console.log('checked')"`
Expected: `checked` with no `broken` lines.

- [ ] **Step 4: Commit**

```bash
pnpm format
git add README.md CONTRIBUTING.md
git commit -m "docs: expand README and add contributing guide"
```

---

## Lesson count summary

| Stage | Lessons |
| --- | --- |
| 0 | 7 new (plus lesson 00 from Plan A) |
| 1 | 14 |
| 2 | 9 |
| 3 | 12 |
| 4 | 12 |
| 5 | 11 |
| 6 | 8 |
| 7 | 12 |
| 8 | 8 |
| 9 | 10 |
| 10 | 12 |
| 11 | 4 |
| **Total** | **119 new + 1 from Plan A = 120** |

## Self-review notes

- Spec section 3 topics: every listed topic maps to a lesson above (checked stage by stage; stage 4 "images/fonts" → lesson 08; stage 5 "Redux" → discussed in lesson 00; stage 6 "advanced Git" → lesson 01; stage 7 "deep links" → lesson 08; stage 10 "when to leave managed" → lesson 10).
- Spec section 4 section order matches Part 1.1 and the Task 16 checklist, including `## Práctica` with accent and the `**Prerrequisitos:**` line with lesson ids.
- Spec section 4 practice rule: preferences per stage plus the two hard limits; Terminal/Checklist-only lessons in stages 0, 6, 9 and 10 and the stage-8 `Playground` JWT lesson comply.
- Spec section 5.2 frontmatter, including optional `hidden`, matches Global Constraints.
- Spec section 6 props match Part 1.3, including `Snack` `dependencies` as an object and `Challenge` `solution` as `React.ReactNode`.
- Plan A alignment (Task 18): `Course.lessons`, `Module.name`, `Lesson.load(): Promise<LessonComponent>`, `renderWithRepositories`, `LessonProvider`, `MdxProvider`, `validateContent` re-exported from `scripts/validate-content.ts`, `validateLesson` returning `{ id, stage, hidden, prereqs, links, errors }`, helpers `extractBlock`, `extractProp` (`string | null`) and `extractQuizQuestions` (`QuizQuestionSource[]`) from `scripts/lib/validateContent.ts`, per-stage component limits left to Plan A, `@vitest/coverage-v8` present, Vitest config inside `vite.config.ts`.
- Stage 0 lesson 00 and the hidden demo lesson come from Plan A and are never rewritten by Task 1.
- Every commit step runs `pnpm format` first so `prettier --check` in `pnpm lint` passes.
