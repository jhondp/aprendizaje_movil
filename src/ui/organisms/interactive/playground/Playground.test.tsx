import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Playground } from './Playground';

function post(id: string, level: string, args: string[]) {
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', { data: { type: 'saber-playground', id, level, args } }),
    );
  });
}

describe('Playground', () => {
  it('runs code in a sandboxed iframe and shows console output', async () => {
    render(<Playground code={'console.log("hola")'} expected="hola" />);
    expect(screen.queryByTitle('Resultado del código')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ejecutar' }));
    const iframe = screen.getByTitle('Resultado del código');
    expect(iframe).toHaveAttribute('sandbox', 'allow-scripts');
    const id = screen.getByTestId('playground').getAttribute('data-playground-id') ?? '';
    post(id, 'log', ['hola']);
    post(id, 'done', []);
    expect(screen.getByText('hola')).toBeInTheDocument();
    expect(screen.getByText('Salida correcta')).toBeInTheDocument();
  });

  it('shows errors and mismatches', async () => {
    render(<Playground code={'throw new Error("boom")'} expected="hola" />);
    await userEvent.click(screen.getByRole('button', { name: 'Ejecutar' }));
    const id = screen.getByTestId('playground').getAttribute('data-playground-id') ?? '';
    post(id, 'error', ['Error: boom']);
    post(id, 'done', []);
    expect(screen.getByText('Error: boom')).toBeInTheDocument();
    expect(screen.getByText('La salida no coincide con lo esperado')).toBeInTheDocument();
  });

  it('ignores messages from other instances', async () => {
    render(<Playground code="1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Ejecutar' }));
    post('someone-else', 'log', ['intruso']);
    expect(screen.queryByText('intruso')).not.toBeInTheDocument();
  });

  it('times out when the sandbox never reports done', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      render(<Playground code="while(true){}" />);
      await userEvent.click(screen.getByRole('button', { name: 'Ejecutar' }));
      act(() => {
        vi.advanceTimersByTime(5001);
      });
      expect(screen.getByText('Tiempo de espera agotado (5 s)')).toBeInTheDocument();
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
});
