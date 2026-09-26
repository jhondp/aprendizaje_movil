import { useEffect, useId, useRef, useState } from 'react';
import { transpile, type PlaygroundLang } from './transpile';
import { buildSrcdoc, type PlaygroundMessage } from './buildSrcdoc';
import styles from './Playground.module.css';

const TIMEOUT_MS = 5000;
const LEVELS: readonly PlaygroundMessage['level'][] = ['log', 'info', 'warn', 'error', 'done'];

interface OutputLine {
  level: PlaygroundMessage['level'];
  text: string;
}

type Verdict = 'idle' | 'running' | 'ok' | 'mismatch' | 'timeout';

function isPlaygroundMessage(data: unknown): data is PlaygroundMessage {
  if (typeof data !== 'object' || data === null) return false;
  const candidate = data as Partial<PlaygroundMessage>;
  return (
    candidate.type === 'saber-playground' &&
    typeof candidate.id === 'string' &&
    typeof candidate.level === 'string' &&
    LEVELS.includes(candidate.level as PlaygroundMessage['level']) &&
    Array.isArray(candidate.args)
  );
}

export function Playground({
  code,
  lang = 'js',
  expected,
}: {
  code: string;
  lang?: PlaygroundLang;
  expected?: string;
}) {
  const instanceId = useId();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const runCounter = useRef(0);
  const activeRunId = useRef<string | null>(null);
  const settled = useRef(true);
  const expectedRef = useRef(expected);
  expectedRef.current = expected;

  const [source, setSource] = useState(code);
  const [srcdoc, setSrcdoc] = useState<string | null>(null);
  const [renderRun, setRenderRun] = useState(0);
  const [lines, setLines] = useState<OutputLine[]>([]);
  const linesRef = useRef<OutputLine[]>([]);
  const [syntaxError, setSyntaxError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (!isPlaygroundMessage(event.data)) return;
      if (settled.current || event.data.id !== activeRunId.current) return;
      const { level, args } = event.data;
      if (level === 'done') {
        settled.current = true;
        clearTimer();
        const output = linesRef.current
          .filter((l) => l.level !== 'error')
          .map((l) => l.text)
          .join('\n');
        const expectedValue = expectedRef.current;
        setVerdict(
          expectedValue === undefined
            ? 'idle'
            : output.trim() === expectedValue.trim()
              ? 'ok'
              : 'mismatch',
        );
        return;
      }
      linesRef.current = [...linesRef.current, { level, text: args.join(' ') }];
      setLines(linesRef.current);
    }
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      clearTimer();
    };
  }, [instanceId]);

  const execute = () => {
    const result = transpile(source, lang);
    if ('error' in result) {
      settled.current = true;
      activeRunId.current = null;
      setSyntaxError(result.error);
      setSrcdoc(null);
      return;
    }
    setSyntaxError(null);
    linesRef.current = [];
    setLines([]);
    setVerdict('running');
    runCounter.current += 1;
    const runId = `${instanceId}:${runCounter.current}`;
    activeRunId.current = runId;
    settled.current = false;
    setSrcdoc(buildSrcdoc(result.code, runId));
    setRenderRun(runCounter.current);
    clearTimer();
    timer.current = setTimeout(() => {
      settled.current = true;
      setVerdict('timeout');
      setSrcdoc(null);
    }, TIMEOUT_MS);
  };

  return (
    <div
      className={styles.root}
      data-testid="playground"
      data-playground-id={instanceId}
      data-playground-run-id={renderRun > 0 ? `${instanceId}:${renderRun}` : ''}
    >
      <div className={styles.head}>
        <span className={styles.lang}>{lang === 'ts' ? 'TypeScript' : 'JavaScript'}</span>
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => setSource(code)}>
            Restablecer
          </button>
          <button type="button" className={styles.primary} onClick={execute}>
            Ejecutar
          </button>
        </div>
      </div>
      <textarea
        className={styles.editor}
        aria-label="Editor de código"
        spellCheck={false}
        value={source}
        onChange={(e) => setSource(e.target.value)}
        rows={Math.max(4, source.split('\n').length + 1)}
      />
      {syntaxError && <div className={styles.error}>Error de sintaxis: {syntaxError}</div>}
      {srcdoc && (
        <iframe
          key={renderRun}
          ref={iframeRef}
          title="Resultado del código"
          sandbox="allow-scripts"
          srcDoc={srcdoc}
          className={styles.frame}
        />
      )}
      <div className={styles.console} aria-label="Consola">
        {lines.length === 0 && verdict === 'idle' && (
          <span className={styles.muted}>La salida aparecerá aquí.</span>
        )}
        {lines.map((line, i) => (
          <div key={i} className={styles.line} data-level={line.level}>
            {line.text}
          </div>
        ))}
        {verdict === 'timeout' && (
          <div className={styles.line} data-level="error">
            Tiempo de espera agotado (5 s)
          </div>
        )}
        {verdict === 'ok' && <div className={styles.verdictOk}>Salida correcta</div>}
        {verdict === 'mismatch' && (
          <div className={styles.verdictBad}>La salida no coincide con lo esperado</div>
        )}
      </div>
    </div>
  );
}
