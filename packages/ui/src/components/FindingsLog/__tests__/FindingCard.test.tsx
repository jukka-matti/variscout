/**
 * Tests for the FindingCard window-context footer (multi-level SCOUT V1).
 */
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import FindingCard from '../FindingCard';
import type { Finding } from '@variscout/core';
import { createFinding } from '@variscout/core/findings';

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'f-window-1',
    text: 'Drift suspected on Line 2',
    createdAt: 1714000000000,
    deletedAt: null,
    context: {
      activeFilters: { Machine: ['B'] },
      cumulativeScope: 30,
      stats: { mean: 10, samples: 50 },
    },
    evidenceType: 'data',
    status: 'observed',
    comments: [],
    statusChangedAt: Date.now(),
    ...overrides,
  };
}

const noopHandlers = {
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onRestore: vi.fn(),
};

describe('FindingCard window-context footer', () => {
  it('renders window + stats snapshot when windowContext is present', () => {
    const finding = makeFinding({
      windowContext: {
        windowAtCreation: {
          kind: 'fixed',
          startISO: '2026-04-01T00:00:00.000Z',
          endISO: '2026-04-15T00:00:00.000Z',
        },
        statsAtCreation: { cpk: 0.62, mean: 10.1, sigma: 0.3, n: 200 },
      },
    });

    render(<FindingCard finding={finding} {...noopHandlers} />);

    const footer = screen.getByTestId('finding-window-footer');
    expect(footer).toBeDefined();
    // Captured-window line uses the fixed-window date range
    expect(footer.textContent).toMatch(/Captured:/);
    // Cpk @ creation rendered via formatStat (locale-aware), not toFixed
    expect(footer.textContent).toMatch(/Cpk @ creation/);
    expect(footer.textContent).toMatch(/0\.62/);
    // Sample count
    expect(footer.textContent).toMatch(/n=200/);
  });

  it('does not render footer when windowContext is absent', () => {
    const finding = makeFinding({ windowContext: undefined });

    render(<FindingCard finding={finding} {...noopHandlers} />);

    expect(screen.queryByTestId('finding-window-footer')).toBeNull();
  });
});

describe('FindingCard — PR-CS-6 Edge 1 promote action', () => {
  const analyzedFinding = (actionOverrides: Record<string, unknown> = {}) =>
    makeFinding({
      status: 'analyzed',
      statusChangedAt: Date.now(),
      actions: [
        {
          id: 'a-1',
          text: 'Recalibrate gauge',
          createdAt: 1000,
          deletedAt: null,
          ...actionOverrides,
        },
      ],
    } as Partial<Finding>);

  it('shows the promote button and fires onPromoteAction when not yet promoted', () => {
    const onPromoteAction = vi.fn();
    render(
      <FindingCard
        finding={analyzedFinding()}
        {...noopHandlers}
        onAddAction={vi.fn()}
        onPromoteAction={onPromoteAction}
      />
    );

    const btn = screen.getByTestId('promote-action-btn');
    fireEvent.click(btn);
    expect(onPromoteAction).toHaveBeenCalledWith('f-window-1', 'a-1');
  });

  it('hides the promote button once the action carries parentImprovementProjectId', () => {
    render(
      <FindingCard
        finding={analyzedFinding({ parentImprovementProjectId: 'ip-7' })}
        {...noopHandlers}
        onAddAction={vi.fn()}
        onPromoteAction={vi.fn()}
      />
    );

    expect(screen.queryByTestId('promote-action-btn')).toBeNull();
    expect(screen.getByTestId('action-promoted-marker')).toBeDefined();
  });

  it('does not show the promote button when onPromoteAction is absent (no Workspace Project)', () => {
    render(<FindingCard finding={analyzedFinding()} {...noopHandlers} onAddAction={vi.fn()} />);

    expect(screen.queryByTestId('promote-action-btn')).toBeNull();
  });
});

describe('FindingCard — lineage pin retired (PO-5)', () => {
  it('renders no lineage pin button; sibling card content survives', () => {
    render(<FindingCard finding={makeFinding()} {...noopHandlers} onAssign={vi.fn()} />);
    // The CS-6 finding-pin gesture (lineage membership) is deleted in PO-5.
    expect(screen.queryByTestId('toggle-lineage-btn')).toBeNull();
    // Sibling survival control — the card still renders the finding (its text
    // surfaces in the restore control's accessible name).
    expect(
      screen.getByRole('button', { name: /Restore finding: Drift suspected on Line 2/i })
    ).toBeDefined();
  });
});

describe('FindingCard — PR-CS-6 Edge 4 origin-step breadcrumb', () => {
  it('renders the "from {step}" breadcrumb with the resolved step name', () => {
    render(
      <FindingCard
        finding={makeFinding({ originStepId: 'step-fill-1' })}
        {...noopHandlers}
        originStepName="Filling"
      />
    );

    const crumb = screen.getByTestId('finding-origin-step');
    expect(crumb.textContent).toContain('from Filling');
  });

  it('does not render the breadcrumb when no resolved name is passed (unresolved step)', () => {
    // originStepId present but the app wrapper could not resolve it → no prop.
    render(<FindingCard finding={makeFinding({ originStepId: 'step-gone' })} {...noopHandlers} />);

    expect(screen.queryByTestId('finding-origin-step')).toBeNull();
  });
});

describe('FindingCard — evidence angle', () => {
  it('renders the evidence angle glyph and reclassifies from edit mode', () => {
    const onSetEvidenceType = vi.fn();
    const finding = {
      ...createFinding('Operator observed the jig sticking', {}, null),
      evidenceType: 'gemba' as const,
    };

    render(
      <FindingCard finding={finding} {...noopHandlers} onSetEvidenceType={onSetEvidenceType} />
    );

    expect(screen.getByTestId('finding-evidence-angle')).toHaveTextContent('👁');

    fireEvent.click(screen.getByRole('button', { name: /edit finding note/i }));
    fireEvent.click(screen.getByRole('radio', { name: /expert/i }));

    expect(onSetEvidenceType).toHaveBeenCalledWith(finding.id, 'expert');
  });
});

describe('FindingCard — ER-7 evidence affordances', () => {
  it('renders condition-scoped evidence and support/counts-against actions', () => {
    const onMarkSupport = vi.fn();
    const onMarkCounter = vi.fn();
    const finding = makeFinding({
      context: {
        activeFilters: { Shift: ['Night'] },
        cumulativeScope: 40,
        stats: { mean: 612, samples: 64 },
      },
      windowContext: {
        windowAtCreation: { kind: 'cumulative' },
        statsAtCreation: { n: 160 },
      },
    });

    render(
      <FindingCard
        finding={finding}
        {...noopHandlers}
        onMarkSupport={onMarkSupport}
        onMarkCounter={onMarkCounter}
      />
    );

    expect(screen.getByTestId('finding-condition-evidence')).toHaveTextContent(
      'mean in 612.00 · n=64 of 160'
    );

    fireEvent.click(screen.getByRole('button', { name: /support/i }));
    fireEvent.click(screen.getByRole('button', { name: /counts against/i }));
    expect(onMarkSupport).toHaveBeenCalledWith(finding.id);
    expect(onMarkCounter).toHaveBeenCalledWith(finding.id);
  });
});
