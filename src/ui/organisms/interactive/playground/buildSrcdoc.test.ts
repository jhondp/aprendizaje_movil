import vm from 'node:vm';
import { buildSrcdoc } from './buildSrcdoc';

interface Posted {
  type: string;
  id: string;
  level: string;
  args: string[];
}

function scriptBody(html: string): string {
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  const body = match?.[1];
  if (body === undefined) throw new Error('script tag not found in srcdoc');
  return body;
}

// Executes the exact harness script buildSrcdoc produces, in a real (non-browser
// but real V8) JS context, so these tests prove what the sandboxed iframe would
// actually do — not just what the generated source string looks like. jsdom does
// not run <iframe srcDoc> scripts at all, so this is the only way to exercise the
// harness's runtime behavior; Playground.test.tsx instead drives the component
// through simulated `message` events (see the note there).
async function runHarness(code: string, instanceId: string): Promise<Posted[]> {
  const html = buildSrcdoc(code, instanceId);
  const posted: Posted[] = [];
  const sandbox: Record<string, unknown> = {
    console: {},
    parent: { postMessage: (message: Posted) => posted.push(message) },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(scriptBody(html), sandbox);
  // The harness's outer function is an async IIFE; flush its microtask queue.
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  return posted;
}

describe('buildSrcdoc', () => {
  it('embeds the instance id and the learner code', () => {
    const html = buildSrcdoc('console.log("hi")', 'pg-1');
    expect(html).toContain('pg-1');
    expect(html).toContain('console.log(\\"hi\\")');
    expect(html).toContain('saber-playground');
  });

  it('produces no raw "<" inside the script element for </script>, </SCRIPT> and <!--<script> payloads', () => {
    const payloads = [
      'const s = "</script><b>x</b>";',
      'const s = "</SCRIPT>";',
      'const s = "<!--<script>";',
    ];
    for (const code of payloads) {
      const body = scriptBody(buildSrcdoc(code, 'pg-2'));
      expect(body).not.toMatch(/</);
    }
  });

  it('reports a JS syntax error as an error message instead of hanging', async () => {
    const posted = await runHarness('const = ;', 'pg-3');
    expect(posted.some((m) => m.level === 'error' && /SyntaxError/.test(m.args.join(' ')))).toBe(
      true,
    );
    expect(posted.some((m) => m.level === 'done')).toBe(true);
  });

  it('reports leftover top-level ESM syntax as an error instead of hanging', async () => {
    const posted = await runHarness('export const n = 1;', 'pg-4');
    expect(posted.some((m) => m.level === 'error')).toBe(true);
    expect(posted.some((m) => m.level === 'done')).toBe(true);
  });

  it('reports a thrown runtime error and still sends done', async () => {
    const posted = await runHarness('throw new Error("boom")', 'pg-5');
    expect(posted.some((m) => m.level === 'error' && m.args.join(' ').includes('boom'))).toBe(true);
    expect(posted.some((m) => m.level === 'done')).toBe(true);
  });

  it('isolates a learner-declared "send" identifier from the harness helper', async () => {
    const posted = await runHarness(
      'function send() { throw new Error("hijacked"); } console.log("ok"); send;',
      'pg-6',
    );
    expect(posted.some((m) => m.level === 'log' && m.args.join(' ') === 'ok')).toBe(true);
    expect(posted.some((m) => m.level === 'done')).toBe(true);
    expect(posted.some((m) => m.level === 'error')).toBe(false);
  });
});
