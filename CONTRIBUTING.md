# Contributing to Saber

Thank you for contributing to the Saber learning platform. This guide covers writing and editing lessons, component usage, and our development process.

## Adding or editing a lesson

### File naming and location

- Save lesson files in `content/<stage-slug>/` where `<stage-slug>` matches the stage directory (e.g., `content/01-javascript/` for stage 1).
- File name format: `NN-slug.mdx` where `NN` is a two-digit order number starting at `00` (00, 01, 02, ...) and `slug` is lowercase ASCII with hyphens.
- The `order` field in frontmatter must be unique within the stage; matching the `NN` prefix is a naming convention, not something the validator enforces.

### Frontmatter schema

Every lesson file starts with YAML frontmatter (required fields unless noted):

```mdx
---
id: "01-javascript/03-funciones"
title: "Funciones"
stage: 1
module: "Fundamentos"
order: 3
minutes: 14
prereqs: ["01-javascript/02-condicionales"]
summary: "Aprende a encapsular pasos en funciones reutilizables con parámetros y valores de retorno."
hidden: false
---
```

- **`id`**: Concatenation of `<stage-slug>/<NN-slug>` from the file path.
- **`title`**: Sentence case (e.g., "Funciones", not "FUNCIONES").
- **`stage`**: Integer 0–11.
- **`module`**: Name of the learning unit within the stage (e.g., "Fundamentos", "Tipos").
- **`order`**: Unique integer within the stage; matching the file's `NN` prefix is a convention, not enforced.
- **`minutes`**: Estimated reading time in minutes.
- **`prereqs`**: Array of required lesson ids, or `[]` if none (never `["ninguno"]`; the word "ninguno" is only used in prose, on the `**Prerrequisitos:**` line).
- **`summary`**: One sentence describing what the lesson teaches (not used in lesson body, shown in course index).
- **`hidden`** (optional): Boolean; if `true`, lesson is hidden from the course menu (defaults to `false`).

### Section order

Lessons must include these sections in this exact order:

1. **`## Objetivo`** — one sentence stating what the learner can do. Must end with a line `**Prerrequisitos:** <ids>` listing all ids from `prereqs`, or the word `ninguno`.

   ```mdx
   ## Objetivo

   Al terminar esta lección podrás escribir funciones con parámetros y valor de retorno, y explicar por qué evitan repetir código.

   **Prerrequisitos:** `01-javascript/02-condicionales`
   ```

2. **`## Concepto`** — Explanation of the topic (5–10 minutes of reading, 600–1200 words). Include at least one analogy from daily life. Add links to official documentation with full URLs.

3. **`## Práctica`** — At least one interactive component (see "Interactive components" below) where the learner runs or manipulates code. The component type depends on the stage:
   - Stages 0–2: prefer `Playground` (JavaScript or TypeScript).
   - Stage 3: prefer `Sandpack` (React web preview).
   - Stages 4–11: prefer `Snack` (React Native).
   - Terminal or Checklist alone is acceptable for operational topics (tool installation, release steps).
   - **Hard limits:** No `Sandpack` or `Snack` in stages 0–2; no `Snack` in stage 3.

4. **`## Ejercicio`** — A single `Challenge` component with a statement as children and a runnable solution (usually a `Playground` or `Snack`).

5. **`## Errores comunes`** — At least two common mistakes. Each mistake lists: what it looks like (code), why it happens (explanation), and how to detect it.

6. **`<Flashcards ... />`** — 3 to 5 review cards. Each card has a question on the front and a concise answer on the back.

7. **`<Quiz ... />`** — Exactly 3 multiple-choice questions. Each question has 2–4 options; exactly one must be marked `correct: true`; every option must include a `feedback` string.

Nothing appears after the quiz.

### Component limits per stage

The validator enforces:

- Every lesson's `## Práctica` needs at least one of `Playground`, `Sandpack`, `Snack`, `Terminal` or `Checklist`.
- No `Sandpack` or `Snack` in stages 0–2.
- No `Snack` in stage 3.
- `Terminal` and `Checklist` are allowed in any stage.

