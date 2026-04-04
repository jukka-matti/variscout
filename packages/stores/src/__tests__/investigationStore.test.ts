import { describe, it, expect, beforeEach } from 'vitest';
import { useInvestigationStore, getInvestigationInitialState } from '../investigationStore';
import type {
  FindingContext,
  FindingOutcome,
  SuspectedCause,
  InvestigationCategory,
} from '@variscout/core';

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
  useInvestigationStore.setState(getInvestigationInitialState());
});

// ============================================================================
// Finding tests
// ============================================================================

describe('investigationStore — findings', () => {
  it('adds a finding with text, context, source, and questionId', () => {
    const ctx = makeContext();
    const source = { chart: 'boxplot' as const, category: 'A' };
    const finding = useInvestigationStore.getState().addFinding('test note', ctx, source, 'q-1');

    const state = useInvestigationStore.getState();
    expect(state.findings).toHaveLength(1);
    expect(state.findings[0].text).toBe('test note');
    expect(state.findings[0].source).toEqual(source);
    expect(state.findings[0].questionId).toBe('q-1');
    expect(state.findings[0].status).toBe('observed');
    expect(finding.id).toBe(state.findings[0].id);
  });

  it('prepends new findings (newest first)', () => {
    const ctx = makeContext();
    useInvestigationStore.getState().addFinding('first', ctx);
    useInvestigationStore.getState().addFinding('second', ctx);
    const { findings } = useInvestigationStore.getState();
    expect(findings[0].text).toBe('second');
    expect(findings[1].text).toBe('first');
  });

  it('edits a finding text', () => {
    const ctx = makeContext();
    const f = useInvestigationStore.getState().addFinding('original', ctx);
    useInvestigationStore.getState().editFinding(f.id, 'updated');
    expect(useInvestigationStore.getState().findings[0].text).toBe('updated');
  });

  it('deletes a finding', () => {
    const ctx = makeContext();
    const f = useInvestigationStore.getState().addFinding('to delete', ctx);
    useInvestigationStore.getState().deleteFinding(f.id);
    expect(useInvestigationStore.getState().findings).toHaveLength(0);
  });

  it('sets finding status with statusChangedAt', () => {
    const ctx = makeContext();
    const f = useInvestigationStore.getState().addFinding('note', ctx);
    const before = Date.now();
    useInvestigationStore.getState().setFindingStatus(f.id, 'investigating');
    const updated = useInvestigationStore.getState().findings[0];
    expect(updated.status).toBe('investigating');
    expect(updated.statusChangedAt).toBeGreaterThanOrEqual(before);
  });

  it('sets finding tag', () => {
    const ctx = makeContext();
    const f = useInvestigationStore.getState().addFinding('note', ctx);
    useInvestigationStore.getState().setFindingTag(f.id, 'key-driver');
    expect(useInvestigationStore.getState().findings[0].tag).toBe('key-driver');

    // Clear tag
    useInvestigationStore.getState().setFindingTag(f.id, null);
    expect(useInvestigationStore.getState().findings[0].tag).toBeUndefined();
  });

  it('sets finding assignee and clears it', () => {
    const ctx = makeContext();
    const f = useInvestigationStore.getState().addFinding('note', ctx);
    const assignee = { upn: 'jane@test.com', displayName: 'Jane' };
    useInvestigationStore.getState().setFindingAssignee(f.id, assignee);
    expect(useInvestigationStore.getState().findings[0].assignee).toEqual(assignee);

    useInvestigationStore.getState().setFindingAssignee(f.id, null);
    expect(useInvestigationStore.getState().findings[0].assignee).toBeUndefined();
  });

  it('links finding to question', () => {
    const ctx = makeContext();
    const f = useInvestigationStore.getState().addFinding('note', ctx);
    useInvestigationStore.getState().linkFindingToQuestion(f.id, 'q-1', 'supports');
    const updated = useInvestigationStore.getState().findings[0];
    expect(updated.questionId).toBe('q-1');
    expect(updated.validationStatus).toBe('supports');
  });

  it('unlinks finding from question', () => {
    const ctx = makeContext();
    const f = useInvestigationStore.getState().addFinding('note', ctx, undefined, 'q-1');
    useInvestigationStore.getState().unlinkFindingFromQuestion(f.id);
    const updated = useInvestigationStore.getState().findings[0];
    expect(updated.questionId).toBeUndefined();
    expect(updated.validationStatus).toBeUndefined();
  });

  it('adds comment to finding', () => {
    const ctx = makeContext();
    const f = useInvestigationStore.getState().addFinding('note', ctx);
    const comment = useInvestigationStore.getState().addFindingComment(f.id, 'my comment', 'Bob');
    const updated = useInvestigationStore.getState().findings[0];
    expect(updated.comments).toHaveLength(1);
    expect(updated.comments[0].text).toBe('my comment');
    expect(updated.comments[0].author).toBe('Bob');
    expect(comment.id).toBe(updated.comments[0].id);
  });

  it('edits and deletes a comment', () => {
    const ctx = makeContext();
    const f = useInvestigationStore.getState().addFinding('note', ctx);
    const c = useInvestigationStore.getState().addFindingComment(f.id, 'original');
    useInvestigationStore.getState().editFindingComment(f.id, c.id, 'edited');
    expect(useInvestigationStore.getState().findings[0].comments[0].text).toBe('edited');

    useInvestigationStore.getState().deleteFindingComment(f.id, c.id);
    expect(useInvestigationStore.getState().findings[0].comments).toHaveLength(0);
  });

  it('sets and clears finding projection', () => {
    const ctx = makeContext();
    const f = useInvestigationStore.getState().addFinding('note', ctx);
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
    useInvestigationStore.getState().setFindingProjection(f.id, projection);
    expect(useInvestigationStore.getState().findings[0].projection).toEqual(projection);

    useInvestigationStore.getState().clearFindingProjection(f.id);
    expect(useInvestigationStore.getState().findings[0].projection).toBeUndefined();
  });
});

