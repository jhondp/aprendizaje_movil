import type { ReactNode } from 'react';
import { RepositoriesContext } from './useRepositories';
import type { Repositories } from './ports/Repositories';

export function RepositoriesProvider({
  value,
  children,
}: {
  value: Repositories;
  children: ReactNode;
}) {
  return <RepositoriesContext.Provider value={value}>{children}</RepositoriesContext.Provider>;
}
