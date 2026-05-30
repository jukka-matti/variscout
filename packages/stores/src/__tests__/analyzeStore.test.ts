import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAnalyzeStore, getAnalyzeInitialState } from '../analyzeStore';
import { useProjectStore, getProjectInitialState } from '../projectStore';
import { useCanvasViewportStore, getCanvasViewportInitialState } from '../canvasViewportStore';
import type {
  FindingContext,
  FindingOutcome,
  Hypothesis,
  AnalyzeCategory,
  GateNode,
  ProblemStatementScope,
} from '@variscout/core';
import { DEFAULT_TIME_LENS } from '@variscout/core';

// ============================================================================
// Helpers
// ============================================================================

const makeContext = (overrides?: Partial<FindingContext>): FindingContext => ({
  activeFilters: {},
  cumulativeScope: null,
  stats: { mean: 10, samples: 100 },
  ...overrides,
});

beforeEach(() => {
  useAnalyzeStore.setState(getAnalyzeInitialState());
});

// ============================================================================
// Finding tests
// ============================================================================

describe('analyzeStore — findings', () => {
  it('adds a finding with text, context, and source', () => {
    const ctx = makeContext();
    const source = { chart: 'boxplot' as const, category: 'A', timeLens: DEFAULT_TIME_LENS };
    const finding = useAnalyzeStore.getState().addFinding('test note', ctx, source);

    const state = useAnalyzeStore.getState();
    expect(state.findings).toHaveLength(1);
    expect(state.findings[0].text).toBe('test note');
    expect(state.findings[0].source).toEqual(source);
    expect(state.findings[0].status).toBe('observed');
    expect(finding.id).toBe(state.findings[0].id);
  });

  it('prepends new findings (newest first)', () => {
    const ctx = makeContext();
    useAnalyzeStore.getState().addFinding('first', ctx);
    useAnalyzeStore.getState().addFinding('second', ctx);
    const { findings } = useAnalyzeStore.getState();
    expect(findings[0].text).toBe('second');
    expect(findings[1].text).toBe('first');
  });

  it('edits a finding text', () => {
    const ctx = makeContext();
    const f = useAnalyzeStore.getState().addFinding('original', ctx);
    useAnalyzeStore.getState().editFinding(f.id, 'updated');
    expect(useAnalyzeStore.getState().findings[0].text).toBe('updated');
  });

  it('deletes a finding', () => {
    const ctx = makeContext();
    const f = useAnalyzeStore.getState().addFinding('to delete', ctx);
    useAnalyzeStore.getState().deleteFinding(f.id);
    expect(useAnalyzeStore.getState().findings).toHaveLength(0);
  });

  it('sets finding status with statusChangedAt', () => {
    const ctx = makeContext();
    const f = useAnalyzeStore.getState().addFinding('note', ctx);
    const before = Date.now();
    useAnalyzeStore.getState().setFindingStatus(f.id, 'investigating');
    const updated = useAnalyzeStore.getState().findings[0];
    expect(updated.status).toBe('investigating');
    expect(updated.statusChangedAt).toBeGreaterThanOrEqual(before);
  });

  it('sets finding tag', () => {
    const ctx = makeContext();
    const f = useAnalyzeStore.getState().addFinding('note', ctx);
    useAnalyzeStore.getState().setFindingTag(f.id, 'key-driver');
    expect(useAnalyzeStore.getState().findings[0].tag).toBe('key-driver');

    // Clear tag
    useAnalyzeStore.getState().setFindingTag(f.id, null);
    expect(useAnalyzeStore.getState().findings[0].tag).toBeUndefined();
  });

  it('sets finding assignee and clears it', () => {
    const ctx = makeContext();
    const f = useAnalyzeStore.getState().addFinding('note', ctx);
    const assignee = { upn: 'jane@test.com', displayName: 'Jane' };
    useAnalyzeStore.getState().setFindingAssignee(f.id, assignee);
    expect(useAnalyzeStore.getState().findings[0].assignee).toEqual(assignee);

    useAnalyzeStore.getState().setFindingAssignee(f.id, null);
    expect(useAnalyzeStore.getState().findings[0].assignee).toBeUndefined();
  });

  it('adds comment to finding', () => {
    const ctx = makeContext();
    const f = useAnalyzeStore.getState().addFinding('note', ctx);
    const comment = useAnalyzeStore.getState().addFindingComment(f.id, 'my comment', 'Bob');
    const updated = useAnalyzeStore.getState().findings[0];
    expect(updated.comments).toHaveLength(1);
    expect(updated.comments[0].text).toBe('my comment');
    expect(updated.comments[0].author).toBe('Bob');
    expect(comment.id).toBe(updated.comments[0].id);
  });

  it('edits and deletes a comment', () => {
    const ctx = makeContext();
    const f = useAnalyzeStore.getState().addFinding('note', ctx);
    const c = useAnalyzeStore.getState().addFindingComment(f.id, 'original');
    useAnalyzeStore.getState().editFindingComment(f.id, c.id, 'edited');
    expect(useAnalyzeStore.getState().findings[0].comments[0].text).toBe('edited');

    useAnalyzeStore.getState().deleteFindingComment(f.id, c.id);
    expect(useAnalyzeStore.getState().findings[0].comments).toHaveLength(0);
  });

  it('sets and clears finding projection', () => {
    const ctx = makeContext();
    const f = useAnalyzeStore.getState().addFinding('note', ctx);
    const projection = {
      baselineMean: 10,
      baselineSigma: 1,
      projectedMean: 9,
      projectedSigma: 0.8,
      meanDelta: -1,
      sigmaDelta: -0.2,
      simulationParams: { meanAdjustment: -1, variationReduction: 20 },
      createdAt: new Date().toISOString(),
    };
    useAnalyzeStore.getState().setFindingProjection(f.id, projection);
    expect(useAnalyzeStore.getState().findings[0].projection).toEqual(projection);

    useAnalyzeStore.getState().clearFindingProjection(f.id);
    expect(useAnalyzeStore.getState().findings[0].projection).toBeUndefined();
  });
});

describe('analyzeStore — finding actions (action items)', () => {
  it('adds action with auto-transition: analyzed → improving', () => {
    const ctx = makeContext();
    const f = useAnalyzeStore.getState().addFinding('note', ctx);
    useAnalyzeStore.getState().setFindingStatus(f.id, 'analyzed');

    useAnalyzeStore.getState().addFindingAction(f.id, 'Fix the machine');
    const updated = useAnalyzeStore.getState().findings[0];
    expect(updated.actions).toHaveLength(1);
    expect(updated.actions![0].text).toBe('Fix the machine');
    // Auto-transition: first action on 'analyzed' → 'improving'
    expect(updated.status).toBe('improving');
  });

  it('does not auto-transition if status is not analyzed', () => {
    const ctx = makeContext();
    const f = useAnalyzeStore.getState().addFinding('note', ctx);
    // Status is 'observed' (default)
    useAnalyzeStore.getState().addFindingAction(f.id, 'Fix');
    expect(useAnalyzeStore.getState().findings[0].status).toBe('observed');
  });

  it('does not auto-transition if finding already has actions', () => {
    const ctx = makeContext();
    const f = useAnalyzeStore.getState().addFinding('note', ctx);
    useAnalyzeStore.getState().setFindingStatus(f.id, 'analyzed');
    useAnalyzeStore.getState().addFindingAction(f.id, 'First');
    // Status is now 'improving' from first action
    useAnalyzeStore.getState().addFindingAction(f.id, 'Second');
    expect(useAnalyzeStore.getState().findings[0].status).toBe('improving');
    expect(useAnalyzeStore.getState().findings[0].actions).toHaveLength(2);
  });

  it('updates an action item', () => {
    const ctx = makeContext();
    const f = useAnalyzeStore.getState().addFinding('note', ctx);
    useAnalyzeStore.getState().addFindingAction(f.id, 'Original');
    const actionId = useAnalyzeStore.getState().findings[0].actions![0].id;
    useAnalyzeStore.getState().updateFindingAction(f.id, actionId, { text: 'Updated' });
    expect(useAnalyzeStore.getState().findings[0].actions![0].text).toBe('Updated');
  });

  it('completes an action item', () => {
    const ctx = makeContext();
    const f = useAnalyzeStore.getState().addFinding('note', ctx);
    useAnalyzeStore.getState().addFindingAction(f.id, 'Task');
    const actionId = useAnalyzeStore.getState().findings[0].actions![0].id;
    useAnalyzeStore.getState().completeFindingAction(f.id, actionId);
    expect(useAnalyzeStore.getState().findings[0].actions![0].completedAt).toBeDefined();
  });

  it('toggles action completion', () => {
    const ctx = makeContext();
    const f = useAnalyzeStore.getState().addFinding('note', ctx);
    useAnalyzeStore.getState().addFindingAction(f.id, 'Task');
    const actionId = useAnalyzeStore.getState().findings[0].actions![0].id;

    // Toggle on
    useAnalyzeStore.getState().toggleFindingActionComplete(f.id, actionId);
    expect(useAnalyzeStore.getState().findings[0].actions![0].completedAt).toBeDefined();

    // Toggle off
    useAnalyzeStore.getState().toggleFindingActionComplete(f.id, actionId);
    expect(useAnalyzeStore.getState().findings[0].actions![0].completedAt).toBeUndefined();
  });

  it('deletes an action item', () => {
    const ctx = makeContext();
    const f = useAnalyzeStore.getState().addFinding('note', ctx);
    useAnalyzeStore.getState().addFindingAction(f.id, 'To delete');
    const actionId = useAnalyzeStore.getState().findings[0].actions![0].id;
    useAnalyzeStore.getState().deleteFindingAction(f.id, actionId);
    expect(useAnalyzeStore.getState().findings[0].actions).toHaveLength(0);
  });
});

