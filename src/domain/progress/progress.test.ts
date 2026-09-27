import {
  completeLesson,
  emptyProgress,
  openLesson,
  recordQuizScore,
  recordReviewSession,
  toggleChecklistItem,
} from './progress';

const today = '2026-09-26';

describe('progress', () => {
  it('completes a lesson once and records the activity day once', () => {
    let s = completeLesson(emptyProgress(), 'a/b', today);
    s = completeLesson(s, 'a/b', today);
    expect(s.completed).toEqual({ 'a/b': today });
    expect(s.activityDays).toEqual([today]);
  });

  it('tracks the last opened lesson', () => {
    expect(openLesson(emptyProgress(), 'a/b').lastOpened).toBe('a/b');
  });

  it('keeps the best quiz score clamped to 0..1', () => {
    let s = recordQuizScore(emptyProgress(), 'a/b', 0.66);
    s = recordQuizScore(s, 'a/b', 0.33);
    s = recordQuizScore(s, 'a/c', 4);
    expect(s.quizScores).toEqual({ 'a/b': 0.66, 'a/c': 1 });
  });

  it('toggles checklist items by index', () => {
    let s = toggleChecklistItem(emptyProgress(), 'a/b:release', 2);
    s = toggleChecklistItem(s, 'a/b:release', 0);
    expect(s.checklists['a/b:release']).toEqual([0, 2]);
    s = toggleChecklistItem(s, 'a/b:release', 2);
    expect(s.checklists['a/b:release']).toEqual([0]);
  });

  it('counts a review session as activity only with at least 5 grades', () => {
    expect(recordReviewSession(emptyProgress(), 4, today).activityDays).toEqual([]);
    expect(recordReviewSession(emptyProgress(), 5, today).activityDays).toEqual([today]);
  });
});
