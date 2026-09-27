import { render, screen } from '@testing-library/react';
import { Sandpack } from './Sandpack';

vi.mock('@codesandbox/sandpack-react', () => ({
  Sandpack: (props: { template: string; files: Record<string, string> }) => (
    <div data-testid="sandpack" data-template={props.template}>
      {Object.keys(props.files).join(',')}
    </div>
  ),
}));

describe('Sandpack', () => {
  it('uses the react-ts template and forwards files', () => {
    render(<Sandpack files={{ '/App.tsx': 'export default () => null' }} />);
    const el = screen.getByTestId('sandpack');
    expect(el).toHaveAttribute('data-template', 'react-ts');
    expect(el).toHaveTextContent('/App.tsx');
  });
});
