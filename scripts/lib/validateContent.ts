import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { StageMeta } from '@/domain/course';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export interface LessonValidation {
  id: string | null;
  stage: number | null;
  hidden: boolean;
  prereqs: string[];
  links: string[];
  errors: string[];
}

export interface QuizOptionSource {
  text: string;
  correct: boolean;
  feedback: string;
}

export interface QuizQuestionSource {
  prompt: string;
  options: QuizOptionSource[];
}

const SECTION_MARKERS = [
  '## Objetivo',
  '## Concepto',
  '## Práctica',
  '## Ejercicio',
  '## Errores comunes',
  '<Flashcards',
  '<Quiz',
];
const PRACTICE_COMPONENTS = ['Playground', 'Sandpack', 'Snack', 'Terminal', 'Checklist'];
/** Components forbidden per stage id (spec section 4); the label is used in the error message. */
const STAGE_LIMITS: { component: string; maxStage: number; label: string }[] = [
  { component: 'Sandpack', maxStage: 2, label: 'stages 0 to 2' },
  { component: 'Snack', maxStage: 3, label: 'stages 0 to 3' },
];

type Field = {
  name: string;
  type: 'string' | 'number' | 'string[]' | 'boolean';
  optional?: boolean;
};

const FIELDS: Field[] = [
  { name: 'id', type: 'string' },
  { name: 'title', type: 'string' },
  { name: 'stage', type: 'number' },
  { name: 'module', type: 'string' },
  { name: 'order', type: 'number' },
  { name: 'minutes', type: 'number' },
  { name: 'prereqs', type: 'string[]' },
  { name: 'summary', type: 'string' },
  { name: 'hidden', type: 'boolean', optional: true },
];

function hasType(value: unknown, type: Field['type']): boolean {
  if (type === 'string[]') return Array.isArray(value) && value.every((v) => typeof v === 'string');
  return typeof value === type;
}

/**
 * Walks `source` from `from` and returns the index just past the `{...}` group that starts at
 * `from`, ignoring braces inside '...', "..." and `...` strings. Returns -1 when unbalanced.
 */
function skipBraceGroup(source: string, from: number): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = from; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (ch === '\\') i += 1;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') quote = ch;
    else if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

/** Returns the source slice of a self-closing JSX block starting at `<Tag`, balancing `{}` braces. */
export function extractBlock(
  source: string,
  tag: string,
  from = 0,
): { start: number; end: number; text: string } | null {
  const start = source.indexOf(`<${tag}`, from);
  if (start === -1) return null;
  let i = start;
  while (i < source.length - 1) {
    const ch = source[i];
    if (ch === '{') {
      const next = skipBraceGroup(source, i);
      if (next === -1) break;
      i = next;
      continue;
    }
    if (ch === '/' && source[i + 1] === '>') {
      return { start, end: i + 2, text: source.slice(start, i + 2) };
    }
    i += 1;
  }
  return { start, end: source.length, text: source.slice(start) };
}

/**
 * Raw text of `prop="..."` (without quotes) or `prop={...}` (without the outer braces) inside the
 * first `<component ... />` block. Returns null when the block or the prop is absent.
 */
export function extractProp(source: string, component: string, prop: string): string | null {
  const block = extractBlock(source, component);
  if (!block) return null;
  const match = new RegExp(`[\\s]${prop}=`).exec(block.text);
  if (!match) return null;
  const valueStart = match.index + match[0].length;
  const first = block.text[valueStart];
  if (first === '"') {
    const close = block.text.indexOf('"', valueStart + 1);
    return close === -1 ? null : block.text.slice(valueStart + 1, close);
  }
  if (first === '{') {
    const end = skipBraceGroup(block.text, valueStart);
    return end === -1 ? null : block.text.slice(valueStart + 1, end - 1);
  }
  return null;
}

/**
 * Parses the `questions={[...]}` literal of the first `<Quiz` block. The literal is trusted repo
 * content, so it is evaluated as a JavaScript array expression. Returns [] when absent or invalid.
 */
export function extractQuizQuestions(source: string): QuizQuestionSource[] {
  const raw = extractProp(source, 'Quiz', 'questions');
  if (!raw) return [];
  try {
    const value = new Function(`return (${raw});`)() as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter(
      (q): q is QuizQuestionSource =>
        typeof q === 'object' && q !== null && typeof (q as QuizQuestionSource).prompt === 'string',
    );
  } catch {
    return [];
  }
}

