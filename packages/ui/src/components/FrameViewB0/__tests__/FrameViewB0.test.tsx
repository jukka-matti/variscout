/**
 * Tests for FrameViewB0 — FRAME b0 lightweight render composition.
 *
 * Critical test rule (per .claude/rules/testing.md): vi.mock() BEFORE
 * component imports. This file uses no mocks — English i18n is statically
 * bundled in @variscout/core.
 */

import type { ComponentProps } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ColumnAnalysis } from '@variscout/core';
import { FrameViewB0, type FrameViewB0YCandidate } from '../FrameViewB0';
import type { XCandidate } from '../../XPickerSection';

function numericColumn(name: string, overrides: Partial<ColumnAnalysis> = {}): ColumnAnalysis {
  return {
    name,
    type: overrides.type ?? 'numeric',
    uniqueCount: overrides.uniqueCount ?? 100,
    hasVariation: overrides.hasVariation ?? true,
    missingCount: overrides.missingCount ?? 0,
    sampleValues: overrides.sampleValues ?? ['1', '2', '3'],
  };
}

function yCandidate(name: string, values: number[] = [1, 2, 3]): FrameViewB0YCandidate {
  return { column: numericColumn(name), numericValues: values };
}

function xCandidate(name: string, values: number[] = [1, 2, 3]): XCandidate {
  return { column: numericColumn(name), numericValues: values };
}

const defaultYCandidates: FrameViewB0YCandidate[] = [
  yCandidate('Down_Content_%', [22.4, 21.9, 23.1, 22.7]),
  yCandidate('Process_Yield', [0.95, 0.97, 0.96]),
];

const defaultXCandidates: XCandidate[] = [
  xCandidate('Machine_Speed', [120, 122, 119]),
  xCandidate('Operator_Tenure', [3, 5, 8, 11]),
];

function renderB0(overrides: Partial<ComponentProps<typeof FrameViewB0>> = {}) {
  const defaults: ComponentProps<typeof FrameViewB0> = {
    yCandidates: defaultYCandidates,
    selectedY: null,
    onSelectY: vi.fn(),
    xCandidates: defaultXCandidates,
    selectedXs: [],
    onToggleX: vi.fn(),
    onConfirmYSpec: vi.fn(),
    onSeeData: vi.fn(),
    children: <div data-testid="canvas-stub">canvas</div>,
  };
  return render(<FrameViewB0 {...defaults} {...overrides} />);
}

