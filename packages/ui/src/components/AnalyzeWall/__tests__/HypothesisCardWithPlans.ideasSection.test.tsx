/**
 * Task 6 — Re-mount the 3 detached IM-1 flows (RED tests).
 *
 * Acceptance oracle:
 *   1. ImprovementIdeasSection mounted on HypothesisCardWithPlans, keyed by
 *      hypothesisId — renders when hub.ideas is non-empty; shows "Improvement Ideas"
 *      toggle; shows each idea's text; passes ideaImpacts down (impact badges);
 *      fires onAddIdea / onProjectIdea via the component's own affordances.
 *   2. handleProjectIdea + ideaImpacts wired into HypothesisCardWithPlans via new
 *      props (onProjectIdea: (hypothesisId, ideaId) => void;
 *             ideaImpacts: Record<string, IdeaImpact | undefined>).
 *   3. createHubFromFinding CTA: WallCanvas / FindingChip exposes
 *      onProposeHypothesis?: (findingId: string) => void and fires it on the
 *      "Propose hypothesis" gesture on an unattached finding chip.
 *
 * These tests FAIL today because:
 *   - HypothesisCardWithPlans does not render ImprovementIdeasSection (neither
 *     imported nor mounted).
 *   - HypothesisCardWithPlans does not accept ideaImpacts / onProjectIdea /
 *     onAddIdea / onUpdateIdea / onSelectIdea / onRemoveIdea props.
 *   - FindingChip / WallCanvas does not accept onProposeHypothesis prop.
 *
 * EXISTING tests are READ-ONLY — no existing test is modified here.
 * This file is additive only.
 *
 * Patterns followed:
 *   - vi.mock BEFORE component imports (project convention)
 *   - Fixtures with deterministic timestamps (no Date.now / Math.random)
 *   - renderInSvg() wrapper (mirrors existing HypothesisCardWithPlans tests)
 *   - Store resets not needed here (no Zustand store reads in these surfaces)
 */

// vi.mock MUST come before component imports.
vi.mock('@variscout/stores', () => ({
  useAnalyzeStore: Object.assign(vi.fn(), {
    getState: () => ({
      addFinding: vi.fn(() => ({ id: 'f-test' })),
      connectFindingToHub: vi.fn(),
    }),
  }),
  usePreferencesStore: Object.assign(vi.fn(), {
    getState: () => ({ timeLens: { mode: 'rolling', windowSize: 50 } }),
  }),
}));

vi.mock('@variscout/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    locale: 'en-US',
    formatStat: (n: number, d?: number) => n.toFixed(d ?? 0),
  }),
}));

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HypothesisCardWithPlans } from '../HypothesisCardWithPlans';
import { FindingChip } from '../FindingChip';
import type { Hypothesis, Finding, ImprovementIdea, IdeaImpact } from '@variscout/core';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';
import type { ProjectMember } from '@variscout/core/projectMembership';
import { DEFAULT_TIME_LENS } from '@variscout/core';

// ── Fixtures ───────────────────────────────────────────────────────────────────

const idea1: ImprovementIdea = {
  id: 'idea-1',
  text: 'Reduce coolant flow by 10%',
  selected: false,
  createdAt: 1_748_649_600_000,
  deletedAt: null,
};

const idea2: ImprovementIdea = {
  id: 'idea-2',
  text: 'Switch to night-shift heat trace',
  selected: true,
  createdAt: 1_748_649_601_000,
  deletedAt: null,
};

const hub: Hypothesis = {
  id: 'h1',
  name: 'Nozzle runs hot on night shift',
  synthesis: '',
  findingIds: ['f1'],
  status: 'proposed',
  createdAt: 1_748_649_600_000,
  updatedAt: 1_748_649_600_000,
  deletedAt: null,
  investigationId: 'inv-1',
  ideas: [idea1, idea2],
};

const hubNoIdeas: Hypothesis = {
  ...hub,
  id: 'h2',
  ideas: [],
};