### Interactive components reference

All multi-line code in JSX props goes inside template literals: `code={`...`}`. Never nest a fenced code block inside a component prop.

#### Playground

Runs JavaScript or TypeScript in a sandboxed iframe. Works offline.

```mdx
<Playground
  lang="js"
  code={`function add(a, b) {
  return a + b;
}
console.log(add(3, 4));`}
  expected={`7`}
/>
```

**Props:**
- `lang` (`"js"` | `"ts"`): Programming language.
- `code` (string): Complete, runnable code.
- `expected` (optional string): Expected console output. Must match the exact output of `JSON.stringify` for objects/arrays and plain text for strings.

#### Sandpack

React preview with hot reload. Requires network.

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

**Props:**
- `files` (object): Map of file paths to contents; `/App.tsx` is required and must export a default component.

#### Snack

React Native preview via Expo. Requires network. Always pass `sdkVersion: "55.0.0"`.

```mdx
<Snack
  sdkVersion="55.0.0"
  platform="ios"
  dependencies={{ "expo-image": "^17.0.0" }}
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

**Props:**
- `code` (string): Complete `App.tsx` with a default export.
- `sdkVersion` (string): Expo SDK version; use `"55.0.0"`.
- `dependencies` (optional object): Map of package names to versions (e.g., `{ 'expo-image': '^17.0.0' }`).
- `platform` (optional `'ios'` | `'android'` | `'web'`, default `'ios'`).

#### Quiz

Exactly 3 multiple-choice questions. Records learner scores.

```mdx
<Quiz
  questions={[
    {
      prompt: "¿Qué imprime console.log(2 + 2)?",
      options: [
        { text: "4", correct: true, feedback: "Correcto." },
        { text: "22", correct: false, feedback: "El operador + suma números, no los concatena como texto." }
      ]
    }
  ]}
/>
```

**Props:**
- `questions` (array of `{ prompt, options: [{ text, correct, feedback }] }`): Exactly 3 questions.

#### Challenge

Exercise with a hidden solution. Children are the problem statement (supports markdown). Solution receives JSX.

```mdx
<Challenge
  title="Doblar un número"
  solution={
    <Playground
      lang="js"
      code={`const double = (n) => n * 2;
console.log(double(5));`}
    />
  }
>
  Escribe una función flecha `double` que multiplique un número por 2. Comprueba que `double(5)` devuelve `10`.
</Challenge>
```

**Props:**
- `title` (string): Exercise title.
- `solution` (JSX): Runnable solution, usually `<Playground>` or `<Snack>`.
- `children` (markdown): Problem statement.

#### Flashcards

Review cards fed into the global review deck. Front is a question; back is a concise answer.

```mdx
<Flashcards
  cards={[
    { front: "¿Cuándo se ejecuta el body de una función flecha?", back: "Cuando la función es llamada, no cuando se declara." },
    { front: "¿Qué significa DRY?", back: "Don't Repeat Yourself: evita repetir código." }
  ]}
/>
```

**Props:**
- `cards` (array of `{ front, back }`): 3 to 5 cards.

#### Terminal

Simulated terminal walkthrough. Learner clicks to reveal each step.

```mdx
<Terminal
  steps={[
    { cmd: "mkdir my-app && cd my-app", out: "" },
    { cmd: "npm init -y", out: "Wrote to my-app/package.json" }
  ]}
/>
```

**Props:**
- `steps` (array of `{ cmd, out }`): Command and output pairs.

#### Checklist

Persistent checklist; state stored per lesson id.

```mdx
<Checklist
  id="08-autenticacion-backend/02-secretos"
  items={[
    "No hay claves privadas en el código",
    "Los tokens viven en SecureStore",
    ".env está en .gitignore"
  ]}
/>
```

**Props:**
- `id` (string): Unique identifier (use the lesson id plus a suffix).
- `items` (array of strings): Checklist items.

#### Callout

Highlighted note box.

```mdx
<Callout kind="warning">
  Nunca guardes un token de sesión en AsyncStorage; no está cifrado.
