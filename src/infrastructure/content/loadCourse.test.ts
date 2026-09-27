import { loadCourse } from './loadCourse';

describe('loadCourse', () => {
  const course = loadCourse();

  it('exposes the twelve stages in order', () => {
    expect(course.stages.map((s) => s.id)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(course.stages[0]?.slug).toBe('00-aprender-a-programar');
  });

  it('includes the first lesson with frontmatter from the MDX file', () => {
    const lesson = course.byId['00-aprender-a-programar/00-que-es-un-programa'];
    expect(lesson).toMatchObject({
      title: 'Qué es un programa',
      stage: 0,
      order: 0,
      stageSlug: '00-aprender-a-programar',
    });
    expect(course.stages[0]?.lessons[0]?.id).toBe(lesson?.id);
  });

  it('every lesson id matches its file path', () => {
    for (const lesson of course.lessons) {
      expect(lesson.id).toBe(`${lesson.stageSlug}/${lesson.slug}`);
    }
  });

  it('loads a lesson component lazily through lesson.load()', async () => {
    const lesson = course.byId['00-aprender-a-programar/00-que-es-un-programa'];
    const Component = await lesson?.load();
    expect(typeof Component).toBe('function');
  });
});
