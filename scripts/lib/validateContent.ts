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

/** Section headings and components, in required order. Headings are matched as whole lines. */
const SECTION_MARKERS: { name: string; regex: RegExp }[] = [
  { name: '## Objetivo', regex: /^## Objetivo[ \t]*$/m },
  { name: '## Concepto', regex: /^## Concepto[ \t]*$/m },
  { name: '## Práctica', regex: /^## Práctica[ \t]*$/m },
  { name: '## Ejercicio', regex: /^## Ejercicio[ \t]*$/m },
  { name: '## Errores comunes', regex: /^## Errores comunes[ \t]*$/m },
  { name: '<Flashcards', regex: /<Flashcards\b/ },
  { name: '<Quiz', regex: /<Quiz\b/ },
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

function describeError(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function isErrnoException(e: unknown): e is NodeJS.ErrnoException {
  return e instanceof Error && 'code' in e;
}

/** Replaces every non-newline character with a space, so line/column positions stay valid. */
function blankKeepingNewlines(text: string): string {
  return text.replace(/[^\n]/g, ' ');
}

/**
 * Blanks out fenced code blocks (``` or ~~~, any language, closing fence at least as long as the
 * opening one) so headings and component tags written inside example code are not matched.
 */
function maskFencedBlocks(text: string): string {
  let fenceChar: string | null = null;
  let fenceLen = 0;
  const lines = text.split('\n').map((line) => {
    const trimmed = line.trim();
    const fenceMatch = /^([`~]{3,})/.exec(trimmed);
    if (fenceChar) {
      if (
        fenceMatch &&
        fenceMatch[1]!.startsWith(fenceChar) &&
        fenceMatch[1]!.length >= fenceLen &&
        trimmed === fenceMatch[1]
      ) {
        fenceChar = null;
      }
      return blankKeepingNewlines(line);
    }
    if (fenceMatch) {
      fenceChar = fenceMatch[1]![0]!;
      fenceLen = fenceMatch[1]!.length;
      return blankKeepingNewlines(line);
    }
    return line;
  });
  return lines.join('\n');
}

/** Blanks out MDX comment blocks, i.e. `{/` + `* ... *` + `/}`, which may span several lines. */
function maskComments(text: string): string {
  return text.replace(/\{\/\*[\s\S]*?\*\/\}/g, (m) => blankKeepingNewlines(m));
}

/** Blanks fenced code blocks and MDX comments so headings/components/links inside them are ignored. */
function maskNonContent(text: string): string {
  return maskComments(maskFencedBlocks(text));
}

function countMatches(text: string, regex: RegExp): number {
  const flags = regex.flags.includes('g') ? regex.flags : `${regex.flags}g`;
  return (text.match(new RegExp(regex.source, flags)) ?? []).length;
}

function hasTag(text: string, tag: string): boolean {
  return new RegExp(`<${tag}\\b`).test(text);
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

/**
 * Returns the source slice of a self-closing JSX block starting at `<Tag` (word-boundary matched,
 * so `<Quiz` never matches `<QuizIntro`), balancing `{}` braces. The tag's start position is
 * located on a masked copy of `source` (fenced code and MDX comments blanked out) so an example
 * `<Tag ... />` written inside a code fence or comment is skipped, but the returned text is sliced
 * from the real, unmasked `source`.
 */
export function extractBlock(
  source: string,
  tag: string,
  from = 0,
): { start: number; end: number; text: string } | null {
  const masked = maskNonContent(source).slice(from);
  const match = new RegExp(`<${tag}\\b`).exec(masked);
  if (!match) return null;
  const start = from + match.index;
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

/** Evaluates a trusted repo-content array/object literal. Throws (with the parser's message) on failure. */
function evalLiteral(raw: string): unknown {
  return new Function(`return (${raw});`)();
}

/**
 * Parses the `questions={[...]}` literal of the first `<Quiz` block. The literal is trusted repo
 * content, so it is evaluated as a JavaScript array expression. Returns [] when absent or invalid;
 * `validateLesson` uses the throwing `evalLiteral` directly so it can report the parse error.
 */
export function extractQuizQuestions(source: string): QuizQuestionSource[] {
  const raw = extractProp(source, 'Quiz', 'questions');
  if (!raw) return [];
  try {
    const value = evalLiteral(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (q): q is QuizQuestionSource =>
        typeof q === 'object' && q !== null && typeof (q as QuizQuestionSource).prompt === 'string',
    );
  } catch {
    return [];
  }
}

function validateQuizQuestions(questions: unknown[], err: (msg: string) => void): void {
  if (questions.length !== 3) err(`Quiz must have exactly 3 questions, found ${questions.length}`);
  questions.forEach((raw, i) => {
    const n = i + 1;
    if (typeof raw !== 'object' || raw === null) {
      err(`Quiz question ${n} must be an object`);
      return;
    }
    const question = raw as Record<string, unknown>;
    if (typeof question.prompt !== 'string') err(`Quiz question ${n} must have a string prompt`);
    const options = question.options;
    if (!Array.isArray(options) || options.length < 2) {
      err(`Quiz question ${n} must have at least 2 options`);
      return;
    }
    let correctCount = 0;
    options.forEach((rawOption, j) => {
      const m = j + 1;
      if (typeof rawOption !== 'object' || rawOption === null) {
        err(`Quiz question ${n} option ${m} must be an object`);
        return;
      }
      const option = rawOption as Record<string, unknown>;
      if (typeof option.text !== 'string')
        err(`Quiz question ${n} option ${m} must have a string text`);
      if (typeof option.correct !== 'boolean') {
        err(`Quiz question ${n} option ${m} must have a boolean correct`);
      } else if (option.correct) {
        correctCount += 1;
      }
      if (typeof option.feedback !== 'string') {
        err(`Quiz question ${n} option ${m} must have a string feedback`);
      }
    });
    if (correctCount !== 1) {
      err(`Quiz question ${n} must have exactly one correct option, found ${correctCount}`);
    }
  });
}

function validateFlashcardsCards(cards: unknown[], err: (msg: string) => void): void {
  if (cards.length < 3 || cards.length > 5) {
    err(`Flashcards must have 3 to 5 cards, found ${cards.length}`);
  }
  cards.forEach((raw, i) => {
    const n = i + 1;
    if (typeof raw !== 'object' || raw === null) {
      err(`Flashcards card ${n} must be an object`);
      return;
    }
    const card = raw as Record<string, unknown>;
    if (typeof card.front !== 'string') err(`Flashcards card ${n} must have a string front`);
    if (typeof card.back !== 'string') err(`Flashcards card ${n} must have a string back`);
  });
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
    err(`frontmatter could not be parsed (${describeError(e)})`);
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
  const maskedBody = maskNonContent(body);

  if (!hidden) {
    const positions = SECTION_MARKERS.map(({ regex }) => regex.exec(maskedBody)?.index ?? -1);
    positions.forEach((pos, i) => {
      const marker = SECTION_MARKERS[i]!.name;
      if (pos === -1) {
        err(`missing section "${marker}"`);
        return;
      }
      const before = SECTION_MARKERS[i - 1]?.name;
      const after = SECTION_MARKERS[i + 1]?.name;
      const prevPos = positions[i - 1] ?? -1;
      const nextPos = positions[i + 1] ?? Number.MAX_SAFE_INTEGER;
      if (
        (before !== undefined && prevPos !== -1 && pos < prevPos) ||
        (after !== undefined && nextPos !== -1 && pos > nextPos)
      ) {
        err(`"${marker}" must appear after "${before ?? 'start'}" and before "${after ?? 'end'}"`);
      }
    });

    const practice = positions[2];
    const exercise = positions[3];
    const mistakes = positions[4];
    if (practice !== -1) {
      const section = maskedBody.slice(practice, exercise === -1 ? undefined : exercise);
      if (!PRACTICE_COMPONENTS.some((c) => hasTag(section, c))) {
        err(`"## Práctica" needs at least one of ${PRACTICE_COMPONENTS.join(', ')}`);
      }
    }
    if (exercise !== -1) {
      const section = maskedBody.slice(exercise, mistakes === -1 ? undefined : mistakes);
      if (!hasTag(section, 'Challenge')) err(`"## Ejercicio" needs a Challenge`);
    }

    if (stage) {
      for (const limit of STAGE_LIMITS) {
        if (stage.id <= limit.maxStage && hasTag(maskedBody, limit.component)) {
          err(`${limit.component} is not allowed in stage ${stage.id} (${limit.label})`);
        }
      }
    }
  }

  const quizMatches = countMatches(maskedBody, /<Quiz\b/g);
  if (!hidden && quizMatches !== 1) err(`lesson must have exactly one Quiz, found ${quizMatches}`);
  const quizBlock = extractBlock(body, 'Quiz');
  if (quizBlock) {
    const raw = extractProp(body, 'Quiz', 'questions');
    if (raw === null) {
      err('Quiz questions literal could not be parsed (missing "questions" prop)');
    } else {
      try {
        const parsed = evalLiteral(raw);
        if (!Array.isArray(parsed)) throw new Error('questions must be an array');
        validateQuizQuestions(parsed, err);
      } catch (e) {
        err(`Quiz questions literal could not be parsed (${describeError(e)})`);
      }
    }
  }

  const cardsMatches = countMatches(maskedBody, /<Flashcards\b/g);
  if (!hidden && cardsMatches !== 1) {
    err(`lesson must have exactly one Flashcards, found ${cardsMatches}`);
  }
  const cardsBlock = extractBlock(body, 'Flashcards');
  if (cardsBlock) {
    const raw = extractProp(body, 'Flashcards', 'cards');
    if (raw === null) {
      err('Flashcards cards literal could not be parsed (missing "cards" prop)');
    } else {
      try {
        const parsed = evalLiteral(raw);
        if (!Array.isArray(parsed)) throw new Error('cards must be an array');
        validateFlashcardsCards(parsed, err);
      } catch (e) {
        err(`Flashcards cards literal could not be parsed (${describeError(e)})`);
      }
    }
  }

  const links: string[] = [];
  for (const match of maskedBody.matchAll(/\]\(\/etapa\/([^)#?\s]+)/g)) {
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
  const stagesPath = path.join(rootDir, 'stages.json');
  let raw: string;
  try {
    raw = readFileSync(stagesPath, 'utf8');
  } catch (e) {
    const reason = isErrnoException(e) && e.code === 'ENOENT' ? 'file not found' : describeError(e);
    return { ok: false, errors: [`content/stages.json: ${reason}`] };
  }
  let stages: StageMeta[];
  try {
    stages = JSON.parse(raw) as StageMeta[];
  } catch (e) {
    return { ok: false, errors: [`content/stages.json: invalid JSON (${describeError(e)})`] };
  }

  const errors: string[] = [];
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