describe('investigationStore — finding actions (action items)', () => {
  it('adds action with auto-transition: analyzed → improving', () => {
    const ctx = makeContext();
    const f = useInvestigationStore.getState().addFinding('note', ctx);
    useInvestigationStore.getState().setFindingStatus(f.id, 'analyzed');

    useInvestigationStore.getState().addFindingAction(f.id, 'Fix the machine');
    const updated = useInvestigationStore.getState().findings[0];
    expect(updated.actions).toHaveLength(1);
    expect(updated.actions![0].text).toBe('Fix the machine');
    // Auto-transition: first action on 'analyzed' → 'improving'
    expect(updated.status).toBe('improving');
  });

  it('does not auto-transition if status is not analyzed', () => {
    const ctx = makeContext();
    const f = useInvestigationStore.getState().addFinding('note', ctx);
    // Status is 'observed' (default)
    useInvestigationStore.getState().addFindingAction(f.id, 'Fix');
    expect(useInvestigationStore.getState().findings[0].status).toBe('observed');
  });

  it('does not auto-transition if finding already has actions', () => {
    const ctx = makeContext();
    const f = useInvestigationStore.getState().addFinding('note', ctx);
    useInvestigationStore.getState().setFindingStatus(f.id, 'analyzed');
    useInvestigationStore.getState().addFindingAction(f.id, 'First');
    // Status is now 'improving' from first action
    useInvestigationStore.getState().addFindingAction(f.id, 'Second');
    expect(useInvestigationStore.getState().findings[0].status).toBe('improving');
    expect(useInvestigationStore.getState().findings[0].actions).toHaveLength(2);
  });

  it('updates an action item', () => {
    const ctx = makeContext();
    const f = useInvestigationStore.getState().addFinding('note', ctx);
    useInvestigationStore.getState().addFindingAction(f.id, 'Original');
    const actionId = useInvestigationStore.getState().findings[0].actions![0].id;
    useInvestigationStore.getState().updateFindingAction(f.id, actionId, { text: 'Updated' });
    expect(useInvestigationStore.getState().findings[0].actions![0].text).toBe('Updated');
  });

  it('completes an action item', () => {
    const ctx = makeContext();
    const f = useInvestigationStore.getState().addFinding('note', ctx);
    useInvestigationStore.getState().addFindingAction(f.id, 'Task');
    const actionId = useInvestigationStore.getState().findings[0].actions![0].id;
    useInvestigationStore.getState().completeFindingAction(f.id, actionId);
    expect(useInvestigationStore.getState().findings[0].actions![0].completedAt).toBeDefined();
  });

  it('toggles action completion', () => {
    const ctx = makeContext();
    const f = useInvestigationStore.getState().addFinding('note', ctx);
    useInvestigationStore.getState().addFindingAction(f.id, 'Task');
    const actionId = useInvestigationStore.getState().findings[0].actions![0].id;

    // Toggle on
    useInvestigationStore.getState().toggleFindingActionComplete(f.id, actionId);
    expect(useInvestigationStore.getState().findings[0].actions![0].completedAt).toBeDefined();

    // Toggle off
    useInvestigationStore.getState().toggleFindingActionComplete(f.id, actionId);
    expect(useInvestigationStore.getState().findings[0].actions![0].completedAt).toBeUndefined();
  });

  it('deletes an action item', () => {
    const ctx = makeContext();
    const f = useInvestigationStore.getState().addFinding('note', ctx);
    useInvestigationStore.getState().addFindingAction(f.id, 'To delete');
    const actionId = useInvestigationStore.getState().findings[0].actions![0].id;
    useInvestigationStore.getState().deleteFindingAction(f.id, actionId);
    expect(useInvestigationStore.getState().findings[0].actions).toHaveLength(0);
  });
});

