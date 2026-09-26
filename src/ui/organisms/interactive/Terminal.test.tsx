import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Terminal } from './Terminal';

const steps = [
  { cmd: 'node --version', out: 'v22.11.0' },
  { cmd: 'git --version', out: 'git version 2.47.0' },
];

describe('Terminal', () => {
  it('reveals one step at a time and can restart', async () => {
    render(<Terminal steps={steps} />);
    expect(screen.getByText('node --version')).toBeInTheDocument();
    expect(screen.getByText('v22.11.0')).toBeInTheDocument();
    expect(screen.queryByText('git --version')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente paso' }));
    expect(screen.getByText('git version 2.47.0')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reiniciar' }));
    expect(screen.queryByText('git --version')).not.toBeInTheDocument();
  });
});
