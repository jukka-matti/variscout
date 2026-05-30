/**
 * Task 4 — HypothesisCardWithPlans: Plan-owner data-collection task surface (RED tests).
 *
 * Encodes the acceptance oracle:
 *   - The card shows MeasurementPlan.owner + status as the data-collection task,
 *     distinct from Task 3's ActionItems.
 *   - Owner name is resolved from the member roster and surfaced with a
 *     "Assigned: collect {primaryFactor}" label.
 *   - Status (planned / in-progress / complete / skipped) is shown as a labeled badge.
 *   - Optional dueDate, when present, is displayed next to the badge.
 *   - The section uses data-testid="data-collection-task" to be distinct from
 *     data-testid="action-item-row" (Task 3) and data-testid="chip-body" (compact chip).
 *   - The section is visible regardless of canEdit (it is a read-display, not write gate).
 *   - No data-collection-task section is rendered when plans is empty.
 *   - When multiple plans exist each gets its own data-collection-task section.
 *
 * These tests FAIL today because:
 *   1. data-testid="data-collection-task" does not exist in the rendered DOM.
 *   2. No "Assigned: collect" label is rendered anywhere.
 *   3. MeasurementPlan has no dueDate field — the implementer adds it.
 *   4. Status is only shown as an icon in the compact chip; no labeled badge in
 *      a dedicated "data-collection-task" section.
 *
 * Existing tests read and preserved (DO NOT MODIFY):
 *   - HypothesisCardWithPlans.test.tsx — plan rows, ACL gate, AddPlanForm, picker
 *   - HypothesisCardWithPlans.actionItems.test.tsx — Task 3 ActionItem rows
 *   - MeasurementPlanChip.test.tsx — compact chip unit coverage
 */

// vi.mock MUST precede component imports per project convention.
vi.mock('@variscout/stores', () => ({
  useAnalyzeStore: Object.assign(vi.fn(), {
    getState: () => ({ addFinding: vi.fn(() => ({ id: 'f-test' })), connectFindingToHub: vi.fn() }),
  }),
  usePreferencesStore: Object.assign(vi.fn(), {
    getState: () => ({ timeLens: { mode: 'rolling', windowSize: 50 } }),
  }),
}));

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { HypothesisCardWithPlans } from '../HypothesisCardWithPlans';
import type { Hypothesis } from '@variscout/core';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';
import type { ProjectMember } from '@variscout/core/projectMembership';

// ── fixtures ──────────────────────────────────────────────────────────────────

const hub: Hypothesis = {
  id: 'h1',
  name: 'Nozzle runs hot on night shift',
  synthesis: '',
  findingIds: [],
  status: 'proposed',
  createdAt: 1_748_649_600_000,
  updatedAt: 1_748_649_600_000,
  deletedAt: null,
  investigationId: 'inv-1',
};

const leadMember: ProjectMember = {
  id: 'm1',
  userId: 'user-lead',
  displayName: 'Alice Lead',
  role: 'lead',
  invitedAt: 1_748_649_600_000,
  createdAt: 1_748_649_600_000,
  deletedAt: null,
};

const memberCollector: ProjectMember = {
  id: 'm2',
  userId: 'user-member',
  displayName: 'Bob Collector',
  role: 'member',
  invitedAt: 1_748_649_600_000,
  createdAt: 1_748_649_600_000,
  deletedAt: null,
};

/**
 * Minimal planned MeasurementPlan — no dueDate (that field is net-new for Task 4).
 * The implementer adds dueDate?: string to MeasurementPlan.
 */
const plannedPlan: MeasurementPlan = {
  id: 'mp-1',
  createdAt: 1_748_649_600_000,
  deletedAt: null,
  hypothesisId: 'h1',
  outcome: 'Fill Weight (g)',
  primaryFactor: 'Nozzle temperature',
  neededFactors: [],
  method: 'sensor',
  sampleSize: 30,
  owner: 'm1',
  status: 'planned',
  scope: [],
  processLocation: '',
};

