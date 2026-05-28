import React from 'react';
import type { ColumnParsingProfile } from '@variscout/core/parser';
import { ColumnChip } from './ColumnChip';
import type { SuggestedRole } from '../hooks/useGhostSuggestions';

export interface ColumnGroupProps {
  groupKey:
    | 'numeric'
    | 'categorical'
    | 'time-id'
    | 'derived-timings'
    | 'derived-formula'
    | 'derived-time-decomposition'
    | 'derived-bins'
    | 'derived-fallback'
    | 'other';
  label: string;
  profiles: ColumnParsingProfile[];
  numericValuesByColumn: Record<string, number[]>;
  /**
   * H1 Task 2: ghost-suggested role per column name. Threaded from Palette;
   * looked up per chip and forwarded as the `ghostSuggested` prop.
   */
  ghostSuggestions?: Record<string, SuggestedRole>;
  onColumnOverrideOpen?: (columnName: string, anchor: { x: number; y: number }) => void;
  onColumnContextMenuOpen?: (columnName: string, anchor: { x: number; y: number }) => void;
}

export const ColumnGroup: React.FC<ColumnGroupProps> = ({
  groupKey,
  label,
  profiles,
  numericValuesByColumn,
  ghostSuggestions,
  onColumnOverrideOpen,
  onColumnContextMenuOpen,
}) => {
  return (
    <section data-testid={`palette-group-${groupKey}`} className="flex flex-col gap-1.5">
      <h4 className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
        {label} · {profiles.length}
      </h4>
      <div className="flex flex-col gap-1">
        {profiles.map(profile => {
          const suggested = ghostSuggestions?.[profile.columnName] ?? null;
          return (
            <ColumnChip
              key={profile.columnName}
              profile={profile}
              numericValues={numericValuesByColumn[profile.columnName]}
              derived={profile.derived}
              ghostSuggested={suggested !== null ? suggested : undefined}
              onOverrideOpen={onColumnOverrideOpen}
              onContextMenuOpen={onColumnContextMenuOpen}
            />
          );
        })}
      </div>
    </section>
  );
};

export default ColumnGroup;