describe('analyzeStore — finding outcome', () => {
  it('sets outcome with auto-transition: improving + all complete → resolved', () => {
    const ctx = makeContext();
    const f = useAnalyzeStore.getState().addFinding('note', ctx);
    useAnalyzeStore.getState().setFindingStatus(f.id, 'analyzed');
    useAnalyzeStore.getState().addFindingAction(f.id, 'Fix');
    // Status auto-transitioned to 'improving'

    const actionId = useAnalyzeStore.getState().findings[0].actions![0].id;
    useAnalyzeStore.getState().completeFindingAction(f.id, actionId);

    const outcome: FindingOutcome = {
      effective: 'yes',
      cpkBefore: 0.8,
      cpkAfter: 1.5,
      verifiedAt: Date.now(),
    };
    useAnalyzeStore.getState().setFindingOutcome(f.id, outcome);
    const updated = useAnalyzeStore.getState().findings[0];
    expect(updated.outcome).toEqual(outcome);
    expect(updated.status).toBe('resolved');
  });

  it('does not auto-transition if not all actions complete', () => {
    const ctx = makeContext();
    const f = useAnalyzeStore.getState().addFinding('note', ctx);
    useAnalyzeStore.getState().setFindingStatus(f.id, 'analyzed');
    useAnalyzeStore.getState().addFindingAction(f.id, 'Fix');
    // Don't complete the action

    const outcome: FindingOutcome = {
      effective: 'partial',
      verifiedAt: Date.now(),
    };
    useAnalyzeStore.getState().setFindingOutcome(f.id, outcome);
    expect(useAnalyzeStore.getState().findings[0].status).toBe('improving');
  });
});

describe('analyzeStore — benchmark + scope', () => {
  it('sets benchmark and clears previous benchmark', () => {
    const ctx = makeContext();
    const f1 = useAnalyzeStore.getState().addFinding('first', ctx);
    const f2 = useAnalyzeStore.getState().addFinding('second', ctx);

    const stats = { mean: 10, stdDev: 1, cpk: 1.5, count: 50 };
    useAnalyzeStore.getState().setBenchmark(f1.id, stats);
    expect(useAnalyzeStore.getState().findings.find(f => f.id === f1.id)?.role).toBe('benchmark');

    // Set new benchmark → clears old one
    useAnalyzeStore.getState().setBenchmark(f2.id, stats);
    const state = useAnalyzeStore.getState();
    expect(state.findings.find(f => f.id === f1.id)?.role).toBeUndefined();
    expect(state.findings.find(f => f.id === f2.id)?.role).toBe('benchmark');
  });

  it('clears benchmark', () => {
    const ctx = makeContext();
    const f = useAnalyzeStore.getState().addFinding('note', ctx);
    const stats = { mean: 10, stdDev: 1, count: 50 };
    useAnalyzeStore.getState().setBenchmark(f.id, stats);
    useAnalyzeStore.getState().clearBenchmark(f.id);
    expect(useAnalyzeStore.getState().findings[0].role).toBeUndefined();
    expect(useAnalyzeStore.getState().findings[0].benchmarkStats).toBeUndefined();
  });

  it('toggles scope: undefined → true → false → undefined', () => {
    const ctx = makeContext();
    const f = useAnalyzeStore.getState().addFinding('note', ctx);

    expect(useAnalyzeStore.getState().findings[0].scoped).toBeUndefined();

    useAnalyzeStore.getState().toggleScope(f.id);
    expect(useAnalyzeStore.getState().findings[0].scoped).toBe(true);

    useAnalyzeStore.getState().toggleScope(f.id);
    expect(useAnalyzeStore.getState().findings[0].scoped).toBe(false);

    useAnalyzeStore.getState().toggleScope(f.id);
    expect(useAnalyzeStore.getState().findings[0].scoped).toBeUndefined();
  });
});

// ============================================================================
// Scopes slice tests (ADR-085 — first-class WHERE)
// ============================================================================

describe('analyzeStore — scopes', () => {
  it('starts with empty scopes', () => {
    expect(useAnalyzeStore.getState().scopes).toEqual([]);
  });

  it('addScope creates a scope with outcome and investigationId', () => {
    const scope = useAnalyzeStore.getState().addScope('inv-1', 'High defect rate on Line 3');
    const state = useAnalyzeStore.getState();
    expect(state.scopes).toHaveLength(1);
    expect(state.scopes[0].outcome).toBe('High defect rate on Line 3');
    expect(state.scopes[0].investigationId).toBe('inv-1');
    expect(state.scopes[0].hypothesisIds).toEqual([]);
    expect(state.scopes[0].predicates).toEqual([]);
    expect(scope.id).toBe(state.scopes[0].id);
  });

  it('addScope accepts initial predicates and hypothesisIds', () => {
    const predicates = [
      { kind: 'leaf' as const, column: 'Shift', op: 'eq' as const, value: 'Night' },
    ];
    const scope = useAnalyzeStore
      .getState()
      .addScope('inv-1', 'Defects on night shift', predicates, ['h-1']);
    expect(scope.predicates).toEqual(predicates);
    expect(scope.hypothesisIds).toEqual(['h-1']);
  });

  it('updateScope patches fields and sets updatedAt', () => {
    const scope = useAnalyzeStore.getState().addScope('inv-1', 'Original outcome');
    const beforeUpdate = scope.updatedAt;
    useAnalyzeStore.getState().updateScope(scope.id, { outcome: 'Updated outcome' });
    const updated = useAnalyzeStore.getState().scopes[0];
    expect(updated.outcome).toBe('Updated outcome');
    expect(updated.updatedAt).toBeGreaterThanOrEqual(beforeUpdate);
  });

  it('removeScope deletes the scope by id', () => {
    const s1 = useAnalyzeStore.getState().addScope('inv-1', 'Scope A');
    useAnalyzeStore.getState().addScope('inv-1', 'Scope B');
    expect(useAnalyzeStore.getState().scopes).toHaveLength(2);

    useAnalyzeStore.getState().removeScope(s1.id);
    const state = useAnalyzeStore.getState();
    expect(state.scopes).toHaveLength(1);
    expect(state.scopes[0].outcome).toBe('Scope B');
  });

  it('addHypothesisToScope appends a hypothesisId (no-op on duplicate)', () => {
    const scope = useAnalyzeStore.getState().addScope('inv-1', 'Test scope');
    useAnalyzeStore.getState().addHypothesisToScope(scope.id, 'h-1');
    expect(useAnalyzeStore.getState().scopes[0].hypothesisIds).toEqual(['h-1']);

    // No-op on duplicate
    useAnalyzeStore.getState().addHypothesisToScope(scope.id, 'h-1');
    expect(useAnalyzeStore.getState().scopes[0].hypothesisIds).toEqual(['h-1']);

    // Second distinct hypothesis
    useAnalyzeStore.getState().addHypothesisToScope(scope.id, 'h-2');
    expect(useAnalyzeStore.getState().scopes[0].hypothesisIds).toEqual(['h-1', 'h-2']);
  });

  it('deleteHub removes the hub from all scope hypothesisIds', () => {
    const scope = useAnalyzeStore.getState().addScope('inv-1', 'Test scope');
    const hub = useAnalyzeStore.getState().createHub('Nozzle wear', 'Night shift');
    useAnalyzeStore.getState().addHypothesisToScope(scope.id, hub.id);
    expect(useAnalyzeStore.getState().scopes[0].hypothesisIds).toContain(hub.id);

    useAnalyzeStore.getState().deleteHub(hub.id);
    expect(useAnalyzeStore.getState().scopes[0].hypothesisIds).not.toContain(hub.id);
  });
});

