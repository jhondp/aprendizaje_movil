import { buildCourse } from './buildCourse';
import { findLesson } from './findLesson';
import type { LessonMeta, StageMeta } from './types';

const stages: StageMeta[] = [
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
];

const meta = (
  over: Partial<LessonMeta> & Pick<LessonMeta, 'id' | 'stage' | 'order'>,
): LessonMeta => ({
  title: over.id,
  module: 'M1',
  minutes: 5,
  prereqs: [],
  summary: '',
  ...over,
});

describe('buildCourse', () => {
  it('groups lessons by stage and module keeping numeric order', () => {
    const course = buildCourse(stages, [
      meta({ id: '01-js/01-b', stage: 1, order: 1, module: 'B' }),
      meta({ id: '00-intro/00-a', stage: 0, order: 0, module: 'A' }),
      meta({ id: '01-js/00-a', stage: 1, order: 0, module: 'A' }),
    ]);
    expect(course.stages.map((s) => s.slug)).toEqual(['00-intro', '01-js']);
    expect(course.stages[1]?.modules.map((m) => m.name)).toEqual(['A', 'B']);
    expect(course.lessons.map((l) => l.id)).toEqual(['00-intro/00-a', '01-js/00-a', '01-js/01-b']);
  });

  it('links prev and next across stages and skips hidden lessons', () => {
    const course = buildCourse(stages, [
      meta({ id: '00-intro/00-a', stage: 0, order: 0 }),
      meta({ id: '00-intro/99-demo', stage: 0, order: 99, hidden: true }),
      meta({ id: '01-js/00-a', stage: 1, order: 0 }),
    ]);
    expect(course.byId['00-intro/00-a']?.next).toBe('01-js/00-a');
    expect(course.byId['01-js/00-a']?.prev).toBe('00-intro/00-a');
    expect(course.byId['01-js/00-a']?.next).toBeNull();
    expect(course.stages[0]?.lessons.map((l) => l.id)).toEqual(['00-intro/00-a']);
    expect(course.byId['00-intro/99-demo']?.hidden).toBe(true);
  });

  it('derives stageSlug and slug from the id and defaults prereqs and hidden', () => {
    const course = buildCourse(stages, [
      {
        ...meta({ id: '01-js/03-fn', stage: 1, order: 3 }),
        prereqs: undefined as unknown as string[],
      },
    ]);
    const lesson = course.byId['01-js/03-fn'];
    expect(lesson?.stageSlug).toBe('01-js');
    expect(lesson?.slug).toBe('03-fn');
    expect(lesson?.prereqs).toEqual([]);
    expect(lesson?.hidden).toBe(false);
  });

  it('tie-breaks equal order by id so the sidebar is deterministic', () => {
    const course = buildCourse(stages, [
      meta({ id: '01-js/01-z', stage: 1, order: 1 }),
      meta({ id: '01-js/01-a', stage: 1, order: 1 }),
    ]);
    expect(course.lessons.map((l) => l.slug)).toEqual(['01-a', '01-z']);
  });

  it('ignores lessons whose stage does not exist', () => {
    const course = buildCourse(stages, [meta({ id: '07-x/00-a', stage: 7, order: 0 })]);
    expect(course.lessons).toHaveLength(0);
  });

  it('attaches the loader for each lesson id and rejects when none exists', async () => {
    const Stub = () => null;
    const course = buildCourse(
      stages,
      [
        meta({ id: '01-js/00-a', stage: 1, order: 0 }),
        meta({ id: '01-js/01-b', stage: 1, order: 1 }),
      ],
      { '01-js/00-a': async () => Stub },
    );
    await expect(course.byId['01-js/00-a']?.load()).resolves.toBe(Stub);
    await expect(course.byId['01-js/01-b']?.load()).rejects.toThrow(
      'No loader for lesson 01-js/01-b',
    );
  });
});

describe('findLesson', () => {
  it('finds by stage slug and lesson slug', () => {
    const course = buildCourse(stages, [meta({ id: '01-js/00-a', stage: 1, order: 0 })]);
    expect(findLesson(course, '01-js', '00-a')?.id).toBe('01-js/00-a');
    expect(findLesson(course, '01-js', 'nope')).toBeUndefined();
  });
});
