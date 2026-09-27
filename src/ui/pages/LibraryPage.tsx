import { useState } from 'react';
import { useCourse } from '@/application/CourseContext';
import { useRepositories } from '@/application/RepositoriesContext';
import { useContinueLearning } from '@/application/hooks/useContinueLearning';
import { useProgress } from '@/application/hooks/useProgress';
import { useSrs } from '@/application/hooks/useSrs';
import { useStreak } from '@/application/hooks/useStreak';
import { stageProgress } from '@/domain/progress';
import { Chip } from '@/ui/atoms/Chip';
import { ContinueCard } from '@/ui/molecules/ContinueCard';
import { ReviewTodayCard } from '@/ui/molecules/ReviewTodayCard';
import { StageCard } from '@/ui/molecules/StageCard';
import { StreakBars } from '@/ui/molecules/StreakBars';
import styles from './LibraryPage.module.css';

type Filter = 'all' | 'inProgress' | 'finished';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'inProgress', label: 'En curso' },
  { key: 'finished', label: 'Terminados' },
];

function greeting(hour: number): string {
  if (hour < 12) return 'Buenos días';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export function LibraryPage() {
  const course = useCourse();
  const { clock } = useRepositories();
  const { state } = useProgress();
  const { streak, week } = useStreak();
  const { due } = useSrs();
  const next = useContinueLearning(course);
  const [filter, setFilter] = useState<Filter>('all');

  const nextStage = next ? (course.stages.find((s) => s.id === next.stage) ?? null) : null;
  const nextProgress = nextStage
    ? stageProgress(nextStage, state.completed)
    : { done: 0, total: 0, pct: 0 };

  const cards = course.stages
    .map((stage) => ({ stage, progress: stageProgress(stage, state.completed) }))
    .filter(({ progress }) => {
      if (filter === 'inProgress') return progress.done > 0 && progress.pct < 100;
      if (filter === 'finished') return progress.total > 0 && progress.pct === 100;
      return true;
    });

  return (
    <div className={styles.root}>
      <section className={styles.hero}>
        <div className={styles.greeting}>{greeting(new Date(clock.now()).getHours())}</div>
        <h1 className={styles.headline}>Todo lo que aprendes, en un solo lugar.</h1>
      </section>
      <section className={styles.dashboard}>
        <ContinueCard lesson={next} stage={nextStage} progress={nextProgress} />
        <div className={styles.side}>
          <ReviewTodayCard count={due.length} />
          <StreakBars week={week} streak={streak} />
        </div>
      </section>
      <section className={styles.coursesHead}>
        <h2 className={styles.coursesTitle}>Tus etapas</h2>
        <div className={styles.filters}>
          {FILTERS.map((f) => (
            <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
            </Chip>
          ))}
        </div>
      </section>
      <section className={styles.grid}>
        {cards.map(({ stage, progress }) => (
          <StageCard key={stage.id} stage={stage} progress={progress} />
        ))}
      </section>
    </div>
  );
}