describe('investigationStore — finding outcome', () => {
  it('sets outcome with auto-transition: improving + all complete → resolved', () => {
    const ctx = makeContext();
    const f = useInvestigationStore.getState().addFinding('note', ctx);
    useInvestigationStore.getState().setFindingStatus(f.id, 'analyzed');
    useInvestigationStore.getState().addFindingAction(f.id, 'Fix');
    // Status auto-transitioned to 'improving'

    const actionId = useInvestigationStore.getState().findings[0].actions![0].id;
    useInvestigationStore.getState().completeFindingAction(f.id, actionId);

    const outcome: FindingOutcome = {
      effective: 'yes',
      cpkBefore: 0.8,
      cpkAfter: 1.5,
      verifiedAt: Date.now(),
    };
    useInvestigationStore.getState().setFindingOutcome(f.id, outcome);
    const updated = useInvestigationStore.getState().findings[0];
    expect(updated.outcome).toEqual(outcome);
    expect(updated.status).toBe('resolved');
  });

  it('does not auto-transition if not all actions complete', () => {
    const ctx = makeContext();
    const f = useInvestigationStore.getState().addFinding('note', ctx);
    useInvestigationStore.getState().setFindingStatus(f.id, 'analyzed');
    useInvestigationStore.getState().addFindingAction(f.id, 'Fix');
    // Don't complete the action

    const outcome: FindingOutcome = {
      effective: 'partial',
      verifiedAt: Date.now(),
    };
    useInvestigationStore.getState().setFindingOutcome(f.id, outcome);
    expect(useInvestigationStore.getState().findings[0].status).toBe('improving');
  });
});

