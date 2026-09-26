import { useSyncExternalStore } from 'react';
import type { Store } from '@/application/ports/Store';

export function useStoreValue<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
