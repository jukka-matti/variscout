import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExploreExitButton } from '../ExploreExitButton';
import type { ExploreExitButtonProps } from '../ExploreExitButton';
import type { OutcomeSpec } from '@variscout/core';
import type { ImprovementProjectFactorControl } from '@variscout/core/improvementProject';
import type { ProcessStepEntry } from '@variscout/core/improvementProject';

// ─── Minimal fixtures (mirrors Task 1 test patterns) ──────────────────────────

function makeOutcome(columnName: string): OutcomeSpec {
  return {
    id: `os-${columnName}`,
    hubId: 'hub-1',
    columnName,
    characteristicType: 'nominalIsBest',
    createdAt: 0,
    deletedAt: null,
  };
}

function makeFactorControl(factor: string): ImprovementProjectFactorControl {
  return { factor, targetCondition: 'any' };
}

function makeStep(id: string, name: string, order: number): ProcessStepEntry {
  return { id, name, order };
}

function emptyProps(): ExploreExitButtonProps {
  return {
    outcomeSpecs: [],
    factorControls: [],
    processSteps: [],
    categoricalValuesByColumn: {},
    onExit: vi.fn(),
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('ExploreExitButton', () => {
  // Case 1: disabled state
  it('shows disabled button and hint when outcomeSpecs is empty', () => {
    render(<ExploreExitButton {...emptyProps()} />);

    const btn = screen.getByRole('button', { name: /exit to explore/i });
    expect(btn).toBeDisabled();
    expect(screen.getByTestId('explore-exit-disabled-hint')).toBeInTheDocument();
    expect(screen.getByText(/Drop a column on Outcome to enable Explore/)).toBeInTheDocument();
    expect(screen.queryByText(/will land on/)).not.toBeInTheDocument();
  });

  // Case 2: enabled with 1 outcome (y-only route)
  it('shows enabled button and preview text for y-only route', () => {
    render(
      <ExploreExitButton {...emptyProps()} outcomeSpecs={[makeOutcome('Yield')]} onExit={vi.fn()} />
    );

    const btn = screen.getByRole('button', { name: /exit to explore/i });
    expect(btn).not.toBeDisabled();
    expect(screen.getByText('will land on I-Chart of Yield')).toBeInTheDocument();
    expect(screen.queryByTestId('explore-exit-disabled-hint')).toBeNull();
  });

  // Case 3: disabled click does NOT fire onExit
  it('does not call onExit when button is disabled and clicked', () => {
    const onExit = vi.fn();
    render(<ExploreExitButton {...emptyProps()} onExit={onExit} />);

    fireEvent.click(screen.getByRole('button', { name: /exit to explore/i }));
    expect(onExit).not.toHaveBeenCalled();
  });

  // Case 4: disabled keyboard Enter does NOT fire onExit
  it('does not call onExit when button is disabled and Enter is pressed', async () => {
    const user = userEvent.setup();
    const onExit = vi.fn();
    render(<ExploreExitButton {...emptyProps()} onExit={onExit} />);

    const btn = screen.getByRole('button', { name: /exit to explore/i });
    btn.focus();
    await user.keyboard('{Enter}');
    expect(onExit).not.toHaveBeenCalled();
  });

  // Case 5: enabled click fires onExit with full landing object
  it('calls onExit with full landing when button is enabled and clicked', () => {
    const onExit = vi.fn();
    render(
      <ExploreExitButton
        {...emptyProps()}
        outcomeSpecs={[makeOutcome('Yield')]}
        factorControls={[makeFactorControl('Vessel')]}
        onExit={onExit}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /exit to explore/i }));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledWith(
      expect.objectContaining({
        isEnabled: true,
        focusedChart: 'boxplot',
        boxplotFactor: 'Vessel',
        previewText: 'will land on I-Chart + Boxplot by Vessel',
        routeKey: 'y-plus-one-factor',
      })
    );
  });

  // Case 6: enabled Enter fires onExit (native button Enter-as-click)
  it('calls onExit when button is enabled and Enter is pressed', async () => {
    const user = userEvent.setup();
    const onExit = vi.fn();
    render(
      <ExploreExitButton
        {...emptyProps()}
        outcomeSpecs={[makeOutcome('Yield')]}
        factorControls={[makeFactorControl('Vessel')]}
        onExit={onExit}
      />
    );

    const btn = screen.getByRole('button', { name: /exit to explore/i });
    btn.focus();
    await user.keyboard('{Enter}');

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledWith(
      expect.objectContaining({
        isEnabled: true,
        focusedChart: 'boxplot',
        boxplotFactor: 'Vessel',
        previewText: 'will land on I-Chart + Boxplot by Vessel',
        routeKey: 'y-plus-one-factor',
      })
    );
  });

  // Case 7: preview text reflects route key — table-driven
  describe.each([
    {
      label: 'y-only',
      outcomeSpecs: [makeOutcome('Yield')],
      factorControls: [] as ImprovementProjectFactorControl[],
      processSteps: [] as ProcessStepEntry[],
      categoricalValuesByColumn: {} as Record<string, (string | null)[]>,
      expectedPreview: 'will land on I-Chart of Yield',
    },
    {
      label: 'y-plus-one-factor',
      outcomeSpecs: [makeOutcome('Yield')],
      factorControls: [makeFactorControl('Vessel')],
      processSteps: [] as ProcessStepEntry[],
      categoricalValuesByColumn: {} as Record<string, (string | null)[]>,
      expectedPreview: 'will land on I-Chart + Boxplot by Vessel',
    },
    {
      label: 'y-plus-multi-factor',
      outcomeSpecs: [makeOutcome('Yield')],
      factorControls: [makeFactorControl('Vessel'), makeFactorControl('Operator')],
      processSteps: [] as ProcessStepEntry[],
      categoricalValuesByColumn: {} as Record<string, (string | null)[]>,
      expectedPreview: 'will land on I-Chart + Boxplot — pick from 2 factors',
    },
    {
      label: 'y-plus-process',
      outcomeSpecs: [makeOutcome('Yield')],
      factorControls: [] as ImprovementProjectFactorControl[],
      processSteps: [makeStep('s1', 'Mix', 0)],
      categoricalValuesByColumn: {} as Record<string, (string | null)[]>,
      expectedPreview: 'will land on Boxplot by Step',
    },
  ])(
    'route $label shows correct preview text',
    ({
      outcomeSpecs,
      factorControls,
      processSteps,
      categoricalValuesByColumn,
      expectedPreview,
    }) => {
      it(`renders preview "${expectedPreview}"`, () => {
        render(
          <ExploreExitButton
            outcomeSpecs={outcomeSpecs}
            factorControls={factorControls}
            processSteps={processSteps}
            categoricalValuesByColumn={categoricalValuesByColumn}
            onExit={vi.fn()}
          />
        );
        expect(screen.getByText(expectedPreview)).toBeInTheDocument();
      });
    }
  );

  // H1 Task 3: cyan pill — disabled state renders pill; enabled state does not
  it('disabled state: cyan pill renders with bg-cyan-50 class and new hint copy', () => {
    render(<ExploreExitButton {...emptyProps()} />);
    const pill = screen.getByTestId('explore-exit-disabled-hint');
    expect(pill).toBeInTheDocument();
    expect(pill.className).toContain('bg-cyan-50');
    expect(pill).toHaveTextContent('Drop a column on Outcome to enable Explore');
  });

  it('enabled state: cyan pill does not render', () => {
    render(
      <ExploreExitButton {...emptyProps()} outcomeSpecs={[makeOutcome('Yield')]} onExit={vi.fn()} />
    );
    expect(screen.queryByTestId('explore-exit-disabled-hint')).toBeNull();
  });

  // Case 8: aria-label always present
  it('has aria-label="Exit to Explore" when disabled', () => {
    render(<ExploreExitButton {...emptyProps()} />);
    expect(screen.getByRole('button', { name: 'Exit to Explore' })).toBeInTheDocument();
  });

  it('has aria-label="Exit to Explore" when enabled', () => {
    render(
      <ExploreExitButton {...emptyProps()} outcomeSpecs={[makeOutcome('Yield')]} onExit={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: 'Exit to Explore' })).toBeInTheDocument();
  });

  // Case 9: transition disabled → enabled (mutually exclusive subtitle lines)
  it('hint disappears and preview appears after transitioning from disabled to enabled', () => {
    const onExit = vi.fn();
    const { rerender } = render(<ExploreExitButton {...emptyProps()} onExit={onExit} />);

    // Initial state: disabled — cyan pill is present
    expect(screen.getByTestId('explore-exit-disabled-hint')).toBeInTheDocument();
    expect(screen.queryByText(/will land on/)).not.toBeInTheDocument();

    // Transition: add an outcome
    rerender(
      <ExploreExitButton
        outcomeSpecs={[makeOutcome('Yield')]}
        factorControls={[]}
        processSteps={[]}
        categoricalValuesByColumn={{}}
        onExit={onExit}
      />
    );

    // Enabled state: preview appears, hint pill disappears
    expect(screen.queryByTestId('explore-exit-disabled-hint')).toBeNull();
    expect(screen.getByText('will land on I-Chart of Yield')).toBeInTheDocument();
  });
});
