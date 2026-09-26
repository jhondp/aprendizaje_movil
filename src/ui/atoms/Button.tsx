import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'dark' | 'ghost';

export function Button({
  variant = 'primary',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type="button"
      {...rest}
      data-variant={variant}
      className={[styles.root, className].filter(Boolean).join(' ')}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  to,
  variant = 'primary',
  children,
}: {
  to: string;
  variant?: ButtonVariant;
  children: ReactNode;
}) {
  return (
    <Link to={to} data-variant={variant} className={styles.root}>
      {children}
    </Link>
  );
}
