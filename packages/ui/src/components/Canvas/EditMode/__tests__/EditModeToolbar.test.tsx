import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditModeToolbar } from '../EditModeToolbar';

describe('EditModeToolbar', () => {
  it('renders a toolbar container with role="toolbar" and aria-label="Edit mode toolbar"', () => {
    render(<EditModeToolbar steps={[]} />);
    expect(screen.getByRole('toolbar', { name: 'Edit mode toolbar' })).toBeInTheDocument();
  });

  it('renders a single visible button with text containing "+ Capture step timings"', () => {
    render(<EditModeToolbar steps={[]} />);
    expect(screen.getByRole('button', { name: /\+ Capture step timings/i })).toBeInTheDocument();
  });

  it('button is disabled when steps.length === 0', () => {
    render(<EditModeToolbar steps={[]} />);
    const btn = screen.getByRole('button', { name: /\+ Capture step timings/i });
    expect(btn).toBeDisabled();
  });

  it('button has title="Add steps first" when disabled', () => {
    render(<EditModeToolbar steps={[]} />);
    const btn = screen.getByRole('button', { name: /\+ Capture step timings/i });
    expect(btn).toHaveAttribute('title', 'Add steps first');
  });

  it('button is enabled when steps.length >= 1', () => {
    render(<EditModeToolbar steps={[{ id: 's1', name: 'Mix', order: 0 }]} />);
    const btn = screen.getByRole('button', { name: /\+ Capture step timings/i });
    expect(btn).not.toBeDisabled();
  });

  it('calls onCaptureStepTimings when button is clicked with steps present', () => {
    const onCaptureStepTimings = vi.fn();
    render(
      <EditModeToolbar
        steps={[{ id: 's1', name: 'Mix', order: 0 }]}
        onCaptureStepTimings={onCaptureStepTimings}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /\+ Capture step timings/i }));
    expect(onCaptureStepTimings).toHaveBeenCalledTimes(1);
  });

  it('does NOT render other toolbar buttons (+ Goal narrative, + Issue / question, → Explore)', () => {
    render(<EditModeToolbar steps={[]} />);
    expect(screen.queryByRole('button', { name: /goal narrative/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /issue.*question/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /explore/i })).not.toBeInTheDocument();
  });
});
