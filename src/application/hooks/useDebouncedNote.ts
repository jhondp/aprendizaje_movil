import { useCallback, useEffect, useRef, useState } from 'react';
import type { LessonId } from '@/domain/course';

const DEBOUNCE_MS = 400;

/**
 * Keeps a lesson note in local state for instant feedback while persisting it
 * with a debounce, so typing does not trigger a synchronous localStorage
 * write on every keystroke. Pending text is flushed immediately when the
 * lesson changes, when the hook unmounts, and when the page is hidden or
 * about to be discarded (visibilitychange / pagehide), so nothing is lost.
 */
export function useDebouncedNote(
  lessonId: LessonId,
  storedText: string,
  persist: (lessonId: LessonId, text: string) => void,
): { text: string; onChange(text: string): void } {
  const [text, setText] = useState(storedText);
  const pendingRef = useRef<{ lessonId: LessonId; text: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistRef = useRef(persist);
  persistRef.current = persist;

  const flush = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const pending = pendingRef.current;
    if (pending) {
      pendingRef.current = null;
      persistRef.current(pending.lessonId, pending.text);
    }
  }, []);

  // Flush any pending write for the previous lesson before switching, and on unmount.
  useEffect(() => {
    return () => flush();
  }, [lessonId, flush]);

  // Reseed local text whenever the lesson changes.
  useEffect(() => {
    setText(storedText);
    // storedText is only used to seed the value when the lesson changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  useEffect(() => {
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, [flush]);

  const onChange = useCallback(
    (nextText: string) => {
      setText(nextText);
      pendingRef.current = { lessonId, text: nextText };
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, DEBOUNCE_MS);
    },
    [lessonId, flush],
  );

  return { text, onChange };
}
