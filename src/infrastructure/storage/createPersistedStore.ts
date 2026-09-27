import { createStore } from 'zustand/vanilla';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { Store } from '@/application/ports/Store';

interface Slice<T> {
  value: T;
}

function safeLocalStorage(): StateStorage | null {
  try {
    const ls = window.localStorage;
    const probeKey = 'saber:probe';
    ls.setItem(probeKey, '1');
    ls.removeItem(probeKey);
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

/**
 * Wraps a StateStorage so a throwing setItem (quota exceeded, some private
 * browsing modes) never escapes to the caller. The value still lands in an
 * in-memory fallback map for the rest of the session, and a single
 * console.warn is emitted the first time a write fails.
 */
function resilientStorage(backend: StateStorage): StateStorage {
  const fallback = new Map<string, string>();
  let warned = false;
  return {
    getItem: (k) => {
      if (fallback.has(k)) return fallback.get(k) ?? null;
      return backend.getItem(k);
    },
    setItem: (k, v) => {
      fallback.set(k, v);
      try {
        backend.setItem(k, v);
      } catch (error) {
        if (!warned) {
          warned = true;
          console.warn('saber: localStorage write failed, keeping data in memory only', error);
        }
      }
    },
    removeItem: (k) => {
      fallback.delete(k);
      try {
        backend.removeItem(k);
      } catch {
        // ignore: fallback already cleared, nothing more to do
      }
    },
  };
}

export function createPersistedStore<T>(name: string, initial: T): Store<T> {
  const backend = resilientStorage(safeLocalStorage() ?? memoryStorage());
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
