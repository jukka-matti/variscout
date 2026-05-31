import { describe, it, expect, vi } from 'vitest';

vi.mock('@variscout/stores', () => ({
  useAnalyzeStore: Object.assign(vi.fn(), {
    getState: () => ({ addFinding: vi.fn(() => ({ id: 'f-test' })), connectFindingToHub: vi.fn() }),
  }),
  usePreferencesStore: Object.assign(vi.fn(), {
    getState: () => ({ timeLens: { mode: 'rolling', windowSize: 50 } }),
  }),
}));

import { render, screen, fireEvent } from '@testing-library/react';
import { HypothesisCard } from '../HypothesisCard';
import { projectMechanismBranch, type Finding, type Hypothesis } from '@variscout/core';

const hub: Hypothesis = {
  id: 'h1',
  name: 'Nozzle runs hot on night shift',
  synthesis: '',
  findingIds: ['f1', 'f2', 'f3'],
  status: 'confirmed',
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
  investigationId: 'inv-test',
};

describe('HypothesisCard', () => {
  it('renders hub name and status', () => {
    render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="confirmed" x={0} y={0} />
      </svg>
    );
    expect(screen.getByText(/Nozzle runs hot on night shift/)).toBeInTheDocument();
    // displayStatus 'confirmed' renders the user-facing label "Supported".
    expect(screen.getAllByText(/supported/i).length).toBeGreaterThan(0);
  });

  it('shows supporting clue count from legacy linked findings', () => {
    render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="confirmed" x={0} y={0} />
      </svg>
    );
    expect(screen.getByText(/3 supporting clues/)).toBeInTheDocument();
  });

  it('renders theme tags in the full-card body when present', () => {
    const { container } = render(
      <svg>
        <HypothesisCard
          hub={{ ...hub, themeTags: ['Night Shift', 'Nozzle Temp'] }}
          displayStatus="confirmed"
          x={0}
          y={0}
        />
      </svg>
    );

    expect(container.querySelector('foreignObject')).toBeTruthy();
    expect(screen.getByText('#Night Shift')).toBeInTheDocument();
    expect(screen.getByText('#Nozzle Temp')).toBeInTheDocument();
  });

  it('keeps tagged layout rows vertically separated', () => {
    const { container } = render(
      <svg>
        <HypothesisCard
          hub={{ ...hub, themeTags: ['Night Shift'] }}
          displayStatus="confirmed"
          x={0}
          y={0}
        />
      </svg>
    );

    const tagRow = container.querySelector('foreignObject');
    const readinessText = Array.from(container.querySelectorAll('text')).find(
      text => text.textContent === 'Supported' && text.getAttribute('y') !== '24'
    );
    const clueText = screen.getByText(/3 supporting clues/);

    expect(tagRow).toBeTruthy();
    expect(readinessText).toBeTruthy();
    const tagBottom =
      Number(tagRow?.getAttribute('y') ?? 0) + Number(tagRow?.getAttribute('height') ?? 0);
    const readinessY = Number(readinessText?.getAttribute('y') ?? 0);
    const clueY = Number(clueText.getAttribute('y') ?? 0);

    expect(readinessY - tagBottom).toBeGreaterThanOrEqual(8);
    expect(clueY - readinessY).toBeGreaterThanOrEqual(18);
  });

  it('does not render a theme tag container when no tags are present', () => {
    const { container } = render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="confirmed" x={0} y={0} />
      </svg>
    );

    expect(container.querySelector('[data-testid="hypothesis-theme-tags"]')).toBeNull();
    expect(container.querySelector('foreignObject')).toBeNull();
  });

  it('keeps theme tags hidden at medium and glyph LOD', () => {
    const taggedHub = { ...hub, themeTags: ['Night Shift'] };
    const { rerender } = render(
      <svg>
        <HypothesisCard hub={taggedHub} displayStatus="confirmed" x={0} y={0} zoomScale={0.5} />
      </svg>
    );

    expect(screen.queryByText('#Night Shift')).toBeNull();

    rerender(
      <svg>
        <HypothesisCard hub={taggedHub} displayStatus="confirmed" x={0} y={0} zoomScale={0.2} />
      </svg>
    );

    expect(screen.queryByText('#Night Shift')).toBeNull();
  });

  it('fires onSelect on click', () => {
    const onSelect = vi.fn();
    render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="evidenced" x={0} y={0} onSelect={onSelect} />
      </svg>
    );
    fireEvent.click(screen.getByRole('button', { name: /mechanism branch/i }));
    expect(onSelect).toHaveBeenCalledWith('h1');
  });

  it('renders branch content with suspected mechanism language, clue counts, checks, readiness, and next move', () => {
    const findings: Finding[] = [
      {
        id: 'f1',
        text: 'Night shift has wider spread',
        createdAt: 1,
        deletedAt: null,
        investigationId: 'inv-test',
        context: { activeFilters: {}, cumulativeScope: null },
        evidenceType: 'data',
        status: 'analyzed',
        comments: [],
        statusChangedAt: 1,
        validationStatus: 'supports',
      },
      {
        id: 'f2',
        text: 'Nozzle temperature rises late in the run',
        createdAt: 2,
        deletedAt: null,
        investigationId: 'inv-test',
        context: { activeFilters: {}, cumulativeScope: null },
        evidenceType: 'data',
        status: 'analyzed',
        comments: [],
        statusChangedAt: 2,
        validationStatus: 'supports',
      },
      {
        id: 'f3',
        text: 'Day shift has one similar spread event',
        createdAt: 3,
        deletedAt: null,
        investigationId: 'inv-test',
        context: { activeFilters: {}, cumulativeScope: null },
        evidenceType: 'data',
        status: 'analyzed',
        comments: [],
        statusChangedAt: 3,
        validationStatus: 'contradicts',
      },
    ];
    // "Not-tested" clue represents an inconclusive finding (open check in IM-1).
    const notTestedFinding: Finding = {
      id: 'f-not-tested',
      text: 'Inconclusive check — needs more runs',
      createdAt: 4,
      deletedAt: null,
      investigationId: 'inv-test',
      context: { activeFilters: {}, cumulativeScope: null },
      evidenceType: 'data',
      status: 'analyzed',
      comments: [],
      statusChangedAt: 4,
      validationStatus: 'inconclusive',
    };
    const allFindings = [...findings, notTestedFinding];
    const branch = projectMechanismBranch(
      {
        ...hub,
        status: 'proposed',
        nextMove: 'Run a late-shift temperature check.',
        findingIds: [...hub.findingIds, 'f-not-tested'],
      },
      { findings: allFindings }
    );

    render(
      <svg>
        <HypothesisCard
          hub={{ ...hub, status: 'proposed' }}
          branch={branch}
          displayStatus="evidenced"
          x={0}
          y={0}
        />
      </svg>
    );

    expect(screen.getByText(/Mechanism Branch/i)).toBeInTheDocument();
    expect(screen.getByText(/2 supporting clues/i)).toBeInTheDocument();
    expect(screen.getByText(/1 counter-clue/i)).toBeInTheDocument();
    expect(screen.getByText(/1 open check/i)).toBeInTheDocument();
    expect(screen.getByText(/Needs check/i)).toBeInTheDocument();
    expect(screen.getByText(/Next: Run a late-shift temperature check/i)).toBeInTheDocument();
  });

  it('shows warning badge when hasGap is true', () => {
    render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="confirmed" x={0} y={0} hasGap />
      </svg>
    );
    expect(screen.getByLabelText(/evidence gap/i)).toBeInTheDocument();
  });

  it('renders status-tinted data attribute', () => {
    const { container } = render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="refuted" x={0} y={0} />
      </svg>
    );
    expect(container.querySelector('[data-status="refuted"]')).toBeTruthy();
  });

  it('does not render missing-column badge by default', () => {
    render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="evidenced" x={0} y={0} />
      </svg>
    );
    expect(screen.queryByLabelText(/references missing column/i)).toBeNull();
  });

  it('renders missing-column badge when missingColumn prop is true', () => {
    render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="evidenced" x={0} y={0} missingColumn />
      </svg>
    );
    expect(screen.getByLabelText(/references missing column/i)).toBeInTheDocument();
  });

  it('missing-column badge is distinct from evidence-gap badge', () => {
    render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="evidenced" x={0} y={0} hasGap missingColumn />
      </svg>
    );
    expect(screen.getByLabelText(/evidence gap/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/references missing column/i)).toBeInTheDocument();
  });

  // ── Level-of-detail rendering (Phase 13.1) ────────────────────────────────
  describe('LOD at low zoom', () => {
    it('renders glyph-only when zoomScale < 0.3', () => {
      const { container } = render(
        <svg>
          <HypothesisCard hub={hub} displayStatus="evidenced" x={0} y={0} zoomScale={0.2} />
        </svg>
      );
      // Glyph marker is present...
      expect(container.querySelector('[data-wall-lod="glyph"]')).toBeTruthy();
      // ...but the hub name and clue label are not.
      expect(screen.queryByText(/Nozzle runs hot on night shift/)).toBeNull();
      expect(screen.queryByText(/3 supporting clues/)).toBeNull();
    });

    it('renders glyph + hub name (no findings/chart) when zoomScale < 0.6', () => {
      const { container } = render(
        <svg>
          <HypothesisCard hub={hub} displayStatus="confirmed" x={0} y={0} zoomScale={0.5} />
        </svg>
      );
      expect(container.querySelector('[data-wall-lod="medium"]')).toBeTruthy();
      expect(screen.getByText(/Nozzle runs hot on night shift/)).toBeInTheDocument();
      // Branch detail counts hidden at medium LOD.
      expect(screen.queryByText(/3 supporting clues/)).toBeNull();
    });

    it('renders full card when zoomScale >= 0.6', () => {
      render(
        <svg>
          <HypothesisCard hub={hub} displayStatus="confirmed" x={0} y={0} zoomScale={0.8} />
        </svg>
      );
      expect(screen.getByText(/Nozzle runs hot on night shift/)).toBeInTheDocument();
      expect(screen.getByText(/3 supporting clues/)).toBeInTheDocument();
    });

    it('renders full card when zoomScale is undefined (no LOD)', () => {
      render(
        <svg>
          <HypothesisCard hub={hub} displayStatus="confirmed" x={0} y={0} />
        </svg>
      );
      expect(screen.getByText(/Nozzle runs hot on night shift/)).toBeInTheDocument();
      expect(screen.getByText(/3 supporting clues/)).toBeInTheDocument();
    });
  });

  describe('FE-2b — the OneStepAwayBadge is a clickable affordance', () => {
    it('fires onOneStepAwayAction when the badge is clicked (needs-disconfirmation)', () => {
      const onOneStepAwayAction = vi.fn();
      render(
        <svg>
          <HypothesisCard
            hub={hub}
            displayStatus="needs-disconfirmation"
            x={0}
            y={0}
            onOneStepAwayAction={onOneStepAwayAction}
          />
        </svg>
      );
      fireEvent.click(screen.getByTestId('one-step-away-action'));
      expect(onOneStepAwayAction).toHaveBeenCalledWith('h1');
    });

    it('stays a passive label when onOneStepAwayAction is omitted', () => {
      render(
        <svg>
          <HypothesisCard hub={hub} displayStatus="needs-disconfirmation" x={0} y={0} />
        </svg>
      );
      expect(screen.queryByTestId('one-step-away-action')).toBeNull();
    });
  });
});
