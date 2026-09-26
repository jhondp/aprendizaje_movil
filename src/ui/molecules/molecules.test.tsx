import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { buildCourse } from '@/domain/course';
import { lastSevenDays } from '@/domain/progress';
import { StageCard } from './StageCard';
import { LessonRow } from './LessonRow';
import { StreakBars } from './StreakBars';
import { ContinueCard } from './ContinueCard';
import { ReviewTodayCard } from './ReviewTodayCard';
import { NoteBox } from './NoteBox';
import { lessonPath } from '@/ui/routes';

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
    {
      id: 1,
      slug: '01-js',
      title: 'JS',
      mark: 'Js',
      bg: '#ff3d00',
      fg: '#ff6a3a',
      project: 'Todo',
      hours: 20,
    },
  ],
  [
    {
      id: '00-intro/00-a',
      title: 'Qué es un programa',
      stage: 0,
      module: 'Base',
      order: 0,
      minutes: 8,
      prereqs: [],
      summary: '',
    },
    {
      id: '00-intro/01-b',
      title: 'La terminal',
      stage: 0,
      module: 'Base',
      order: 1,
      minutes: 12,
      prereqs: [],
      summary: '',
    },
  ],
);
const stage0 = course.stages[0]!;
const lesson = course.lessons[0]!;

const wrap = (ui: ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('molecules', () => {
  it('lessonPath builds the route', () => {
    expect(lessonPath(lesson)).toBe('/etapa/00-intro/00-a');
  });
  it('StageCard links to the first lesson and shows meta', () => {
    wrap(<StageCard stage={stage0} progress={{ done: 1, total: 2, pct: 50 }} />);
    expect(screen.getByRole('link', { name: /Intro/ })).toHaveAttribute(
      'href',
      '/etapa/00-intro/00-a',
    );
    expect(screen.getByText('2 lecciones · 1 módulo · 4 h')).toBeInTheDocument();
  });
  it('StageCard without lessons is not a link', () => {
    wrap(<StageCard stage={course.stages[1]!} progress={{ done: 0, total: 0, pct: 0 }} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Próximamente')).toBeInTheDocument();
  });
  it('LessonRow renders title, minutes and state', () => {
    wrap(<LessonRow lesson={lesson} state="active" />);
    const link = screen.getByRole('link', { name: /Qué es un programa/ });
    expect(link).toHaveAttribute('data-state', 'active');
    expect(link).toHaveTextContent('8 min');
  });
  it('StreakBars shows the streak count and seven days', () => {
    wrap(<StreakBars week={lastSevenDays(['2026-09-26'], '2026-09-26')} streak={3} />);
    expect(screen.getByText('3 días')).toBeInTheDocument();
    expect(screen.getAllByTestId('streak-day')).toHaveLength(7);
  });
  it('ContinueCard shows the resume link or the finished state', () => {
    wrap(<ContinueCard lesson={lesson} stage={stage0} progress={{ done: 1, total: 2, pct: 50 }} />);
    expect(screen.getByRole('link', { name: 'Reanudar lección' })).toHaveAttribute(
      'href',
      '/etapa/00-intro/00-a',
    );
    expect(screen.getByText('50% · 1 de 2 lecciones')).toBeInTheDocument();
  });
  it('ContinueCard without a lesson invites to start', () => {
    wrap(<ContinueCard lesson={null} stage={null} progress={{ done: 0, total: 0, pct: 0 }} />);
    expect(screen.getByText('Completaste todo el curso')).toBeInTheDocument();
  });
  it('ReviewTodayCard links to review', () => {
    wrap(<ReviewTodayCard count={24} />);
    expect(screen.getByRole('link', { name: /24/ })).toHaveAttribute('href', '/repaso');
  });
  it('NoteBox edits text', async () => {
    const onChange = vi.fn();
    wrap(<NoteBox value="" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Mi nota'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });
});