const ideaImpacts: Record<string, IdeaImpact | undefined> = {
  'idea-1': 'high',
  'idea-2': 'medium',
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

const finding: Finding = {
  id: 'f1',
  text: 'Temperature spike at 02:00',
  context: { activeFilters: {}, cumulativeScope: null },
  evidenceType: 'data',
  status: 'observed',
  comments: [],
  statusChangedAt: 1_748_649_600_000,
  investigationId: 'inv-1',
  createdAt: 1_748_649_600_000,
  deletedAt: null,
  source: {
    chart: 'ichart',
    anchorX: 0,
    anchorY: 0,
    timeLens: DEFAULT_TIME_LENS,
  },
};

const emptyPlans: MeasurementPlan[] = [];

function renderInSvg(ui: React.ReactElement) {
  return render(<svg>{ui}</svg>);
}

// Shared minimal props for HypothesisCardWithPlans (all required fields):
function makeCardProps(
  overrides: Partial<React.ComponentProps<typeof HypothesisCardWithPlans>> = {}
): React.ComponentProps<typeof HypothesisCardWithPlans> {
  return {
    hub,
    displayStatus: 'proposed',
    x: 0,
    y: 0,
    plans: emptyPlans,
    members: [leadMember],
    currentUserId: 'user-lead',
    findings: [finding],
    onAddPlan: vi.fn(),
    onLinkFinding: vi.fn(),
    onEditPlan: vi.fn(),
    ...overrides,
  };
}

// ── Flow 1: ImprovementIdeasSection mounted (keyed by hypothesisId) ─────────────

describe('HypothesisCardWithPlans — ImprovementIdeasSection (Flow 1, IM-1 re-mount)', () => {
  it('renders the Improvement Ideas section when hub has ideas', () => {
    renderInSvg(<HypothesisCardWithPlans {...makeCardProps()} ideaImpacts={ideaImpacts} />);
    // ImprovementIdeasSection renders with data-testid keyed by hypothesisId
    expect(screen.getByTestId(`ideas-section-${hub.id}`)).toBeInTheDocument();
  });

  it('does NOT render the ImprovementIdeasSection when hub has no ideas', () => {
    renderInSvg(
      <HypothesisCardWithPlans {...makeCardProps({ hub: hubNoIdeas })} ideaImpacts={{}} />
    );
    expect(screen.queryByTestId(`ideas-section-${hubNoIdeas.id}`)).toBeNull();
  });

  it('section is keyed by hypothesisId (data-testid="ideas-section-<hypothesisId>")', () => {
    renderInSvg(<HypothesisCardWithPlans {...makeCardProps()} ideaImpacts={ideaImpacts} />);
    // The testid must contain the hub's actual id, not a generic placeholder
    expect(screen.getByTestId('ideas-section-h1')).toBeInTheDocument();
  });

  it('renders idea text for each idea in hub.ideas', () => {
    renderInSvg(<HypothesisCardWithPlans {...makeCardProps()} ideaImpacts={ideaImpacts} />);
    // Expand the section to make ideas visible (ImprovementIdeasSection starts open when ideas.length > 0)
    expect(screen.getByText('Reduce coolant flow by 10%')).toBeInTheDocument();
    expect(screen.getByText('Switch to night-shift heat trace')).toBeInTheDocument();
  });

  it('passes ideaImpacts down — renders impact badge for idea-1 (high)', () => {
    renderInSvg(<HypothesisCardWithPlans {...makeCardProps()} ideaImpacts={ideaImpacts} />);
    // ImprovementIdeasSection renders impact badges via data-testid="idea-impact-<ideaId>"
    expect(screen.getByTestId('idea-impact-idea-1')).toBeInTheDocument();
    expect(screen.getByTestId('idea-impact-idea-1').textContent).toMatch(/high/i);
  });

  it('passes ideaImpacts down — renders impact badge for idea-2 (medium)', () => {
    renderInSvg(<HypothesisCardWithPlans {...makeCardProps()} ideaImpacts={ideaImpacts} />);
    expect(screen.getByTestId('idea-impact-idea-2')).toBeInTheDocument();
    expect(screen.getByTestId('idea-impact-idea-2').textContent).toMatch(/medium/i);
  });

  it('shows Add idea input when onAddIdea is wired', () => {
    renderInSvg(
      <HypothesisCardWithPlans {...makeCardProps()} ideaImpacts={ideaImpacts} onAddIdea={vi.fn()} />
    );
    // ImprovementIdeasSection renders data-testid="add-idea-input-<hypothesisId>"
    expect(screen.getByTestId('add-idea-input-h1')).toBeInTheDocument();
  });

  it('does NOT show Add idea input when onAddIdea is omitted', () => {
    // Without onAddIdea, the input is hidden (ImprovementIdeasSection guard)
    renderInSvg(
      <HypothesisCardWithPlans
        {...makeCardProps()}
        ideaImpacts={ideaImpacts}
        // onAddIdea intentionally omitted
      />
    );
    expect(screen.queryByTestId('add-idea-input-h1')).toBeNull();
  });
});

// ── ACL gate: ideas section is read-only for non-editors ───────────────────────
//
// The Wall is per-project. A viewer who is NOT in the member roster (i.e.
// canAccess(..., 'edit-contributions') === false) must see existing ideas but
// get no data-mutating affordance — mirrors the read-for-all / write-for-editors
// pattern used by HypothesisComments and the plans/tasks zone.

describe('HypothesisCardWithPlans — ImprovementIdeasSection ACL gate (non-member viewer)', () => {
  // members populated AND current user not among them => canEdit === false
  const viewerProps = () =>
    makeCardProps({ members: [leadMember], currentUserId: 'user-stranger' });

  it('still renders existing ideas + impact badges for a non-member viewer (read view preserved)', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        {...viewerProps()}
        ideaImpacts={ideaImpacts}
        onAddIdea={vi.fn()}
        onProjectIdea={vi.fn()}
        onRemoveIdea={vi.fn()}
      />
    );
    expect(screen.getByText('Reduce coolant flow by 10%')).toBeInTheDocument();
    expect(screen.getByText('Switch to night-shift heat trace')).toBeInTheDocument();
    expect(screen.getByTestId('idea-impact-idea-1')).toBeInTheDocument();
  });

  it('hides the Add idea input even when onAddIdea is wired', () => {
    renderInSvg(
      <HypothesisCardWithPlans {...viewerProps()} ideaImpacts={ideaImpacts} onAddIdea={vi.fn()} />
    );
    expect(screen.queryByTestId('add-idea-input-h1')).toBeNull();
  });

  it('hides the Project button even when onProjectIdea is wired', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        {...viewerProps()}
        ideaImpacts={ideaImpacts}
        onProjectIdea={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /project idea with what-if/i })).toBeNull();
  });

  it('hides the Remove button and renders the select toggle as a non-interactive indicator', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        {...viewerProps()}
        ideaImpacts={ideaImpacts}
        onRemoveIdea={vi.fn()}
        onSelectIdea={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /remove idea/i })).toBeNull();
    // The select toggle is a static <span> (not a button) for viewers.
    expect(screen.queryByRole('button', { name: /select idea|deselect idea/i })).toBeNull();
    // idea-2 is selected — its static indicator is still shown.
    expect(screen.getByLabelText('Selected idea')).toBeInTheDocument();
  });
});

