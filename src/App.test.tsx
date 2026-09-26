import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('boots with real repositories and the loaded course', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: 'Todo lo que aprendes, en un solo lugar.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Cómo aprender a programar')).toBeInTheDocument();
  });
});
