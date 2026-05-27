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
  it('adds a finding with text, context, source, and questionId', () => {
    const ctx = makeContext();
    const source = { chart: 'boxplot' as const, category: 'A', timeLens: DEFAULT_TIME_LENS };
    const finding = useAnalyzeStore.getState().addFinding('test note', ctx, source, 'q-1');

    const state = useAnalyzeStore.getState();
    expect(state.findings).toHaveLength(1);
    expect(state.findings[0].text).toBe('test note');
    expect(state.findings[0].source).toEqual(source);
    expect(state.findings[0].questionId).toBe('q-1');
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

  it('links finding to question', () => {
    const ctx = makeContext();
    const f = useAnalyzeStore.getState().addFinding('note', ctx);
    useAnalyzeStore.getState().linkFindingToQuestion(f.id, 'q-1', 'supports');
    const updated = useAnalyzeStore.getState().findings[0];
    expect(updated.questionId).toBe('q-1');
    expect(updated.validationStatus).toBe('supports');
  });

  it('unlinks finding from question', () => {
    const ctx = makeContext();
    const f = useAnalyzeStore.getState().addFinding('note', ctx, undefined, 'q-1');
    useAnalyzeStore.getState().unlinkFindingFromQuestion(f.id);
    const updated = useAnalyzeStore.getState().findings[0];
    expect(updated.questionId).toBeUndefined();
    expect(updated.validationStatus).toBeUndefined();
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
// Question tests
// ============================================================================

describe('analyzeStore — questions', () => {
  it('adds a root question', () => {
    const q = useAnalyzeStore.getState().addQuestion('Does shift matter?', 'Shift');
    const state = useAnalyzeStore.getState();
    expect(state.questions).toHaveLength(1);
    expect(state.questions[0].text).toBe('Does shift matter?');
    expect(state.questions[0].factor).toBe('Shift');
    expect(state.questions[0].status).toBe('open');
    expect(q.id).toBe(state.questions[0].id);
  });

  it('adds a sub-question', () => {
    const parent = useAnalyzeStore.getState().addQuestion('Root');
    const child = useAnalyzeStore
      .getState()
      .addSubQuestion(parent.id, 'Sub question', 'Machine', 'A', 'gemba');
    expect(child).not.toBeNull();
    expect(child!.parentId).toBe(parent.id);
    expect(child!.validationType).toBe('gemba');
    expect(useAnalyzeStore.getState().questions).toHaveLength(2);
  });

  it('returns null for sub-question if parent does not exist', () => {
    const result = useAnalyzeStore.getState().addSubQuestion('nonexistent', 'Sub');
    expect(result).toBeNull();
  });

  it('returns null for sub-question if max depth exceeded', () => {
    const q0 = useAnalyzeStore.getState().addQuestion('L0');
    const q1 = useAnalyzeStore.getState().addSubQuestion(q0.id, 'L1');
    const q2 = useAnalyzeStore.getState().addSubQuestion(q1!.id, 'L2');
    // Depth of q2 is 2, MAX_QUESTION_DEPTH - 1 = 2, so adding a child to q2 should fail
    const q3 = useAnalyzeStore.getState().addSubQuestion(q2!.id, 'L3');
    expect(q3).toBeNull();
  });

  it('returns null for sub-question if max children exceeded', () => {
    const parent = useAnalyzeStore.getState().addQuestion('Parent');
    // Add MAX_CHILDREN_PER_PARENT children
    for (let i = 0; i < 8; i++) {
      useAnalyzeStore.getState().addSubQuestion(parent.id, `Child ${i}`);
    }
    const overflow = useAnalyzeStore.getState().addSubQuestion(parent.id, 'Overflow');
    expect(overflow).toBeNull();
  });

  it('edits a question', () => {
    const q = useAnalyzeStore.getState().addQuestion('Original');
    useAnalyzeStore.getState().editQuestion(q.id, { text: 'Edited', factor: 'New' });
    const updated = useAnalyzeStore.getState().questions[0];
    expect(updated.text).toBe('Edited');
    expect(updated.factor).toBe('New');
  });

  it('sets question status', () => {
    const q = useAnalyzeStore.getState().addQuestion('Test');
    useAnalyzeStore.getState().setQuestionStatus(q.id, 'answered');
    expect(useAnalyzeStore.getState().questions[0].status).toBe('answered');
  });

  it('deletes question and all descendants', () => {
    const q0 = useAnalyzeStore.getState().addQuestion('Root');
    const q1 = useAnalyzeStore.getState().addSubQuestion(q0.id, 'Child');
    useAnalyzeStore.getState().addSubQuestion(q1!.id, 'Grandchild');
    expect(useAnalyzeStore.getState().questions).toHaveLength(3);

    useAnalyzeStore.getState().deleteQuestion(q0.id);
    expect(useAnalyzeStore.getState().questions).toHaveLength(0);
  });

  it('delete question clears questionId from linked findings', () => {
    const q = useAnalyzeStore.getState().addQuestion('To delete');
    const ctx = makeContext();
    useAnalyzeStore.getState().addFinding('note', ctx, undefined, q.id);
    expect(useAnalyzeStore.getState().findings[0].questionId).toBe(q.id);

    useAnalyzeStore.getState().deleteQuestion(q.id);
    expect(useAnalyzeStore.getState().findings[0].questionId).toBeUndefined();
  });

  it('links and unlinks finding to question list', () => {
    const q = useAnalyzeStore.getState().addQuestion('Test');
    useAnalyzeStore.getState().linkFindingToQuestionList(q.id, 'f-1');
    expect(useAnalyzeStore.getState().questions[0].linkedFindingIds).toEqual(['f-1']);

    // No-op on duplicate
    useAnalyzeStore.getState().linkFindingToQuestionList(q.id, 'f-1');
    expect(useAnalyzeStore.getState().questions[0].linkedFindingIds).toEqual(['f-1']);

    useAnalyzeStore.getState().unlinkFindingFromQuestionList(q.id, 'f-1');
    expect(useAnalyzeStore.getState().questions[0].linkedFindingIds).toEqual([]);
  });
});

describe('analyzeStore — question ideas', () => {
  it('adds idea to question', () => {
    const q = useAnalyzeStore.getState().addQuestion('Test');
    const idea = useAnalyzeStore.getState().addIdea(q.id, 'My idea');
    expect(idea).not.toBeNull();
    expect(idea!.text).toBe('My idea');
    expect(useAnalyzeStore.getState().questions[0].ideas).toHaveLength(1);
  });

  it('returns null when adding idea to nonexistent question', () => {
    const result = useAnalyzeStore.getState().addIdea('nonexistent', 'Idea');
    expect(result).toBeNull();
  });

  it('updates an idea', () => {
    const q = useAnalyzeStore.getState().addQuestion('Test');
    const idea = useAnalyzeStore.getState().addIdea(q.id, 'Original');
    useAnalyzeStore.getState().updateIdea(q.id, idea!.id, { text: 'Updated' });
    expect(useAnalyzeStore.getState().questions[0].ideas![0].text).toBe('Updated');
  });

  it('deletes an idea', () => {
    const q = useAnalyzeStore.getState().addQuestion('Test');
    const idea = useAnalyzeStore.getState().addIdea(q.id, 'To delete');
    useAnalyzeStore.getState().deleteIdea(q.id, idea!.id);
    expect(useAnalyzeStore.getState().questions[0].ideas).toHaveLength(0);
  });

  it('selects and deselects an idea', () => {
    const q = useAnalyzeStore.getState().addQuestion('Test');
    const idea = useAnalyzeStore.getState().addIdea(q.id, 'Idea');
    useAnalyzeStore.getState().selectIdea(q.id, idea!.id, true);
    expect(useAnalyzeStore.getState().questions[0].ideas![0].selected).toBe(true);

    useAnalyzeStore.getState().selectIdea(q.id, idea!.id, false);
    expect(useAnalyzeStore.getState().questions[0].ideas![0].selected).toBe(false);
  });

  it('updates idea projection', () => {
    const q = useAnalyzeStore.getState().addQuestion('Test');
    const idea = useAnalyzeStore.getState().addIdea(q.id, 'Idea');
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
    useAnalyzeStore.getState().updateIdeaProjection(q.id, idea!.id, projection);
    expect(useAnalyzeStore.getState().questions[0].ideas![0].projection).toEqual(projection);
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

  it('connects question and finding to hub', () => {
    const hub = useAnalyzeStore.getState().createHub('Test', 'Synth');
    useAnalyzeStore.getState().connectQuestionToHub(hub.id, 'q-1');
    useAnalyzeStore.getState().connectFindingToHub(hub.id, 'f-1');

    const updated = useAnalyzeStore.getState().hypotheses[0];
    expect(updated.questionIds).toEqual(['q-1']);
    expect(updated.findingIds).toEqual(['f-1']);
  });

  it('no-op when connecting already-connected question', () => {
    const hub = useAnalyzeStore.getState().createHub('Test', 'Synth');
    useAnalyzeStore.getState().connectQuestionToHub(hub.id, 'q-1');
    useAnalyzeStore.getState().connectQuestionToHub(hub.id, 'q-1');
    expect(useAnalyzeStore.getState().hypotheses[0].questionIds).toEqual(['q-1']);
  });

  it('no-op when connecting already-connected finding', () => {
    const hub = useAnalyzeStore.getState().createHub('Test', 'Synth');
    useAnalyzeStore.getState().connectFindingToHub(hub.id, 'f-1');
    useAnalyzeStore.getState().connectFindingToHub(hub.id, 'f-1');
    expect(useAnalyzeStore.getState().hypotheses[0].findingIds).toEqual(['f-1']);
  });

  it('disconnects question from hub', () => {
    const hub = useAnalyzeStore.getState().createHub('Test', 'Synth');
    useAnalyzeStore.getState().connectQuestionToHub(hub.id, 'q-1');
    useAnalyzeStore.getState().connectQuestionToHub(hub.id, 'q-2');
    useAnalyzeStore.getState().disconnectQuestionFromHub(hub.id, 'q-1');
    expect(useAnalyzeStore.getState().hypotheses[0].questionIds).toEqual(['q-2']);
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

  it('sets hub status', () => {
    const hub = useAnalyzeStore.getState().createHub('Test', 'Synth');
    useAnalyzeStore.getState().setHubStatus(hub.id, 'confirmed');
    expect(useAnalyzeStore.getState().hypotheses[0].status).toBe('confirmed');
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
        questionIds: [],
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
    };
    const question = {
      id: 'q-1',
      text: 'Why?',
      status: 'open' as const,
      linkedFindingIds: [],
      createdAt: 1714000000000,
      updatedAt: 1714000000000,
      deletedAt: null as null,
      investigationId: 'inv-test-001',
    };
    const hub: Hypothesis = {
      id: 'h-1',
      name: 'Hub',
      synthesis: 'Synth',
      questionIds: ['q-1'],
      findingIds: ['f-1'],
      status: 'proposed',
      createdAt: 1714000000000,
      updatedAt: 1714000000000,
      deletedAt: null,
      investigationId: 'inv-test-001',
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
      questions: [question],
      hypotheses: [hub],
      categories: [category],
    });

    const state = useAnalyzeStore.getState();
    expect(state.findings).toEqual([finding]);
    expect(state.questions).toEqual([question]);
    expect(state.hypotheses).toEqual([hub]);
    expect(state.categories).toEqual([category]);
  });

  it('loadAnalyzeState only updates provided fields', () => {
    useAnalyzeStore.getState().addQuestion('Existing');
    useAnalyzeStore.getState().loadAnalyzeState({ categories: [] });
    // Questions should be preserved
    expect(useAnalyzeStore.getState().questions).toHaveLength(1);
    expect(useAnalyzeStore.getState().questions[0].text).toBe('Existing');
  });

  it('resetAll clears everything', () => {
    useAnalyzeStore.getState().addFinding('note', makeContext());
    useAnalyzeStore.getState().addQuestion('question');
    useAnalyzeStore.getState().createHub('hub', 'synth');

    useAnalyzeStore.getState().resetAll();
    const state = useAnalyzeStore.getState();
    expect(state.findings).toEqual([]);
    expect(state.questions).toEqual([]);
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
    expect(link!.questionIds).toEqual([]);
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

  it('links a question ID', () => {
    const link = useAnalyzeStore.getState().addCausalLink('A', 'B', 'Test');
    useAnalyzeStore.getState().linkQuestionToCausalLink(link!.id, 'q-1');
    expect(useAnalyzeStore.getState().causalLinks[0].questionIds).toEqual(['q-1']);
  });

  it('no duplicate question IDs on double-link', () => {
    const link = useAnalyzeStore.getState().addCausalLink('A', 'B', 'Test');
    useAnalyzeStore.getState().linkQuestionToCausalLink(link!.id, 'q-1');
    useAnalyzeStore.getState().linkQuestionToCausalLink(link!.id, 'q-1');
    expect(useAnalyzeStore.getState().causalLinks[0].questionIds).toEqual(['q-1']);
  });

  it('unlinks a question ID', () => {
    const link = useAnalyzeStore.getState().addCausalLink('A', 'B', 'Test');
    useAnalyzeStore.getState().linkQuestionToCausalLink(link!.id, 'q-1');
    useAnalyzeStore.getState().linkQuestionToCausalLink(link!.id, 'q-2');
    useAnalyzeStore.getState().unlinkQuestionFromCausalLink(link!.id, 'q-1');
    expect(useAnalyzeStore.getState().causalLinks[0].questionIds).toEqual(['q-2']);
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
    useAnalyzeStore.getState().unlinkFindingFromCausalLink(link!.id, 'f-1');
    expect(useAnalyzeStore.getState().causalLinks[0].findingIds).toEqual([]);
  });
});

describe('analyzeStore — causalLink cascade behavior', () => {
  it('deleteQuestion removes questionId from causal links', () => {
    const q = useAnalyzeStore.getState().addQuestion('Test question');
    const link = useAnalyzeStore.getState().addCausalLink('A', 'B', 'Test');
    useAnalyzeStore.getState().linkQuestionToCausalLink(link!.id, q.id);
    expect(useAnalyzeStore.getState().causalLinks[0].questionIds).toContain(q.id);

    useAnalyzeStore.getState().deleteQuestion(q.id);
    expect(useAnalyzeStore.getState().causalLinks[0].questionIds).not.toContain(q.id);
  });

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
    // Manually set hypothesisId via updateCausalLink — the store doesn't have a direct setter,
    // so we use loadAnalyzeState to set it
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
// problemContributionTree tests
// ============================================================================

describe('problemContributionTree', () => {
  beforeEach(() => {
    useAnalyzeStore.setState(getAnalyzeInitialState());
  });

  it('defaults to undefined', () => {
    expect(useAnalyzeStore.getState().problemContributionTree).toBeUndefined();
  });

  it('can be set to a gate tree with hub leaves', () => {
    const tree: GateNode = {
      kind: 'and',
      children: [
        { kind: 'hub', hubId: 'h1' },
        { kind: 'hub', hubId: 'h2' },
      ],
    };
    useAnalyzeStore.getState().setProblemContributionTree(tree);
    expect(useAnalyzeStore.getState().problemContributionTree).toEqual(tree);
  });

  it('can be cleared by setting undefined', () => {
    useAnalyzeStore.getState().setProblemContributionTree({ kind: 'hub', hubId: 'h1' });
    useAnalyzeStore.getState().setProblemContributionTree(undefined);
    expect(useAnalyzeStore.getState().problemContributionTree).toBeUndefined();
  });

  it('survives loadAnalyzeState round-trip', () => {
    const tree: GateNode = {
      kind: 'and',
      children: [
        { kind: 'hub', hubId: 'h1' },
        { kind: 'not', child: { kind: 'hub', hubId: 'h2' } },
      ],
    };
    useAnalyzeStore.setState(useAnalyzeStore.getInitialState());
    useAnalyzeStore.getState().loadAnalyzeState({
      problemContributionTree: tree,
    });
    expect(useAnalyzeStore.getState().problemContributionTree).toEqual(tree);
  });
});

// ============================================================================
// composeGate tests (Phase 7.2)
// ============================================================================

describe('composeGate', () => {
  beforeEach(() => {
    useAnalyzeStore.setState(getAnalyzeInitialState());
  });

  it('is a no-op when the tree is undefined', () => {
    useAnalyzeStore.getState().composeGate([], 'h1');
    expect(useAnalyzeStore.getState().problemContributionTree).toBeUndefined();
  });

  it('appends a hub to an existing AND at root', () => {
    const tree: GateNode = {
      kind: 'and',
      children: [
        { kind: 'hub', hubId: 'h1' },
        { kind: 'hub', hubId: 'h2' },
      ],
    };
    useAnalyzeStore.getState().setProblemContributionTree(tree);
    useAnalyzeStore.getState().composeGate([], 'h3');
    expect(useAnalyzeStore.getState().problemContributionTree).toEqual({
      kind: 'and',
      children: [
        { kind: 'hub', hubId: 'h1' },
        { kind: 'hub', hubId: 'h2' },
        { kind: 'hub', hubId: 'h3' },
      ],
    });
  });

  it('wraps a leaf tree in a new AND when dropped at root', () => {
    useAnalyzeStore.getState().setProblemContributionTree({ kind: 'hub', hubId: 'h1' });
    useAnalyzeStore.getState().composeGate([], 'h2');
    expect(useAnalyzeStore.getState().problemContributionTree).toEqual({
      kind: 'and',
      children: [
        { kind: 'hub', hubId: 'h1' },
        { kind: 'hub', hubId: 'h2' },
      ],
    });
  });

  it('wraps an OR in a new AND at root when dropped on the OR', () => {
    const tree: GateNode = {
      kind: 'or',
      children: [
        { kind: 'hub', hubId: 'h1' },
        { kind: 'hub', hubId: 'h2' },
      ],
    };
    useAnalyzeStore.getState().setProblemContributionTree(tree);
    useAnalyzeStore.getState().composeGate([], 'h3');
    expect(useAnalyzeStore.getState().problemContributionTree).toEqual({
      kind: 'and',
      children: [tree, { kind: 'hub', hubId: 'h3' }],
    });
  });

  it('composes at a nested path', () => {
    // Leaf at [0] inside a root AND — composing there wraps that leaf in AND.
    const tree: GateNode = {
      kind: 'and',
      children: [
        { kind: 'hub', hubId: 'h1' },
        { kind: 'hub', hubId: 'h2' },
      ],
    };
    useAnalyzeStore.getState().setProblemContributionTree(tree);
    useAnalyzeStore.getState().composeGate([0], 'h3');
    expect(useAnalyzeStore.getState().problemContributionTree).toEqual({
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
    const tree: GateNode = { kind: 'hub', hubId: 'h1' };
    useAnalyzeStore.getState().setProblemContributionTree(tree);
    useAnalyzeStore.getState().composeGate([99], 'h2');
    expect(useAnalyzeStore.getState().problemContributionTree).toBe(tree);
  });
});

// ============================================================================
// Relocation assertion (F4)
// ============================================================================

describe('analyzeStore — relocation assertions (F4)', () => {
  it('does not own focusedQuestionId (relocated to useViewStore in F4)', () => {
    const state = useAnalyzeStore.getState() as Record<string, unknown>;
    expect('focusedQuestionId' in state).toBe(false);
    expect('setFocusedQuestion' in state).toBe(false);
  });
});