describe('investigationStore — benchmark + scope', () => {
  it('sets benchmark and clears previous benchmark', () => {
    const ctx = makeContext();
    const f1 = useInvestigationStore.getState().addFinding('first', ctx);
    const f2 = useInvestigationStore.getState().addFinding('second', ctx);

    const stats = { mean: 10, stdDev: 1, cpk: 1.5, count: 50 };
    useInvestigationStore.getState().setBenchmark(f1.id, stats);
    expect(useInvestigationStore.getState().findings.find(f => f.id === f1.id)?.role).toBe(
      'benchmark'
    );

    // Set new benchmark → clears old one
    useInvestigationStore.getState().setBenchmark(f2.id, stats);
    const state = useInvestigationStore.getState();
    expect(state.findings.find(f => f.id === f1.id)?.role).toBeUndefined();
    expect(state.findings.find(f => f.id === f2.id)?.role).toBe('benchmark');
  });

  it('clears benchmark', () => {
    const ctx = makeContext();
    const f = useInvestigationStore.getState().addFinding('note', ctx);
    const stats = { mean: 10, stdDev: 1, count: 50 };
    useInvestigationStore.getState().setBenchmark(f.id, stats);
    useInvestigationStore.getState().clearBenchmark(f.id);
    expect(useInvestigationStore.getState().findings[0].role).toBeUndefined();
    expect(useInvestigationStore.getState().findings[0].benchmarkStats).toBeUndefined();
  });

  it('toggles scope: undefined → true → false → undefined', () => {
    const ctx = makeContext();
    const f = useInvestigationStore.getState().addFinding('note', ctx);

    expect(useInvestigationStore.getState().findings[0].scoped).toBeUndefined();

    useInvestigationStore.getState().toggleScope(f.id);
    expect(useInvestigationStore.getState().findings[0].scoped).toBe(true);

    useInvestigationStore.getState().toggleScope(f.id);
    expect(useInvestigationStore.getState().findings[0].scoped).toBe(false);

    useInvestigationStore.getState().toggleScope(f.id);
    expect(useInvestigationStore.getState().findings[0].scoped).toBeUndefined();
  });
});

// ============================================================================
// Question tests
// ============================================================================

describe('investigationStore — questions', () => {
  it('adds a root question', () => {
    const q = useInvestigationStore.getState().addQuestion('Does shift matter?', 'Shift');
    const state = useInvestigationStore.getState();
    expect(state.questions).toHaveLength(1);
    expect(state.questions[0].text).toBe('Does shift matter?');
    expect(state.questions[0].factor).toBe('Shift');
    expect(state.questions[0].status).toBe('open');
    expect(q.id).toBe(state.questions[0].id);
  });

  it('adds a sub-question', () => {
    const parent = useInvestigationStore.getState().addQuestion('Root');
    const child = useInvestigationStore
      .getState()
      .addSubQuestion(parent.id, 'Sub question', 'Machine', 'A', 'gemba');
    expect(child).not.toBeNull();
    expect(child!.parentId).toBe(parent.id);
    expect(child!.validationType).toBe('gemba');
    expect(useInvestigationStore.getState().questions).toHaveLength(2);
  });

  it('returns null for sub-question if parent does not exist', () => {
    const result = useInvestigationStore.getState().addSubQuestion('nonexistent', 'Sub');
    expect(result).toBeNull();
  });

  it('returns null for sub-question if max depth exceeded', () => {
    const q0 = useInvestigationStore.getState().addQuestion('L0');
    const q1 = useInvestigationStore.getState().addSubQuestion(q0.id, 'L1');
    const q2 = useInvestigationStore.getState().addSubQuestion(q1!.id, 'L2');
    // Depth of q2 is 2, MAX_QUESTION_DEPTH - 1 = 2, so adding a child to q2 should fail
    const q3 = useInvestigationStore.getState().addSubQuestion(q2!.id, 'L3');
    expect(q3).toBeNull();
  });

  it('returns null for sub-question if max children exceeded', () => {
    const parent = useInvestigationStore.getState().addQuestion('Parent');
    // Add MAX_CHILDREN_PER_PARENT children
    for (let i = 0; i < 8; i++) {
      useInvestigationStore.getState().addSubQuestion(parent.id, `Child ${i}`);
    }
    const overflow = useInvestigationStore.getState().addSubQuestion(parent.id, 'Overflow');
    expect(overflow).toBeNull();
  });

  it('edits a question', () => {
    const q = useInvestigationStore.getState().addQuestion('Original');
    useInvestigationStore.getState().editQuestion(q.id, { text: 'Edited', factor: 'New' });
    const updated = useInvestigationStore.getState().questions[0];
    expect(updated.text).toBe('Edited');
    expect(updated.factor).toBe('New');
  });

  it('sets question status', () => {
    const q = useInvestigationStore.getState().addQuestion('Test');
    useInvestigationStore.getState().setQuestionStatus(q.id, 'answered');
    expect(useInvestigationStore.getState().questions[0].status).toBe('answered');
  });

  it('deletes question and all descendants', () => {
    const q0 = useInvestigationStore.getState().addQuestion('Root');
    const q1 = useInvestigationStore.getState().addSubQuestion(q0.id, 'Child');
    useInvestigationStore.getState().addSubQuestion(q1!.id, 'Grandchild');
    expect(useInvestigationStore.getState().questions).toHaveLength(3);

    useInvestigationStore.getState().deleteQuestion(q0.id);
    expect(useInvestigationStore.getState().questions).toHaveLength(0);
  });

  it('delete question clears questionId from linked findings', () => {
    const q = useInvestigationStore.getState().addQuestion('To delete');
    const ctx = makeContext();
    useInvestigationStore.getState().addFinding('note', ctx, undefined, q.id);
    expect(useInvestigationStore.getState().findings[0].questionId).toBe(q.id);

    useInvestigationStore.getState().deleteQuestion(q.id);
    expect(useInvestigationStore.getState().findings[0].questionId).toBeUndefined();
  });

  it('links and unlinks finding to question list', () => {
    const q = useInvestigationStore.getState().addQuestion('Test');
    useInvestigationStore.getState().linkFindingToQuestionList(q.id, 'f-1');
    expect(useInvestigationStore.getState().questions[0].linkedFindingIds).toEqual(['f-1']);

    // No-op on duplicate
    useInvestigationStore.getState().linkFindingToQuestionList(q.id, 'f-1');
    expect(useInvestigationStore.getState().questions[0].linkedFindingIds).toEqual(['f-1']);

    useInvestigationStore.getState().unlinkFindingFromQuestionList(q.id, 'f-1');
    expect(useInvestigationStore.getState().questions[0].linkedFindingIds).toEqual([]);
  });
});

