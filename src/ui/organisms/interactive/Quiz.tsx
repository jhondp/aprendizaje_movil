import { useEffect, useState } from 'react';
import { useProgress } from '@/application/hooks/useProgress';
import { useLessonId } from './LessonContext';
import styles from './Quiz.module.css';

export interface QuizOption {
  text: string;
  correct: boolean;
  feedback: string;
}

export interface QuizQuestion {
  prompt: string;
  options: QuizOption[];
}

export function Quiz({ questions }: { questions: QuizQuestion[] }) {
  const lessonId = useLessonId();
  const { recordQuizScore } = useProgress();
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const answered = Object.keys(answers).length;
  const finished = questions.length > 0 && answered === questions.length;
  const correct = questions.filter((q, i) => {
    const pick = answers[i];
    return pick !== undefined && q.options[pick]?.correct === true;
  }).length;

  useEffect(() => {
    if (finished) recordQuizScore(lessonId, correct / questions.length);
  }, [finished, correct, questions.length, lessonId, recordQuizScore]);

  return (
    <section className={styles.root} aria-label="Cuestionario">
      <div className={styles.badge}>Quiz</div>
      {questions.map((question, qi) => {
        const pick = answers[qi];
        return (
          <div key={qi} className={styles.question}>
            <div className={styles.prompt}>
              {qi + 1}. {question.prompt}
            </div>
            <div className={styles.options}>
              {question.options.map((option, oi) => {
                const state =
                  pick === undefined
                    ? 'idle'
                    : option.correct
                      ? 'correct'
                      : pick === oi
                        ? 'wrong'
                        : 'idle';
                const locked = pick !== undefined;
                return (
                  <button
                    key={oi}
                    type="button"
                    className={styles.option}
                    data-state={state}
                    aria-disabled={locked}
                    onClick={() => {
                      if (!locked) setAnswers((a) => ({ ...a, [qi]: oi }));
                    }}
                  >
                    {option.text}
                    {state !== 'idle' && (
                      <>
                        <span className={styles.marker} aria-hidden="true">
                          {state === 'correct' ? '✓' : '✗'}
                        </span>
                        <span className={styles.srOnly}>
                          {state === 'correct'
                            ? ' (respuesta correcta)'
                            : ' (respuesta incorrecta)'}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
            {pick !== undefined && (
              <p className={styles.feedback} role="status">
                {question.options[pick]?.feedback}
              </p>
            )}
          </div>
        );
      })}
      {finished && (
        <div className={styles.result}>
          Resultado: {correct} de {questions.length} correctas
        </div>
      )}
    </section>
  );
}