// ── Flow 2: handleProjectIdea / onProjectIdea wired ───────────────────────────

describe('HypothesisCardWithPlans — onProjectIdea wiring (Flow 2, IM-1 re-mount)', () => {
  it('fires onProjectIdea(hypothesisId, ideaId) when the Project button is clicked', () => {
    const onProjectIdea = vi.fn();
    renderInSvg(
      <HypothesisCardWithPlans
        {...makeCardProps()}
        ideaImpacts={ideaImpacts}
        onProjectIdea={onProjectIdea}
      />
    );
    // ImprovementIdeasSection renders aria-label="Project idea with What-If simulator"
    const projectBtns = screen.getAllByRole('button', { name: /project idea with what-if/i });
    expect(projectBtns.length).toBeGreaterThan(0);
    fireEvent.click(projectBtns[0]);
    // First call: hypothesisId='h1', ideaId='idea-1' (first idea)
    expect(onProjectIdea).toHaveBeenCalledWith('h1', 'idea-1');
  });

  it('passes hypothesisId and ideaId correctly for the second idea', () => {
    const onProjectIdea = vi.fn();
    renderInSvg(
      <HypothesisCardWithPlans
        {...makeCardProps()}
        ideaImpacts={ideaImpacts}
        onProjectIdea={onProjectIdea}
      />
    );
    const projectBtns = screen.getAllByRole('button', { name: /project idea with what-if/i });
    // Second button corresponds to idea-2
    fireEvent.click(projectBtns[1]);
    expect(onProjectIdea).toHaveBeenCalledWith('h1', 'idea-2');
  });

  it('does NOT render Project button when onProjectIdea is omitted', () => {
    renderInSvg(
      <HypothesisCardWithPlans
        {...makeCardProps()}
        ideaImpacts={ideaImpacts}
        // onProjectIdea intentionally omitted
      />
    );
    expect(screen.queryByRole('button', { name: /project idea with what-if/i })).toBeNull();
  });
});

