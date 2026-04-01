import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useJournalEntries } from '../useJournalEntries';
import type { Finding, FindingContext, Hypothesis } from '@variscout/core';

const makeContext = (): FindingContext => ({
  activeFilters: {},
  cumulativeScope: null,
});

const makeFinding = (overrides: Partial<Finding> = {}): Finding => ({
  id: 'f1',
  text: 'Night shift 2.5mm higher',
  status: 'observed',
  createdAt: new Date('2026-04-01T10:45:00Z').getTime(),
  statusChangedAt: new Date('2026-04-01T10:45:00Z').getTime(),
  context: makeContext(),
  comments: [],
  ...overrides,
});

const makeQuestion = (overrides: Partial<Hypothesis> = {}): Hypothesis => ({
  id: 'q1',
  text: 'Does Shift affect fill weight?',
  status: 'supported',
  linkedFindingIds: ['f1'],
  createdAt: '2026-04-01T10:20:00Z',
  updatedAt: '2026-04-01T10:45:00Z',
  questionSource: 'factor-intel',
  evidence: { rSquaredAdj: 0.15 },
  ...overrides,
});

describe('useJournalEntries', () => {
  it('returns empty array when no inputs', () => {
    const { result } = renderHook(() => useJournalEntries({ findings: [], questions: [] }));
    expect(result.current).toEqual([]);
  });

  it('creates entry for each finding', () => {
    const { result } = renderHook(() =>
      useJournalEntries({ findings: [makeFinding()], questions: [] })
    );
    expect(result.current).toHaveLength(1);
    expect(result.current[0].type).toBe('finding-created');
    expect(result.current[0].text).toContain('Night shift');
  });

  it('creates note-added entries for finding comments', () => {
    const finding = makeFinding({
      comments: [
        {
          id: 'c1',
          text: 'Confirmed by operator',
          createdAt: new Date('2026-04-01T11:00:00Z').getTime(),
        },
      ],
    });
    const { result } = renderHook(() => useJournalEntries({ findings: [finding], questions: [] }));
    const noteEntry = result.current.find(e => e.type === 'note-added');
    expect(noteEntry).toBeDefined();
    expect(noteEntry!.text).toBe('Confirmed by operator');
    expect(noteEntry!.detail).toContain('Night shift');
    expect(noteEntry!.relatedFindingId).toBe('f1');
  });

  it('creates entry for answered questions', () => {
    const { result } = renderHook(() =>
      useJournalEntries({ findings: [], questions: [makeQuestion()] })
    );
    const entry = result.current.find(e => e.type === 'question-answered');
    expect(entry).toBeDefined();
    expect(entry!.text).toContain('Shift');
    expect(entry!.detail).toBe('R²adj 15%');
    expect(entry!.relatedQuestionId).toBe('q1');
  });

  it('creates entry for ruled-out questions', () => {
    const { result } = renderHook(() =>
      useJournalEntries({
        findings: [],
        questions: [
          makeQuestion({
            id: 'q2',
            text: 'Does Speed matter?',
            status: 'contradicted',
          }),
        ],
      })
    );
    const entry = result.current.find(e => e.type === 'question-ruled-out');
    expect(entry).toBeDefined();
    expect(entry!.text).toContain('Speed');
  });

  it('does not create entries for untested questions', () => {
    const { result } = renderHook(() =>
      useJournalEntries({
        findings: [],
        questions: [makeQuestion({ status: 'untested' })],
      })
    );
    expect(result.current).toHaveLength(0);
  });

  it('creates problem-statement entry when provided', () => {
    const { result } = renderHook(() =>
      useJournalEntries({
        findings: [],
        questions: [],
        problemStatement: 'Fill weight varies by shift',
      })
    );
    const entry = result.current.find(e => e.type === 'problem-statement');
    expect(entry).toBeDefined();
    expect(entry!.detail).toBe('Fill weight varies by shift');
  });

  it('sorts entries chronologically (oldest first)', () => {
    const earlyFinding = makeFinding({
      id: 'f-early',
      createdAt: new Date('2026-04-01T09:00:00Z').getTime(),
    });
    const laterQuestion = makeQuestion({
      updatedAt: '2026-04-01T11:00:00Z',
    });
    const { result } = renderHook(() =>
      useJournalEntries({
        findings: [earlyFinding],
        questions: [laterQuestion],
      })
    );
    expect(result.current.length).toBeGreaterThanOrEqual(2);
    const timestamps = result.current.map(e => e.timestamp);
    expect(timestamps).toEqual([...timestamps].sort());
  });

  it('uses factor name in question entry when available', () => {
    const { result } = renderHook(() =>
      useJournalEntries({
        findings: [],
        questions: [makeQuestion({ factor: 'Shift' })],
      })
    );
    const entry = result.current.find(e => e.type === 'question-answered');
    expect(entry!.text).toContain('Shift');
  });

  it('omits R²adj detail when evidence is absent', () => {
    const { result } = renderHook(() =>
      useJournalEntries({
        findings: [],
        questions: [makeQuestion({ evidence: undefined })],
      })
    );
    const entry = result.current.find(e => e.type === 'question-answered');
    expect(entry!.detail).toBeUndefined();
  });
});
