import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { AnalysisBrief } from '@variscout/core/findings';
import { ParetoMakeScopeButton, buildIssueStatement } from '../index';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FACTOR = 'defect_type';
const SINGLE_BAR: ReadonlyArray<string> = ['Scratch'];
const MULTI_BARS: ReadonlyArray<string> = ['A', 'B', 'C'];
const NUMERIC_BARS: ReadonlyArray<number> = [1, 2];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ParetoMakeScopeButton', () => {
  // 1. Hidden when selectedBars is empty
  it('renders nothing when selectedBars is empty', () => {
    const { container } = render(
      <ParetoMakeScopeButton factor={FACTOR} selectedBars={[]} onCreateInvestigation={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  // 2. Renders when selectedBars has at least one entry
  it('renders the button when selectedBars has one entry', () => {
    render(
      <ParetoMakeScopeButton
        factor={FACTOR}
        selectedBars={SINGLE_BAR}
        onCreateInvestigation={vi.fn()}
      />
    );
    expect(screen.getByTestId('pareto-make-scope-button')).toBeInTheDocument();
    expect(screen.getByText('Make this the investigation scope')).toBeInTheDocument();
  });

  // 3. Click fires onCreateInvestigation with correct issueStatement
  it('calls onCreateInvestigation with auto-filled issueStatement on click', () => {
    const handler = vi.fn();
    render(
      <ParetoMakeScopeButton
        factor={FACTOR}
        selectedBars={SINGLE_BAR}
        onCreateInvestigation={handler}
      />
    );
    fireEvent.click(screen.getByTestId('pareto-make-scope-button'));
    expect(handler).toHaveBeenCalledOnce();
    const brief = handler.mock.calls[0][0] as AnalysisBrief;
    expect(brief.issueStatement).toBe(`Top Pareto category in ${FACTOR}: Scratch`);
  });

  // 4. Multi-bar issue statement joins with comma+space
  it('formats multi-bar issueStatement correctly', () => {
    const handler = vi.fn();
    render(
      <ParetoMakeScopeButton
        factor={FACTOR}
        selectedBars={MULTI_BARS}
        onCreateInvestigation={handler}
      />
    );
    fireEvent.click(screen.getByTestId('pareto-make-scope-button'));
    const brief = handler.mock.calls[0][0] as AnalysisBrief;
    expect(brief.issueStatement).toBe(`Top Pareto category in ${FACTOR}: A, B, C`);
  });

  // 5. Numeric bars are converted to strings in the issue statement
  it('converts numeric bars to strings in the issueStatement', () => {
    const handler = vi.fn();
    render(
      <ParetoMakeScopeButton
        factor={FACTOR}
        selectedBars={NUMERIC_BARS}
        onCreateInvestigation={handler}
      />
    );
    fireEvent.click(screen.getByTestId('pareto-make-scope-button'));
    const { issueStatement } = handler.mock.calls[0][0] as AnalysisBrief;
    expect(issueStatement).toContain('1, 2');
  });

  // 6. Title attribute for accessibility
  it('has the correct title attribute for accessibility', () => {
    render(
      <ParetoMakeScopeButton
        factor={FACTOR}
        selectedBars={SINGLE_BAR}
        onCreateInvestigation={vi.fn()}
      />
    );
    const button = screen.getByTestId('pareto-make-scope-button');
    expect(button).toHaveAttribute('title', 'Make this the investigation scope');
  });

  // 7. className prop is appended to the button's class list
  it('appends className to the button class list', () => {
    render(
      <ParetoMakeScopeButton
        factor={FACTOR}
        selectedBars={SINGLE_BAR}
        onCreateInvestigation={vi.fn()}
        className="mt-2 extra-class"
      />
    );
    const button = screen.getByTestId('pareto-make-scope-button');
    expect(button.className).toContain('mt-2');
    expect(button.className).toContain('extra-class');
  });

  // ---------------------------------------------------------------------------
  // Unit tests for buildIssueStatement helper (exported for reuse by P4.2+)
  // ---------------------------------------------------------------------------

  describe('buildIssueStatement', () => {
    it('formats a single bar correctly', () => {
      expect(buildIssueStatement('line_speed', ['Fast'])).toBe(
        'Top Pareto category in line_speed: Fast'
      );
    });

    it('formats multiple bars with comma-space separator', () => {
      expect(buildIssueStatement('cause_code', ['C1', 'C2', 'C3'])).toBe(
        'Top Pareto category in cause_code: C1, C2, C3'
      );
    });

    it('converts numbers to strings', () => {
      expect(buildIssueStatement('step', [10, 20])).toBe('Top Pareto category in step: 10, 20');
    });
  });
});
