import { readFileSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { StageMeta } from '@/domain/course';
import { walkMdx } from './walkMdx';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export interface LessonValidation {
  id: string | null;
  stage: number | null;
  order: number | null;
  hidden: boolean;
  prereqs: string[];
  links: string[];
  /** sdkVersion of every Snack in this lesson, in source order; validateContent checks they all
   *  share the same value across the whole content directory. */
  snackSdkVersions: string[];
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
/** Snack embeds it as an iframe `src`; a URL far past this length has historically hit proxy and
 *  browser URL-length limits. The largest current lesson is 6838 characters (04-react-native-expo/11). */
const MAX_SNACK_URL_LENGTH = 7500;
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

const PREREQS_LINE = /^\*\*Prerrequisitos:\*\*.*$/m;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** True when `id` appears on `line` as a whole lesson id (not as part of a longer id). */
function mentionsId(line: string, id: string): boolean {
  return new RegExp(`(^|[^\\w/-])${escapeRegExp(id)}($|[^\\w/-])`).test(line);
}

/**
 * Checks the `**Prerrequisitos:**` line inside the `## Objetivo` section. The line position is
 * found on the masked body but its text is read from the real body, so ids written as inline code
 * still count.
 */
function validatePrereqsLine(
  body: string,
  objective: string,
  offset: number,
  prereqs: string[],
  err: (msg: string) => void,
): void {
  const match = PREREQS_LINE.exec(objective);
  if (!match) {
    err('"## Objetivo" needs a line starting with "**Prerrequisitos:**"');
    return;
  }
  const start = offset + match.index;
  const line = body.slice(start, start + match[0].length);
  if (prereqs.length === 0) {
    if (!/\bninguno\b/i.test(line)) {
      err('"**Prerrequisitos:**" line must say "ninguno" when prereqs is empty');
    }
    return;
  }
  for (const id of prereqs) {
    if (!mentionsId(line, id)) {
      err(`prereq "${id}" is not listed on the "**Prerrequisitos:**" line`);
    }
  }
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

/** A backtick-fence opener's info string may not itself contain a backtick (CommonMark rule);
 *  a tilde-fence opener's info string may contain anything. Up to 3 leading spaces are allowed. */
const BACKTICK_FENCE_OPEN = /^\s{0,3}(`{3,})([^`]*)$/;
const TILDE_FENCE_OPEN = /^\s{0,3}(~{3,}).*$/;

/**
 * Blanks out fenced code blocks (``` or ~~~, opener detected CommonMark-style so an inline span
 * like `` ```x``` more text `` never starts one) so headings and component tags written inside
 * example code are not matched. A fence that is opened but never closed is masked to end of file
 * and its 1-indexed opening line number is returned so the caller can report it.
 */
function maskFencedBlocks(text: string): { masked: string; unterminatedLine: number | null } {
  let fenceChar: string | null = null;
  let fenceLen = 0;
  let openedAtLine: number | null = null;
  const lines = text.split('\n').map((line, index) => {
    if (fenceChar) {
      const closeRegex =
        fenceChar === '`'
          ? new RegExp(`^\\s{0,3}\`{${fenceLen},}\\s*$`)
          : new RegExp(`^\\s{0,3}~{${fenceLen},}\\s*$`);
      if (closeRegex.test(line)) {
        fenceChar = null;
        openedAtLine = null;
      }
      return blankKeepingNewlines(line);
    }
    const open = BACKTICK_FENCE_OPEN.exec(line) ?? TILDE_FENCE_OPEN.exec(line);
    if (open) {
      fenceChar = open[1]![0]!;
      fenceLen = open[1]!.length;
      openedAtLine = index + 1;
      return blankKeepingNewlines(line);
    }
    return line;
  });
  return { masked: lines.join('\n'), unterminatedLine: fenceChar ? openedAtLine : null };
}

/** Blanks out MDX comment blocks, i.e. `{/` + `* ... *` + `/}`, which may span several lines. */
function maskComments(text: string): string {
  return text.replace(/\{\/\*[\s\S]*?\*\/\}/g, (m) => blankKeepingNewlines(m));
}

/** Blanks out single-line inline code spans (`` `...` ``) so a component mentioned in prose, e.g.
 *  `` `<Sandpack />` ``, is not mistaken for real usage. Multi-line backtick-quoted content (JSX
 *  template-literal props) is left untouched. */
function maskInlineCodeSpans(text: string): string {
  return text.replace(/`[^`\n]*`/g, (m) => blankKeepingNewlines(m));
}

/**
 * Blanks fenced code blocks, MDX comments and inline code spans so headings, components and links
 * written inside them are ignored. Comments are masked before fences, so a fence-like line inside a
 * comment is never treated as a real fence.
 */
function maskNonContent(text: string): string {
  return maskNonContentWithDiagnostics(text).masked;
}

function maskNonContentWithDiagnostics(text: string): {
  masked: string;
  unterminatedFenceLine: number | null;
} {
  const withoutComments = maskComments(text);
  const { masked, unterminatedLine } = maskFencedBlocks(withoutComments);
  return { masked: maskInlineCodeSpans(masked), unterminatedFenceLine: unterminatedLine };
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
 * located on a masked copy of `source` (fenced code, MDX comments and inline code spans blanked
 * out) so an example `<Tag ... />` written inside a code fence, comment or inline code span is
 * skipped, but the returned text is sliced from the real, unmasked `source`.
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
 * Mirrors `buildSnackUrl` in src/ui/organisms/interactive/Snack.tsx (kept in sync manually):
 * importing that module here would pull in its `.css` module import, which `tsx` (the plain
 * Node runtime `pnpm validate:content` uses, with no bundler) cannot resolve.
 */
function snackEmbedUrlLength(props: {
  code: string;
  dependencies?: Record<string, string>;
  platform: string;
  sdkVersion?: string;
}): number {
  const files = { 'App.tsx': { type: 'CODE', contents: props.code } };
  const params = new URLSearchParams({
    platform: props.platform,
    preview: 'true',
    theme: 'light',
    files: JSON.stringify(files),
  });
  if (props.dependencies && Object.keys(props.dependencies).length > 0) {
    params.set(
      'dependencies',
      Object.entries(props.dependencies)
        .map(([name, version]) => `${name}@${version}`)
        .join(','),
    );
  }
  if (props.sdkVersion) params.set('sdkVersion', props.sdkVersion);
  return `https://snack.expo.dev/embedded?${params.toString()}`.length;
}

/**
 * Resolves a prop value extracted by `extractProp` to its real string: a `` `...` `` template
 * literal is evaluated, a `"..."` string is already unwrapped. Returns null when the value is not
 * a string (a parse failure counts as "not a string" here, rather than throwing).
 */
function evalPropStringLiteral(raw: string): string | null {
  if (!raw.startsWith('`')) return raw;
  try {
    const value = evalLiteral(raw);
    return typeof value === 'string' ? value : null;
  } catch {
    return null;
  }
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
    return {
      id: null,
      stage: null,
      order: null,
      hidden: false,
      prereqs: [],
      links: [],
      snackSdkVersions: [],
      errors,
    };
  }

  for (const field of FIELDS) {
    const value = data[field.name];
    if (value === undefined) {
      if (!field.optional) err(`frontmatter.${field.name} is required (${field.type})`);
      continue;
    }
    if (!hasType(value, field.type)) err(`frontmatter.${field.name} must be a ${field.type}`);
  }
  for (const name of ['title', 'summary']) {
    const value = data[name];
    if (typeof value === 'string' && value.trim() === '') {
      err(`frontmatter.${name} must be a non-empty string`);
    }
  }
  if (typeof data.minutes === 'number' && !(data.minutes > 0)) {
    err('frontmatter.minutes must be greater than 0');
  }
  const prereqs =
    Array.isArray(data.prereqs) && hasType(data.prereqs, 'string[]')
      ? (data.prereqs as string[])
      : [];

  const expectedId = relPath.replace(/\.mdx$/, '');
  const dir = expectedId.split('/')[0] ?? '';
  const stage = stages.find((s) => s.slug === dir);
  if (data.id !== expectedId) err(`frontmatter.id must be "${expectedId}"`);
  if (!stage) err(`directory "${dir}" is not a stage slug in stages.json`);
  else if (typeof data.stage === 'number' && data.stage !== stage.id) {
    err(`frontmatter.stage must be ${stage.id} to match directory ${dir}`);
  }

  const hidden = data.hidden === true;
  const { masked: maskedBody, unterminatedFenceLine } = maskNonContentWithDiagnostics(body);
  if (unterminatedFenceLine !== null) {
    err(`unterminated code fence opened at line ${unterminatedFenceLine}`);
  }

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

    const objective = positions[0];
    if (objective !== undefined && objective !== -1) {
      const concept = positions[1] ?? -1;
      const section = maskedBody.slice(objective, concept === -1 ? undefined : concept);
      validatePrereqsLine(body, section, objective, prereqs, err);
    }

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

  // Every Snack must declare an sdkVersion (validateContent checks they all agree across content)
  // and its generated embed URL must stay within MAX_SNACK_URL_LENGTH.
  const snackSdkVersions: string[] = [];
  let snackFrom = 0;
  for (;;) {
    const block = extractBlock(body, 'Snack', snackFrom);
    if (!block) break;
    snackFrom = block.end;
    const sdkVersion = extractProp(block.text, 'Snack', 'sdkVersion');
    if (sdkVersion === null) err('Snack is missing "sdkVersion"');
    else snackSdkVersions.push(sdkVersion);

    const codeRaw = extractProp(block.text, 'Snack', 'code');
    const code = codeRaw !== null ? evalPropStringLiteral(codeRaw) : null;
    if (code !== null) {
      const platform = extractProp(block.text, 'Snack', 'platform') ?? 'ios';
      const dependenciesRaw = extractProp(block.text, 'Snack', 'dependencies');
      let dependencies: Record<string, string> | undefined;
      if (dependenciesRaw !== null) {
        try {
          const parsed = evalLiteral(dependenciesRaw);
          if (parsed !== null && typeof parsed === 'object') {
            dependencies = parsed as Record<string, string>;
          }
        } catch {
          // A malformed dependencies literal is not this check's concern; skip it.
        }
      }
      const urlLength = snackEmbedUrlLength({
        code,
        dependencies,
        platform,
        sdkVersion: sdkVersion ?? undefined,
      });
      if (urlLength > MAX_SNACK_URL_LENGTH) {
        err(
          `Snack embed URL is ${urlLength} characters, exceeding the ${MAX_SNACK_URL_LENGTH} limit`,
        );
      }
    }
  }

  // Every Playground "expected" prop, when present, must be a non-empty string.
  let playgroundFrom = 0;
  for (;;) {
    const block = extractBlock(body, 'Playground', playgroundFrom);
    if (!block) break;
    playgroundFrom = block.end;
    const raw = extractProp(block.text, 'Playground', 'expected');
    if (raw === null) continue;
    const value = evalPropStringLiteral(raw);
    if (value === null || value.trim() === '') {
      err('Playground "expected" must be a non-empty string when present');
    }
  }

  const links: string[] = [];
  for (const match of maskedBody.matchAll(/\]\(\/etapa\/([^)#?\s]+)/g)) {
    links.push(match[1]!.replace(/\/$/, ''));
  }

  return {
    id: typeof data.id === 'string' ? data.id : null,
    stage: stage ? stage.id : null,
    order: typeof data.order === 'number' ? data.order : null,
    hidden,
    prereqs,
    links,
    snackSdkVersions,
    errors,
  };
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
  const files = walkMdx(rootDir);
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
  const orders = new Map<string, string>();
  for (const r of results) {
    if (r.stage === null || r.order === null) continue;
    const key = `${r.stage}:${r.order}`;
    const previous = orders.get(key);
    if (previous) {
      errors.push(
        `${r.relPath}: duplicate order ${r.order} in stage ${r.stage}, already used by ${previous}`,
      );
    } else {
      orders.set(key, r.relPath);
    }
  }
  for (const r of results) {
    for (const p of r.prereqs)
      if (!ids.has(p)) errors.push(`${r.relPath}: prereq "${p}" does not exist`);
    for (const l of r.links)
      if (!ids.has(l)) errors.push(`${r.relPath}: link "/etapa/${l}" does not resolve to a lesson`);
  }
  let baselineSdkVersion: { value: string; relPath: string } | null = null;
  for (const r of results) {
    for (const v of r.snackSdkVersions) {
      if (!baselineSdkVersion) {
        baselineSdkVersion = { value: v, relPath: r.relPath };
      } else if (v !== baselineSdkVersion.value) {
        errors.push(
          `${r.relPath}: Snack sdkVersion "${v}" does not match "${baselineSdkVersion.value}" used in ${baselineSdkVersion.relPath}`,
        );
      }
    }
  }
  return { ok: errors.length === 0, errors };
}
