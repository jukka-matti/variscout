/**
 * WallCanvas collaboration SEAM tests (IM-4b).
 *
 * These are NOT injected-prop unit tests of the leaf components — they render
 * the PRODUCTION `WallCanvas` with a hub + members + a full `planningProps` bag
 * and assert the collaboration affordances actually RENDER + DISPATCH through
 * the production seam:
 *
 *   WallCanvas → hubPlanningProps builder → HypothesisCardWithPlans
 *     → HypothesisComments (comment thread)
 *     → ActionItem '+ Add Task' rows
 *     → ImprovementIdeasSection
 *
 * The adversarial review found these features GREEN-but-DEAD: the leaf unit
 * tests passed but `WallCanvas` forwarded 0 of the new callbacks, so nothing
 * rendered on the production path. These tests pin the seam.
 *
 * FindingComments (wrapped by HypothesisComments) pulls `useTranslation` from
 * @variscout/hooks + lucide-react icons. We partial-mock @variscout/hooks so
 * WallCanvas's own real `useCanvasViewportInput` stays intact, and stub lucide
 * (mirrors the FindingComments unit-test setup).
 */

vi.mock('lucide-react', () => ({
  MessageSquare: (props: Record<string, unknown>) => (
    <span data-testid="messagesquare-icon" {...props} />
  ),
  Pencil: (props: Record<string, unknown>) => <span data-testid="pencil-icon" {...props} />,
  Trash2: (props: Record<string, unknown>) => <span data-testid="trash-icon" {...props} />,
  Camera: (props: Record<string, unknown>) => <span data-testid="camera-icon" {...props} />,
  Loader2: (props: Record<string, unknown>) => <span data-testid="loader-icon" {...props} />,
  ImageIcon: (props: Record<string, unknown>) => <span data-testid="image-icon" {...props} />,
  Paperclip: (props: Record<string, unknown>) => <span data-testid="paperclip-icon" {...props} />,
  FileText: (props: Record<string, unknown>) => <span data-testid="filetext-icon" {...props} />,
  X: (props: Record<string, unknown>) => <span data-testid="x-icon" {...props} />,
  Mic: (props: Record<string, unknown>) => <span data-testid="mic-icon" {...props} />,
}));

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key, locale: 'en-US' }),
  };
});

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { WallCanvas, type WallCanvasPlanningProps } from '../WallCanvas';
import { getCanvasViewportInitialState, useCanvasViewportStore } from '@variscout/stores';
import type { Hypothesis, ProcessMap, ActionItem, ImprovementIdea } from '@variscout/core';
import type { ProjectContributor } from '@variscout/core/improvementProject';

const processMap: ProcessMap = {
  version: 1,
  nodes: [{ id: 'n1', name: 'Fill', order: 0 }],
  tributaries: [{ id: 't1', stepId: 'n1', column: 'SHIFT' }],
  ctsColumn: 'FILL',
  createdAt: '2026-05-09T00:00:00.000Z',
  updatedAt: '2026-05-09T00:00:00.000Z',
};

const leadMember: ProjectContributor = {
  id: 'm1',
  userId: 'user-lead',
  displayName: 'Alice Lead',
  createdAt: 1,
  deletedAt: null,
};

const openAction: ActionItem = {
  id: 'ai-1',
  text: 'Validate night-shift data',
  createdAt: 1,
  deletedAt: null,
};

const idea: ImprovementIdea = {
  id: 'idea-1',
  text: 'Reduce coolant flow by 10%',
  createdAt: 1,
  deletedAt: null,
};

const baseHub: Hypothesis = {
  id: 'h1',
  name: 'Nozzle runs hot',
  synthesis: '',
  findingIds: [],
  status: 'proposed',
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
};

/**
 * Build a full planningProps bag with vi.fn() callbacks so each test can assert
 * the production callback fires. `members: []` → open-access so the ACL gate
 * never hides the composer (the gate itself is unit-tested in HypothesisComments).
 */
function makePlanningProps(
  overrides: Partial<WallCanvasPlanningProps> = {}
): WallCanvasPlanningProps {
  return {
    plans: [],
    members: [],
    currentUserId: null,
    onAddPlan: vi.fn(),
    onLinkFinding: vi.fn(),
    onEditPlan: vi.fn(),
    onAddHubComment: vi.fn(),
    onEditHubComment: vi.fn(),
    onDeleteHubComment: vi.fn(),
    onAddHypothesisAction: vi.fn(),
    onCompleteHypothesisAction: vi.fn(),
    ideaImpacts: {},
    onProjectIdea: vi.fn(),
    onAddIdea: vi.fn(),
    onUpdateIdea: vi.fn(),
    onRemoveIdea: vi.fn(),
    onSelectIdea: vi.fn(),
    ...overrides,
  };
}

function renderWall(hub: Hypothesis, planningProps: WallCanvasPlanningProps) {
  return render(
    <WallCanvas
      hubs={[hub]}
      findings={[]}
      processMap={processMap}
      problemCpk={0.78}
      eventsPerWeek={42}
      planningProps={planningProps}
    />
  );
}

beforeEach(() => {
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
});

// ── Comment thread (Task 1) ───────────────────────────────────────────────────

