import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Button, ButtonLink } from './Button';
import { Chip } from './Chip';
import { ProgressBar } from './ProgressBar';
import { StatusDot } from './StatusDot';
import { Brand } from './Brand';

describe('atoms', () => {
  it('Button forwards props and variant', () => {
    render(
      <Button variant="dark" onClick={() => undefined}>
        Ir
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Ir' })).toHaveAttribute('data-variant', 'dark');
  });
  it('ButtonLink renders a router link', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ButtonLink to="/repaso">Repasar</ButtonLink>
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Repasar' })).toHaveAttribute('href', '/repaso');
  });
  it('Chip exposes pressed state', () => {
    render(
      <Chip active onClick={() => undefined}>
        Todos
      </Chip>,
    );
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('ProgressBar clamps and exposes aria values', () => {
    render(<ProgressBar pct={140} label="Progreso" />);
    const bar = screen.getByRole('progressbar', { name: 'Progreso' });
    expect(bar).toHaveAttribute('aria-valuenow', '100');
  });
  it('StatusDot shows a check when done', () => {
    render(<StatusDot state="done" />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });
  it('Brand shows the name and links home', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Brand />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Saber' })).toHaveAttribute('href', '/');
  });
});
