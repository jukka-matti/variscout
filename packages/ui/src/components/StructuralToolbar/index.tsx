import type { ReactNode } from 'react';
import { GitBranch, GitMerge, Layers3, Plus, Redo2, Undo2 } from 'lucide-react';

export interface StructuralToolbarProps {
  selectedStepCount: number;
  onAddStep: () => void;
  onGroupSelection: () => void;
  onBranchSelection: () => void;
  onJoinSelection: () => void;
  onUndo: () => void;
  onRedo: () => void;
  disabled?: boolean;
}

interface ToolbarButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}

function ToolbarButton({ label, onClick, disabled, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-edge bg-surface-primary text-content-secondary transition-colors hover:bg-surface-tertiary hover:text-content disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function StructuralToolbar({
  selectedStepCount,
  onAddStep,
  onGroupSelection,
  onBranchSelection,
  onJoinSelection,
  onUndo,
  onRedo,
  disabled,
}: StructuralToolbarProps) {
  const selectionDisabled = disabled || selectedStepCount < 2;

  return (
    <div
      data-testid="structural-toolbar"
      role="toolbar"
      aria-label="Canvas structural authoring"
      className="flex items-center gap-1 rounded-md border border-edge bg-surface-secondary p-1"
    >
      <ToolbarButton label="Add step" onClick={onAddStep} disabled={disabled}>
        <Plus aria-hidden="true" size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Group selected steps"
        onClick={onGroupSelection}
        disabled={selectionDisabled}
      >
        <Layers3 aria-hidden="true" size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Branch selected steps"
        onClick={onBranchSelection}
        disabled={selectionDisabled}
      >
        <GitBranch aria-hidden="true" size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Join selected steps"
        onClick={onJoinSelection}
        disabled={selectionDisabled}
      >
        <GitMerge aria-hidden="true" size={16} />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-edge" aria-hidden="true" />
      <ToolbarButton label="Undo canvas action" onClick={onUndo} disabled={disabled}>
        <Undo2 aria-hidden="true" size={16} />
      </ToolbarButton>
      <ToolbarButton label="Redo canvas action" onClick={onRedo} disabled={disabled}>
        <Redo2 aria-hidden="true" size={16} />
      </ToolbarButton>
    </div>
  );
}
