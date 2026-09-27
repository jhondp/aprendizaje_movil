import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '@/test/renderApp';

describe('LessonPage', () => {
  it('renders sidebar, lazily loaded body and marks the lesson as opened', async () => {
    const { repos } = renderApp('/etapa/00-intro/00-a');
    expect(await screen.findByText('Cuerpo de Qué es un programa')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Qué es un programa' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /La terminal/ })).toHaveAttribute(
      'data-state',
      'pending',
    );
    expect(repos.progress.get().lastOpened).toBe('00-intro/00-a');
  });

  it('completes the lesson and navigates to the next one', async () => {
    const { repos } = renderApp('/etapa/00-intro/00-a');
    await screen.findByText('Cuerpo de Qué es un programa');
    await userEvent.click(screen.getByRole('button', { name: 'Completar y seguir ›' }));
    expect(repos.progress.get().completed['00-intro/00-a']).toBe('2026-09-26');
    expect(await screen.findByText('Cuerpo de La terminal')).toBeInTheDocument();
  });

  it('scrolls to the top when moving to another lesson', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    renderApp('/etapa/00-intro/00-a');
    await screen.findByText('Cuerpo de Qué es un programa');
    scrollTo.mockClear();
    await userEvent.click(screen.getByRole('button', { name: 'Completar y seguir ›' }));
    await screen.findByText('Cuerpo de La terminal');
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    scrollTo.mockRestore();
  });

  it('closes the lesson index with Escape', async () => {
    renderApp('/etapa/00-intro/00-a');
    await screen.findByText('Cuerpo de Qué es un programa');
    const toggle = screen.getByRole('button', { name: 'Ver índice' });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Escape}');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('links the index toggle to the sidebar it controls', async () => {
    renderApp('/etapa/00-intro/00-a');
    await screen.findByText('Cuerpo de Qué es un programa');
    const toggle = screen.getByRole('button', { name: 'Ver índice' });
    const id = toggle.getAttribute('aria-controls');
    expect(id).toBeTruthy();
    expect(document.getElementById(id ?? '')).toHaveTextContent('‹ Biblioteca');
  });

  it('on the last lesson the button returns to the library', async () => {
    renderApp('/etapa/01-js/00-a');
    await screen.findByText('Cuerpo de Variables');
    await userEvent.click(screen.getByRole('button', { name: 'Completar y terminar' }));
    expect(
      await screen.findByRole('heading', { name: 'Todo lo que aprendes, en un solo lugar.' }),
    ).toBeInTheDocument();
  });

  it('saves a note for the lesson', async () => {
    const { repos } = renderApp('/etapa/00-intro/00-a');
    await screen.findByText('Cuerpo de Qué es un programa');
    await userEvent.click(screen.getByRole('button', { name: 'Añadir nota' }));
    await userEvent.type(screen.getByLabelText('Mi nota'), 'Recordar');
    await waitFor(() => expect(repos.notes.get()['00-intro/00-a']?.text).toBe('Recordar'));
  });

  it('shows a not-found state for unknown lessons', () => {
    renderApp('/etapa/00-intro/zzz');
    expect(screen.getByText('Lección no encontrada')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver a la biblioteca' })).toBeInTheDocument();
  });
});
