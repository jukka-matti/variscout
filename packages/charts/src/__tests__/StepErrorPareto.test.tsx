import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepErrorParetoBase } from '../StepErrorPareto';
import type { StepErrorParetoStep } from '../types';

const steps: StepErrorParetoStep[] = [
  { nodeId: 'n1', label: 'Mix', errorCount: 12 },
  { nodeId: 'n2', label: 'Fill', errorCount: 47 },
  { nodeId: 'n3', label: 'Cap', errorCount: 5 },
  { nodeId: 'n4', label: 'Label', errorCount: 22 },
];

describe('StepErrorParetoBase', () => {
  it('renders one bar per step (4 steps → 4 categories visible)', () => {
    render(<StepErrorParetoBase parentWidth={800} parentHeight={400} steps={steps} />);
    expect(screen.getAllByText('Mix').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Fill').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cap').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Label').length).toBeGreaterThan(0);
  });

  it('uses default "Errors" Y-axis label', () => {
    render(<StepErrorParetoBase parentWidth={800} parentHeight={400} steps={steps} />);
    expect(screen.getByText('Errors')).toBeInTheDocument();
  });

  it('honors yAxisLabel override', () => {
    render(
      <StepErrorParetoBase
        parentWidth={800}
        parentHeight={400}
        steps={steps}
        yAxisLabel="Defects"
      />
    );
    expect(screen.getByText('Defects')).toBeInTheDocument();
  });

  it('aggregates beyond maxBars into "Others"', () => {
    const many: StepErrorParetoStep[] = Array.from({ length: 25 }, (_, i) => ({
      nodeId: `n${i}`,
      label: `Step${i}`,
      errorCount: 100 - i,
    }));
    render(<StepErrorParetoBase parentWidth={1000} parentHeight={400} steps={many} maxBars={5} />);
    expect(screen.getAllByText(/Others/i).length).toBeGreaterThan(0);
  });

  it('omits "Others" when steps.length <= maxBars', () => {
    const { container } = render(
      <StepErrorParetoBase parentWidth={800} parentHeight={400} steps={steps} maxBars={20} />
    );
    // visx SVGText renders a hidden measurement node with id __react_svg_text_measurement_id
    // that may temporarily hold any string — exclude it and assert no visible "Others" label.
    const visibleOthers = container.querySelectorAll('text:not(#__react_svg_text_measurement_id)');
    const hasOthers = Array.from(visibleOthers).some(el => /others/i.test(el.textContent ?? ''));
    expect(hasOthers).toBe(false);
  });

  it('fires onStepClick with nodeId when a bar is clicked', () => {
    const onStepClick = vi.fn();
    const { container } = render(
      <StepErrorParetoBase
        parentWidth={800}
        parentHeight={400}
        steps={steps}
        onStepClick={onStepClick}
      />
    );
    const bars = container.querySelectorAll('rect');
    expect(bars.length).toBeGreaterThan(0);
    fireEvent.click(bars[0]);
    expect(onStepClick).toHaveBeenCalled();
    const calledWith = onStepClick.mock.calls[0]?.[0];
    expect(['n1', 'n2', 'n3', 'n4']).toContain(calledWith);
  });

  it('renders empty state cleanly with no steps (no throw)', () => {
    expect(() => {
      render(<StepErrorParetoBase parentWidth={600} parentHeight={300} steps={[]} />);
    }).not.toThrow();
  });

  it('drops steps with errorCount=0 from the chart', () => {
    const mixed: StepErrorParetoStep[] = [
      { nodeId: 'n1', label: 'Has', errorCount: 5 },
      { nodeId: 'n2', label: 'Zero', errorCount: 0 },
    ];
    render(<StepErrorParetoBase parentWidth={600} parentHeight={300} steps={mixed} />);
    expect(screen.getAllByText('Has').length).toBeGreaterThan(0);
    expect(screen.queryByText('Zero')).not.toBeInTheDocument();
  });

  it('treats maxBars<2 as 2 (worst step + Others, not headless or mis-aggregated)', () => {
    const many: StepErrorParetoStep[] = [
      { nodeId: 'n1', label: 'Top', errorCount: 100 },
      { nodeId: 'n2', label: 'Mid', errorCount: 50 },
      { nodeId: 'n3', label: 'Low', errorCount: 25 },
    ];
    // maxBars=0 should NOT silently slice(0, -1); should behave like maxBars=2
    render(<StepErrorParetoBase parentWidth={800} parentHeight={400} steps={many} maxBars={0} />);
    expect(screen.getAllByText('Top').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Others/i).length).toBeGreaterThan(0);
  });
});
