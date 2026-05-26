import { describe, expect, it } from 'vitest';
import type { ActionItem, ImprovementIdea } from '@variscout/core/findings';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import type { ControlHandoff, SustainmentRecord } from '@variscout/core';
import { deriveIPActivityEvents } from '../activityEvents';

const hour = 60 * 60 * 1000;
const now = Date.UTC(2026, 4, 15, 12, 0, 0);

function makeIP(overrides: Partial<ImprovementProject> = {}): ImprovementProject {
  return {
    id: 'ip-1',
    hubId: 'hub-1',
    createdAt: now - 72 * hour,
    updatedAt: now - 8 * hour,
    deletedAt: null,
    status: 'active',
    metadata: {
      title: 'Fill Cpk lift',
      investigationId: 'inv-1',
    },
    goal: {
      outcomeGoals: [{ outcomeSpecId: 'outcome-1', baseline: 0.8, target: 1.33 }],
      updatedAt: now - 8 * hour,
    },
    sections: {
      background: { manualNarrative: 'Baseline narrative', updatedAt: now - 7 * hour },
      investigationLineage: {
        hypothesisIds: ['hyp-1', 'hyp-2'],
        updatedAt: now - 6 * hour,
      },
      approach: {
        improvementIdeaIds: ['idea-1'],
        actionItemIds: ['action-1'],
        updatedAt: now - 5 * hour,
      },
      outcomeReference: { sustainmentRecordId: 'sus-1', updatedAt: now - 4 * hour },
    },
    signoff: {
      requestedAt: now - 3 * hour,
      approvedAt: now - 2 * hour,
      approvedBy: { displayName: 'Pat Process', upn: 'pat@example.com' },
    },
    ...overrides,
  };
}

function makeIdea(overrides: Partial<ImprovementIdea> = {}): ImprovementIdea {
  return {
    id: 'idea-1',
    createdAt: now - 12 * hour,
    deletedAt: null,
    text: 'Add visual setup guide',
    selected: true,
    updatedAt: now - 90 * 60 * 1000,
    ...overrides,
  };
}

function makeAction(overrides: Partial<ActionItem> = {}): ActionItem {
  return {
    id: 'action-1',
    createdAt: now - 10 * hour,
    deletedAt: null,
    text: 'Pilot visual guide',
    status: 'in-progress',
    assignedTo: { displayName: 'Mira Lead', upn: 'mira@example.com' },
    updatedAt: now - 45 * 60 * 1000,
    ...overrides,
  };
}

function makeSustainment(overrides: Partial<SustainmentRecord> = {}): SustainmentRecord {
  return {
    id: 'sus-1',
    createdAt: now - 4 * hour,
    deletedAt: null,
    investigationId: 'inv-1',
    hubId: 'hub-1',
    status: 'pending',
    title: 'Fill Cpk lift sustainment',
    improvementProjectId: 'ip-1',
    consecutiveOnTargetTicks: 1,
    hasOverride: false,
    lastEvaluatedSnapshotId: undefined,
    cadence: 'weekly',
    updatedAt: now - 30 * 60 * 1000,
    owner: { displayName: 'Avery Owner', upn: 'avery@example.com' },
    ...overrides,
  };
}

function makeHandoff(overrides: Partial<ControlHandoff> = {}): ControlHandoff {
  return {
    id: 'handoff-1',
    createdAt: now - 2 * hour,
    deletedAt: null,
    investigationId: 'inv-1',
    hubId: 'hub-1',
    status: 'pending',
    surface: 'work-instruction',
    systemName: 'Line guide',
    operationalOwner: { displayName: 'Jordan Ops', upn: 'jordan@example.com' },
    handoffDate: now,
    description: 'Operational handoff',
    retainSustainmentReview: true,
    recordedBy: { displayName: 'Mira Lead', upn: 'mira@example.com' },
    ...overrides,
  };
}

describe('deriveIPActivityEvents', () => {
  it('derives chronological V1 activity events from explicit IP inputs', () => {
    const events = deriveIPActivityEvents({
      ip: makeIP(),
      ideas: [makeIdea()],
      actions: [makeAction()],
      sustainmentRecord: makeSustainment(),
      controlHandoff: makeHandoff(),
      now,
    });

    expect(events.map(event => event.label)).toEqual([
      'Avery Owner updated sustainment Fill Cpk lift sustainment · 30m ago',
      'Mira Lead moved action Pilot visual guide to in progress · 45m ago',
      'System selected idea Add visual setup guide · 1h ago',
      'Mira Lead started handoff Line guide · 2h ago',
      'Pat Process approved signoff · 2h ago',
      'System requested signoff · 3h ago',
      'System updated Outcome reference · 4h ago',
      'System updated Approach · 5h ago',
      'System linked 2 hypotheses · 6h ago',
      'System updated Investigation lineage · 6h ago',
      'System updated Background · 7h ago',
      'System changed goal · 8h ago',
    ]);
  });

  it('filters deleted ideas and actions while keeping output deterministic for a fixed now', () => {
    const events = deriveIPActivityEvents({
      ip: makeIP({ signoff: undefined }),
      ideas: [
        makeIdea({ id: 'idea-deleted', deletedAt: now - hour }),
        makeIdea({ id: 'idea-unselected', selected: false, updatedAt: now - hour }),
      ],
      actions: [
        makeAction({ id: 'action-deleted', deletedAt: now - hour }),
        makeAction({ id: 'action-open', status: 'open', updatedAt: undefined }),
      ],
      now,
    });

    expect(events.some(event => event.kind === 'idea-selected')).toBe(false);
    expect(events.some(event => event.kind === 'action-status')).toBe(false);
    expect(events[0]?.label).toBe('System updated Outcome reference · 4h ago');
  });

  it('does not label unrelated project updates as goal changes without an explicit goal timestamp', () => {
    const events = deriveIPActivityEvents({
      ip: makeIP({
        updatedAt: now - 5 * 60 * 1000,
        goal: { outcomeGoals: [{ outcomeSpecId: 'outcome-1', baseline: 0.8, target: 1.33 }] },
      }),
      now,
    });

    expect(events.some(event => event.kind === 'goal-changed')).toBe(false);
  });
});