// ============================================================================
// Drill → scope producer (IM-4a Task 1 — the active compound drill becomes a
// persisted ProblemStatementScope; idempotent on the predicate set)
// ============================================================================

describe('analyzeStore — syncScopeFromDrill (IM-4a)', () => {
  const compoundFilters = [
    { column: 'Machine', values: ['B'] },
    { column: 'Product', values: ['X'] },
  ];

  it('produces a ProblemStatementScope from a compound drill condition', () => {
    const scope = useAnalyzeStore
      .getState()
      .syncScopeFromDrill('inv-1', 'lead_time', compoundFilters);
    expect(scope).not.toBeNull();
    const state = useAnalyzeStore.getState();
    expect(state.scopes).toHaveLength(1);
    expect(state.scopes[0].outcome).toBe('lead_time');
    expect(state.scopes[0].investigationId).toBe('inv-1');
    expect(state.scopes[0].predicates).toEqual([
      { kind: 'leaf', column: 'Machine', op: 'eq', value: 'B' },
      { kind: 'leaf', column: 'Product', op: 'eq', value: 'X' },
    ]);
  });

  it('does NOT duplicate when re-fired on the same compound condition', () => {
    const first = useAnalyzeStore
      .getState()
      .syncScopeFromDrill('inv-1', 'lead_time', compoundFilters);
    // Re-fire with the SAME condition (different chip order — still the same set)
    const reordered = [
      { column: 'Product', values: ['X'] },
      { column: 'Machine', values: ['B'] },
    ];
    const second = useAnalyzeStore.getState().syncScopeFromDrill('inv-1', 'lead_time', reordered);
    expect(useAnalyzeStore.getState().scopes).toHaveLength(1);
    expect(second?.id).toBe(first?.id);
  });

  it('creates a second scope for a distinct compound condition', () => {
    useAnalyzeStore.getState().syncScopeFromDrill('inv-1', 'lead_time', compoundFilters);
    useAnalyzeStore
      .getState()
      .syncScopeFromDrill('inv-1', 'lead_time', [{ column: 'Line', values: ['A'] }]);
    expect(useAnalyzeStore.getState().scopes).toHaveLength(2);
  });

  it('returns undefined and adds nothing for an empty drill', () => {
    const scope = useAnalyzeStore.getState().syncScopeFromDrill('inv-1', 'lead_time', []);
    expect(scope).toBeUndefined();
    expect(useAnalyzeStore.getState().scopes).toHaveLength(0);
  });

  it('multi-value chips become in-leaves and stay idempotent', () => {
    const multi = [{ column: 'Line', values: ['1', '2'] }];
    const first = useAnalyzeStore.getState().syncScopeFromDrill('inv-1', 'lead_time', multi);
    expect(first?.predicates).toEqual([
      { kind: 'leaf', column: 'Line', op: 'in', value: ['1', '2'] },
    ]);
    // Re-fire with the values in a different order — still one scope.
    useAnalyzeStore
      .getState()
      .syncScopeFromDrill('inv-1', 'lead_time', [{ column: 'Line', values: ['2', '1'] }]);
    expect(useAnalyzeStore.getState().scopes).toHaveLength(1);
  });
});

// ============================================================================
// Scope What-If projection (IM-5 — persist whatIfProjection)
// ============================================================================

describe('analyzeStore — recomputeScopeWhatIf (IM-5)', () => {
  beforeEach(() => {
    useProjectStore.setState(getProjectInitialState());
  });

  afterEach(() => {
    useProjectStore.setState(getProjectInitialState());
  });

  // Deterministic dataset: Machine A runs hotter than B against USL=13.
  const makeRawData = () => {
    const rows: { Value: number; Machine: string }[] = [];
    for (let i = 0; i < 30; i++) rows.push({ Value: 12 + (i % 5) * 0.1, Machine: 'A' });
    for (let i = 0; i < 30; i++) rows.push({ Value: 10 + (i % 5) * 0.1, Machine: 'B' });
    return rows;
  };

  it('computes and persists whatIfProjection from the scope condition + project data', () => {
    useProjectStore.setState({
      rawData: makeRawData(),
      outcome: 'Value',
      specs: { lsl: 8, usl: 13 },
    });
    const scope = useAnalyzeStore
      .getState()
      .addScope('inv-1', 'Value', [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }]);

    useAnalyzeStore.getState().recomputeScopeWhatIf(scope.id);

    const updated = useAnalyzeStore.getState().scopes[0];
    expect(typeof updated.whatIfProjection).toBe('number');
    expect(updated.whatIfProjection as number).toBeGreaterThan(0);
  });

  it('prefers the per-outcome measureSpecs entry over the global specs', () => {
    useProjectStore.setState({
      rawData: makeRawData(),
      outcome: 'Value',
      specs: {},
      measureSpecs: { Value: { lsl: 8, usl: 13 } },
    });
    const scope = useAnalyzeStore
      .getState()
      .addScope('inv-1', 'Value', [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }]);

    useAnalyzeStore.getState().recomputeScopeWhatIf(scope.id);

    expect(typeof useAnalyzeStore.getState().scopes[0].whatIfProjection).toBe('number');
  });

  it('leaves whatIfProjection undefined when no specs are available', () => {
    useProjectStore.setState({ rawData: makeRawData(), outcome: 'Value', specs: {} });
    const scope = useAnalyzeStore
      .getState()
      .addScope('inv-1', 'Value', [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }]);

    useAnalyzeStore.getState().recomputeScopeWhatIf(scope.id);

    expect(useAnalyzeStore.getState().scopes[0].whatIfProjection).toBeUndefined();
  });

  it('clears a stale whatIfProjection when the condition no longer projects', () => {
    useProjectStore.setState({
      rawData: makeRawData(),
      outcome: 'Value',
      specs: { lsl: 8, usl: 13 },
    });
    const scope = useAnalyzeStore
      .getState()
      .addScope('inv-1', 'Value', [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }]);
    useAnalyzeStore.getState().recomputeScopeWhatIf(scope.id);
    expect(typeof useAnalyzeStore.getState().scopes[0].whatIfProjection).toBe('number');

    // Drop specs → recompute should clear the stored number rather than keep it stale.
    useProjectStore.setState({ specs: {}, measureSpecs: {} });
    useAnalyzeStore.getState().recomputeScopeWhatIf(scope.id);
    expect(useAnalyzeStore.getState().scopes[0].whatIfProjection).toBeUndefined();
  });

  it('is a no-op for an unknown scope id', () => {
    useProjectStore.setState({
      rawData: makeRawData(),
      outcome: 'Value',
      specs: { lsl: 8, usl: 13 },
    });
    expect(() => useAnalyzeStore.getState().recomputeScopeWhatIf('does-not-exist')).not.toThrow();
    expect(useAnalyzeStore.getState().scopes).toHaveLength(0);
  });
});

// ============================================================================
// Hypothesis ideas tests (F2 — keyed by hypothesisId on Hypothesis.ideas)
// ============================================================================