describe('investigationStore — question ideas', () => {
  it('adds idea to question', () => {
    const q = useInvestigationStore.getState().addQuestion('Test');
    const idea = useInvestigationStore.getState().addIdea(q.id, 'My idea');
    expect(idea).not.toBeNull();
    expect(idea!.text).toBe('My idea');
    expect(useInvestigationStore.getState().questions[0].ideas).toHaveLength(1);
  });

  it('returns null when adding idea to nonexistent question', () => {
    const result = useInvestigationStore.getState().addIdea('nonexistent', 'Idea');
    expect(result).toBeNull();
  });

  it('updates an idea', () => {
    const q = useInvestigationStore.getState().addQuestion('Test');
    const idea = useInvestigationStore.getState().addIdea(q.id, 'Original');
    useInvestigationStore.getState().updateIdea(q.id, idea!.id, { text: 'Updated' });
    expect(useInvestigationStore.getState().questions[0].ideas![0].text).toBe('Updated');
  });

  it('deletes an idea', () => {
    const q = useInvestigationStore.getState().addQuestion('Test');
    const idea = useInvestigationStore.getState().addIdea(q.id, 'To delete');
    useInvestigationStore.getState().deleteIdea(q.id, idea!.id);
    expect(useInvestigationStore.getState().questions[0].ideas).toHaveLength(0);
  });

  it('selects and deselects an idea', () => {
    const q = useInvestigationStore.getState().addQuestion('Test');
    const idea = useInvestigationStore.getState().addIdea(q.id, 'Idea');
    useInvestigationStore.getState().selectIdea(q.id, idea!.id, true);
    expect(useInvestigationStore.getState().questions[0].ideas![0].selected).toBe(true);

    useInvestigationStore.getState().selectIdea(q.id, idea!.id, false);
    expect(useInvestigationStore.getState().questions[0].ideas![0].selected).toBe(false);
  });

  it('updates idea projection', () => {
    const q = useInvestigationStore.getState().addQuestion('Test');
    const idea = useInvestigationStore.getState().addIdea(q.id, 'Idea');
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
    useInvestigationStore.getState().updateIdeaProjection(q.id, idea!.id, projection);
    expect(useInvestigationStore.getState().questions[0].ideas![0].projection).toEqual(projection);
  });

  it('sets focused question', () => {
    const q = useInvestigationStore.getState().addQuestion('Test');
    useInvestigationStore.getState().setFocusedQuestion(q.id);
    expect(useInvestigationStore.getState().focusedQuestionId).toBe(q.id);

    useInvestigationStore.getState().setFocusedQuestion(null);
    expect(useInvestigationStore.getState().focusedQuestionId).toBeNull();
  });
});

