/**
 * CapabilityMetricToggle — the one surviving analysis "view" axis (ADR-038 /
 * ADR-089 §6.2). IM-6 retires the mode/lens user pickers but keeps Values ⇄
 * Capability as a specs-gated toggle. This test guards that the toggle still
 * flips measurement ↔ capability and stays Cp/Cpk-only (ADR-084 — no Pp/Ppk).
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CapabilityMetricToggle } from '../index';

describe('CapabilityMetricToggle (Values ⇄ Capability survivor — ADR-089 §6.2)', () => {
  it('renders both Measurements and Capability over time options', () => {
    render(<CapabilityMetricToggle metric="measurement" onMetricChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Measurements' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Capability over time' })).toBeTruthy();
  });

  it('flips measurement → capability when Capability over time is clicked', () => {
    const onMetricChange = vi.fn();
    render(<CapabilityMetricToggle metric="measurement" onMetricChange={onMetricChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Capability over time' }));
    expect(onMetricChange).toHaveBeenCalledWith('capability');
  });

  it('flips capability → measurement when Measurements is clicked', () => {
    const onMetricChange = vi.fn();
    render(<CapabilityMetricToggle metric="capability" onMetricChange={onMetricChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Measurements' }));
    expect(onMetricChange).toHaveBeenCalledWith('measurement');
  });

  it('does not flip when disabled (no specs)', () => {
    const onMetricChange = vi.fn();
    render(
      <CapabilityMetricToggle
        metric="measurement"
        onMetricChange={onMetricChange}
        disabledReason="Set specs and choose a subgroup to view capability over time"
      />
    );
    const capabilityButton = screen.getByRole('button', { name: 'Capability over time' });
    expect(capabilityButton).toHaveAttribute(
      'title',
      'Set specs and choose a subgroup to view capability over time'
    );
    expect(capabilityButton).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(capabilityButton);
    expect(onMetricChange).not.toHaveBeenCalled();
  });

  it('is Cp/Cpk-only — never exposes Pp/Ppk (ADR-084)', () => {
    render(<CapabilityMetricToggle metric="capability" onMetricChange={vi.fn()} />);
    // The capability survivor view is per-subgroup Cpk stability, never Pp/Ppk.
    expect(screen.queryByText(/Ppk/i)).toBeNull();
    expect(screen.queryByText(/\bPp\b/)).toBeNull();
  });
});