describe('analyzeStore — hypothesis ideas', () => {
  it('adds idea to hypothesis', () => {
    const hub = useAnalyzeStore.getState().createHub('Test hub', 'Synthesis');
    const idea = useAnalyzeStore.getState().addIdea(hub.id, 'My idea');
    expect(idea).not.toBeNull();
    expect(idea!.text).toBe('My idea');
    expect(useAnalyzeStore.getState().hypotheses[0].ideas).toHaveLength(1);
  });

  it('returns null when adding idea to nonexistent hypothesis', () => {
    const result = useAnalyzeStore.getState().addIdea('nonexistent', 'Idea');
    expect(result).toBeNull();
  });

  it('updates an idea', () => {
    const hub = useAnalyzeStore.getState().createHub('Test hub', 'Synthesis');
    const idea = useAnalyzeStore.getState().addIdea(hub.id, 'Original');
    useAnalyzeStore.getState().updateIdea(hub.id, idea!.id, { text: 'Updated' });
    expect(useAnalyzeStore.getState().hypotheses[0].ideas![0].text).toBe('Updated');
  });

  it('deletes an idea', () => {
    const hub = useAnalyzeStore.getState().createHub('Test hub', 'Synthesis');
    const idea = useAnalyzeStore.getState().addIdea(hub.id, 'To delete');
    useAnalyzeStore.getState().deleteIdea(hub.id, idea!.id);
    expect(useAnalyzeStore.getState().hypotheses[0].ideas).toHaveLength(0);
  });

  it('selects and deselects an idea', () => {
    const hub = useAnalyzeStore.getState().createHub('Test hub', 'Synthesis');
    const idea = useAnalyzeStore.getState().addIdea(hub.id, 'Idea');
    useAnalyzeStore.getState().selectIdea(hub.id, idea!.id, true);
    expect(useAnalyzeStore.getState().hypotheses[0].ideas![0].selected).toBe(true);

    useAnalyzeStore.getState().selectIdea(hub.id, idea!.id, false);
    expect(useAnalyzeStore.getState().hypotheses[0].ideas![0].selected).toBe(false);
  });

  it('updates idea projection', () => {
    const hub = useAnalyzeStore.getState().createHub('Test hub', 'Synthesis');
    const idea = useAnalyzeStore.getState().addIdea(hub.id, 'Idea');
    const projection = {
      baselineMean: 10,
      baselineSigma: 1,
      projectedMean: 9,
      projectedSigma: 0.8,
      meanDelta: -1,
      sigmaDelta: -0.2,
      simulationParams: { meanAdjustment: -1, variationReduction: 20 },
      createdAt: new Date().toISOString(),
    };
    useAnalyzeStore.getState().updateIdeaProjection(hub.id, idea!.id, projection);
    expect(useAnalyzeStore.getState().hypotheses[0].ideas![0].projection).toEqual(projection);
  });
});

// ============================================================================
// Hub tests
// ============================================================================

describe('analyzeStore — hypothesis hubs', () => {
  it('creates a hub', () => {
    const hub = useAnalyzeStore.getState().createHub('Nozzle wear', 'Night shift causes wear');
    const state = useAnalyzeStore.getState();
    expect(state.hypotheses).toHaveLength(1);
    expect(state.hypotheses[0].name).toBe('Nozzle wear');
    expect(state.hypotheses[0].synthesis).toBe('Night shift causes wear');
    expect(state.hypotheses[0].status).toBe('proposed');
    expect(hub.id).toBe(state.hypotheses[0].id);
  });

  it('updates a hub', () => {
    const hub = useAnalyzeStore.getState().createHub('Old name', 'Old synthesis');
    useAnalyzeStore.getState().updateHub(hub.id, { name: 'New name' });
    expect(useAnalyzeStore.getState().hypotheses[0].name).toBe('New name');
    expect(useAnalyzeStore.getState().hypotheses[0].synthesis).toBe('Old synthesis');
  });

  it('createHubFromFinding returns null when the finding does not exist', () => {
    const result = useAnalyzeStore.getState().createHubFromFinding('missing-id');
    expect(result).toBeNull();
    expect(useAnalyzeStore.getState().hypotheses).toHaveLength(0);
  });

  it('createHubFromFinding creates a hub seeded from the finding text and links it', () => {
    const ctx = makeContext();
    const finding = useAnalyzeStore
      .getState()
      .addFinding('Night shift nozzle runs consistently hotter than day shift baseline', ctx);
    const hub = useAnalyzeStore.getState().createHubFromFinding(finding.id);
    expect(hub).not.toBeNull();
    const state = useAnalyzeStore.getState();
    expect(state.hypotheses).toHaveLength(1);
    const persisted = state.hypotheses[0];
    expect(persisted.findingIds).toEqual([finding.id]);
    expect(persisted.name.startsWith('Suspected mechanism:')).toBe(true);
    expect(persisted.status).toBe('proposed');
  });

  it('createHubFromFinding uses fallback name when finding text is empty', () => {
    const ctx = makeContext();
    const finding = useAnalyzeStore.getState().addFinding('   ', ctx);
    useAnalyzeStore.getState().createHubFromFinding(finding.id);
    expect(useAnalyzeStore.getState().hypotheses[0].name).toBe('New mechanism branch');
  });

  it('connects and disconnects finding to hub', () => {
    const hub = useAnalyzeStore.getState().createHub('Test', 'Synth');
    useAnalyzeStore.getState().connectFindingToHub(hub.id, 'f-1');

    const updated = useAnalyzeStore.getState().hypotheses[0];
    expect(updated.findingIds).toEqual(['f-1']);
  });

  it('no-op when connecting already-connected finding', () => {
    const hub = useAnalyzeStore.getState().createHub('Test', 'Synth');
    useAnalyzeStore.getState().connectFindingToHub(hub.id, 'f-1');
    useAnalyzeStore.getState().connectFindingToHub(hub.id, 'f-1');
    expect(useAnalyzeStore.getState().hypotheses[0].findingIds).toEqual(['f-1']);
  });

  it('disconnects finding from hub', () => {
    const hub = useAnalyzeStore.getState().createHub('Test', 'Synth');
    useAnalyzeStore.getState().connectFindingToHub(hub.id, 'f-1');
    useAnalyzeStore.getState().disconnectFindingFromHub(hub.id, 'f-1');
    expect(useAnalyzeStore.getState().hypotheses[0].findingIds).toEqual([]);
  });

  it('deletes a hub', () => {
    const hub = useAnalyzeStore.getState().createHub('Test', 'Synth');
    useAnalyzeStore.getState().deleteHub(hub.id);
    expect(useAnalyzeStore.getState().hypotheses).toHaveLength(0);
  });

  it('sets hub evidence', () => {
    const hub = useAnalyzeStore.getState().createHub('Test', 'Synth');
    const evidence = {
      mode: 'standard' as const,
      contribution: {
        value: 0.52,
        label: 'R²adj',
        description: 'Explains 52% of variation',
      },
    };
    useAnalyzeStore.getState().setHubEvidence(hub.id, evidence);
    expect(useAnalyzeStore.getState().hypotheses[0].evidence).toEqual(evidence);
  });

  it('resets hubs atomically', () => {
    useAnalyzeStore.getState().createHub('A', 'a');
    useAnalyzeStore.getState().createHub('B', 'b');
    expect(useAnalyzeStore.getState().hypotheses).toHaveLength(2);

    const newHubs: Hypothesis[] = [
      {
        id: 'h-new',
        name: 'New',
        synthesis: 'Fresh',
        findingIds: [],
        status: 'proposed',
        createdAt: 1714000000000,
        updatedAt: 1714000000000,
        deletedAt: null,
        investigationId: 'inv-test-001',
      },
    ];
    useAnalyzeStore.getState().resetHubs(newHubs);
    expect(useAnalyzeStore.getState().hypotheses).toEqual(newHubs);
  });

  it('recordDisconfirmation appends a DisconfirmationAttempt to the hub', () => {
    const hub = useAnalyzeStore.getState().createHub('Worn spindle', 'Night shift');
    const attempt = {
      id: 'd-1',
      attemptedAt: '2026-05-30T00:00:00.000Z',
      attemptedBy: { displayName: 'Analyst' },
      description: 'Checked against day-shift data',
      verdict: 'survived' as const,
      linkedFindingIds: [] as string[],
    };
    useAnalyzeStore.getState().recordDisconfirmation(hub.id, attempt);
    const updated = useAnalyzeStore.getState().hypotheses[0];
    expect(updated.disconfirmationAttempts).toEqual([attempt]);
    expect(updated.updatedAt).toBeGreaterThanOrEqual(hub.updatedAt);
  });

  it('recordDisconfirmation appends without dropping prior attempts', () => {
    const hub = useAnalyzeStore.getState().createHub('Worn spindle', 'Night shift');
    const a1 = {
      id: 'd-1',
      attemptedAt: '2026-05-30T00:00:00.000Z',
      attemptedBy: { displayName: 'A' },
      description: 'first',
      verdict: 'pending' as const,
      linkedFindingIds: [] as string[],
    };
    const a2 = { ...a1, id: 'd-2', description: 'second', verdict: 'survived' as const };
    useAnalyzeStore.getState().recordDisconfirmation(hub.id, a1);
    useAnalyzeStore.getState().recordDisconfirmation(hub.id, a2);
    expect(useAnalyzeStore.getState().hypotheses[0].disconfirmationAttempts).toEqual([a1, a2]);
  });

  it('recordDisconfirmation is a no-op for an unknown hub id', () => {
    useAnalyzeStore.getState().createHub('X', '');
    expect(() =>
      useAnalyzeStore.getState().recordDisconfirmation('does-not-exist', {
        id: 'd',
        attemptedAt: '2026-05-30T00:00:00.000Z',
        attemptedBy: { displayName: 'A' },
        description: 'x',
        verdict: 'pending',
        linkedFindingIds: [],
      })
    ).not.toThrow();
    expect(useAnalyzeStore.getState().hypotheses[0].disconfirmationAttempts).toBeUndefined();
  });
});

