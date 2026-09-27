import { createContext, useContext } from 'react';
import type { Repositories } from './ports/Repositories';

export const RepositoriesContext = createContext<Repositories | null>(null);

export function useRepositories(): Repositories {
  const repos = useContext(RepositoriesContext);
  if (!repos) throw new Error('RepositoriesProvider is missing above this component');
  return repos;
}
