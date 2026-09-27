import { Link } from 'react-router-dom';
import { ROUTES } from '@/ui/routes';

export function NotFoundPage() {
  return (
    <section style={{ padding: 'var(--page-gutter)' }}>
      <h1>No encontramos esa página</h1>
      <p>
        <Link to={ROUTES.library}>Volver a la biblioteca</Link>
      </p>
    </section>
  );
}
