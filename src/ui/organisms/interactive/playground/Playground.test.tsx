import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Playground } from './Playground';

// jsdom does not execute <iframe srcDoc> scripts (documented limitation of this
// project's test setup), so every scenario here drives the component the same
// way the real sandboxed iframe would: by dispatching a `message` event whose
// `source` is the mounted iframe's `contentWindow` (jsdom does provide a real,
// distinct contentWindow per mounted iframe — verified for this fix) and whose
// `data` matches the shape buildSrcdoc's harness posts. The harness's own
// runtime behavior (that it actually posts these shapes, including for syntax
// errors) is proven separately, executing the real generated script in a V8
// context, in buildSrcdoc.test.ts.
function post(source: Window | null, id: string, level: string, args: string[]) {
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'saber-playground', id, level, args },
        source,
      }),
    );
  });
}

function currentIframe() {
  return screen.getByTitle('Resultado del código') as HTMLIFrameElement;
}

function currentRunId() {
  return screen.getByTestId('playground').getAttribute('data-playground-run-id') ?? '';
}

describe('Playground', () => {
  it('runs code in a sandboxed iframe and shows console output', async () => {
    render(<Playground code={'console.log("hola")'} expected="hola" />);
    expect(screen.queryByTitle('Resultado del código')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ejecutar' }));
    const iframe = currentIframe();
    expect(iframe).toHaveAttribute('sandbox', 'allow-scripts');
    const id = currentRunId();
    post(iframe.contentWindow, id, 'log', ['hola']);
    post(iframe.contentWindow, id, 'done', []);
    expect(screen.getByText('hola')).toBeInTheDocument();
    expect(screen.getByText('Salida correcta')).toBeInTheDocument();
  });

  it('shows errors and mismatches', async () => {
    render(<Playground code={'throw new Error("boom")'} expected="hola" />);
    await userEvent.click(screen.getByRole('button', { name: 'Ejecutar' }));
    const iframe = currentIframe();
    const id = currentRunId();
    post(iframe.contentWindow, id, 'error', ['Error: boom']);
    post(iframe.contentWindow, id, 'done', []);
    expect(screen.getByText('Error: boom')).toBeInTheDocument();
    expect(screen.getByText('La salida no coincide con lo esperado')).toBeInTheDocument();
  });

  it('ignores messages from other instances', async () => {
    render(<Playground code="1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Ejecutar' }));
    const iframe = currentIframe();
    post(iframe.contentWindow, 'someone-else', 'log', ['intruso']);
    expect(screen.queryByText('intruso')).not.toBeInTheDocument();
  });

  it("ignores a message whose source is not the current iframe's contentWindow", async () => {
    render(<Playground code={'console.log("hola")'} />);
    await userEvent.click(screen.getByRole('button', { name: 'Ejecutar' }));
    const id = currentRunId();
    post(null, id, 'log', ['spoofed']);
    expect(screen.queryByText('spoofed')).not.toBeInTheDocument();
  });

  it("ignores a message carrying a previous run's id after a re-run", async () => {
    render(<Playground code={'console.log("first")'} />);
    await userEvent.click(screen.getByRole('button', { name: 'Ejecutar' }));
    const firstId = currentRunId();

    await userEvent.click(screen.getByRole('button', { name: 'Ejecutar' }));
    const secondIframe = currentIframe();
    const secondId = currentRunId();
    expect(secondId).not.toBe(firstId);

    post(secondIframe.contentWindow, firstId, 'log', ['stale']);
    post(secondIframe.contentWindow, secondId, 'log', ['fresh']);
    post(secondIframe.contentWindow, secondId, 'done', []);

    expect(screen.queryByText('stale')).not.toBeInTheDocument();
    expect(screen.getByText('fresh')).toBeInTheDocument();
  });

  it('times out when the sandbox never reports done and unmounts the iframe', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      render(<Playground code="while(true){}" />);
      await userEvent.click(screen.getByRole('button', { name: 'Ejecutar' }));
      expect(screen.getByTitle('Resultado del código')).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(5001);
      });
      expect(screen.getByText('Tiempo de espera agotado (5 s)')).toBeInTheDocument();
      expect(screen.queryByTitle('Resultado del código')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows transpile errors without mounting the iframe', async () => {
    render(<Playground code="const = ;" lang="ts" />);
    await userEvent.click(screen.getByRole('button', { name: 'Ejecutar' }));
    expect(screen.queryByTitle('Resultado del código')).not.toBeInTheDocument();
    expect(screen.getByText(/Error de sintaxis/)).toBeInTheDocument();
  });

  it('shows a sandbox-reported JS syntax error instead of a silent timeout', async () => {
    render(<Playground code={'const = ;'} />);
    await userEvent.click(screen.getByRole('button', { name: 'Ejecutar' }));
    const iframe = currentIframe();
    const id = currentRunId();
    post(iframe.contentWindow, id, 'error', ["SyntaxError: Unexpected token '='"]);
    post(iframe.contentWindow, id, 'done', []);
    expect(screen.getByText(/SyntaxError/)).toBeInTheDocument();
    expect(screen.queryByText('Tiempo de espera agotado (5 s)')).not.toBeInTheDocument();
  });
});
