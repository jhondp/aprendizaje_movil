import { act, renderHook } from '@testing-library/react';
import { useDebouncedNote } from './useDebouncedNote';

describe('useDebouncedNote', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows typed text instantly but writes to the store only once after the debounce', () => {
    const persist = vi.fn();
    const { result } = renderHook(() => useDebouncedNote('a', '', persist));

    act(() => result.current.onChange('H'));
    act(() => result.current.onChange('Ho'));
    act(() => result.current.onChange('Hol'));
    act(() => result.current.onChange('Hola'));

    expect(result.current.text).toBe('Hola');
    expect(persist).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(400));

    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledWith('a', 'Hola');
  });

  it('flushes pending text immediately when the lesson changes', () => {
    const persist = vi.fn();
    const { result, rerender } = renderHook(
      ({ lessonId }: { lessonId: string }) => useDebouncedNote(lessonId, '', persist),
      { initialProps: { lessonId: 'a' } },
    );

    act(() => result.current.onChange('draft'));
    expect(persist).not.toHaveBeenCalled();

    rerender({ lessonId: 'b' });

    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledWith('a', 'draft');
  });

  it('flushes pending text immediately on unmount', () => {
    const persist = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedNote('a', '', persist));

    act(() => result.current.onChange('draft'));
    unmount();

    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledWith('a', 'draft');
  });

  it('flushes pending text on visibilitychange and pagehide', () => {
    const persist = vi.fn();
    const { result } = renderHook(() => useDebouncedNote('a', '', persist));

    act(() => result.current.onChange('draft'));
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(persist).toHaveBeenCalledTimes(1);

    act(() => result.current.onChange('draft2'));
    act(() => window.dispatchEvent(new Event('pagehide')));
    expect(persist).toHaveBeenCalledTimes(2);
    expect(persist).toHaveBeenLastCalledWith('a', 'draft2');
  });
});