// ============================================================================
// addHubComment — optimistic + SSE queue fallback
// ============================================================================

describe('analyzeStore — addHubComment', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    useProjectStore.setState(getProjectInitialState());
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('optimistically appends the comment to the hub before the fetch resolves', async () => {
    useProjectStore.setState({ projectId: 'proj-1' });
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: true }) });

    const hub = useAnalyzeStore.getState().createHub('Nozzle wear', 'Night shift');

    const pending = useAnalyzeStore.getState().addHubComment(hub.id, 'First thought', 'Jane');

    // Comment is visible synchronously on the hub — optimistic update landed
    // before the promise resolves.
    const liveHub = useAnalyzeStore.getState().hypotheses[0];
    expect(liveHub.comments).toHaveLength(1);
    expect(liveHub.comments?.[0]?.text).toBe('First thought');
    expect(liveHub.comments?.[0]?.author).toBe('Jane');

    await pending;
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/hub-comments/append',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('sends the same id used in the optimistic update (server dedupes by id)', async () => {
    useProjectStore.setState({ projectId: 'proj-id-echo' });
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: true }) });
    const hub = useAnalyzeStore.getState().createHub('Hub', 'Synth');

    const comment = await useAnalyzeStore.getState().addHubComment(hub.id, 'hi');

    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body) as { id: string; text: string };
    expect(body.id).toBe(comment.id);
    expect(body.text).toBe('hi');
  });

  it('queues to canvasViewportStore.pendingComments when the server returns !ok', async () => {
    useProjectStore.setState({ projectId: 'proj-fail' });
    mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) });

    const hub = useAnalyzeStore.getState().createHub('Hub', 'Synth');
    await useAnalyzeStore.getState().addHubComment(hub.id, 'queued text', 'Alex');

    const pending = useCanvasViewportStore.getState().pendingComments;
    expect(pending).toHaveLength(1);
    expect(pending[0].scope).toBe('hub');
    expect(pending[0].targetId).toBe(hub.id);
    expect(pending[0].text).toBe('queued text');
    expect(pending[0].author).toBe('Alex');
  });

  it('queues when fetch rejects (network error)', async () => {
    useProjectStore.setState({ projectId: 'proj-throw' });
    mockFetch.mockRejectedValueOnce(new Error('offline'));

    const hub = useAnalyzeStore.getState().createHub('Hub', 'Synth');
    await useAnalyzeStore.getState().addHubComment(hub.id, 'offline text');

    const pending = useCanvasViewportStore.getState().pendingComments;
    expect(pending).toHaveLength(1);
    expect(pending[0].text).toBe('offline text');
  });

  it('skips the network when no project is active (PWA-local mode)', async () => {
    // projectId stays null after beforeEach reset
    const hub = useAnalyzeStore.getState().createHub('Hub', 'Synth');

    await useAnalyzeStore.getState().addHubComment(hub.id, 'local only');

    expect(mockFetch).not.toHaveBeenCalled();
    // Still optimistically appended locally.
    const liveHub = useAnalyzeStore.getState().hypotheses[0];
    expect(liveHub.comments).toHaveLength(1);
  });

  it('drain queue retrieves and clears all pending comments for retry', async () => {
    useProjectStore.setState({ projectId: 'proj-drain' });
    // Two failing posts fill the queue.
    mockFetch
      .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) });

    const hub = useAnalyzeStore.getState().createHub('Hub', 'Synth');
    await useAnalyzeStore.getState().addHubComment(hub.id, 'first');
    await useAnalyzeStore.getState().addHubComment(hub.id, 'second');

    expect(useCanvasViewportStore.getState().pendingComments).toHaveLength(2);
    const drained = useCanvasViewportStore.getState().drainPendingComments();
    expect(drained).toHaveLength(2);
    expect(useCanvasViewportStore.getState().pendingComments).toHaveLength(0);
  });
});

// ============================================================================
// editHubComment / deleteHubComment — task 1 failing tests
// ============================================================================

describe('analyzeStore — editHubComment', () => {
  it('edits the comment text in place, leaving other comments unchanged', () => {
    const hub = useAnalyzeStore.getState().createHub('Nozzle wear', 'Night shift');
    // Seed two comments directly (bypassing async addHubComment)
    const c1 = {
      id: 'c1',
      text: 'Original text',
      createdAt: 1,
      parentId: hub.id,
      parentKind: 'hypothesis' as const,
    };
    const c2 = {
      id: 'c2',
      text: 'Another comment',
      createdAt: 2,
      parentId: hub.id,
      parentKind: 'hypothesis' as const,
    };
    useAnalyzeStore.setState(state => ({
      hypotheses: state.hypotheses.map(h => (h.id === hub.id ? { ...h, comments: [c1, c2] } : h)),
    }));

    useAnalyzeStore.getState().editHubComment(hub.id, 'c1', 'Edited text');

    const updated = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!;
    expect(updated.comments).toHaveLength(2);
    expect(updated.comments!.find(c => c.id === 'c1')!.text).toBe('Edited text');
    // second comment unchanged
    expect(updated.comments!.find(c => c.id === 'c2')!.text).toBe('Another comment');
  });

  it('is a no-op when the commentId does not exist', () => {
    const hub = useAnalyzeStore.getState().createHub('Hub', 'Synth');
    const c1 = {
      id: 'c1',
      text: 'Stays the same',
      createdAt: 1,
      parentId: hub.id,
      parentKind: 'hypothesis' as const,
    };
    useAnalyzeStore.setState(state => ({
      hypotheses: state.hypotheses.map(h => (h.id === hub.id ? { ...h, comments: [c1] } : h)),
    }));

    useAnalyzeStore.getState().editHubComment(hub.id, 'c-does-not-exist', 'Ignored');

    const updated = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!;
    expect(updated.comments![0].text).toBe('Stays the same');
  });

  it('is a no-op when the hubId does not exist', () => {
    // Just confirm it doesn't throw
    expect(() =>
      useAnalyzeStore.getState().editHubComment('no-such-hub', 'c1', 'text')
    ).not.toThrow();
  });
});

