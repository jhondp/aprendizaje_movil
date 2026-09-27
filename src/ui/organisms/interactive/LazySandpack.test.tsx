import { render, screen } from '@testing-library/react';
import { LazySandpack } from './LazySandpack';

vi.mock('@codesandbox/sandpack-react', () => ({
  Sandpack: (props: { files: Record<string, string> }) => (
    <div data-testid="sandpack">{Object.keys(props.files).join(',')}</div>
  ),
}));

describe('LazySandpack', () => {
  it('shows a fallback and then the editor with the given files', async () => {
    render(<LazySandpack files={{ '/App.tsx': 'export default () => null' }} />);
    expect(screen.getByText('Cargando editor…')).toBeInTheDocument();
    expect(await screen.findByTestId('sandpack')).toHaveTextContent('/App.tsx');
  });

  it('shows a neutral fallback instead of crashing when the chunk fails to load', async () => {
    vi.resetModules();
    vi.doMock('./Sandpack', () => {
      throw new Error('Failed to fetch dynamically imported module');
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { LazySandpack: LazySandpackWithFailingImport } = await import('./LazySandpack');
      render(<LazySandpackWithFailingImport files={{ '/App.tsx': 'export default () => null' }} />);
      expect(
        await screen.findByText(
          'No se pudo cargar el editor interactivo. Revisa tu conexión y recarga la página.',
        ),
      ).toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
      vi.doUnmock('./Sandpack');
    }
  });
});
