import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { extractBlock, extractProp } from './lib/validateContent';
import { walkMdx } from './lib/walkMdx';
import { transpile } from '@/ui/organisms/interactive/playground/transpile';
import { buildSrcdoc } from '@/ui/organisms/interactive/playground/buildSrcdoc';
import { TIMEOUT_MS } from '@/ui/organisms/interactive/playground/Playground';

/** Hard ceiling on the fake virtual clock, well beyond the real Playground timeout, so a
 *  setInterval that a lesson snippet never clears cannot spin `drain()` forever: it throws a
 *  clear error instead of hanging the test run. */
const MAX_VIRTUAL_MS = 60_000;

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
 * scheduling order, like a fake event loop. `setInterval` reschedules itself with the same delay
 * until `clearInterval` runs, exactly like the browser; `drain()` refuses to advance the virtual
 * clock past `MAX_VIRTUAL_MS`, so a lesson snippet that forgets to clear its interval fails with a
 * clear error instead of looping forever.
 */
function createFastTimers() {
  let seq = 0;
  let virtualNow = 0;
  const queue: { id: number; at: number; seq: number; run: () => void }[] = [];
  const cleared = new Set<number>();

  function scheduleAt(id: number, at: number, run: () => void): void {
    queue.push({ id, at, seq: (seq += 1), run });
  }
  function setTimeoutImpl(fn: (...args: unknown[]) => void, ms = 0, ...args: unknown[]): number {
    const id = (seq += 1);
    scheduleAt(id, virtualNow + Math.max(0, ms), () => fn(...args));
    return id;
  }
  function setIntervalImpl(fn: (...args: unknown[]) => void, ms = 0, ...args: unknown[]): number {
    const id = (seq += 1);
    const delay = Math.max(1, ms);
    const tick = () => {
      if (cleared.has(id)) return;
      fn(...args);
      if (!cleared.has(id)) scheduleAt(id, virtualNow + delay, tick);
    };
    scheduleAt(id, virtualNow + delay, tick);
    return id;
  }
  function clear(id: number): void {
    cleared.add(id);
    const index = queue.findIndex((t) => t.id === id);
    if (index !== -1) queue.splice(index, 1);
  }
  async function drain(): Promise<void> {
    while (queue.length > 0) {
      queue.sort((a, b) => a.at - b.at || a.seq - b.seq);
      const next = queue.shift();
      if (!next) break;
      if (next.at > MAX_VIRTUAL_MS) {
        throw new Error(
          `Playground harness virtual clock exceeded ${MAX_VIRTUAL_MS}ms: check for a setInterval that is never cleared`,
        );
      }
      virtualNow = next.at;
      next.run();
      // Flush the microtask queue (promise .then/await continuations) so a callback scheduled
      // from this tick is visible in `queue` before the loop condition is checked again.
      for (let i = 0; i < 10; i += 1) await Promise.resolve();
    }
  }
  return {
    setTimeout: setTimeoutImpl,
    clearTimeout: clear,
    setInterval: setIntervalImpl,
    clearInterval: clear,
    drain,
    virtualNow: () => virtualNow,
  };
}

interface HarnessResult {
  posted: Posted[];
  /** Virtual time (ms) at which the sandbox posted `done`, or `null` if it never did. */
  doneAt: number | null;
}

// Executes the exact harness script buildSrcdoc produces, in a real (non-browser but real V8)
// context, so this proves what the sandboxed iframe would actually output for real lesson code
// (see buildSrcdoc.test.ts for the same technique on synthetic payloads).
async function runHarness(code: string, instanceId: string): Promise<HarnessResult> {
  const html = buildSrcdoc(code, instanceId);
  const posted: Posted[] = [];
  const timers = createFastTimers();
  let doneAt: number | null = null;
  const sandbox: Record<string, unknown> = {
    console: {},
    parent: {
      postMessage: (message: Posted) => {
        posted.push(message);
        if (message.level === 'done' && doneAt === null) doneAt = timers.virtualNow();
      },
    },
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
  return { posted, doneAt };
}

/** Evaluates a `` `...` `` template literal or an already-unwrapped `"..."` string, as extracted
 *  by `extractProp` (backticked props keep their delimiters; quoted props do not). */
function evalPropValue(raw: string): string {
  return raw.startsWith('`') ? (new Function(`return (${raw});`)() as string) : raw;
}

function collectExpectations(rootDir: string): PlaygroundExpectation[] {
  const expectations: PlaygroundExpectation[] = [];
  for (const file of walkMdx(rootDir)) {
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

/** Transpiles and runs one Playground snippet, then enforces the same time budget the real
 *  component gives a run (`TIMEOUT_MS`): if `done` never arrives, or arrives after the budget,
 *  the case fails with a message naming the label and the virtual time it took, instead of
 *  silently comparing output that a real user would never have seen (the component would have
 *  shown "timeout" first). Returns the visible output (log/info/warn, excluding error/done). */
async function evaluateExpectation(
  expectation: { code: string; lang: 'js' | 'ts' },
  label: string,
): Promise<string> {
  const transpiled = transpile(expectation.code, expectation.lang);
  if ('error' in transpiled) {
    throw new Error(`${label}: ${transpiled.error}`);
  }
  const { posted, doneAt } = await runHarness(transpiled.code, label);
  if (doneAt === null) {
    throw new Error(`${label}: the sandbox never posted "done" (virtual clock stalled)`);
  }
  if (doneAt > TIMEOUT_MS) {
    throw new Error(
      `${label}: took ${doneAt}ms of virtual time, exceeding the Playground timeout of ${TIMEOUT_MS}ms`,
    );
  }
  return posted
    .filter((m) => m.level !== 'error' && m.level !== 'done')
    .map((m) => m.args.join(' '))
    .join('\n');
}

describe('every Playground "expected" output matches the real sandbox', () => {
  it('found Playground blocks with an expected prop in real content', () => {
    expect(expectations.length).toBeGreaterThan(0);
  });

  it.each(expectations.map((e) => [`${e.relPath} #${e.index}`, e] as const))(
    '%s',
    async (_label, expectation) => {
      const output = await evaluateExpectation(
        expectation,
        `${expectation.relPath} #${expectation.index}`,
      );
      expect(trimTrailing(output)).toBe(trimTrailing(expectation.expected));
    },
  );

  it('fails the time budget for a synthetic snippet that awaits 6 seconds', async () => {
    const code = [
      'await new Promise((resolve) => setTimeout(resolve, 6000));',
      'console.log("too late");',
    ].join('\n');
    await expect(evaluateExpectation({ code, lang: 'js' }, 'synthetic:budget')).rejects.toThrow(
      /exceeding the Playground timeout/,
    );
  });
});
