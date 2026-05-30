import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MeasurementPlanChip } from '../MeasurementPlanChip';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';

const basePlan: MeasurementPlan = {
  id: 'mp-1',
  createdAt: 100,
  deletedAt: null,
  hypothesisId: 'h-1',
  outcome: 'Fill Weight',
  primaryFactor: 'spindle vibration',
  neededFactors: [],
  method: 'sensor',
  sampleSize: 30,
  owner: 'pm-alice',
  status: 'planned',
  scope: [],
  processLocation: '',
};

describe('<MeasurementPlanChip />', () => {
  it('renders factor, method, sample size, and owner name', () => {
    render(
      <MeasurementPlanChip
        plan={basePlan}
        ownerName="Alice"
        canEdit
        onEdit={vi.fn()}
        onLinkFinding={vi.fn()}
      />
    );
    expect(screen.getByText(/spindle vibration/i)).toBeInTheDocument();
    expect(screen.getByText(/sensor/i)).toBeInTheDocument();
    expect(screen.getByText(/n=30/i)).toBeInTheDocument();
    expect(screen.getByText(/Alice/i)).toBeInTheDocument();
  });

  it('shows amber status indicator for planned/in-progress', () => {
    const { container } = render(
      <MeasurementPlanChip
        plan={basePlan}
        ownerName="Alice"
        canEdit
        onEdit={vi.fn()}
        onLinkFinding={vi.fn()}
      />
    );
    const indicator = container.querySelector('[data-testid="status-indicator"]');
    expect(indicator?.className).toMatch(/amber/);
  });

  it('shows green check for complete status', () => {
    const { container } = render(
      <MeasurementPlanChip
        plan={{ ...basePlan, status: 'complete' }}
        ownerName="Alice"
        canEdit
        onEdit={vi.fn()}
        onLinkFinding={vi.fn()}
      />
    );
    const indicator = container.querySelector('[data-testid="status-indicator"]');
    expect(indicator?.className).toMatch(/green-700/);
    expect(indicator?.textContent).toMatch(/✓/);
  });

  it('hides Link Finding button when complete', () => {
    render(
      <MeasurementPlanChip
        plan={{ ...basePlan, status: 'complete' }}
        ownerName="Alice"
        canEdit
        onEdit={vi.fn()}
        onLinkFinding={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /link finding/i })).not.toBeInTheDocument();
  });

  it('calls onEdit when chip body is clicked (canEdit=true)', () => {
    const onEdit = vi.fn();
    render(
      <MeasurementPlanChip
        plan={basePlan}
        ownerName="Alice"
        canEdit
        onEdit={onEdit}
        onLinkFinding={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('chip-body'));
    expect(onEdit).toHaveBeenCalledWith('mp-1');
  });

  it('does not call handlers when canEdit=false', () => {
    const onEdit = vi.fn();
    const onLinkFinding = vi.fn();
    render(
      <MeasurementPlanChip
        plan={basePlan}
        ownerName="Alice"
        canEdit={false}
        onEdit={onEdit}
        onLinkFinding={onLinkFinding}
      />
    );
    fireEvent.click(screen.getByTestId('chip-body'));
    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /link finding/i })).not.toBeInTheDocument();
  });

  it('calls onLinkFinding (and stops propagation) when Link Finding button is clicked', () => {
    const onEdit = vi.fn();
    const onLinkFinding = vi.fn();
    render(
      <MeasurementPlanChip
        plan={basePlan}
        ownerName="Alice"
        canEdit
        onEdit={onEdit}
        onLinkFinding={onLinkFinding}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /link finding/i }));
    expect(onLinkFinding).toHaveBeenCalledWith('mp-1');
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('has role="button" and aria-label when canEdit=true', () => {
    render(
      <MeasurementPlanChip
        plan={basePlan}
        ownerName="Alice"
        canEdit
        onEdit={vi.fn()}
        onLinkFinding={vi.fn()}
      />
    );
    const body = screen.getByTestId('chip-body');
    expect(body.getAttribute('role')).toBe('button');
    expect(body.getAttribute('aria-label')).toMatch(/spindle vibration/i);
  });

  it('drops role="button" when canEdit=false', () => {
    render(
      <MeasurementPlanChip
        plan={basePlan}
        ownerName="Alice"
        canEdit={false}
        onEdit={vi.fn()}
        onLinkFinding={vi.fn()}
      />
    );
    const body = screen.getByTestId('chip-body');
    expect(body.hasAttribute('role')).toBe(false);
  });
});
