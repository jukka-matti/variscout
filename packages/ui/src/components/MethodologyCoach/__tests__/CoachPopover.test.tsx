import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CoachPopover } from '../CoachPopover';

describe('CoachPopover', () => {
  it('renders coaching text', () => {
    render(
      <CoachPopover phase="scout" coachingText="Look for variation patterns" onClose={vi.fn()} />
    );
    expect(screen.getByText('Look for variation patterns')).toBeDefined();
  });

  it('renders scout hints', () => {
    render(
      <CoachPopover
        phase="scout"
        scoutHints={[
          { text: '5 out-of-control points', type: 'violation' },
          { text: 'Equipment contributes 42%', type: 'contribution' },
        ]}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('5 out-of-control points')).toBeDefined();
    expect(screen.getByText('Equipment contributes 42%')).toBeDefined();
  });

  it('renders drill suggestion', () => {
    render(
      <CoachPopover phase="scout" drillSuggestion="Drill into Equipment factor" onClose={vi.fn()} />
    );
    expect(screen.getByText('Drill into Equipment factor')).toBeDefined();
  });

  it('renders diamond phase map for investigate', () => {
    render(<CoachPopover phase="investigate" investigationPhase="diverging" onClose={vi.fn()} />);
    expect(screen.getByTestId('diamond-phase-map')).toBeDefined();
  });

  it('renders uncovered factors for investigate', () => {
    render(
      <CoachPopover
        phase="investigate"
        uncoveredFactors={[{ factor: 'Material', role: 'input' }]}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Material')).toBeDefined();
    expect(screen.getByText('input')).toBeDefined();
  });

  it('renders PDCA progress for improve phase', () => {
    render(
      <CoachPopover
        phase="improve"
        findings={[
          {
            id: 'f-1',
            text: 'Test',
            createdAt: 1000,
            context: { activeFilters: {}, cumulativeScope: null },
            status: 'improving' as const,
            comments: [],
            statusChangedAt: 1000,
            actions: [{ id: 'a-1', text: 'Fix', createdAt: 2000 }],
          },
        ]}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByTestId('pdca-progress')).toBeDefined();
  });

  it('shows convergence nudge when phase=improve and investigationPhase=converging', () => {
    render(
      <CoachPopover
        phase="improve"
        investigationPhase="converging"
        findings={[]}
        onClose={vi.fn()}
      />
    );
    // The convergence nudge text (from i18n key improve.convergenceNudge)
    expect(screen.getByText(/converging/i)).toBeDefined();
  });

  it('does not show convergence nudge when investigationPhase is not converging', () => {
    render(
      <CoachPopover
        phase="improve"
        investigationPhase="diverging"
        findings={[]}
        onClose={vi.fn()}
      />
    );
    const nudge = screen.queryByText(/converging/i);
    expect(nudge).toBeNull();
  });
});
