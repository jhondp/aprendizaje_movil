import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRepositories } from '@/application/testing/renderWithRepositories';
import { LessonProvider } from './LessonContext';
import { Quiz } from './Quiz';

const questions = [
  {
    prompt: '¿2 + 2?',
    options: [
      { text: '3', correct: false, feedback: 'No, revisa la suma.' },
      { text: '4', correct: true, feedback: 'Correcto.' },
    ],
  },
  {
    prompt: '¿Capital de Francia?',
    options: [
      { text: 'París', correct: true, feedback: 'Correcto.' },
      { text: 'Roma', correct: false, feedback: 'Roma es la capital de Italia.' },
    ],
  },
];

describe('Quiz', () => {
  it('shows feedback per answer, locks the question and records the best score', async () => {
    const { repos } = renderWithRepositories(
      <LessonProvider lessonId="a/b">
        <Quiz questions={questions} />
      </LessonProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: '3' }));
    expect(screen.getByRole('status')).toHaveTextContent('No, revisa la suma.');
    const right = screen.getByRole('button', { name: /^4/ });
    expect(right).toHaveAttribute('aria-disabled', 'true');
    expect(right).not.toBeDisabled();
    expect(right).toHaveAccessibleName('4 (respuesta correcta)');
    expect(screen.getByRole('button', { name: /^3/ })).toHaveAccessibleName(
      '3 (respuesta incorrecta)',
    );
    await userEvent.click(right);
    expect(screen.getByRole('status')).toHaveTextContent('No, revisa la suma.');
    expect(screen.queryByText(/Resultado/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'París' }));
    expect(screen.getByText('Resultado: 1 de 2 correctas')).toBeInTheDocument();
    expect(repos.progress.get().quizScores['a/b']).toBe(0.5);
  });
});
