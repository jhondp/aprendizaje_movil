import { Link } from 'react-router-dom';

/** Minimal branded fallback for unexpected render errors, so the routed
 * subtree never falls back to react-router's unstyled default error page. */
export function RouteError() {
  return (
    <section style={{ padding: 'var(--page-gutter)' }}>
      <h1>Algo salió mal</h1>
      <p>
        <Link to="/">Volver al inicio</Link>
      </p>
    </section>
  );
}