const inProgressPlan: MeasurementPlan = {
  ...plannedPlan,
  id: 'mp-2',
  status: 'in-progress',
  owner: 'm2',
  primaryFactor: 'Coolant flow rate',
  // dueDate is added by the implementer — tested conditionally below
};

const completePlan: MeasurementPlan = {
  ...plannedPlan,
  id: 'mp-3',
  status: 'complete',
  owner: 'm1',
  primaryFactor: 'Vibration amplitude',
};

const skippedPlan: MeasurementPlan = {
  ...plannedPlan,
  id: 'mp-4',
  status: 'skipped',
  owner: 'm2',
  primaryFactor: 'Ambient humidity',
};

/** Plan with a dueDate — the implementer adds this field to MeasurementPlan. */
const planWithDue: MeasurementPlan & { dueDate?: string } = {
  ...plannedPlan,
  id: 'mp-5',
  primaryFactor: 'Spindle RPM',
  dueDate: '2026-06-30',
};

function renderInSvg(ui: React.ReactElement) {
  return render(<svg>{ui}</svg>);
}

/** Shared base props reused across tests. */
function baseProps(
  plans: MeasurementPlan[],
  overrides?: Partial<React.ComponentProps<typeof HypothesisCardWithPlans>>
): React.ComponentProps<typeof HypothesisCardWithPlans> {
  return {
    hub,
    displayStatus: 'proposed',
    x: 0,
    y: 0,
    plans,
    members: [leadMember, memberCollector],
    currentUserId: 'user-lead',
    findings: [],
    onAddPlan: vi.fn(),
    onLinkFinding: vi.fn(),
    onEditPlan: vi.fn(),
    ...overrides,
  };
}

// ── data-collection-task section presence ─────────────────────────────────────

describe('HypothesisCardWithPlans — data-collection task section presence', () => {
  it('renders one data-collection-task section per plan', () => {
    renderInSvg(<HypothesisCardWithPlans {...baseProps([plannedPlan, inProgressPlan])} />);
    const sections = document.querySelectorAll('[data-testid="data-collection-task"]');
    expect(sections.length).toBe(2);
  });

  it('renders no data-collection-task section when plans is empty', () => {
    renderInSvg(<HypothesisCardWithPlans {...baseProps([])} />);
    expect(document.querySelector('[data-testid="data-collection-task"]')).toBeNull();
  });

  it('renders a single section for a single plan', () => {
    renderInSvg(<HypothesisCardWithPlans {...baseProps([plannedPlan])} />);
    const sections = document.querySelectorAll('[data-testid="data-collection-task"]');
    expect(sections.length).toBe(1);
  });
});

// ── "Assigned: collect X" label ──────────────────────────────────────────────

describe('HypothesisCardWithPlans — Assigned: collect {primaryFactor} label', () => {
  it('shows "Assigned: collect {primaryFactor}" for a planned plan', () => {
    renderInSvg(<HypothesisCardWithPlans {...baseProps([plannedPlan])} />);
    // The label should read approximately "Assigned: collect Nozzle temperature"
    // (the exact phrasing is an i18n key — match on the primaryFactor name)
    const section = document.querySelector('[data-testid="data-collection-task"]');
    expect(section).not.toBeNull();
    // The section body must contain the primaryFactor prominently
    expect(section!.textContent).toMatch(/Nozzle temperature/i);
  });

  it('shows an "Assigned" or "collect" heading to label the task surface', () => {
    renderInSvg(<HypothesisCardWithPlans {...baseProps([plannedPlan])} />);
    // The card must render text that signals this is an assignment / collection task,
    // not merely a compact chip. Accept "Assigned", "collect", or an i18n variant.
    // Use a broad matcher; the exact copy is the implementer's choice.
    const section = document.querySelector('[data-testid="data-collection-task"]');
    expect(section!.textContent).toMatch(/assign|collect/i);
  });

  it('uses the correct primaryFactor for each plan when multiple plans exist', () => {
    renderInSvg(<HypothesisCardWithPlans {...baseProps([plannedPlan, inProgressPlan])} />);
    const sections = document.querySelectorAll('[data-testid="data-collection-task"]');
    const texts = Array.from(sections).map(s => s.textContent ?? '');
    expect(texts.some(t => /Nozzle temperature/i.test(t))).toBe(true);
    expect(texts.some(t => /Coolant flow rate/i.test(t))).toBe(true);
  });
});

