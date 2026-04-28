import { describe, expect, it } from 'vitest';
import {
  PROCESS_STATE_NOTE_KINDS,
  isProcessStateNoteKind,
  type ProcessStateNote,
} from '../processStateNote';

describe('PROCESS_STATE_NOTE_KINDS', () => {
  it('contains exactly 4 kinds in stable order', () => {
    expect(PROCESS_STATE_NOTE_KINDS).toEqual(['question', 'gemba', 'data-gap', 'decision']);
  });

  it('is a readonly tuple (length stable)', () => {
    expect(PROCESS_STATE_NOTE_KINDS).toHaveLength(4);
  });
});

describe('isProcessStateNoteKind', () => {
  it('returns true for all 4 valid kinds', () => {
    for (const kind of PROCESS_STATE_NOTE_KINDS) {
      expect(isProcessStateNoteKind(kind)).toBe(true);
    }
  });

  it('returns false for invalid strings', () => {
    expect(isProcessStateNoteKind('idea')).toBe(false);
    expect(isProcessStateNoteKind('')).toBe(false);
    expect(isProcessStateNoteKind('QUESTION')).toBe(false);
  });

  it('narrows the type when used as a predicate', () => {
    const candidate: string = 'question';
    if (isProcessStateNoteKind(candidate)) {
      const note: ProcessStateNote = {
        id: 'n-1',
        itemId: 'item-1',
        kind: candidate,
        text: 'hello',
        author: 'tester',
        createdAt: '2026-04-27T00:00:00.000Z',
      };
      expect(note.kind).toBe('question');
    } else {
      throw new Error('predicate should have narrowed');
    }
  });
});
