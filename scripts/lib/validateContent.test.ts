import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  extractProp,
  extractQuizQuestions,
  validateContent,
  validateLesson,
} from './validateContent';
import stagesJson from '../../content/stages.json';
import type { StageMeta } from '@/domain/course';

const stages = stagesJson as StageMeta[];

const good = `---
id: "01-javascript/00-variables"
title: "Variables"
stage: 1
module: "Base"
order: 0
minutes: 8
prereqs: []
summary: "Resumen."
---

## Objetivo

Texto.

## Concepto

Texto.

## Práctica

<Playground lang="js" code={\`console.log(1)\`} />

## Ejercicio

<Challenge title="Reto" solution={<p>sol</p>}>
  Enunciado. Ver [la siguiente](/etapa/01-javascript/01-tipos).
</Challenge>

## Errores comunes

- Uno.
- Dos.

<Flashcards cards={[
  { front: "a", back: "b" },
  { front: "c", back: "d" },
  { front: "e", back: "f" },
]} />

<Quiz questions={[
  { prompt: "1", options: [{ text: "x", correct: true, feedback: "ok" }] },
  { prompt: "2", options: [{ text: "x", correct: true, feedback: "ok" }] },
  { prompt: "3", options: [{ text: "x", correct: true, feedback: "ok" }] },
]} />
`;