</Callout>
```

**Props:**
- `kind` (`"tip"` | `"warning"` | `"danger"`): Callout style.
- `children`: Note text.

## Language contract

- **Prose, headings, quiz questions, flashcard text, checklist items, callout text:** Neutral professional Spanish. Use "tú" as the address form. No regional slang, no voseo (Argentine Spanish), no exclamation-heavy tone.
- **Code, identifiers, comments inside code, file and directory names:** English.
- **Technical terms:** Keep English names when the industry does (hook, state, props, bundle, build, commit). Write them in plain text, not quoted.
- **Titles:** Sentence case (e.g., "Funciones flecha", not "Funciones Flecha").

## Running the validator

After writing or editing lessons, validate your work:

```bash
pnpm validate:content
```

This checks:
- Frontmatter completeness and correctness.
- Unique lesson ids.
- Existing prerequisite references.
- Section order and required sections.
- At least one interactive component in `## Práctica`.
- Exactly 3 quiz questions with exactly 1 correct answer and feedback on every option.
- 3–5 flashcard cards.
- Internal lesson links resolve.
- Component stage limits (no `Sandpack`/`Snack` in stages 0–2; no `Snack` in stage 3).
- Every `Snack` declares `sdkVersion`, and every `Snack` in the content directory shares the same one.
- Every `Playground` `expected` prop, when present, is a non-empty string.
- Every `Snack`'s generated embed URL is at most 7500 characters.

The validator must pass (`OK` with zero errors) before committing.

`pnpm validate:content` checks structure only; it does not run any code. `pnpm test` covers that: it executes every `Playground` `expected` against the real sandbox harness (`scripts/playground-expected.test.ts`) and renders every non-hidden lesson through the real MDX pipeline, failing if a lesson triggers a `console.error` (`src/ui/pages/Lesson.content.test.tsx`).

## Commits

- Use [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): subject`.
- Examples:
  - `content: add stage 3 lessons`
  - `fix(playground): capture console.error output`
  - `docs: clarify Quiz component feedback requirement`
- Never add `Co-Authored-By` or AI attribution trailers.
- Keep the subject under 70 characters.

## Review process

Lessons go through four review lenses:

1. **Technical:** Code correctness against the real APIs and tools taught (Expo, EAS, Supabase, React Native), and consistency with the platform's own components (e.g., `Snack`, `Playground`).
2. **Pedagogy:** Whether the lesson actually teaches what it claims, in the right order, with a clear analogy and a practice section that exercises the concept.
3. **Security:** Safe defaults in every example (no secrets in code, correct RLS/auth patterns, no unsafe input handling), matching the MASVS-aligned content in stage 9.
4. **Style:** Language contract compliance (neutral professional Spanish in prose, English in code/identifiers), formatting, and consistency of terminology across lessons.

Each lens reports findings as JSON in `docs/superpowers/reviews/` (e.g., `docs/superpowers/reviews/<date>-technical.json`), one entry per finding with `file`, `line`, `severity`, `category`, `summary` and `fix`. Severity is one of:

- **blocker:** Must be fixed before the change can land.
- **major:** Should be fixed; a significant but non-blocking issue.
- **minor:** Worth fixing, low impact.

## Before you commit

1. Run `pnpm format` to auto-format your files.
2. Run `pnpm lint` to check code style and prose.
3. Run `pnpm typecheck` to verify TypeScript types.
4. Run `pnpm test` to run unit tests.
5. Run `pnpm validate:content` to validate lesson structure.
6. Review the output of each command and fix any issues.
7. Commit only your stage's lessons:
   ```bash
   git add content/<your-stage>/
   git commit -m "content: add stage <N> lessons"
   ```

If you're editing an existing lesson, use a message like:
```bash
git commit -m "content: fix stage 3 lesson on hooks"
```

## Questions?

Refer to the lesson template at `content/01-javascript/03-funciones.mdx` and the platform's [README](README.md).