// ============================================================================
// Hub tests
// ============================================================================

describe('investigationStore — suspected cause hubs', () => {
  it('creates a hub', () => {
    const hub = useInvestigationStore
      .getState()
      .createHub('Nozzle wear', 'Night shift causes wear');
    const state = useInvestigationStore.getState();
    expect(state.suspectedCauses).toHaveLength(1);
    expect(state.suspectedCauses[0].name).toBe('Nozzle wear');
    expect(state.suspectedCauses[0].synthesis).toBe('Night shift causes wear');
    expect(state.suspectedCauses[0].status).toBe('suspected');
    expect(hub.id).toBe(state.suspectedCauses[0].id);
  });

  it('updates a hub', () => {
    const hub = useInvestigationStore.getState().createHub('Old name', 'Old synthesis');
    useInvestigationStore.getState().updateHub(hub.id, { name: 'New name' });
    expect(useInvestigationStore.getState().suspectedCauses[0].name).toBe('New name');
    expect(useInvestigationStore.getState().suspectedCauses[0].synthesis).toBe('Old synthesis');
  });

  it('connects question and finding to hub', () => {
    const hub = useInvestigationStore.getState().createHub('Test', 'Synth');
    useInvestigationStore.getState().connectQuestionToHub(hub.id, 'q-1');
    useInvestigationStore.getState().connectFindingToHub(hub.id, 'f-1');

    const updated = useInvestigationStore.getState().suspectedCauses[0];
    expect(updated.questionIds).toEqual(['q-1']);
    expect(updated.findingIds).toEqual(['f-1']);
  });

  it('no-op when connecting already-connected question', () => {
    const hub = useInvestigationStore.getState().createHub('Test', 'Synth');
    useInvestigationStore.getState().connectQuestionToHub(hub.id, 'q-1');
    useInvestigationStore.getState().connectQuestionToHub(hub.id, 'q-1');
    expect(useInvestigationStore.getState().suspectedCauses[0].questionIds).toEqual(['q-1']);
  });

  it('no-op when connecting already-connected finding', () => {
    const hub = useInvestigationStore.getState().createHub('Test', 'Synth');
    useInvestigationStore.getState().connectFindingToHub(hub.id, 'f-1');
    useInvestigationStore.getState().connectFindingToHub(hub.id, 'f-1');
    expect(useInvestigationStore.getState().suspectedCauses[0].findingIds).toEqual(['f-1']);
  });

  it('disconnects question from hub', () => {
    const hub = useInvestigationStore.getState().createHub('Test', 'Synth');
    useInvestigationStore.getState().connectQuestionToHub(hub.id, 'q-1');
    useInvestigationStore.getState().connectQuestionToHub(hub.id, 'q-2');
    useInvestigationStore.getState().disconnectQuestionFromHub(hub.id, 'q-1');
    expect(useInvestigationStore.getState().suspectedCauses[0].questionIds).toEqual(['q-2']);
  });

  it('disconnects finding from hub', () => {
    const hub = useInvestigationStore.getState().createHub('Test', 'Synth');
    useInvestigationStore.getState().connectFindingToHub(hub.id, 'f-1');
    useInvestigationStore.getState().disconnectFindingFromHub(hub.id, 'f-1');
    expect(useInvestigationStore.getState().suspectedCauses[0].findingIds).toEqual([]);
  });

  it('deletes a hub', () => {
    const hub = useInvestigationStore.getState().createHub('Test', 'Synth');
    useInvestigationStore.getState().deleteHub(hub.id);
    expect(useInvestigationStore.getState().suspectedCauses).toHaveLength(0);
  });

  it('sets hub status', () => {
    const hub = useInvestigationStore.getState().createHub('Test', 'Synth');
    useInvestigationStore.getState().setHubStatus(hub.id, 'confirmed');
    expect(useInvestigationStore.getState().suspectedCauses[0].status).toBe('confirmed');
  });

  it('sets hub evidence', () => {
    const hub = useInvestigationStore.getState().createHub('Test', 'Synth');
    const evidence = {
      mode: 'standard' as const,
      contribution: {
        value: 0.52,
        label: 'R²adj',
        description: 'Explains 52% of variation',
      },
    };
    useInvestigationStore.getState().setHubEvidence(hub.id, evidence);
    expect(useInvestigationStore.getState().suspectedCauses[0].evidence).toEqual(evidence);
  });

  it('resets hubs atomically', () => {
    useInvestigationStore.getState().createHub('A', 'a');
    useInvestigationStore.getState().createHub('B', 'b');
    expect(useInvestigationStore.getState().suspectedCauses).toHaveLength(2);

    const newHubs: SuspectedCause[] = [
      {
        id: 'h-new',
        name: 'New',
        synthesis: 'Fresh',
        questionIds: [],
        findingIds: [],
        status: 'suspected',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    useInvestigationStore.getState().resetHubs(newHubs);
    expect(useInvestigationStore.getState().suspectedCauses).toEqual(newHubs);
  });
});

// ============================================================================
// Bulk + category tests
// ============================================================================

describe('investigationStore — bulk operations', () => {
  it('loadInvestigationState hydrates all arrays', () => {
    const ctx = makeContext();
    const finding = {
      id: 'f-1',
      text: 'Test',
      createdAt: Date.now(),
      context: ctx,
      status: 'observed' as const,
      comments: [],
      statusChangedAt: Date.now(),
    };
    const question = {
      id: 'q-1',
      text: 'Why?',
      status: 'open' as const,
      linkedFindingIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const hub: SuspectedCause = {
      id: 'h-1',
      name: 'Hub',
      synthesis: 'Synth',
      questionIds: ['q-1'],
      findingIds: ['f-1'],
      status: 'suspected',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const category: InvestigationCategory = {
      id: 'c-1',
      name: 'Equipment',
      factorNames: ['Machine'],
    };

    useInvestigationStore.getState().loadInvestigationState({
      findings: [finding],
      questions: [question],
      suspectedCauses: [hub],
      categories: [category],
    });

    const state = useInvestigationStore.getState();
    expect(state.findings).toEqual([finding]);
    expect(state.questions).toEqual([question]);
    expect(state.suspectedCauses).toEqual([hub]);
    expect(state.categories).toEqual([category]);
  });

  it('loadInvestigationState only updates provided fields', () => {
    useInvestigationStore.getState().addQuestion('Existing');
    useInvestigationStore.getState().loadInvestigationState({ categories: [] });
    // Questions should be preserved
    expect(useInvestigationStore.getState().questions).toHaveLength(1);
    expect(useInvestigationStore.getState().questions[0].text).toBe('Existing');
  });

  it('resetAll clears everything', () => {
    useInvestigationStore.getState().addFinding('note', makeContext());
    useInvestigationStore.getState().addQuestion('question');
    useInvestigationStore.getState().createHub('hub', 'synth');
    useInvestigationStore.getState().setFocusedQuestion('q-1');

    useInvestigationStore.getState().resetAll();
    const state = useInvestigationStore.getState();
    expect(state.findings).toEqual([]);
    expect(state.questions).toEqual([]);
    expect(state.suspectedCauses).toEqual([]);
    expect(state.categories).toEqual([]);
    expect(state.focusedQuestionId).toBeNull();
  });

  it('setCategories replaces categories', () => {
    const cats: InvestigationCategory[] = [
      { id: 'c-1', name: 'People', factorNames: ['Operator'] },
      { id: 'c-2', name: 'Equipment', factorNames: ['Machine'] },
    ];
    useInvestigationStore.getState().setCategories(cats);
    expect(useInvestigationStore.getState().categories).toEqual(cats);
  });
});