describe('WallCanvas seam — comment thread renders + dispatches through production path', () => {
  it('mounts HypothesisComments on the hub card when onAddHubComment is wired', () => {
    const hub: Hypothesis = {
      ...baseHub,
      comments: [
        {
          id: 'c1',
          text: 'First team note',
          createdAt: 1_000,
          deletedAt: null,
          parentId: 'h1',
          parentKind: 'hypothesis',
        },
      ],
    };
    const { container } = renderWall(hub, makePlanningProps());
    // The comments foreignObject is mounted on the production path…
    expect(container.querySelector('[data-testid="comments-fo-h1"]')).toBeTruthy();
    // …and the thread toggle renders the existing comment count.
    expect(screen.getByText(/1 comment/i)).toBeInTheDocument();
  });

  it('does NOT mount the comment thread when onAddHubComment is omitted', () => {
    const { container } = renderWall(
      { ...baseHub, comments: [] },
      makePlanningProps({ onAddHubComment: undefined })
    );
    expect(container.querySelector('[data-testid="comments-fo-h1"]')).toBeNull();
  });

  it('adding a comment fires onAddHubComment through the production callback', () => {
    const onAddHubComment = vi.fn();
    renderWall({ ...baseHub, comments: [] }, makePlanningProps({ onAddHubComment }));

    // Open the composer (FindingComments empty state → "Add comment" → "+ Add comment").
    fireEvent.click(screen.getByText(/Add comment/i));
    fireEvent.click(screen.getByText('+ Add comment'));
    const textarea = screen.getByLabelText('finding.note');
    fireEvent.change(textarea, { target: { value: 'Night-shift spike' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(onAddHubComment).toHaveBeenCalledWith('h1', 'Night-shift spike', undefined);
  });
});

// ── ActionItem tasks (Task 3) ──────────────────────────────────────────────────

describe('WallCanvas seam — ActionItem "+ Add Task" renders + dispatches', () => {
  it('renders existing action rows on the card via the production path', () => {
    const { container } = renderWall({ ...baseHub, actions: [openAction] }, makePlanningProps());
    const rows = container.querySelectorAll('[data-testid="action-item-row"]');
    expect(rows.length).toBe(1);
    expect(screen.getByText('Validate night-shift data')).toBeInTheDocument();
  });

  it('clicking "+ Add Task" + saving fires onAddHypothesisAction', () => {
    // The card renders via getMessage (core i18n), so labels are the real
    // English strings — not message keys.
    const onAddHypothesisAction = vi.fn();
    renderWall({ ...baseHub, actions: [] }, makePlanningProps({ onAddHypothesisAction }));

    fireEvent.click(screen.getByLabelText('+ Add Task'));
    const input = screen.getByLabelText('Task description');
    fireEvent.change(input, { target: { value: 'Collect 30 samples' } });
    fireEvent.click(screen.getByText('Save'));

    expect(onAddHypothesisAction).toHaveBeenCalledWith('h1', 'Collect 30 samples', undefined);
  });

  it('marking an open task done fires onCompleteHypothesisAction', () => {
    const onCompleteHypothesisAction = vi.fn();
    renderWall(
      { ...baseHub, actions: [openAction] },
      makePlanningProps({ onCompleteHypothesisAction })
    );
    fireEvent.click(screen.getByLabelText('Mark Done'));
    expect(onCompleteHypothesisAction).toHaveBeenCalledWith('h1', 'ai-1');
  });

  it('does NOT render "+ Add Task" when onAddHypothesisAction is omitted', () => {
    renderWall(
      { ...baseHub, actions: [] },
      makePlanningProps({ onAddHypothesisAction: undefined })
    );
    expect(screen.queryByLabelText('+ Add Task')).toBeNull();
  });
});

// ── ImprovementIdeasSection (Task 6) ───────────────────────────────────────────

describe('WallCanvas seam — ImprovementIdeasSection renders + dispatches', () => {
  it('mounts the ideas section on the card when the hub has ideas + ideaImpacts is wired', () => {
    const { container } = renderWall({ ...baseHub, ideas: [idea] }, makePlanningProps());
    const fo = container.querySelector('[data-testid="ideas-fo-h1"]');
    expect(fo).toBeTruthy();
    expect(within(fo as HTMLElement).getByText('Reduce coolant flow by 10%')).toBeInTheDocument();
  });

  it('does NOT mount the ideas section when the hub has no ideas', () => {
    const { container } = renderWall({ ...baseHub, ideas: [] }, makePlanningProps());
    expect(container.querySelector('[data-testid="ideas-fo-h1"]')).toBeNull();
  });
});

// ── Data-collection-task header (Task 4 — {primaryFactor} fix) ──────────────────

describe('WallCanvas seam — data-collection task header renders the primaryFactor', () => {
  it('renders "collect <primaryFactor>" (not a blanked placeholder)', () => {
    const { container } = renderWall(
      baseHub,
      makePlanningProps({
        plans: [
          {
            id: 'p1',
            hypothesisId: 'h1',
            outcome: 'Fill Weight',
            primaryFactor: 'Nozzle Temp',
            neededFactors: [],
            method: 'sensor',
            sampleSize: 30,
            owner: 'user-lead',
            status: 'planned',
            scope: [],
            processLocation: '',
            createdAt: 1,
            deletedAt: null,
          },
        ],
        members: [leadMember],
        currentUserId: 'user-lead',
      })
    );
    const section = container.querySelector('[data-testid="data-collection-task"]');
    expect(section).toBeTruthy();
    // The header interpolates the real factor — not 'Assigned: collect ' with a blank.
    expect(section!.textContent).toMatch(/Nozzle Temp/);
  });
});

describe('WallCanvas seam — stalled activity escape actions', () => {
  it('forwards onGoLook from planningProps to the suspected-cause card', () => {
    const onGoLook = vi.fn();
    renderWall(
      {
        ...baseHub,
        status: 'needs-disconfirmation',
        updatedAt: Date.UTC(2026, 5, 1, 12, 0, 0),
      },
      makePlanningProps({ onGoLook } as Partial<WallCanvasPlanningProps>)
    );

    fireEvent.click(screen.getByRole('button', { name: /Go look/i }));
    expect(onGoLook).toHaveBeenCalledWith(baseHub.id);
  });
});
