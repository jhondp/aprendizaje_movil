import {
  buildCourse,
  type LessonComponent,
  type LessonMeta,
  type StageMeta,
} from '@/domain/course';

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

const metas: LessonMeta[] = [
  {
    id: '00-intro/00-a',
    title: 'Qué es un programa',
    stage: 0,
    module: 'Base',
    order: 0,
    minutes: 8,
    prereqs: [],
    summary: 'Primera',
  },
  {
    id: '00-intro/01-b',
    title: 'La terminal',
    stage: 0,
    module: 'Base',
    order: 1,
    minutes: 12,
    prereqs: ['00-intro/00-a'],
    summary: 'Segunda',
  },
  {
    id: '00-intro/99-demo',
    title: 'Demo',
    stage: 0,
    module: 'Base',
    order: 99,
    minutes: 1,
    prereqs: [],
    summary: '',
    hidden: true,
  },
  {
    id: '01-js/00-a',
    title: 'Variables',
    stage: 1,
    module: 'Fundamentos',
    order: 0,
    minutes: 10,
    prereqs: [],
    summary: 'Tercera',
  },
];

function stub(title: string): () => Promise<LessonComponent> {
  const Body: LessonComponent = () => <p>Cuerpo de {title}</p>;
  return () => Promise.resolve(Body);
}

export const testCourse = buildCourse(
  stages,
  metas,
  Object.fromEntries(metas.map((m) => [m.id, stub(m.title)])),
);
