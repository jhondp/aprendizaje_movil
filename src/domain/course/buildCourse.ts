import type {
  Course,
  Lesson,
  LessonId,
  LessonLoader,
  LessonMeta,
  Module,
  Stage,
  StageMeta,
} from './types';

function splitId(id: string): { stageSlug: string; slug: string } {
  const slash = id.indexOf('/');
  if (slash === -1) return { stageSlug: '', slug: id };
  return { stageSlug: id.slice(0, slash), slug: id.slice(slash + 1) };
}

function normalize(meta: LessonMeta): LessonMeta {
  return {
    ...meta,
    prereqs: Array.isArray(meta.prereqs) ? meta.prereqs : [],
    hidden: meta.hidden === true,
  };
}

function byStageThenOrder(a: LessonMeta, b: LessonMeta): number {
  if (a.stage !== b.stage) return a.stage - b.stage;
  if (a.order !== b.order) return a.order - b.order;
  return a.id.localeCompare(b.id);
}

export function buildCourse(
  stageMetas: StageMeta[],
  lessonMetas: LessonMeta[],
  loaders: Record<LessonId, LessonLoader> = {},
): Course {
  const stageIds = new Set(stageMetas.map((s) => s.id));
  const sorted = lessonMetas
    .map(normalize)
    .filter((m) => stageIds.has(m.stage))
    .sort(byStageThenOrder);

  const visible = sorted.filter((m) => !m.hidden);
  const lessons: Lesson[] = sorted.map((m) => {
    const { stageSlug, slug } = splitId(m.id);
    const index = visible.findIndex((v) => v.id === m.id);
    const prev = index > 0 ? (visible[index - 1]?.id ?? null) : null;
    const next = index >= 0 && index < visible.length - 1 ? (visible[index + 1]?.id ?? null) : null;
    const load: LessonLoader =
      loaders[m.id] ?? (() => Promise.reject(new Error(`No loader for lesson ${m.id}`)));
    return { ...m, stageSlug, slug, prev, next, load };
  });

  const byId: Record<string, Lesson> = {};
  for (const lesson of lessons) byId[lesson.id] = lesson;

  const stages: Stage[] = [...stageMetas]
    .sort((a, b) => a.id - b.id)
    .map((meta) => {
      const stageLessons = lessons.filter((l) => l.stage === meta.id && !l.hidden);
      const modules: Module[] = [];
      for (const lesson of stageLessons) {
        let module = modules.find((m) => m.name === lesson.module);
        if (!module) {
          module = { name: lesson.module, lessons: [] };
          modules.push(module);
        }
        module.lessons.push(lesson);
      }
      return { ...meta, modules, lessons: stageLessons };
    });

  return { stages, lessons, byId };
}
