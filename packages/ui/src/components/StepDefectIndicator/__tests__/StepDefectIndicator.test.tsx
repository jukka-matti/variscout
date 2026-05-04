import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepDefectIndicator } from '../StepDefectIndicator';

describe('StepDefectIndicator', () => {
  it('renders the defect count', () => {
    render(<StepDefectIndicator defectCount={42} />);
    expect(screen.getByText('42')).toBeDefined();
  });

  it('has data-testid="step-defect-indicator"', () => {
    render(<StepDefectIndicator defectCount={7} />);
    expect(screen.getByTestId('step-defect-indicator')).toBeDefined();
  });

  it('title includes count and step label when both provided', () => {
    render(<StepDefectIndicator defectCount={12} stepLabel="Mold" />);
    const el = screen.getByTestId('step-defect-indicator');
    expect(el.getAttribute('title')).toBe('12 defects at Mold');
  });

  it('title includes count without step label when stepLabel is omitted', () => {
    render(<StepDefectIndicator defectCount={5} />);
    const el = screen.getByTestId('step-defect-indicator');
    expect(el.getAttribute('title')).toBe('5 defects');
  });

  it('title includes cost when costTotal is provided', () => {
    render(<StepDefectIndicator defectCount={10} costTotal={2500} />);
    const el = screen.getByTestId('step-defect-indicator');
    const title = el.getAttribute('title') ?? '';
    expect(title).toContain('cost:');
    expect(title).toContain('2,500');
  });

  it('title includes duration when durationTotal is provided', () => {
    render(<StepDefectIndicator defectCount={8} durationTotal={3600} />);
    const el = screen.getByTestId('step-defect-indicator');
    const title = el.getAttribute('title') ?? '';
    expect(title).toContain('duration:');
    expect(title).toContain('3,600');
  });

  it('title includes both cost and duration when both are provided', () => {
    render(<StepDefectIndicator defectCount={20} costTotal={1000} durationTotal={900} />);
    const el = screen.getByTestId('step-defect-indicator');
    const title = el.getAttribute('title') ?? '';
    expect(title).toContain('cost:');
    expect(title).toContain('duration:');
  });

  it('renders as <button> when onClick is provided', () => {
    const handler = vi.fn();
    render(<StepDefectIndicator defectCount={3} onClick={handler} />);
    const el = screen.getByTestId('step-defect-indicator');
    expect(el.tagName.toLowerCase()).toBe('button');
  });

  it('renders as <span> when onClick is absent', () => {
    render(<StepDefectIndicator defectCount={3} />);
    const el = screen.getByTestId('step-defect-indicator');
    expect(el.tagName.toLowerCase()).toBe('span');
  });

  it('fires the onClick callback when the button is clicked', () => {
    const handler = vi.fn();
    render(<StepDefectIndicator defectCount={15} onClick={handler} />);
    fireEvent.click(screen.getByTestId('step-defect-indicator'));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
