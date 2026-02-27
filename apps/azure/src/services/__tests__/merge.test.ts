import { describe, it, expect } from 'vitest';
import { mergeAnalysisState } from '../merge';
import type { AnalysisState } from '@variscout/hooks';
import type { Finding, FindingComment } from '@variscout/core';

// ── Helpers ──────────────────────────────────────────────────────────────

function makeState(overrides: Partial<AnalysisState> = {}): AnalysisState {
  return {
    version: '1.0',
    rawData: [],
    outcome: 'value',
    factors: ['Machine'],
    specs: {},
    filters: {},
    axisSettings: {},
    ...overrides,
  };
}

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'f1',
    text: 'Original finding',
    createdAt: 1000,
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'observed',
    comments: [],
    statusChangedAt: 1000,
    ...overrides,
  };
}

function makeComment(overrides: Partial<FindingComment> = {}): FindingComment {
  return {
    id: 'c1',
    text: 'A comment',
    createdAt: 2000,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('mergeAnalysisState', () => {
  describe('clean merge (no conflicts)', () => {
    it('returns merged result when no changes in any branch', () => {
      const base = makeState();
      const result = mergeAnalysisState(base, base, base);

      expect(result.hasConflict).toBe(false);
      expect(result.merged.outcome).toBe('value');
      expect(result.summary).toContain('Clean merge');
    });

    it('takes local change when only local changed', () => {
      const base = makeState({ outcome: 'weight' });
      const local = makeState({ outcome: 'temperature' });
      const remote = makeState({ outcome: 'weight' });

      const result = mergeAnalysisState(base, local, remote);

      expect(result.hasConflict).toBe(false);
      expect(result.merged.outcome).toBe('temperature');
    });

    it('takes remote change when only remote changed', () => {
      const base = makeState({ outcome: 'weight' });
      const local = makeState({ outcome: 'weight' });
      const remote = makeState({ outcome: 'temperature' });

      const result = mergeAnalysisState(base, local, remote);

      expect(result.merged.outcome).toBe('temperature');
    });

    it('takes remote when both changed (remote wins by default)', () => {
      const base = makeState({ outcome: 'weight' });
      const local = makeState({ outcome: 'height' });
      const remote = makeState({ outcome: 'temperature' });

      const result = mergeAnalysisState(base, local, remote);

      expect(result.merged.outcome).toBe('temperature');
    });
  });

  describe('rawData merge', () => {
    it('takes the larger array (additive rows)', () => {
      const base = makeState({ rawData: [{ a: 1 }, { a: 2 }] });
      const local = makeState({ rawData: [{ a: 1 }, { a: 2 }, { a: 3 }] });
      const remote = makeState({ rawData: [{ a: 1 }, { a: 2 }] });

      const result = mergeAnalysisState(base, local, remote);

      expect(result.merged.rawData).toHaveLength(3);
    });

    it('takes remote if remote has more rows', () => {
      const base = makeState({ rawData: [{ a: 1 }] });
      const local = makeState({ rawData: [{ a: 1 }] });
      const remote = makeState({ rawData: [{ a: 1 }, { a: 2 }, { a: 3 }] });

      const result = mergeAnalysisState(base, local, remote);

      expect(result.merged.rawData).toHaveLength(3);
    });
  });

  describe('findings merge — additive', () => {
    it('preserves findings new in local only', () => {
      const base = makeState({ findings: [] });
      const local = makeState({
        findings: [makeFinding({ id: 'local-new', text: 'Local finding' })],
      });
      const remote = makeState({ findings: [] });

      const result = mergeAnalysisState(base, local, remote);

      expect(result.merged.findings).toHaveLength(1);
      expect(result.merged.findings![0].text).toBe('Local finding');
    });

    it('preserves findings new in remote only', () => {
      const base = makeState({ findings: [] });
      const local = makeState({ findings: [] });
      const remote = makeState({
        findings: [makeFinding({ id: 'remote-new', text: 'Remote finding' })],
      });

      const result = mergeAnalysisState(base, local, remote);

      expect(result.merged.findings).toHaveLength(1);
      expect(result.merged.findings![0].text).toBe('Remote finding');
    });

    it('merges findings from both sides (union)', () => {
      const base = makeState({ findings: [] });
      const local = makeState({
        findings: [makeFinding({ id: 'f-local', text: 'Local' })],
      });
      const remote = makeState({
        findings: [makeFinding({ id: 'f-remote', text: 'Remote' })],
      });

      const result = mergeAnalysisState(base, local, remote);

      expect(result.merged.findings).toHaveLength(2);
      const ids = result.merged.findings!.map(f => f.id);
      expect(ids).toContain('f-local');
      expect(ids).toContain('f-remote');
    });
  });

  describe('findings merge — deletion', () => {
    it('removes finding deleted in local', () => {
      const finding = makeFinding({ id: 'del-local' });
      const base = makeState({ findings: [finding] });
      const local = makeState({ findings: [] }); // deleted
      const remote = makeState({ findings: [finding] });

      const result = mergeAnalysisState(base, local, remote);

      expect(result.merged.findings).toHaveLength(0);
    });

    it('removes finding deleted in remote', () => {
      const finding = makeFinding({ id: 'del-remote' });
      const base = makeState({ findings: [finding] });
      const local = makeState({ findings: [finding] });
      const remote = makeState({ findings: [] }); // deleted

      const result = mergeAnalysisState(base, local, remote);

      expect(result.merged.findings).toHaveLength(0);
    });
  });

  describe('findings merge — modification', () => {
    it('takes local version when only local modified text', () => {
      const baseFinding = makeFinding({ id: 'f1', text: 'Original' });
      const localFinding = makeFinding({ id: 'f1', text: 'Local edit' });
      const remoteFinding = makeFinding({ id: 'f1', text: 'Original' });

      const base = makeState({ findings: [baseFinding] });
      const local = makeState({ findings: [localFinding] });
      const remote = makeState({ findings: [remoteFinding] });

      const result = mergeAnalysisState(base, local, remote);

      expect(result.merged.findings![0].text).toBe('Local edit');
      expect(result.hasConflict).toBe(false);
    });

    it('takes remote version when only remote modified text', () => {
      const baseFinding = makeFinding({ id: 'f1', text: 'Original' });
      const localFinding = makeFinding({ id: 'f1', text: 'Original' });
      const remoteFinding = makeFinding({ id: 'f1', text: 'Remote edit' });

      const base = makeState({ findings: [baseFinding] });
      const local = makeState({ findings: [localFinding] });
      const remote = makeState({ findings: [remoteFinding] });

      const result = mergeAnalysisState(base, local, remote);

      expect(result.merged.findings![0].text).toBe('Remote edit');
    });

    it('reports conflict when both modified text differently', () => {
      const baseFinding = makeFinding({ id: 'f1', text: 'Original text here' });
      const localFinding = makeFinding({ id: 'f1', text: 'Local version' });
      const remoteFinding = makeFinding({ id: 'f1', text: 'Remote version' });

      const base = makeState({ findings: [baseFinding] });
      const local = makeState({ findings: [localFinding] });
      const remote = makeState({ findings: [remoteFinding] });

      const result = mergeAnalysisState(base, local, remote);

      expect(result.hasConflict).toBe(true);
      expect(result.summary).toContain('text edited by both');
      // Local text wins
      expect(result.merged.findings![0].text).toBe('Local version');
    });
  });

  describe('findings merge — status', () => {
    it('takes the most recent status (local newer)', () => {
      const baseFinding = makeFinding({
        id: 'f1',
        status: 'observed',
        statusChangedAt: 1000,
      });
      const localFinding = makeFinding({
        id: 'f1',
        status: 'investigating',
        statusChangedAt: 3000,
      });
      const remoteFinding = makeFinding({
        id: 'f1',
        status: 'analyzed',
        statusChangedAt: 2000,
      });

      const base = makeState({ findings: [baseFinding] });
      const local = makeState({ findings: [localFinding] });
      const remote = makeState({ findings: [remoteFinding] });

      const result = mergeAnalysisState(base, local, remote);

      expect(result.merged.findings![0].status).toBe('investigating');
      expect(result.merged.findings![0].statusChangedAt).toBe(3000);
    });

    it('takes the most recent status (remote newer)', () => {
      const baseFinding = makeFinding({
        id: 'f1',
        status: 'observed',
        statusChangedAt: 1000,
      });
      const localFinding = makeFinding({
        id: 'f1',
        status: 'investigating',
        statusChangedAt: 2000,
      });
      const remoteFinding = makeFinding({
        id: 'f1',
        status: 'analyzed',
        statusChangedAt: 3000,
      });

      const base = makeState({ findings: [baseFinding] });
      const local = makeState({ findings: [localFinding] });
      const remote = makeState({ findings: [remoteFinding] });

      const result = mergeAnalysisState(base, local, remote);

      expect(result.merged.findings![0].status).toBe('analyzed');
    });
  });

  describe('findings merge — comments', () => {
    it('merges comments from both sides (union by ID)', () => {
      const baseFinding = makeFinding({
        id: 'f1',
        comments: [makeComment({ id: 'c-base', text: 'Base comment' })],
      });
      const localFinding = makeFinding({
        id: 'f1',
        comments: [
          makeComment({ id: 'c-base', text: 'Base comment' }),
          makeComment({ id: 'c-local', text: 'Local comment', createdAt: 3000 }),
        ],
      });
      const remoteFinding = makeFinding({
        id: 'f1',
        comments: [
          makeComment({ id: 'c-base', text: 'Base comment' }),
          makeComment({ id: 'c-remote', text: 'Remote comment', createdAt: 4000 }),
        ],
      });

      const base = makeState({ findings: [baseFinding] });
      const local = makeState({ findings: [localFinding] });
      const remote = makeState({ findings: [remoteFinding] });

      const result = mergeAnalysisState(base, local, remote);

      const comments = result.merged.findings![0].comments;
      expect(comments).toHaveLength(3);
      const ids = comments.map(c => c.id);
      expect(ids).toContain('c-base');
      expect(ids).toContain('c-local');
      expect(ids).toContain('c-remote');
    });

    it('sorts comments by createdAt ascending', () => {
      const baseFinding = makeFinding({ id: 'f1', comments: [] });
      const localFinding = makeFinding({
        id: 'f1',
        comments: [makeComment({ id: 'c2', text: 'Second', createdAt: 5000 })],
      });
      const remoteFinding = makeFinding({
        id: 'f1',
        comments: [makeComment({ id: 'c1', text: 'First', createdAt: 3000 })],
      });

      const base = makeState({ findings: [baseFinding] });
      const local = makeState({ findings: [localFinding] });
      const remote = makeState({ findings: [remoteFinding] });

      const result = mergeAnalysisState(base, local, remote);

      const comments = result.merged.findings![0].comments;
      expect(comments[0].id).toBe('c1');
      expect(comments[1].id).toBe('c2');
    });

    it('takes newer version of same-ID comment', () => {
      const baseComment = makeComment({ id: 'c1', text: 'Original', createdAt: 1000 });
      const baseFinding = makeFinding({ id: 'f1', comments: [baseComment] });

      // Remote has an updated version (e.g. photo status update)
      const updatedComment = makeComment({
        id: 'c1',
        text: 'Original',
        createdAt: 2000,
      });
      const localFinding = makeFinding({ id: 'f1', comments: [baseComment] });
      const remoteFinding = makeFinding({ id: 'f1', comments: [updatedComment] });

      const base = makeState({ findings: [baseFinding] });
      const local = makeState({ findings: [localFinding] });
      const remote = makeState({ findings: [remoteFinding] });

      const result = mergeAnalysisState(base, local, remote);

      expect(result.merged.findings![0].comments[0].createdAt).toBe(2000);
    });
  });

  describe('scalar field merge', () => {
    it('merges specs independently', () => {
      const base = makeState({ specs: { usl: 10 } });
      const local = makeState({ specs: { usl: 12 } }); // local changed
      const remote = makeState({ specs: { usl: 10 } }); // remote unchanged

      const result = mergeAnalysisState(base, local, remote);

      expect(result.merged.specs).toEqual({ usl: 12 });
    });

    it('merges displayOptions independently', () => {
      const base = makeState({ displayOptions: { showViolin: false } as never });
      const local = makeState({ displayOptions: { showViolin: true } as never });
      const remote = makeState({ displayOptions: { showViolin: false } as never });

      const result = mergeAnalysisState(base, local, remote);

      expect((result.merged.displayOptions as { showViolin: boolean }).showViolin).toBe(true);
    });

    it('merges columnAliases', () => {
      const base = makeState({ columnAliases: { col1: 'Column 1' } });
      const local = makeState({ columnAliases: { col1: 'My Column' } });
      const remote = makeState({ columnAliases: { col1: 'Column 1' } });

      const result = mergeAnalysisState(base, local, remote);

      expect(result.merged.columnAliases).toEqual({ col1: 'My Column' });
    });
  });

  describe('edge cases', () => {
    it('handles empty findings arrays', () => {
      const base = makeState({ findings: undefined });
      const local = makeState({ findings: [] });
      const remote = makeState({ findings: undefined });

      const result = mergeAnalysisState(base, local, remote);

      expect(result.merged.findings).toEqual([]);
      expect(result.hasConflict).toBe(false);
    });

    it('handles undefined optional fields', () => {
      const base = makeState();
      const local = makeState({ cpkTarget: 1.33 });
      const remote = makeState();

      const result = mergeAnalysisState(base, local, remote);

      expect(result.merged.cpkTarget).toBe(1.33);
    });

    it('preserves version from local', () => {
      const base = makeState({ version: '1.0' });
      const local = makeState({ version: '1.1' });
      const remote = makeState({ version: '1.0' });

      const result = mergeAnalysisState(base, local, remote);

      expect(result.merged.version).toBe('1.1');
    });
  });
});