// ── Owner name surfaced prominently ───────────────────────────────────────────

describe('HypothesisCardWithPlans — owner name in data-collection task section', () => {
  it('shows the resolved owner displayName in the data-collection task section', () => {
    renderInSvg(<HypothesisCardWithPlans {...baseProps([plannedPlan])} />);
    const section = document.querySelector('[data-testid="data-collection-task"]');
    // plannedPlan.owner = 'm1' → 'Alice Lead'
    expect(section!.textContent).toMatch(/Alice Lead/i);
  });

  it('shows collector member (member role) displayName for an in-progress plan', () => {
    renderInSvg(<HypothesisCardWithPlans {...baseProps([inProgressPlan])} />);
    const section = document.querySelector('[data-testid="data-collection-task"]');
    // inProgressPlan.owner = 'm2' → 'Bob Collector'
    expect(section!.textContent).toMatch(/Bob Collector/i);
  });

  it('falls back to "(unknown)" when the owner id is not in members', () => {
    const orphanPlan: MeasurementPlan = { ...plannedPlan, owner: 'nobody' };
    renderInSvg(<HypothesisCardWithPlans {...baseProps([orphanPlan])} />);
    const section = document.querySelector('[data-testid="data-collection-task"]');
    expect(section!.textContent).toMatch(/unknown/i);
  });
});

// ── Status label ─────────────────────────────────────────────────────────────

describe('HypothesisCardWithPlans — status label in data-collection task section', () => {
  it.each([
    ['planned', plannedPlan],
    ['in-progress', inProgressPlan],
    ['complete', completePlan],
    ['skipped', skippedPlan],
  ] as const)('shows status "%s" in the data-collection task section', (status, plan) => {
    renderInSvg(<HypothesisCardWithPlans {...baseProps([plan])} />);
    const section = document.querySelector('[data-testid="data-collection-task"]');
    // The section must expose the status string or a human-readable equivalent.
    // Match on the raw status value OR a label matching it (e.g. "In progress", "Complete").
    expect(section!.textContent).toMatch(new RegExp(status.replace('-', '.?'), 'i'));
  });

  it('exposes the plan status via data-status attribute on the section or a child', () => {
    renderInSvg(<HypothesisCardWithPlans {...baseProps([inProgressPlan])} />);
    const section = document.querySelector('[data-testid="data-collection-task"]');
    // The implementer should expose status for automated tests and screen readers
    // via a data-status attribute (mirrors the action-item-row pattern from Task 3).
    const withStatus =
      section?.querySelector('[data-status]') ??
      (section?.hasAttribute('data-status') ? section : null);
    expect(withStatus).not.toBeNull();
    const statusValue = (withStatus as HTMLElement).getAttribute('data-status');
    expect(statusValue).toBe('in-progress');
  });
});

// ── Due date ─────────────────────────────────────────────────────────────────

