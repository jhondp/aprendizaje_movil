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
});
