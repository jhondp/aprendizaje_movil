import { emptyNotes, upsertNote } from './notes';

describe('upsertNote', () => {
  it('creates and updates a note with a timestamp', () => {
    let s = upsertNote(emptyNotes(), 'a/b', 'hola', '2026-09-26T10:00:00.000Z');
    expect(s['a/b']).toEqual({
      lessonId: 'a/b',
      text: 'hola',
      updatedAt: '2026-09-26T10:00:00.000Z',
    });
    s = upsertNote(s, 'a/b', 'adiós', '2026-09-26T11:00:00.000Z');
    expect(s['a/b']?.text).toBe('adiós');
  });
  it('removes the note when text is blank', () => {
    const s = upsertNote(upsertNote(emptyNotes(), 'a/b', 'x', 't'), 'a/b', '   ', 't2');
    expect(s).toEqual({});
  });
});
