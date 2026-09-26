import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { buildCourse } from '@/domain/course';
import { newCardState } from '@/domain/srs';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { ReviewCard } from './ReviewCard';

const course = buildCourse(
  [
    {
      id: 0,
      slug: '00-intro',
      title: 'Intro',
      mark: 'In',
      bg: '#022a2a',
      fg: '#10484a',
      project: 'Repo',
      hours: 4,
    },
  ],
  [
    {
      id: '00-intro/00-a',
      title: 'Uno',
      stage: 0,
      module: 'Base',
      order: 0,
      minutes: 5,
      prereqs: [],
      summary: '',
    },
    {
      id: '00-intro/01-b',
      title: 'Dos',
      stage: 0,
      module: 'Base',
      order: 1,
      minutes: 5,
      prereqs: [],
      summary: '',
    },
    {
      id: '00-intro/02-c',
      title: 'Tres',
      stage: 0,
      module: 'Herramientas',
      order: 2,
      minutes: 5,
      prereqs: [],
      summary: '',
    },
  ],
);
const stage = course.stages[0]!;

describe('TopNav', () => {
  it('links to the three sections', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <TopNav />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Biblioteca' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Repaso' })).toHaveAttribute('href', '/repaso');
    expect(screen.getByRole('link', { name: 'Notas' })).toHaveAttribute('href', '/notas');
  });
});

describe('Sidebar', () => {
  it('renders modules with lesson states and the stage progress', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Sidebar
          stage={stage}
          currentLessonId="00-intro/01-b"
          completed={{ '00-intro/00-a': '2026-09-26' }}
          progress={{ done: 1, total: 3, pct: 33 }}
          open={false}
          onClose={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Base')).toBeInTheDocument();
    expect(screen.getByText('Herramientas')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Uno/ })).toHaveAttribute('data-state', 'done');
    expect(screen.getByRole('link', { name: /Dos/ })).toHaveAttribute('data-state', 'active');
    expect(screen.getByRole('link', { name: /Tres/ })).toHaveAttribute('data-state', 'pending');
    expect(screen.getByText('33% completado')).toBeInTheDocument();
    expect(screen.getByRole('complementary')).toHaveAttribute('data-open', 'false');
  });
});

describe('ReviewCard', () => {
  const card = {
    key: 'a/b#0',
    lessonId: 'a/b',
    front: 'Pregunta',
    back: 'Respuesta',
    state: newCardState('2026-09-26'),
    graded: false,
  };
  it('shows the front, flips and grades', async () => {
    const onFlip = vi.fn();
    const onGrade = vi.fn();
    const { rerender } = render(
      <ReviewCard card={card} flipped={false} onFlip={onFlip} onGrade={onGrade} />,
    );
    expect(screen.getByText('Pregunta')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Bien/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Toca para girar/ }));
    expect(onFlip).toHaveBeenCalled();
    rerender(<ReviewCard card={card} flipped onFlip={onFlip} onGrade={onGrade} />);
    expect(screen.getByText('Respuesta')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Fácil/ }));
    expect(onGrade).toHaveBeenCalledWith('easy');
  });
});
