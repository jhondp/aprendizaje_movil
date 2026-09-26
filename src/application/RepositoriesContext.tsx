import { createContext, useContext, type ReactNode } from 'react';
import type { Repositories } from './ports/Repositories';

const RepositoriesContext = createContext<Repositories | null>(null);

export function RepositoriesProvider({
  value,
  children,
}: {
  value: Repositories;
  children: ReactNode;
}) {
  return <RepositoriesContext.Provider value={value}>{children}</RepositoriesContext.Provider>;
}

export function useRepositories(): Repositories {
  const repos = useContext(RepositoriesContext);
  if (!repos) throw new Error('RepositoriesProvider is missing above this component');
  return repos;
}
