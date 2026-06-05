import { describe, expect, it } from 'vitest';
import { isControlEligible, isControlled } from '../controlReadiness';
import type { ControlHandoff, ControlRecord } from '../control';
import type { ImprovementProject } from '../improvementProject';

// ── Minimal fixtures (mirror the shapes in control.test.ts) ────────────────

function makeProject(
  id: string,
  status: ImprovementProject['status'] = 'active'
): ImprovementProject {
  return {
    id,
    hubId: 'hub-1',
    status,
    metadata: { title: `Project ${id}` },
    goal: { outcomeGoals: [] },
    sections: {
      background: {},
      approach: {},
      outcomeReference: {},
    },
    createdAt: 1_743_465_600_000,
    updatedAt: 1_743_465_600_000,
    deletedAt: null,
  };
}

function makeRecord(
  improvementProjectId: string,
  overrides: Partial<ControlRecord> = {}
): ControlRecord {
  return {
    id: `rec-${improvementProjectId}`,
    title: `Control record for ${improvementProjectId}`,
    investigationId: `inv-${improvementProjectId}`,
    hubId: 'hub-1',
    improvementProjectId,
    cadence: 'monthly',
    status: 'pending',
    consecutiveOnTargetTicks: 0,
    hasOverride: false,
    lastEvaluatedSnapshotId: undefined,
    createdAt: 1_743_465_600_000,
    updatedAt: 1_743_465_600_000,
    deletedAt: null,
    ...overrides,
  };
}

// ControlHandoff carries NO improvementProjectId — it joins to a project
// through a ControlRecord that shares its `investigationId` (the live app
// bridge: Editor.tsx ~:870 + PWA App.tsx ~:1094). The `investigationId`
// here is the bridge key.
function makeHandoff(
  investigationId: string,
  overrides: Partial<ControlHandoff> = {}
): ControlHandoff {
  return {
    id: `h-${investigationId}`,
    investigationId,
    hubId: 'hub-1',
    status: 'operational',
    surface: 'mes-recipe',
    systemName: 'System',
    operationalOwner: { displayName: 'Op' },
    handoffDate: 1_745_625_600_000,
    description: '',
    retainControlReview: true,
    recordedBy: { displayName: 'Op' },
    createdAt: 1_745_625_600_000,
    deletedAt: null,
    ...overrides,
  };
}

describe('isControlEligible', () => {
  it('is true when the project status is closed (no records needed)', () => {
    const project = makeProject('p-1', 'closed');
    expect(isControlEligible(project, [], [])).toBe(true);
  });

  it('is true when a ControlRecord with improvementProjectId === project.id exists (active project)', () => {
    const project = makeProject('p-1', 'active');
    const records = [makeRecord('p-1')];
    expect(isControlEligible(project, records, [])).toBe(true);
  });

  it('is true when a ControlHandoff bridges to the project even though its record is tombstoned (active project)', () => {
    // Handoffs carry no project FK; they join via a record sharing investigationId.
    // A tombstoned record turns OFF the live-record path, but a live handoff that
    // bridges through that record still makes the project control-eligible.
    const project = makeProject('p-1', 'active');
    const tombstonedRecord = [makeRecord('p-1', { deletedAt: 1_745_625_600_000 })];
    const handoffs = [makeHandoff('inv-p-1')]; // shares the record's investigationId
    expect(isControlEligible(project, tombstonedRecord, handoffs)).toBe(true);
  });

  it("NEGATIVE CONTROL: the label-can't-lie test — active project with zero records/handoffs is NOT eligible", () => {
    // Even if a (soon-dead) analyzeStatus said "resolved", with no Control
    // artifacts and a non-closed lifecycle status the project is not eligible.
    const project = makeProject('p-1', 'active');
    expect(isControlEligible(project, [], [])).toBe(false);
  });

  it('distractor: a record + bridging handoff for a DIFFERENT project does not make this project eligible', () => {
    const project = makeProject('p-1', 'active');
    const records = [makeRecord('p-OTHER')];
    const handoffs = [makeHandoff('inv-p-OTHER')];
    expect(isControlEligible(project, records, handoffs)).toBe(false);
  });

  it('treats a tombstoned record (with no bridging handoff) as no artifact → not eligible for an active project', () => {
    const project = makeProject('p-1', 'active');
    const tombstoned = [makeRecord('p-1', { deletedAt: 1_745_625_600_000 })];
    expect(isControlEligible(project, tombstoned, [])).toBe(false);
  });
});

describe('isControlled', () => {
  it('is true only when an active (non-tombstoned) ControlRecord exists for the project', () => {
    const project = makeProject('p-1', 'active');
    const records = [makeRecord('p-1')];
    expect(isControlled(project, records)).toBe(true);
  });

  it('NEGATIVE CONTROL: a tombstoned record does not count as controlled', () => {
    const project = makeProject('p-1', 'active');
    const tombstoned = [makeRecord('p-1', { deletedAt: 1_745_625_600_000 })];
    expect(isControlled(project, tombstoned)).toBe(false);
  });

  it('is false when the only record belongs to a different project', () => {
    const project = makeProject('p-1', 'active');
    const records = [makeRecord('p-OTHER')];
    expect(isControlled(project, records)).toBe(false);
  });

  it('is false when the project has no records — closed status alone does not mean controlled', () => {
    const project = makeProject('p-1', 'closed');
    expect(isControlled(project, [])).toBe(false);
  });
});
