import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom';
import { App } from './App';
import { routes } from './router';

function Throws(): never {
  throw new Error('boom');
}

describe('App', () => {
  it('boots with real repositories and the loaded course', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: 'Todo lo que aprendes, en un solo lugar.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Cómo aprender a programar')).toBeInTheDocument();
  });

  it('renders the root errorElement fallback instead of the unstyled default when a route throws', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { path, element, errorElement } = routes[0]!;
    const testRoutes: RouteObject[] = [
      { path, element, errorElement, children: [{ index: true, element: <Throws /> }] },
    ];
    try {
      const router = createMemoryRouter(testRoutes, { initialEntries: ['/'] });
      render(<RouterProvider router={router} />);
      expect(await screen.findByText('Algo salió mal')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
    } finally {
      consoleError.mockRestore();
    }
  });
});
