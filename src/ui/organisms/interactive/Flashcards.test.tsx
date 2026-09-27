import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRepositories } from '@/application/testing/renderWithRepositories';
import { LessonProvider } from './LessonContext';
import { Flashcards } from './Flashcards';

describe('Flashcards', () => {
  it('registers the cards for review and flips on click', async () => {
    const { repos } = renderWithRepositories(
      <LessonProvider lessonId="a/b">
        <Flashcards cards={[{ front: 'Pregunta 1', back: 'Respuesta 1' }]} />
      </LessonProvider>,
    );
    expect(Object.keys(repos.srs.get())).toEqual(['a/b#0']);
    expect(screen.getByText('Pregunta 1')).toBeInTheDocument();
    expect(screen.queryByText('Respuesta 1')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Pregunta 1/ }));
    expect(screen.getByText('Respuesta 1')).toBeInTheDocument();
  });
});
