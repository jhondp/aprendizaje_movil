import { createPersistedStore } from './createPersistedStore';

describe('createPersistedStore', () => {
  beforeEach(() => localStorage.clear());

  it('starts from the initial value and persists updates under a namespaced key', () => {
    const store = createPersistedStore('t', { n: 1 });
    expect(store.get()).toEqual({ n: 1 });
    store.set({ n: 2 });
    expect(JSON.parse(localStorage.getItem('saber:t') ?? '{}').state.value).toEqual({ n: 2 });
    expect(createPersistedStore('t', { n: 0 }).get()).toEqual({ n: 2 });
  });

  it('notifies subscribers and allows unsubscribing', () => {
    const store = createPersistedStore('u', 0);
    const listener = vi.fn();
    const off = store.subscribe(listener);
    store.set(1);
    off();
    store.set(2);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('falls back to the initial value when stored JSON is corrupt', () => {
    localStorage.setItem('saber:c', '{not json');
    expect(createPersistedStore('c', { ok: true }).get()).toEqual({ ok: true });
  });

  it('works in memory when localStorage is unavailable', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('denied');
      },
    });
    try {
      const store = createPersistedStore('m', 5);
      store.set(6);
      expect(store.get()).toBe(6);
    } finally {
      if (original) Object.defineProperty(window, 'localStorage', original);
    }
  });
});