describe('analyzeStore — deleteHubComment', () => {
  it('removes the comment identified by commentId', () => {
    const hub = useAnalyzeStore.getState().createHub('Hub', 'Synth');
    const c1 = {
      id: 'c1',
      text: 'Keep',
      createdAt: 1,
      parentId: hub.id,
      parentKind: 'hypothesis' as const,
    };
    const c2 = {
      id: 'c2',
      text: 'Delete me',
      createdAt: 2,
      parentId: hub.id,
      parentKind: 'hypothesis' as const,
    };
    useAnalyzeStore.setState(state => ({
      hypotheses: state.hypotheses.map(h => (h.id === hub.id ? { ...h, comments: [c1, c2] } : h)),
    }));

    useAnalyzeStore.getState().deleteHubComment(hub.id, 'c2');

    const updated = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!;
    expect(updated.comments).toHaveLength(1);
    expect(updated.comments![0].id).toBe('c1');
  });

  it('empties the comments array when the last comment is deleted', () => {
    const hub = useAnalyzeStore.getState().createHub('Hub', 'Synth');
    const c1 = {
      id: 'c1',
      text: 'Only one',
      createdAt: 1,
      parentId: hub.id,
      parentKind: 'hypothesis' as const,
    };
    useAnalyzeStore.setState(state => ({
      hypotheses: state.hypotheses.map(h => (h.id === hub.id ? { ...h, comments: [c1] } : h)),
    }));

    useAnalyzeStore.getState().deleteHubComment(hub.id, 'c1');

    const updated = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!;
    expect(updated.comments).toHaveLength(0);
  });

  it('is a no-op when the commentId does not exist', () => {
    const hub = useAnalyzeStore.getState().createHub('Hub', 'Synth');
    const c1 = {
      id: 'c1',
      text: 'Stays',
      createdAt: 1,
      parentId: hub.id,
      parentKind: 'hypothesis' as const,
    };
    useAnalyzeStore.setState(state => ({
      hypotheses: state.hypotheses.map(h => (h.id === hub.id ? { ...h, comments: [c1] } : h)),
    }));

    useAnalyzeStore.getState().deleteHubComment(hub.id, 'c-ghost');

    const updated = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!;
    expect(updated.comments).toHaveLength(1);
  });

  it('is a no-op when the hubId does not exist', () => {
    expect(() => useAnalyzeStore.getState().deleteHubComment('no-such-hub', 'c1')).not.toThrow();
  });
});

// ============================================================================
// Bulk + category tests
// ============================================================================

describe('analyzeStore — bulk operations', () => {
  it('loadAnalyzeState hydrates all arrays', () => {
    const ctx = makeContext();
    const finding = {
      id: 'f-1',
      text: 'Test',
      createdAt: 1714000000000,
      deletedAt: null as null,
      investigationId: 'inv-test-001',
      context: ctx,
      status: 'observed' as const,
      comments: [],
      statusChangedAt: 1714000000000,
      evidenceType: 'data' as const,
    };
    const hub: Hypothesis = {
      id: 'h-1',
      name: 'Hub',
      synthesis: 'Synth',
      findingIds: ['f-1'],
      status: 'proposed',
      createdAt: 1714000000000,
      updatedAt: 1714000000000,
      deletedAt: null,
      investigationId: 'inv-test-001',
    };
    const scope: ProblemStatementScope = {
      id: 's-1',
      investigationId: 'inv-test-001',
      outcome: 'High defect rate',
      predicates: [],
      hypothesisIds: ['h-1'],
      createdAt: 1714000000000,
      updatedAt: 1714000000000,
      deletedAt: null,
    };
    const category: AnalyzeCategory = {
      id: 'c-1',
      name: 'Equipment',
      factorNames: ['Machine'],
      createdAt: 1714000000000,
      deletedAt: null,
    };

    useAnalyzeStore.getState().loadAnalyzeState({
      findings: [finding],
      hypotheses: [hub],
      scopes: [scope],
      categories: [category],
    });

    const state = useAnalyzeStore.getState();
    expect(state.findings).toEqual([finding]);
    expect(state.hypotheses).toEqual([hub]);
    expect(state.scopes).toEqual([scope]);
    expect(state.categories).toEqual([category]);
  });

  it('loadAnalyzeState only updates provided fields', () => {
    const scope = useAnalyzeStore.getState().addScope('inv-1', 'Existing scope');
    useAnalyzeStore.getState().loadAnalyzeState({ categories: [] });
    // Scopes should be preserved
    expect(useAnalyzeStore.getState().scopes).toHaveLength(1);
    expect(useAnalyzeStore.getState().scopes[0].id).toBe(scope.id);
  });

  it('resetAll clears everything', () => {
    useAnalyzeStore.getState().addFinding('note', makeContext());
    useAnalyzeStore.getState().addScope('inv-1', 'scope');
    useAnalyzeStore.getState().createHub('hub', 'synth');

    useAnalyzeStore.getState().resetAll();
    const state = useAnalyzeStore.getState();
    expect(state.findings).toEqual([]);
    expect(state.scopes).toEqual([]);
    expect(state.hypotheses).toEqual([]);
    expect(state.categories).toEqual([]);
  });

  it('setCategories replaces categories', () => {
    const cats: AnalyzeCategory[] = [
      {
        id: 'c-1',
        name: 'People',
        factorNames: ['Operator'],
        createdAt: 1714000000000,
        deletedAt: null,
      },
      {
        id: 'c-2',
        name: 'Equipment',
        factorNames: ['Machine'],
        createdAt: 1714000000000,
        deletedAt: null,
      },
    ];
    useAnalyzeStore.getState().setCategories(cats);
    expect(useAnalyzeStore.getState().categories).toEqual(cats);
  });
});

// ============================================================================
// Causal link tests
// ============================================================================

describe('analyzeStore — causalLink actions', () => {
  it('creates a causal link with correct defaults', () => {
    const link = useAnalyzeStore.getState().addCausalLink('A', 'B', 'A drives B');
    expect(link).not.toBeNull();
    expect(link!.fromFactor).toBe('A');
    expect(link!.toFactor).toBe('B');
    expect(link!.whyStatement).toBe('A drives B');
    expect(link!.direction).toBe('drives');
    expect(link!.evidenceType).toBe('unvalidated');
    expect(link!.findingIds).toEqual([]);
    expect(link!.source).toBe('analyst');
    expect(useAnalyzeStore.getState().causalLinks).toHaveLength(1);
  });

  it('returns null if would create cycle', () => {
    useAnalyzeStore.getState().addCausalLink('A', 'B', 'A drives B');
    const result = useAnalyzeStore.getState().addCausalLink('B', 'A', 'B drives A');
    expect(result).toBeNull();
    expect(useAnalyzeStore.getState().causalLinks).toHaveLength(1);
  });

  it('returns null for self-loop (same fromFactor and toFactor)', () => {
    const result = useAnalyzeStore.getState().addCausalLink('A', 'A', 'Self loop');
    expect(result).toBeNull();
    expect(useAnalyzeStore.getState().causalLinks).toHaveLength(0);
  });

  it('removes a causal link', () => {
    const link = useAnalyzeStore.getState().addCausalLink('A', 'B', 'A drives B');
    useAnalyzeStore.getState().removeCausalLink(link!.id);
    expect(useAnalyzeStore.getState().causalLinks).toHaveLength(0);
  });

  it('no error when removing non-existent link', () => {
    useAnalyzeStore.getState().removeCausalLink('nonexistent');
    expect(useAnalyzeStore.getState().causalLinks).toHaveLength(0);
  });

  it('updates whyStatement', () => {
    const link = useAnalyzeStore.getState().addCausalLink('A', 'B', 'Original');
    useAnalyzeStore.getState().updateCausalLink(link!.id, { whyStatement: 'Updated' });
    expect(useAnalyzeStore.getState().causalLinks[0].whyStatement).toBe('Updated');
  });

  it('updates evidenceType', () => {
    const link = useAnalyzeStore.getState().addCausalLink('A', 'B', 'Test');
    useAnalyzeStore.getState().updateCausalLink(link!.id, { evidenceType: 'data' });
    expect(useAnalyzeStore.getState().causalLinks[0].evidenceType).toBe('data');
  });

  it('sets updatedAt on update', () => {
    const link = useAnalyzeStore.getState().addCausalLink('A', 'B', 'Test');
    const before = link!.updatedAt;
    // Small delay to ensure timestamp differs
    useAnalyzeStore.getState().updateCausalLink(link!.id, { whyStatement: 'Changed' });
    const after = useAnalyzeStore.getState().causalLinks[0].updatedAt;
    expect(after).toBeDefined();
    // updatedAt should be a valid ISO string
    expect(new Date(after).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());
  });

  it('links a finding ID', () => {
    const link = useAnalyzeStore.getState().addCausalLink('A', 'B', 'Test');
    useAnalyzeStore.getState().linkFindingToCausalLink(link!.id, 'f-1');
    expect(useAnalyzeStore.getState().causalLinks[0].findingIds).toEqual(['f-1']);
  });

  it('no duplicate finding IDs on double-link', () => {
    const link = useAnalyzeStore.getState().addCausalLink('A', 'B', 'Test');
    useAnalyzeStore.getState().linkFindingToCausalLink(link!.id, 'f-1');
    useAnalyzeStore.getState().linkFindingToCausalLink(link!.id, 'f-1');
    expect(useAnalyzeStore.getState().causalLinks[0].findingIds).toEqual(['f-1']);
  });

  it('unlinks a finding ID', () => {
    const link = useAnalyzeStore.getState().addCausalLink('A', 'B', 'Test');
    useAnalyzeStore.getState().linkFindingToCausalLink(link!.id, 'f-1');
    useAnalyzeStore.getState().linkFindingToCausalLink(link!.id, 'f-2');
    useAnalyzeStore.getState().unlinkFindingFromCausalLink(link!.id, 'f-1');
    expect(useAnalyzeStore.getState().causalLinks[0].findingIds).toEqual(['f-2']);
  });
});

