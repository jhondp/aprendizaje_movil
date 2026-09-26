import { NavLink } from 'react-router-dom';
import { Brand } from '@/ui/atoms/Brand';
import { ROUTES } from '@/ui/routes';
import styles from './TopNav.module.css';

const LINKS = [
  { to: ROUTES.library, label: 'Biblioteca', end: true },
  { to: ROUTES.review, label: 'Repaso', end: false },
  { to: ROUTES.notes, label: 'Notas', end: false },
];

export function TopNav() {
  return (
    <header className={styles.root}>
      <Brand />
      <nav className={styles.nav} aria-label="Principal">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => (isActive ? styles.active : styles.link)}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
