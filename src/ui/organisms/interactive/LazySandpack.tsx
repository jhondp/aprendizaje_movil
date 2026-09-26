import { lazy, Suspense, type ComponentProps } from 'react';
import type { Sandpack } from './Sandpack';

const SandpackEditor = lazy(() => import('./Sandpack').then((m) => ({ default: m.Sandpack })));

/** Loads the Sandpack editor (and CodeMirror) on demand, only in lessons that use it. */
export function LazySandpack(props: ComponentProps<typeof Sandpack>) {
  return (
    <Suspense fallback={<p style={{ margin: '24px 0' }}>Cargando editor…</p>}>
      <SandpackEditor {...props} />
    </Suspense>
  );
}