describe('FrameViewB0', () => {
  it('renders YPickerSection at the top', () => {
    renderB0();
    expect(screen.getByTestId('y-picker-section')).toBeInTheDocument();
  });

  it('does not render XPickerSection when no Y is selected', () => {
    renderB0({ selectedY: null });
    expect(screen.queryByTestId('x-picker-section')).toBeNull();
  });

  it('renders XPickerSection only after a Y is selected', () => {
    renderB0({ selectedY: 'Down_Content_%' });
    expect(screen.getByTestId('x-picker-section')).toBeInTheDocument();
  });

  it('opens InlineSpecEditor when + add spec is clicked on the Y picker', () => {
    renderB0({ selectedY: 'Down_Content_%' });
    // Editor not visible by default
    expect(screen.queryByTestId('inline-spec-editor')).toBeNull();
    // Click the Y picker's + add spec
    fireEvent.click(screen.getByTestId('y-picker-add-spec'));
    expect(screen.getByTestId('inline-spec-editor')).toBeInTheDocument();
    // Anchor wrapper is also present
    expect(screen.getByTestId('frame-view-b0-spec-editor-anchor')).toBeInTheDocument();
  });

  it('does not open InlineSpecEditor when no Y is selected (no Y picker selected row → no add-spec button)', () => {
    renderB0({ selectedY: null });
    // The y-picker-add-spec button only renders inside the selected row,
    // which only appears when selectedY is set. So it should not exist.
    expect(screen.queryByTestId('y-picker-add-spec')).toBeNull();
    expect(screen.queryByTestId('inline-spec-editor')).toBeNull();
  });

  it('closes InlineSpecEditor on Save and fires onConfirmYSpec', () => {
    const onConfirmYSpec = vi.fn();
    renderB0({ selectedY: 'Down_Content_%', onConfirmYSpec });
    fireEvent.click(screen.getByTestId('y-picker-add-spec'));
    expect(screen.getByTestId('inline-spec-editor')).toBeInTheDocument();
    // Set USL > LSL so the form is valid
    fireEvent.change(screen.getByTestId('inline-spec-editor-usl'), { target: { value: '30' } });
    fireEvent.change(screen.getByTestId('inline-spec-editor-lsl'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('inline-spec-editor-save'));
    expect(onConfirmYSpec).toHaveBeenCalledTimes(1);
    const args = onConfirmYSpec.mock.calls[0][0];
    expect(args.usl).toBe(30);
    expect(args.lsl).toBe(10);
    // Editor closed
    expect(screen.queryByTestId('inline-spec-editor')).toBeNull();
  });

  it('closes InlineSpecEditor on Cancel without firing onConfirmYSpec', () => {
    const onConfirmYSpec = vi.fn();
    renderB0({ selectedY: 'Down_Content_%', onConfirmYSpec });
    fireEvent.click(screen.getByTestId('y-picker-add-spec'));
    expect(screen.getByTestId('inline-spec-editor')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('inline-spec-editor-cancel'));
    expect(screen.queryByTestId('inline-spec-editor')).toBeNull();
    expect(onConfirmYSpec).not.toHaveBeenCalled();
  });

  it('renders ProcessStepsExpander collapsed by default', () => {
    renderB0();
    const expander = screen.getByTestId('process-steps-expander');
    expect(expander).toBeInTheDocument();
    // Panel is not present when collapsed
    expect(screen.queryByTestId('process-steps-expander-panel')).toBeNull();
    // Children (canvas) only renders inside the panel, so they're hidden too
    expect(screen.queryByTestId('canvas-stub')).toBeNull();
  });

  it('renders the canvas inside the expander panel after the user opens it', () => {
    renderB0();
    fireEvent.click(screen.getByTestId('process-steps-expander-header'));
    expect(screen.getByTestId('process-steps-expander-panel')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-stub')).toBeInTheDocument();
  });

  it('SeeTheDataCta is disabled when no Y is selected and enabled after Y is selected', () => {
    const { rerender } = renderB0({ selectedY: null });
    const cta = screen.getByTestId('see-the-data-cta');
    expect(cta.getAttribute('data-disabled')).toBe('true');
    expect(cta.getAttribute('disabled')).not.toBeNull();

    // Re-render with Y selected
    rerender(
      <FrameViewB0
        yCandidates={defaultYCandidates}
        selectedY="Down_Content_%"
        onSelectY={vi.fn()}
        xCandidates={defaultXCandidates}
        selectedXs={[]}
        onToggleX={vi.fn()}
        onConfirmYSpec={vi.fn()}
        onSeeData={vi.fn()}
      >
        <div data-testid="canvas-stub">canvas</div>
      </FrameViewB0>
    );
    const ctaAfter = screen.getByTestId('see-the-data-cta');
    expect(ctaAfter.getAttribute('data-disabled')).toBe('false');
    expect(ctaAfter.getAttribute('disabled')).toBeNull();
  });

  it('SeeTheDataCta click fires onSeeData when enabled', () => {
    const onSeeData = vi.fn();
    renderB0({ selectedY: 'Down_Content_%', onSeeData });
    fireEvent.click(screen.getByTestId('see-the-data-cta'));
    expect(onSeeData).toHaveBeenCalledTimes(1);
  });

  it('SeeTheDataCta does not fire onSeeData when disabled (no Y)', () => {
    const onSeeData = vi.fn();
    renderB0({ selectedY: null, onSeeData });
    fireEvent.click(screen.getByTestId('see-the-data-cta'));
    expect(onSeeData).not.toHaveBeenCalled();
  });

  it('passes runOrderColumn through to the X picker', () => {
    renderB0({ selectedY: 'Down_Content_%', runOrderColumn: 'timestamp' });
    const hint = screen.getByTestId('x-picker-run-order-hint');
    expect(hint.textContent).toContain('timestamp');
  });

  it('marks Y picker spec status as "set" when currentYSpec has a finite value', () => {
    renderB0({
      selectedY: 'Down_Content_%',
      currentYSpec: { target: 22.5 },
    });
    const status = screen.getByTestId('y-picker-spec-status').textContent ?? '';
    // The "spec status" text varies between locales but must NOT show the
    // "not set" message when the user has a target. We check for absence.
    expect(status).not.toBe('spec: not set');
  });
});
