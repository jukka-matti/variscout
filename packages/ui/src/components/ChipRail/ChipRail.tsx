import { ChipRailItem, type ChipRailItemRole } from './ChipRailItem';

export interface ChipRailEntry {
  chipId: string;
  label: string;
  role: ChipRailItemRole;
}

export interface ChipRailProps {
  chips: ChipRailEntry[];
  className?: string;
  onKeyboardPickUp?: (chipId: string) => void;
}

export function ChipRail({ chips, className, onKeyboardPickUp }: ChipRailProps) {
  const rootClass = [
    'flex flex-col gap-3 border-r border-edge bg-surface-secondary p-3 text-content',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <aside className={rootClass} aria-labelledby="chip-rail-heading" data-testid="chip-rail">
      <h2 id="chip-rail-heading" className="text-sm font-semibold text-content">
        Unassigned columns
      </h2>

      {chips.length > 0 ? (
        <div className="flex flex-col gap-2">
          {chips.map(chip => (
            <ChipRailItem
              key={chip.chipId}
              chipId={chip.chipId}
              label={chip.label}
              role={chip.role}
              onKeyboardPickUp={onKeyboardPickUp}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-edge bg-surface-primary px-3 py-4 text-sm text-content-secondary">
          All columns assigned
        </p>
      )}
    </aside>
  );
}
