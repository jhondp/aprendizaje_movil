import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { extractBlock, extractProp } from './lib/validateContent';
import { transpile } from '@/ui/organisms/interactive/playground/transpile';
import { buildSrcdoc } from '@/ui/organisms/interactive/playground/buildSrcdoc';

interface Posted {
  type: string;
  id: string;
  level: string;
  args: string[];
}

interface PlaygroundExpectation {
  relPath: string;
  index: number;
  lang: 'js' | 'ts';
  code: string;
  expected: string;
}

function scriptBody(html: string): string {
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  const body = match?.[1];
  if (body === undefined) throw new Error('script tag not found in srcdoc');
  return body;
}

/**
 * A virtual-time setTimeout/setInterval so lessons that simulate a delay (chained `setTimeout`
 * inside a `Promise`, e.g. 01-javascript/11-callbacks-y-promesas) settle instantly instead of the
 * test suite waiting on real wall-clock time. Timers fire in delay order, ties broken by
 * scheduling order, like a fake event loop.
 */
function createFastTimers() {
  let seq = 0;
  let virtualNow = 0;
  const queue: { id: number; at: number; seq: number; run: () => void }[] = [];

  function schedule(fn: (...args: unknown[]) => void, ms = 0, ...args: unknown[]): number {
    const id = (seq += 1);
    queue.push({ id, at: virtualNow + Math.max(0, ms), seq: id, run: () => fn(...args) });
    return id;
  }
  function clear(id: number): void {
    const index = queue.findIndex((t) => t.id === id);
    if (index !== -1) queue.splice(index, 1);
  }
  async function drain(): Promise<void> {
    while (queue.length > 0) {
      queue.sort((a, b) => a.at - b.at || a.seq - b.seq);
      const next = queue.shift();
      if (!next) break;
      virtualNow = next.at;
      next.run();
      // Flush the microtask queue (promise .then/await continuations) so a callback scheduled
      // from this tick is visible in `queue` before the loop condition is checked again.
      for (let i = 0; i < 10; i += 1) await Promise.resolve();
    }
  }
  return {
    setTimeout: schedule,
    clearTimeout: clear,
    setInterval: schedule,
    clearInterval: clear,
    drain,
  };
}

// Executes the exact harness script buildSrcdoc produces, in a real (non-browser but real V8)
// context, so this proves what the sandboxed iframe would actually output for real lesson code
// (see buildSrcdoc.test.ts for the same technique on synthetic payloads).
async function runHarness(code: string, instanceId: string): Promise<Posted[]> {
  const html = buildSrcdoc(code, instanceId);
  const posted: Posted[] = [];
  const timers = createFastTimers();
  const sandbox: Record<string, unknown> = {
    console: {},
    parent: { postMessage: (message: Posted) => posted.push(message) },
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
    setInterval: timers.setInterval,
    clearInterval: timers.clearInterval,
    // Standard Web Platform globals a real (sandboxed) iframe provides, which a bare vm context
    // does not: lessons that encode/decode demo tokens (e.g. a JWT) rely on these.
    btoa,
    atob,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(scriptBody(html), sandbox);
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
  await timers.drain();
  return posted;
}

/** Evaluates a `` `...` `` template literal or an already-unwrapped `"..."` string, as extracted
 *  by `extractProp` (backticked props keep their delimiters; quoted props do not). */
function evalPropValue(raw: string): string {
  return raw.startsWith('`') ? (new Function(`return (${raw});`)() as string) : raw;
}

function walkMdxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkMdxFiles(full));
    else if (entry.endsWith('.mdx')) out.push(full);
  }
  return out.sort();
}

function collectExpectations(rootDir: string): PlaygroundExpectation[] {
  const expectations: PlaygroundExpectation[] = [];
  for (const file of walkMdxFiles(rootDir)) {
    const relPath = path.relative(rootDir, file).split(path.sep).join('/');
    const source = readFileSync(file, 'utf8');
    let from = 0;
    let index = 0;
    for (;;) {
      const block = extractBlock(source, 'Playground', from);
      if (!block) break;
      from = block.end;
      const expectedRaw = extractProp(block.text, 'Playground', 'expected');
      const codeRaw = extractProp(block.text, 'Playground', 'code');
      if (expectedRaw !== null && codeRaw !== null) {
        const langRaw = extractProp(block.text, 'Playground', 'lang');
        expectations.push({
          relPath,
          index,
          lang: langRaw === 'ts' ? 'ts' : 'js',
          code: evalPropValue(codeRaw),
          expected: evalPropValue(expectedRaw),
        });
      }
      index += 1;
    }
  }
  return expectations;
}

const CONTENT_ROOT = path.resolve(__dirname, '../content');
const expectations = collectExpectations(CONTENT_ROOT);

/** Only trailing whitespace is normalized; the sandbox is the source of truth for the rest. */
function trimTrailing(text: string): string {
  return text.replace(/\s+$/, '');
}

describe('every Playground "expected" output matches the real sandbox', () => {
  it('found Playground blocks with an expected prop in real content', () => {
    expect(expectations.length).toBeGreaterThan(0);
  });

  it.each(expectations.map((e) => [`${e.relPath} #${e.index}`, e] as const))(
    '%s',
    async (_label, expectation) => {
      const transpiled = transpile(expectation.code, expectation.lang);
      if ('error' in transpiled) {
        throw new Error(`${expectation.relPath} #${expectation.index}: ${transpiled.error}`);
      }
      const posted = await runHarness(
        transpiled.code,
        `${expectation.relPath}:${expectation.index}`,
      );
      const output = posted
        .filter((m) => m.level !== 'error' && m.level !== 'done')
        .map((m) => m.args.join(' '))
        .join('\n');
      expect(trimTrailing(output)).toBe(trimTrailing(expectation.expected));
    },
  );
});