describe('analyzeStore — causalLink cascade behavior', () => {
  it('deleteFinding removes findingId from causal links', () => {
    const ctx = makeContext();
    const f = useAnalyzeStore.getState().addFinding('Test finding', ctx);
    const link = useAnalyzeStore.getState().addCausalLink('A', 'B', 'Test');
    useAnalyzeStore.getState().linkFindingToCausalLink(link!.id, f.id);
    expect(useAnalyzeStore.getState().causalLinks[0].findingIds).toContain(f.id);

    useAnalyzeStore.getState().deleteFinding(f.id);
    expect(useAnalyzeStore.getState().causalLinks[0].findingIds).not.toContain(f.id);
  });

  it('deleteHub clears hypothesisId from causal links', () => {
    const hub = useAnalyzeStore.getState().createHub('Test hub', 'Synthesis');
    const link = useAnalyzeStore.getState().addCausalLink('A', 'B', 'Test', {
      source: 'analyst',
    });
    // Manually set hypothesisId via setState — the store doesn't have a direct setter
    useAnalyzeStore.setState(state => ({
      causalLinks: state.causalLinks.map(l =>
        l.id === link!.id ? { ...l, hypothesisId: hub.id } : l
      ),
    }));
    expect(useAnalyzeStore.getState().causalLinks[0].hypothesisId).toBe(hub.id);

    useAnalyzeStore.getState().deleteHub(hub.id);
    expect(useAnalyzeStore.getState().causalLinks[0].hypothesisId).toBeUndefined();
  });
});

// ============================================================================
// Per-scope gateNode tests (ADR-085 — replaces top-level problemContributionTree)
// ============================================================================

describe('analyzeStore — setScopeGateNode', () => {
  beforeEach(() => {
    useAnalyzeStore.setState(getAnalyzeInitialState());
  });

  it('sets a gate tree on a scope', () => {
    const scope = useAnalyzeStore.getState().addScope('inv-1', 'High defect rate');
    const tree: GateNode = {
      kind: 'and',
      children: [
        { kind: 'hub', hubId: 'h1' },
        { kind: 'hub', hubId: 'h2' },
      ],
    };
    useAnalyzeStore.getState().setScopeGateNode(scope.id, tree);
    expect(useAnalyzeStore.getState().scopes[0].gateNode).toEqual(tree);
  });

  it('can clear the gate tree by setting undefined', () => {
    const scope = useAnalyzeStore.getState().addScope('inv-1', 'High defect rate');
    useAnalyzeStore.getState().setScopeGateNode(scope.id, { kind: 'hub', hubId: 'h1' });
    useAnalyzeStore.getState().setScopeGateNode(scope.id, undefined);
    expect(useAnalyzeStore.getState().scopes[0].gateNode).toBeUndefined();
  });

  it('is a no-op for unknown scopeId', () => {
    useAnalyzeStore.getState().addScope('inv-1', 'Scope A');
    useAnalyzeStore.getState().setScopeGateNode('nonexistent', { kind: 'hub', hubId: 'h1' });
    // Scope A gateNode untouched
    expect(useAnalyzeStore.getState().scopes[0].gateNode).toBeUndefined();
  });

  it('survives loadAnalyzeState round-trip', () => {
    const tree: GateNode = {
      kind: 'and',
      children: [
        { kind: 'hub', hubId: 'h1' },
        { kind: 'not', child: { kind: 'hub', hubId: 'h2' } },
      ],
    };
    const scope: ProblemStatementScope = {
      id: 's-roundtrip',
      investigationId: 'inv-1',
      outcome: 'Test',
      predicates: [],
      hypothesisIds: [],
      gateNode: tree,
      createdAt: 1714000000000,
      updatedAt: 1714000000000,
      deletedAt: null,
    };
    useAnalyzeStore.getState().loadAnalyzeState({ scopes: [scope] });
    expect(useAnalyzeStore.getState().scopes[0].gateNode).toEqual(tree);
  });
});

describe('analyzeStore — composeScopeGate', () => {
  beforeEach(() => {
    useAnalyzeStore.setState(getAnalyzeInitialState());
  });

  it('is a no-op when the scope gateNode is undefined', () => {
    const scope = useAnalyzeStore.getState().addScope('inv-1', 'Test scope');
    useAnalyzeStore.getState().composeScopeGate(scope.id, [], 'h1');
    expect(useAnalyzeStore.getState().scopes[0].gateNode).toBeUndefined();
  });

  it('is a no-op for unknown scopeId', () => {
    const scope = useAnalyzeStore.getState().addScope('inv-1', 'Test scope');
    useAnalyzeStore.getState().setScopeGateNode(scope.id, { kind: 'hub', hubId: 'h1' });
    const before = useAnalyzeStore.getState().scopes[0].gateNode;
    useAnalyzeStore.getState().composeScopeGate('nonexistent', [], 'h2');
    expect(useAnalyzeStore.getState().scopes[0].gateNode).toBe(before);
  });

  it('appends a hub to an existing AND at root', () => {
    const scope = useAnalyzeStore.getState().addScope('inv-1', 'Test scope');
    const tree: GateNode = {
      kind: 'and',
      children: [
        { kind: 'hub', hubId: 'h1' },
        { kind: 'hub', hubId: 'h2' },
      ],
    };
    useAnalyzeStore.getState().setScopeGateNode(scope.id, tree);
    useAnalyzeStore.getState().composeScopeGate(scope.id, [], 'h3');
    expect(useAnalyzeStore.getState().scopes[0].gateNode).toEqual({
      kind: 'and',
      children: [
        { kind: 'hub', hubId: 'h1' },
        { kind: 'hub', hubId: 'h2' },
        { kind: 'hub', hubId: 'h3' },
      ],
    });
  });

  it('wraps a leaf tree in a new AND when dropped at root', () => {
    const scope = useAnalyzeStore.getState().addScope('inv-1', 'Test scope');
    useAnalyzeStore.getState().setScopeGateNode(scope.id, { kind: 'hub', hubId: 'h1' });
    useAnalyzeStore.getState().composeScopeGate(scope.id, [], 'h2');
    expect(useAnalyzeStore.getState().scopes[0].gateNode).toEqual({
      kind: 'and',
      children: [
        { kind: 'hub', hubId: 'h1' },
        { kind: 'hub', hubId: 'h2' },
      ],
    });
  });

  it('wraps an OR in a new AND at root when dropped on the OR', () => {
    const scope = useAnalyzeStore.getState().addScope('inv-1', 'Test scope');
    const tree: GateNode = {
      kind: 'or',
      children: [
        { kind: 'hub', hubId: 'h1' },
        { kind: 'hub', hubId: 'h2' },
      ],
    };
    useAnalyzeStore.getState().setScopeGateNode(scope.id, tree);
    useAnalyzeStore.getState().composeScopeGate(scope.id, [], 'h3');
    expect(useAnalyzeStore.getState().scopes[0].gateNode).toEqual({
      kind: 'and',
      children: [tree, { kind: 'hub', hubId: 'h3' }],
    });
  });

  it('composes at a nested path', () => {
    const scope = useAnalyzeStore.getState().addScope('inv-1', 'Test scope');
    const tree: GateNode = {
      kind: 'and',
      children: [
        { kind: 'hub', hubId: 'h1' },
        { kind: 'hub', hubId: 'h2' },
      ],
    };
    useAnalyzeStore.getState().setScopeGateNode(scope.id, tree);
    useAnalyzeStore.getState().composeScopeGate(scope.id, [0], 'h3');
    expect(useAnalyzeStore.getState().scopes[0].gateNode).toEqual({
      kind: 'and',
      children: [
        {
          kind: 'and',
          children: [
            { kind: 'hub', hubId: 'h1' },
            { kind: 'hub', hubId: 'h3' },
          ],
        },
        { kind: 'hub', hubId: 'h2' },
      ],
    });
  });

  it('is a no-op for an invalid path (leaves tree untouched)', () => {
    const scope = useAnalyzeStore.getState().addScope('inv-1', 'Test scope');
    const tree: GateNode = { kind: 'hub', hubId: 'h1' };
    useAnalyzeStore.getState().setScopeGateNode(scope.id, tree);
    useAnalyzeStore.getState().composeScopeGate(scope.id, [99], 'h2');
    expect(useAnalyzeStore.getState().scopes[0].gateNode).toBe(tree);
  });
});

