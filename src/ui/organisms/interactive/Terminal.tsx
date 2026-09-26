import { useState } from 'react';
import styles from './Terminal.module.css';

export interface TerminalStep {
  cmd: string;
  out: string;
}

export function Terminal({ steps }: { steps: TerminalStep[] }) {
  const [visible, setVisible] = useState(1);
  const finished = visible >= steps.length;
  return (
    <div className={styles.root}>
      <div className={styles.bar}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.barTitle}>terminal</span>
      </div>
      <pre className={styles.screen}>
        {steps.slice(0, visible).map((step, i) => (
          <div key={i} className={styles.step}>
            <div>
              <span className={styles.prompt}>$ </span>
              <span className={styles.cmd}>{step.cmd}</span>
            </div>
            {step.out !== '' && <div className={styles.out}>{step.out}</div>}
          </div>
        ))}
      </pre>
      <div className={styles.actions}>
        {finished ? (
          <button type="button" className={styles.button} onClick={() => setVisible(1)}>
            Reiniciar
          </button>
        ) : (
          <button type="button" className={styles.button} onClick={() => setVisible((v) => v + 1)}>
            Siguiente paso
          </button>
        )}
        <span className={styles.counter}>
          {Math.min(visible, steps.length)} / {steps.length}
        </span>
      </div>
    </div>
  );
}
