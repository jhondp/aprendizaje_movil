import { createStore } from 'zustand/vanilla';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { Store } from '@/application/ports/Store';

interface Slice<T> {
  value: T;
}

function safeLocalStorage(): StateStorage | null {
  try {
    const ls = window.localStorage;
    ls.getItem('saber:probe');
    return ls;
  } catch {
    return null;
  }
}

function memoryStorage(): StateStorage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

export function createPersistedStore<T>(name: string, initial: T): Store<T> {
  const backend = safeLocalStorage() ?? memoryStorage();
  const store = createStore<Slice<T>>()(
    persist(() => ({ value: initial }), {
      name: `saber:${name}`,
      storage: createJSONStorage(() => backend),
      merge: (persisted, current) => {
        const p = persisted as Partial<Slice<T>> | undefined;
        return p && typeof p === 'object' && 'value' in p && p.value !== undefined
          ? { value: p.value as T }
          : current;
      },
    }),
  );
  return {
    get: () => store.getState().value,
    set: (next) => store.setState({ value: next }),
    subscribe: (listener) => store.subscribe(listener),
  };
}
