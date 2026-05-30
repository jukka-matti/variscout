/**
 * Task 3 — analyzeStore: ActionItem tasks on hypotheses (RED tests).
 *
 * Encodes the acceptance oracle for the store layer:
 *   - `addHypothesisAction(hubId, text, assignee?, dueDate?)` → appends ActionItem to
 *     `hypothesis.actions[]`; returns null for unknown hubId.
 *   - `updateHypothesisAction(hubId, actionId, patch)` → merges patch onto the matched item.
 *   - `completeHypothesisAction(hubId, actionId)` → sets `completedAt` (soft-complete).
 *   - `toggleHypothesisActionComplete(hubId, actionId)` → toggles completedAt.
 *   - `deleteHypothesisAction(hubId, actionId)` → removes from actions[].
 *   - No side-effects on other state (finding actions, MeasurementPlans untouched).
 *
 * All timestamps use store's own Date.now() calls — tests use toBeGreaterThanOrEqual
 * or check defined/undefined to remain deterministic.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAnalyzeStore, getAnalyzeInitialState } from '../analyzeStore';

beforeEach(() => {
  useAnalyzeStore.setState(getAnalyzeInitialState());
});

// ============================================================================
// addHypothesisAction
// ============================================================================

describe('analyzeStore — addHypothesisAction', () => {
  it('appends an ActionItem to hypothesis.actions with text', () => {
    const hub = useAnalyzeStore.getState().createHub('Worn spindle', 'Night shift data');
    const item = useAnalyzeStore
      .getState()
      .addHypothesisAction(hub.id, '@Jane: validate against night-shift data');
    const updated = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!;
    expect(updated.actions).toHaveLength(1);
    expect(updated.actions![0].text).toBe('@Jane: validate against night-shift data');
    expect(item).not.toBeNull();
    expect(item!.text).toBe('@Jane: validate against night-shift data');
  });

  it('appends with optional assignee', () => {
    const hub = useAnalyzeStore.getState().createHub('Coolant drift', '');
    useAnalyzeStore.getState().addHypothesisAction(hub.id, 'Validate temp', {
      upn: 'jane@contoso.com',
      displayName: 'Jane Analyst',
    });
    const updated = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!;
    expect(updated.actions![0].assignee?.displayName).toBe('Jane Analyst');
    expect(updated.actions![0].assignee?.upn).toBe('jane@contoso.com');
  });

  it('appends with optional dueDate', () => {
    const hub = useAnalyzeStore.getState().createHub('Spindle wear', '');
    useAnalyzeStore.getState().addHypothesisAction(hub.id, 'Run test', undefined, '2026-06-15');
    const updated = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!;
    expect(updated.actions![0].dueDate).toBe('2026-06-15');
  });

  it('returns null when hubId is unknown', () => {
    const result = useAnalyzeStore.getState().addHypothesisAction('nonexistent', 'Task');
    expect(result).toBeNull();
  });

  it('accumulates multiple actions in order', () => {
    const hub = useAnalyzeStore.getState().createHub('Mechanism', '');
    useAnalyzeStore.getState().addHypothesisAction(hub.id, 'First task');
    useAnalyzeStore.getState().addHypothesisAction(hub.id, 'Second task');
    const updated = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!;
    expect(updated.actions).toHaveLength(2);
    expect(updated.actions![0].text).toBe('First task');
    expect(updated.actions![1].text).toBe('Second task');
  });

  it('does NOT affect finding actions (no cross-contamination)', () => {
    const ctx = { activeFilters: {}, cumulativeScope: null };
    const finding = useAnalyzeStore.getState().addFinding('Observation', ctx);
    useAnalyzeStore.getState().addFindingAction(finding.id, 'Finding task');
    const hub = useAnalyzeStore.getState().createHub('Mechanism', '');
    useAnalyzeStore.getState().addHypothesisAction(hub.id, 'Hypothesis task');

    const updatedFinding = useAnalyzeStore.getState().findings.find(f => f.id === finding.id)!;
    expect(updatedFinding.actions).toHaveLength(1);
    expect(updatedFinding.actions![0].text).toBe('Finding task');

    const updatedHub = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!;
    expect(updatedHub.actions).toHaveLength(1);
    expect(updatedHub.actions![0].text).toBe('Hypothesis task');
  });
});

// ============================================================================
// updateHypothesisAction
// ============================================================================

describe('analyzeStore — updateHypothesisAction', () => {
  it('merges patch onto the matched action item', () => {
    const hub = useAnalyzeStore.getState().createHub('Test', '');
    useAnalyzeStore.getState().addHypothesisAction(hub.id, 'Original task');
    const actionId = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!.actions![0]
      .id;
    useAnalyzeStore.getState().updateHypothesisAction(hub.id, actionId, { text: 'Updated task' });
    const updated = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!;
    expect(updated.actions![0].text).toBe('Updated task');
    expect(updated.actions![0].id).toBe(actionId);
  });

  it('can re-assign to a new assignee', () => {
    const hub = useAnalyzeStore.getState().createHub('Test', '');
    useAnalyzeStore
      .getState()
      .addHypothesisAction(hub.id, 'Task', { upn: 'alice@contoso.com', displayName: 'Alice' });
    const actionId = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!.actions![0]
      .id;
    useAnalyzeStore.getState().updateHypothesisAction(hub.id, actionId, {
      assignee: { upn: 'bob@contoso.com', displayName: 'Bob' },
    });
    const updated = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!;
    expect(updated.actions![0].assignee?.displayName).toBe('Bob');
  });

  it('leaves non-matching actions unchanged', () => {
    const hub = useAnalyzeStore.getState().createHub('Test', '');
    useAnalyzeStore.getState().addHypothesisAction(hub.id, 'Task A');
    useAnalyzeStore.getState().addHypothesisAction(hub.id, 'Task B');
    const actions = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!.actions!;
    const actionAId = actions[0].id;
    const actionBId = actions[1].id;
    useAnalyzeStore
      .getState()
      .updateHypothesisAction(hub.id, actionAId, { text: 'Task A Updated' });
    const updated = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!;
    expect(updated.actions!.find(a => a.id === actionBId)!.text).toBe('Task B');
  });

  it('is a no-op for unknown hubId', () => {
    const hub = useAnalyzeStore.getState().createHub('Test', '');
    useAnalyzeStore.getState().addHypothesisAction(hub.id, 'Task');
    // Should not throw
    expect(() =>
      useAnalyzeStore.getState().updateHypothesisAction('nonexistent', 'ai-1', { text: 'X' })
    ).not.toThrow();
  });
});

// ============================================================================
// completeHypothesisAction / toggleHypothesisActionComplete
// ============================================================================

describe('analyzeStore — completeHypothesisAction', () => {
  it('sets completedAt on the matched action item', () => {
    const hub = useAnalyzeStore.getState().createHub('Test', '');
    useAnalyzeStore.getState().addHypothesisAction(hub.id, 'Task');
    const actionId = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!.actions![0]
      .id;
    const before = Date.now();
    useAnalyzeStore.getState().completeHypothesisAction(hub.id, actionId);
    const updated = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!;
    expect(updated.actions![0].completedAt).toBeDefined();
    expect(updated.actions![0].completedAt as number).toBeGreaterThanOrEqual(before);
  });
});

describe('analyzeStore — toggleHypothesisActionComplete', () => {
  it('toggles completedAt on → off', () => {
    const hub = useAnalyzeStore.getState().createHub('Test', '');
    useAnalyzeStore.getState().addHypothesisAction(hub.id, 'Task');
    const actionId = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!.actions![0]
      .id;

    // Toggle on
    useAnalyzeStore.getState().toggleHypothesisActionComplete(hub.id, actionId);
    expect(
      useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!.actions![0].completedAt
    ).toBeDefined();

    // Toggle off
    useAnalyzeStore.getState().toggleHypothesisActionComplete(hub.id, actionId);
    expect(
      useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!.actions![0].completedAt
    ).toBeUndefined();
  });
});

// ============================================================================
// deleteHypothesisAction
// ============================================================================

describe('analyzeStore — deleteHypothesisAction', () => {
  it('removes the matched action item from hypothesis.actions', () => {
    const hub = useAnalyzeStore.getState().createHub('Test', '');
    useAnalyzeStore.getState().addHypothesisAction(hub.id, 'To delete');
    const actionId = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!.actions![0]
      .id;
    useAnalyzeStore.getState().deleteHypothesisAction(hub.id, actionId);
    const updated = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!;
    expect(updated.actions).toHaveLength(0);
  });

  it('does not remove other actions when deleting one', () => {
    const hub = useAnalyzeStore.getState().createHub('Test', '');
    useAnalyzeStore.getState().addHypothesisAction(hub.id, 'Keep');
    useAnalyzeStore.getState().addHypothesisAction(hub.id, 'Delete me');
    const actions = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!.actions!;
    const deleteId = actions[1].id;
    useAnalyzeStore.getState().deleteHypothesisAction(hub.id, deleteId);
    const updated = useAnalyzeStore.getState().hypotheses.find(h => h.id === hub.id)!;
    expect(updated.actions).toHaveLength(1);
    expect(updated.actions![0].text).toBe('Keep');
  });
});
