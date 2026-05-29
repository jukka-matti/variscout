export interface ExploreJumpButtonProps {
  /** User-facing label embedded into aria-label ("Open {label} in Explore"). */
  readonly label: string;
  readonly onClick: () => void;
}

export function ExploreJumpButton({ label, onClick }: ExploreJumpButtonProps) {
  return (
    <button
      type="button"
      data-testid="chip-explore-jump"
      aria-label={`Open ${label} in Explore`}
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
      className="rounded p-1 text-content-tertiary opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-surface-secondary hover:text-content focus-visible:opacity-100"
    >
      →
    </button>
  );
}
