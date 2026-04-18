import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CapabilityCoachingPanel } from '../index';

describe('CapabilityCoachingPanel', () => {
  it('renders all three coaching sections', () => {
    render(<CapabilityCoachingPanel />);
    expect(screen.getByText('How to read this chart')).toBeInTheDocument();
    expect(screen.getByText('The two capability numbers')).toBeInTheDocument();
    expect(screen.getByText('Centering vs spread')).toBeInTheDocument();
    expect(screen.getByText('Why rational subgroups?')).toBeInTheDocument();
  });

  it('omits the close button when onClose is not provided', () => {
    render(<CapabilityCoachingPanel />);
    expect(screen.queryByLabelText('Close coaching panel')).not.toBeInTheDocument();
  });

  it('renders a close button and calls onClose when provided', () => {
    const onClose = vi.fn();
    render(<CapabilityCoachingPanel onClose={onClose} />);
    const closeBtn = screen.getByLabelText('Close coaching panel');
    closeBtn.click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('anchors to the methodology vocabulary from coScout/modes/capability.ts', () => {
    // These phrases are load-bearing: if the prompt content changes, so should this panel.
    render(<CapabilityCoachingPanel />);
    expect(screen.getByText(/realized capability/i)).toBeInTheDocument();
    expect(screen.getByText(/potential capability/i)).toBeInTheDocument();
    expect(screen.getByText(/centering loss/i)).toBeInTheDocument();
  });

  it('exposes a testable data-testid on the outer element', () => {
    render(<CapabilityCoachingPanel />);
    expect(screen.getByTestId('capability-coaching-panel')).toBeInTheDocument();
  });

  it('applies a custom className onto the outer container', () => {
    render(<CapabilityCoachingPanel className="custom-class" />);
    const panel = screen.getByTestId('capability-coaching-panel');
    expect(panel.className).toMatch(/custom-class/);
  });
});
