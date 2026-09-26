import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRepositories } from '@/application/testing/renderWithRepositories';
import { LessonProvider } from './LessonContext';
import { Checklist } from './Checklist';

describe('Checklist', () => {
  it('persists checked items per lesson and checklist id', async () => {
    const { repos } = renderWithRepositories(
      <LessonProvider lessonId="09-seguridad-movil/00-x">
        <Checklist id="release" items={['Sin secretos en el bundle', 'HTTPS obligatorio']} />
      </LessonProvider>,
    );
    await userEvent.click(screen.getByLabelText('HTTPS obligatorio'));
    expect(screen.getByLabelText('HTTPS obligatorio')).toBeChecked();
    expect(repos.progress.get().checklists['09-seguridad-movil/00-x:release']).toEqual([1]);
    expect(screen.getByText('1 de 2 completados')).toBeInTheDocument();
  });
});
