import { render, screen } from '@testing-library/react';
import { Callout } from './Callout';

describe('Callout', () => {
  it('renders children with a role of note and the kind label', () => {
    render(<Callout kind="warning">Cuidado</Callout>);
    const note = screen.getByRole('note');
    expect(note).toHaveTextContent('Cuidado');
    expect(note).toHaveAttribute('data-kind', 'warning');
  });
  it('defaults to tip', () => {
    render(<Callout>Idea</Callout>);
    expect(screen.getByRole('note')).toHaveAttribute('data-kind', 'tip');
  });
});