describe('validateLesson', () => {
  it('accepts a complete lesson and extracts id, stage, prereqs and links', () => {
    const result = validateLesson(good, '01-javascript/00-variables.mdx', stages);
    expect(result.errors).toEqual([]);
    expect(result.id).toBe('01-javascript/00-variables');
    expect(result.stage).toBe(1);
    expect(result.hidden).toBe(false);
    expect(result.links).toEqual(['01-javascript/01-tipos']);
  });

  it('rejects Sandpack and Snack in stages 0 to 2 and Snack in stage 3', () => {
    const withSnack = good.replace(
      '<Playground lang="js" code={`console.log(1)`} />',
      '<Snack code={`x`} />\n\n<Sandpack files={{ "/App.tsx": "x" }} />',
    );
    const { errors } = validateLesson(withSnack, '01-javascript/00-variables.mdx', stages);
    expect(errors).toContain(
      '01-javascript/00-variables.mdx: Snack is not allowed in stage 1 (stages 0 to 3)',
    );
    expect(errors).toContain(
      '01-javascript/00-variables.mdx: Sandpack is not allowed in stage 1 (stages 0 to 2)',
    );

    const stage3 = withSnack
      .replace('id: "01-javascript/00-variables"', 'id: "03-react/00-variables"')
      .replace('stage: 1', 'stage: 3');
    const s3 = validateLesson(stage3, '03-react/00-variables.mdx', stages).errors;
    expect(s3).toContain(
      '03-react/00-variables.mdx: Snack is not allowed in stage 3 (stages 0 to 3)',
    );
    expect(s3.some((e) => e.includes('Sandpack is not allowed'))).toBe(false);

    const stage4 = withSnack
      .replace('id: "01-javascript/00-variables"', 'id: "04-react-native-expo/00-variables"')
      .replace('stage: 1', 'stage: 4');
    const s4 = validateLesson(stage4, '04-react-native-expo/00-variables.mdx', stages).errors;
    expect(s4.some((e) => e.includes('is not allowed in stage'))).toBe(false);
  });

  it('extracts raw props and parsed quiz questions', () => {
    expect(extractProp(good, 'Playground', 'lang')).toBe('js');
    expect(extractProp(good, 'Playground', 'code')).toBe('`console.log(1)`');
    expect(extractProp(good, 'Playground', 'missing')).toBeNull();
    const questions = extractQuizQuestions(good);
    expect(questions).toHaveLength(3);
    expect(questions[0]).toEqual({
      prompt: '1',
      options: [{ text: 'x', correct: true, feedback: 'ok' }],
    });
    expect(extractQuizQuestions('no quiz here')).toEqual([]);
  });

  it('reports missing frontmatter fields and wrong types by name', () => {
    const src = good.replace('order: 0\n', '').replace('stage: 1', 'stage: "1"');
    const { errors } = validateLesson(src, '01-javascript/00-variables.mdx', stages);
    expect(errors).toContain(
      '01-javascript/00-variables.mdx: frontmatter.order is required (number)',
    );
    expect(errors).toContain('01-javascript/00-variables.mdx: frontmatter.stage must be a number');
  });

  it('reports id/path and stage/dir mismatches', () => {
    const { errors } = validateLesson(good, '02-typescript/00-variables.mdx', stages);
    expect(errors).toContain(
      '02-typescript/00-variables.mdx: frontmatter.id must be "02-typescript/00-variables"',
    );
    expect(errors).toContain(
      '02-typescript/00-variables.mdx: frontmatter.stage must be 2 to match directory 02-typescript',
    );
  });

  it('reports sections out of order and missing', () => {
    const src = good
      .replace('## Concepto\n\nTexto.\n\n', '')
      .replace('## Práctica', '## Práctica\n\n## Concepto');
    const { errors } = validateLesson(src, '01-javascript/00-variables.mdx', stages);
    expect(
      errors.some((e) =>
        e.includes('"## Concepto" must appear after "## Objetivo" and before "## Práctica"'),
      ),
    ).toBe(true);
  });

  it('counts quiz questions and flashcards', () => {
    const src = good.replace(
      '  { prompt: "3", options: [{ text: "x", correct: true, feedback: "ok" }] },\n',
      '',
    );
    const { errors } = validateLesson(src, '01-javascript/00-variables.mdx', stages);
    expect(errors).toContain(
      '01-javascript/00-variables.mdx: Quiz must have exactly 3 questions, found 2',
    );
    const src2 = good.replace('  { front: "e", back: "f" },\n', '');
    expect(validateLesson(src2, '01-javascript/00-variables.mdx', stages).errors).toContain(
      '01-javascript/00-variables.mdx: Flashcards must have 3 to 5 cards, found 2',
    );
  });

  it('requires an interactive component in Práctica and a Challenge in Ejercicio', () => {
    const src = good
      .replace('<Playground lang="js" code={`console.log(1)`} />', 'Sin componente.')
      .replace(/<Challenge[\s\S]*?<\/Challenge>/, 'Sin reto.');
    const { errors } = validateLesson(src, '01-javascript/00-variables.mdx', stages);
    expect(errors).toContain(
      '01-javascript/00-variables.mdx: "## Práctica" needs at least one of Playground, Sandpack, Snack, Terminal, Checklist',
    );
    expect(errors).toContain('01-javascript/00-variables.mdx: "## Ejercicio" needs a Challenge');
  });

  it('skips section and stage checks for hidden lessons', () => {
    const src = good
      .replace('summary: "Resumen."', 'summary: "Resumen."\nhidden: true')
      .replace(/## Concepto[\s\S]*/, '<Snack code={`x`} />\n');
    const result = validateLesson(src, '01-javascript/00-variables.mdx', stages);
    expect(result.errors).toEqual([]);
    expect(result.hidden).toBe(true);
  });
});

describe('validateContent', () => {
  it('passes on the real content directory', () => {
    const result = validateContent(path.resolve(__dirname, '../../content'));
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('reports duplicate ids, missing prereqs and broken links across files', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'saber-content-'));
    mkdirSync(path.join(root, '01-javascript'));
    writeFileSync(path.join(root, 'stages.json'), JSON.stringify(stages));
    writeFileSync(path.join(root, '01-javascript', '00-variables.mdx'), good);
    writeFileSync(
      path.join(root, '01-javascript', '01-tipos.mdx'),
      good
        .replace('id: "01-javascript/00-variables"', 'id: "01-javascript/00-variables"')
        .replace('prereqs: []', 'prereqs: ["01-javascript/99-nope"]'),
    );
    const result = validateContent(root);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      '01-javascript/01-tipos.mdx: frontmatter.id must be "01-javascript/01-tipos"',
    );
    expect(result.errors).toContain(
      '01-javascript/01-tipos.mdx: prereq "01-javascript/99-nope" does not exist',
    );
    expect(result.errors.some((e) => e.includes('duplicate id "01-javascript/00-variables"'))).toBe(
      true,
    );
  });
});