function countOccurrences(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

export function validateLesson(
  source: string,
  relPath: string,
  stages: StageMeta[],
): LessonValidation {
  const errors: string[] = [];
  const err = (msg: string) => errors.push(`${relPath}: ${msg}`);
  let data: Record<string, unknown> = {};
  let body = source;
  try {
    const parsed = matter(source);
    data = parsed.data as Record<string, unknown>;
    body = parsed.content;
  } catch (e) {
    err(`frontmatter could not be parsed (${e instanceof Error ? e.message : String(e)})`);
    return { id: null, stage: null, hidden: false, prereqs: [], links: [], errors };
  }

  for (const field of FIELDS) {
    const value = data[field.name];
    if (value === undefined) {
      if (!field.optional) err(`frontmatter.${field.name} is required (${field.type})`);
      continue;
    }
    if (!hasType(value, field.type)) err(`frontmatter.${field.name} must be a ${field.type}`);
  }

  const expectedId = relPath.replace(/\.mdx$/, '');
  const dir = expectedId.split('/')[0] ?? '';
  const stage = stages.find((s) => s.slug === dir);
  if (data.id !== expectedId) err(`frontmatter.id must be "${expectedId}"`);
  if (!stage) err(`directory "${dir}" is not a stage slug in stages.json`);
  else if (typeof data.stage === 'number' && data.stage !== stage.id) {
    err(`frontmatter.stage must be ${stage.id} to match directory ${dir}`);
  }

  const hidden = data.hidden === true;

  if (!hidden) {
    const positions = SECTION_MARKERS.map((marker) => body.indexOf(marker));
    positions.forEach((pos, i) => {
      const marker = SECTION_MARKERS[i]!;
      if (pos === -1) {
        err(`missing section "${marker}"`);
        return;
      }
      const before = SECTION_MARKERS[i - 1];
      const after = SECTION_MARKERS[i + 1];
      const prevPos = positions[i - 1] ?? -1;
      const nextPos = positions[i + 1] ?? Number.MAX_SAFE_INTEGER;
      if (
        (before !== undefined && prevPos !== -1 && pos < prevPos) ||
        (after !== undefined && nextPos !== -1 && pos > nextPos)
      ) {
        err(`"${marker}" must appear after "${before ?? 'start'}" and before "${after ?? 'end'}"`);
      }
    });

    const practice = body.indexOf('## Práctica');
    const exercise = body.indexOf('## Ejercicio');
    const mistakes = body.indexOf('## Errores comunes');
    if (practice !== -1) {
      const section = body.slice(practice, exercise === -1 ? undefined : exercise);
      if (!PRACTICE_COMPONENTS.some((c) => section.includes(`<${c}`))) {
        err(`"## Práctica" needs at least one of ${PRACTICE_COMPONENTS.join(', ')}`);
      }
    }
    if (exercise !== -1) {
      const section = body.slice(exercise, mistakes === -1 ? undefined : mistakes);
      if (!section.includes('<Challenge')) err(`"## Ejercicio" needs a Challenge`);
    }

    if (stage) {
      for (const limit of STAGE_LIMITS) {
        if (stage.id <= limit.maxStage && body.includes(`<${limit.component}`)) {
          err(`${limit.component} is not allowed in stage ${stage.id} (${limit.label})`);
        }
      }
    }
  }

  const quizCount = countOccurrences(body, '<Quiz');
  if (!hidden && quizCount !== 1) err(`lesson must have exactly one Quiz, found ${quizCount}`);
  const quiz = extractBlock(body, 'Quiz');
  if (quiz) {
    const prompts = countOccurrences(quiz.text, 'prompt:');
    if (prompts !== 3) err(`Quiz must have exactly 3 questions, found ${prompts}`);
  }

  const cardsCount = countOccurrences(body, '<Flashcards');
  if (!hidden && cardsCount !== 1)
    err(`lesson must have exactly one Flashcards, found ${cardsCount}`);
  const cards = extractBlock(body, 'Flashcards');
  if (cards) {
    const fronts = countOccurrences(cards.text, 'front:');
    if (fronts < 3 || fronts > 5) err(`Flashcards must have 3 to 5 cards, found ${fronts}`);
  }

  const links: string[] = [];
  for (const match of body.matchAll(/\]\(\/etapa\/([^)#?\s]+)/g)) {
    links.push(match[1]!.replace(/\/$/, ''));
  }

  const prereqs = Array.isArray(data.prereqs) ? (data.prereqs as string[]) : [];
  return {
    id: typeof data.id === 'string' ? data.id : null,
    stage: stage ? stage.id : null,
    hidden,
    prereqs,
    links,
    errors,
  };
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.mdx')) out.push(full);
  }
  return out.sort();
}

export function validateContent(rootDir: string): ValidationResult {
  const errors: string[] = [];
  const stages = JSON.parse(readFileSync(path.join(rootDir, 'stages.json'), 'utf8')) as StageMeta[];
  const files = walk(rootDir);
  const seen = new Map<string, string>();
  const results = files.map((file) => {
    const relPath = path.relative(rootDir, file).split(path.sep).join('/');
    const result = validateLesson(readFileSync(file, 'utf8'), relPath, stages);
    errors.push(...result.errors);
    return { relPath, ...result };
  });
  const ids = new Set<string>();
  for (const r of results) {
    if (!r.id) continue;
    const previous = seen.get(r.id);
    if (previous) errors.push(`${r.relPath}: duplicate id "${r.id}" already used by ${previous}`);
    seen.set(r.id, r.relPath);
    ids.add(r.id);
  }
  for (const r of results) {
    for (const p of r.prereqs)
      if (!ids.has(p)) errors.push(`${r.relPath}: prereq "${p}" does not exist`);
    for (const l of r.links)
      if (!ids.has(l)) errors.push(`${r.relPath}: link "/etapa/${l}" does not resolve to a lesson`);
  }
  return { ok: errors.length === 0, errors };
}