// ── Flow 3: createHubFromFinding — WIRED in IM-4c ─────────────────────────────
//
// The propose-hypothesis-from-finding CTA (onProposeHypothesis +
// createHubFromFinding) is now wired. FindingChip renders a "Propose hypothesis"
// affordance ONLY when `onProposeHypothesis` is provided (orphan chips); it stays
// absent on hub-linked chips that omit it. The render-through (a NEW hub card
// appears on the Wall) is proven by WallCanvas.proposeHypothesis.seam.test.tsx.

describe('FindingChip — propose-hypothesis affordance (IM-4c, wired)', () => {
  it('renders the "Propose hypothesis" affordance when onProposeHypothesis is wired', () => {
    render(
      <svg>
        <FindingChip finding={finding} x={0} y={0} onProposeHypothesis={vi.fn()} />
      </svg>
    );
    expect(
      screen.getByRole('button', { name: /propose suspected mechanism/i })
    ).toBeInTheDocument();
  });

  it('does NOT render the affordance when onProposeHypothesis is omitted', () => {
    render(
      <svg>
        <FindingChip finding={finding} x={0} y={0} />
      </svg>
    );
    expect(screen.queryByRole('button', { name: /propose suspected mechanism/i })).toBeNull();
  });

  it('fires onProposeHypothesis with the findingId when the affordance is clicked', () => {
    const onProposeHypothesis = vi.fn();
    render(
      <svg>
        <FindingChip finding={finding} x={0} y={0} onProposeHypothesis={onProposeHypothesis} />
      </svg>
    );
    fireEvent.click(screen.getByRole('button', { name: /propose suspected mechanism/i }));
    expect(onProposeHypothesis).toHaveBeenCalledWith('f1');
  });

  it('still fires onSelect on chip click (unchanged behaviour)', () => {
    const onSelect = vi.fn();
    render(
      <svg>
        <FindingChip finding={finding} x={0} y={0} onSelect={onSelect} />
      </svg>
    );
    fireEvent.click(screen.getByRole('button', { name: /finding/i }));
    expect(onSelect).toHaveBeenCalledWith('f1');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

// ── Regression guard: existing ImprovementIdeasSection prop interface ───────────

describe('ImprovementIdeasSection — direct mount (component API shape guard)', () => {
  // Import directly so we can test the component in isolation.
  // The tests above verify it mounts INSIDE HypothesisCardWithPlans.
  // This guard verifies the stand-alone component renders correctly with
  // the props that HypothesisCardWithPlans will pass.
  it('renders section container with data-testid keyed by hypothesisId', async () => {
    const { default: ImprovementIdeasSection } =
      await import('../../FindingsLog/ImprovementIdeasSection');
    render(
      <ImprovementIdeasSection
        hypothesisId="h-standalone"
        ideas={[idea1]}
        hypothesisText="Standalone hub"
      />
    );
    expect(screen.getByTestId('ideas-section-h-standalone')).toBeInTheDocument();
  });

  it('renders idea text when ideas are provided', async () => {
    const { default: ImprovementIdeasSection } =
      await import('../../FindingsLog/ImprovementIdeasSection');
    render(
      <ImprovementIdeasSection
        hypothesisId="h-standalone"
        ideas={[idea1, idea2]}
        hypothesisText="Standalone hub"
      />
    );
    expect(screen.getByText('Reduce coolant flow by 10%')).toBeInTheDocument();
    expect(screen.getByText('Switch to night-shift heat trace')).toBeInTheDocument();
  });

  it('renders impact badge when ideaImpacts is provided', async () => {
    const { default: ImprovementIdeasSection } =
      await import('../../FindingsLog/ImprovementIdeasSection');
    render(
      <ImprovementIdeasSection
        hypothesisId="h-standalone"
        ideas={[idea1]}
        ideaImpacts={{ 'idea-1': 'high' }}
        hypothesisText="Standalone hub"
      />
    );
    expect(screen.getByTestId('idea-impact-idea-1')).toBeInTheDocument();
  });
});