// ============================================================================
// Relocation assertions (IM-1 / F4)
// ============================================================================

// ============================================================================
// @mentions — task 2 failing tests (RED)
// addHubComment stores mentionedUserIds when text contains @DisplayName tokens
// ============================================================================

describe('analyzeStore — addHubComment with @mentions', () => {
  // mentionedUserIds are resolved externally (via parseMentions) and passed into
  // addHubComment so the store stays transport-agnostic. The resulting
  // FindingComment.mentionedUserIds must be persisted verbatim.
  //
  // Acceptance: "typing @<member> yields a mention" — the stored comment carries
  // the resolved userId(s) so the SSE fan-out and UI badge can reference them.

  beforeEach(() => {
    useAnalyzeStore.setState(getAnalyzeInitialState());
  });

  it('stores mentionedUserIds on the comment when passed to addHubComment', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

    const hub = useAnalyzeStore.getState().createHub('Nozzle wear', 'Night shift');
    const comment = await useAnalyzeStore
      .getState()
      .addHubComment(hub.id, '@Alice Lead — can you validate?', 'Bob', ['user-alice']);

    expect(comment.mentionedUserIds).toEqual(['user-alice']);

    const liveHub = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!;
    expect(liveHub.comments?.[0]?.mentionedUserIds).toEqual(['user-alice']);

    vi.unstubAllGlobals();
  });

  it('stores multiple mentionedUserIds when several members are mentioned', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

    const hub = useAnalyzeStore.getState().createHub('Coolant temp', 'Day shift');
    const comment = await useAnalyzeStore
      .getState()
      .addHubComment(hub.id, '@Alice Lead and @Bob Member please validate', 'Carol', [
        'user-alice',
        'user-bob',
      ]);

    expect(comment.mentionedUserIds).toEqual(['user-alice', 'user-bob']);

    vi.unstubAllGlobals();
  });

  it('stores no mentionedUserIds when none are provided (backward-compatible)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

    const hub = useAnalyzeStore.getState().createHub('Hub', 'Synth');
    const comment = await useAnalyzeStore
      .getState()
      .addHubComment(hub.id, 'Plain comment without any mentions', 'Bob');

    // mentionedUserIds should be absent or empty — not an error
    expect(comment.mentionedUserIds ?? []).toEqual([]);

    vi.unstubAllGlobals();
  });

  it('includes mentionedUserIds in the POST body sent to the server', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);
    useProjectStore.setState({ projectId: 'proj-mention-test' });

    const hub = useAnalyzeStore.getState().createHub('Hub', 'Synth');
    await useAnalyzeStore
      .getState()
      .addHubComment(hub.id, '@Alice Lead check this', 'Carol', ['user-alice']);

    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body) as { mentionedUserIds?: string[] };
    expect(body.mentionedUserIds).toEqual(['user-alice']);

    vi.unstubAllGlobals();
  });
});

// ============================================================================
// Relocation assertions (IM-1 / F4)
// ============================================================================

describe('analyzeStore — relocation assertions (IM-1)', () => {
  it('does not own questions (retired in ADR-085)', () => {
    const state = useAnalyzeStore.getState() as unknown as Record<string, unknown>;
    expect('questions' in state).toBe(false);
    expect('addQuestion' in state).toBe(false);
  });

  it('does not own top-level problemContributionTree (moved to per-scope gateNode in ADR-085)', () => {
    const state = useAnalyzeStore.getState() as unknown as Record<string, unknown>;
    expect('problemContributionTree' in state).toBe(false);
    expect('setProblemContributionTree' in state).toBe(false);
  });

  it('does not own focusedQuestionId (relocated to useViewStore in F4)', () => {
    const state = useAnalyzeStore.getState() as unknown as Record<string, unknown>;
    expect('focusedQuestionId' in state).toBe(false);
    expect('setFocusedQuestion' in state).toBe(false);
  });

  it('owns scopes slice (new in ADR-085)', () => {
    const state = useAnalyzeStore.getState() as unknown as Record<string, unknown>;
    expect('scopes' in state).toBe(true);
    expect('addScope' in state).toBe(true);
    expect('updateScope' in state).toBe(true);
    expect('removeScope' in state).toBe(true);
    expect('addHypothesisToScope' in state).toBe(true);
  });

  it('owns archiveScope action (new in IM-4b Task 5 — scope rail)', () => {
    // archiveScope is the store-level owner of the SCOPE_ARCHIVE side-effect.
    // This test FAILS until the implementer adds archiveScope to AnalyzeActions.
    const state = useAnalyzeStore.getState() as unknown as Record<string, unknown>;
    expect('archiveScope' in state).toBe(true);
  });
});

// ============================================================================
// archiveScope (IM-4b Task 5 — SCOPE_ARCHIVE via scope rail)
//
// The acceptance requires that SCOPE_ARCHIVE prunes a scope from the rail.
// archiveScope is a soft-delete (sets deletedAt) so the HubRepository can
// persist the tombstone; the store filters deleted scopes out of the
// presentation slice OR marks them deleted — tests cover both observable
// effects (the scope no longer appears in the active listing).
// ============================================================================

describe('analyzeStore — archiveScope (IM-4b Task 5)', () => {
  it('archiveScope removes the scope from the active scopes list', () => {
    const sA = useAnalyzeStore
      .getState()
      .addScope('inv-1', 'Scope A', [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'B' }]);
    const sB = useAnalyzeStore
      .getState()
      .addScope('inv-1', 'Scope B', [{ kind: 'leaf', column: 'Line', op: 'eq', value: '1' }]);
    expect(useAnalyzeStore.getState().scopes).toHaveLength(2);

    useAnalyzeStore.getState().archiveScope(sA.id);

    // After archive, scope A must not appear in the active listing.
    const remaining = useAnalyzeStore.getState().scopes;
    expect(remaining.some(s => s.id === sA.id && !s.deletedAt)).toBe(false);
    // Scope B is untouched.
    expect(remaining.some(s => s.id === sB.id)).toBe(true);
  });

  it('archiveScope is a no-op for an unknown scope id', () => {
    useAnalyzeStore.getState().addScope('inv-1', 'Scope A');
    expect(() => useAnalyzeStore.getState().archiveScope('does-not-exist')).not.toThrow();
    expect(useAnalyzeStore.getState().scopes).toHaveLength(1);
  });

  it('archiveScope on the last scope leaves an empty active listing', () => {
    const s = useAnalyzeStore.getState().addScope('inv-1', 'Only scope');
    useAnalyzeStore.getState().archiveScope(s.id);
    // Active (non-deleted) scopes must be empty.
    const active = useAnalyzeStore.getState().scopes.filter(sc => !sc.deletedAt);
    expect(active).toHaveLength(0);
  });

  it('archiveScope does not affect the sibling scope predicates or hypothesisIds', () => {
    const sA = useAnalyzeStore
      .getState()
      .addScope('inv-1', 'Scope A', [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'B' }]);
    const sB = useAnalyzeStore
      .getState()
      .addScope('inv-1', 'Scope B', [{ kind: 'leaf', column: 'Product', op: 'eq', value: 'X' }]);
    useAnalyzeStore.getState().addHypothesisToScope(sB.id, 'h-1');

    useAnalyzeStore.getState().archiveScope(sA.id);

    const sibling = useAnalyzeStore.getState().scopes.find(s => s.id === sB.id);
    expect(sibling?.predicates).toEqual([
      { kind: 'leaf', column: 'Product', op: 'eq', value: 'X' },
    ]);
    expect(sibling?.hypothesisIds).toEqual(['h-1']);
  });
});
