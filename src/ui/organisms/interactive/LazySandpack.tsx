import { Component, lazy, Suspense, type ComponentProps, type ReactNode } from 'react';
import type { Sandpack } from './Sandpack';

const SandpackEditor = lazy(() => import('./Sandpack').then((m) => ({ default: m.Sandpack })));

/** Catches a failed dynamic import (stale tab, offline) so it degrades the widget. */
class SandpackErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <p style={{ margin: '24px 0', color: 'var(--color-error)' }}>
          No se pudo cargar el editor interactivo. Revisa tu conexión y recarga la página.
        </p>
      );
    }
    return this.props.children;
  }
}

/** Loads the Sandpack editor (and CodeMirror) on demand, only in lessons that use it. */
export function LazySandpack(props: ComponentProps<typeof Sandpack>) {
  return (
    <SandpackErrorBoundary>
      <Suspense fallback={<p style={{ margin: '24px 0' }}>Cargando editor…</p>}>
        <SandpackEditor {...props} />
      </Suspense>
    </SandpackErrorBoundary>
  );
}