describe('HypothesisCardWithPlans — due date in data-collection task section', () => {
  it('displays the dueDate when present on the plan', () => {
    // planWithDue has dueDate '2026-06-30' (field added by the implementer)
    renderInSvg(<HypothesisCardWithPlans {...baseProps([planWithDue as MeasurementPlan])} />);
    const section = document.querySelector('[data-testid="data-collection-task"]');
    // The section should contain some representation of the due date.
    // Accept ISO (2026-06-30), locale-formatted (Jun 30), or "due" label text.
    expect(section!.textContent).toMatch(/2026.06.30|Jun.+30|30.+Jun|due/i);
  });

  it('does not render a due date when dueDate is absent', () => {
    // plannedPlan has no dueDate
    renderInSvg(<HypothesisCardWithPlans {...baseProps([plannedPlan])} />);
    const section = document.querySelector('[data-testid="data-collection-task"]');
    // Should not show a stale date string or a "Due:" label with no value
    expect(section!.textContent).not.toMatch(/Due:\s*$/i);
  });
});

// ── Distinct from Task 3 ActionItems ─────────────────────────────────────────

describe('HypothesisCardWithPlans — data-collection task section is distinct from action-item-row', () => {
  it('data-collection-task and action-item-row coexist independently', () => {
    const hubWithAction: Hypothesis = {
      ...hub,
      actions: [
        {
          id: 'ai-1',
          text: '@Jane: validate against night-shift data',
          createdAt: 1_748_649_600_000,
          deletedAt: null,
        },
      ],
    };
    renderInSvg(<HypothesisCardWithPlans {...baseProps([plannedPlan], { hub: hubWithAction })} />);
    // Both section types are rendered simultaneously
    expect(document.querySelector('[data-testid="data-collection-task"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="action-item-row"]')).not.toBeNull();
  });

  it('data-collection-task section does NOT use data-testid="action-item-row"', () => {
    renderInSvg(<HypothesisCardWithPlans {...baseProps([plannedPlan])} />);
    // Ensure the plan section has its own identity, not reusing the action row testid
    const section = document.querySelector('[data-testid="data-collection-task"]');
    expect(section).not.toBeNull();
    // The data-collection-task section must not itself carry data-testid="action-item-row"
    expect(section!.getAttribute('data-testid')).not.toBe('action-item-row');
    // And there must be no action-item-row elements from a plan (actions = absent)
    expect(document.querySelectorAll('[data-testid="action-item-row"]').length).toBe(0);
  });

  it('data-collection-task section is separate from the compact chip-body row', () => {
    renderInSvg(<HypothesisCardWithPlans {...baseProps([plannedPlan])} />);
    // The compact chip-body (MeasurementPlanChip) may or may not still be rendered,
    // but the data-collection-task section is a separate, prominent element.
    const collectorSection = document.querySelector('[data-testid="data-collection-task"]');
    expect(collectorSection).not.toBeNull();
    // The section itself must not be identified as "chip-body"
    expect(collectorSection!.getAttribute('data-testid')).not.toBe('chip-body');
  });
});

// ── Visibility gating (read-display, not write gate) ─────────────────────────

describe('HypothesisCardWithPlans — data-collection task section visibility (no write gate)', () => {
  it('shows the data-collection-task section even when canEdit is false (non-member)', () => {
    // The data-collection task surface is a READ display — it shows the assigned
    // collector to anyone viewing the card, not gated behind edit-contributions.
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps([plannedPlan], {
          currentUserId: 'user-not-a-member',
          // members is non-empty → canAccess returns false for 'user-not-a-member'
          members: [leadMember, memberCollector],
        })}
      />
    );
    expect(document.querySelector('[data-testid="data-collection-task"]')).not.toBeNull();
  });

  it('shows the data-collection-task section when members is empty (open-access)', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps([plannedPlan], {
          members: [],
          currentUserId: 'any-user',
        })}
      />
    );
    expect(document.querySelector('[data-testid="data-collection-task"]')).not.toBeNull();
  });

  it('shows the data-collection-task section when currentUserId is null', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        {...baseProps([plannedPlan], {
          currentUserId: null,
          members: [leadMember],
        })}
      />
    );
    expect(document.querySelector('[data-testid="data-collection-task"]')).not.toBeNull();
  });
});
