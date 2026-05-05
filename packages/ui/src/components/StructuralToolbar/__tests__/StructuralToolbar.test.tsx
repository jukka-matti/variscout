import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StructuralToolbar } from '../index';

describe('StructuralToolbar', () => {
  it('renders structural authoring controls and calls callbacks', () => {
    const props = {
      selectedStepCount: 2,
      onAddStep: vi.fn(),
      onGroupSelection: vi.fn(),
      onBranchSelection: vi.fn(),
      onJoinSelection: vi.fn(),
      onUndo: vi.fn(),
      onRedo: vi.fn(),
    };
    render(<StructuralToolbar {...props} />);

    fireEvent.click(screen.getByRole('button', { name: /add step/i }));
    fireEvent.click(screen.getByRole('button', { name: /group selected steps/i }));
    fireEvent.click(screen.getByRole('button', { name: /branch selected steps/i }));
    fireEvent.click(screen.getByRole('button', { name: /join selected steps/i }));
    fireEvent.click(screen.getByRole('button', { name: /undo canvas action/i }));
    fireEvent.click(screen.getByRole('button', { name: /redo canvas action/i }));

    expect(props.onAddStep).toHaveBeenCalledTimes(1);
    expect(props.onGroupSelection).toHaveBeenCalledTimes(1);
    expect(props.onBranchSelection).toHaveBeenCalledTimes(1);
    expect(props.onJoinSelection).toHaveBeenCalledTimes(1);
    expect(props.onUndo).toHaveBeenCalledTimes(1);
    expect(props.onRedo).toHaveBeenCalledTimes(1);
  });

  it('disables selection commands until enough steps are selected', () => {
    render(
      <StructuralToolbar
        selectedStepCount={1}
        onAddStep={vi.fn()}
        onGroupSelection={vi.fn()}
        onBranchSelection={vi.fn()}
        onJoinSelection={vi.fn()}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /group selected steps/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /branch selected steps/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /join selected steps/i })).toBeDisabled();
  });
});
