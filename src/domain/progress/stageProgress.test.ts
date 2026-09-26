import { buildCourse } from '@/domain/course/buildCourse';
import { stageProgress } from './stageProgress';

const course = buildCourse(
  [
    {
      id: 1,
      slug: '01-js',
      title: 'JS',
      mark: 'Js',
      bg: '#000',
      fg: '#111',
      project: 'p',
      hours: 1,
    },
  ],
  [
    {
      id: '01-js/00-a',
      title: 'a',
      stage: 1,
      module: 'M',
      order: 0,
      minutes: 1,
      prereqs: [],
      summary: '',
    },
    {
      id: '01-js/01-b',
      title: 'b',
      stage: 1,
      module: 'M',
      order: 1,
      minutes: 1,
      prereqs: [],
      summary: '',
    },
    {
      id: '01-js/99-demo',
      title: 'd',
      stage: 1,
      module: 'M',
      order: 99,
      minutes: 1,
      prereqs: [],
      summary: '',
      hidden: true,
    },
  ],
);

describe('stageProgress', () => {
  it('counts only visible lessons', () => {
    expect(stageProgress(course.stages[0]!, { '01-js/00-a': '2026-01-01' })).toEqual({
      done: 1,
      total: 2,
      pct: 50,
    });
  });
  it('is 0% for a stage with no lessons', () => {
    expect(stageProgress({ ...course.stages[0]!, lessons: [] }, {})).toEqual({
      done: 0,
      total: 0,
      pct: 0,
    });
  });
});
