import React from 'react';
import type { ColumnParsingProfile } from '@variscout/core/parser';
import { ColumnChip } from './ColumnChip';

export interface ColumnGroupProps {
  groupKey: 'numeric' | 'categorical' | 'time-id' | 'other';
  label: string;
  profiles: ColumnParsingProfile[];
  numericValuesByColumn: Record<string, number[]>;
  onColumnOverrideOpen?: (columnName: string) => void;
  onColumnContextMenuOpen?: (columnName: string) => void;
}

export const ColumnGroup: React.FC<ColumnGroupProps> = ({
  groupKey,
  label,
  profiles,
  numericValuesByColumn,
  onColumnOverrideOpen,
  onColumnContextMenuOpen,
}) => {
  return (
    <section data-testid={`palette-group-${groupKey}`} className="flex flex-col gap-1.5">
      <h4 className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
        {label} · {profiles.length}
      </h4>
      <div className="flex flex-col gap-1">
        {profiles.map(profile => (
          <ColumnChip
            key={profile.columnName}
            profile={profile}
            numericValues={numericValuesByColumn[profile.columnName]}
            onOverrideOpen={onColumnOverrideOpen}
            onContextMenuOpen={onColumnContextMenuOpen}
          />
        ))}
      </div>
    </section>
  );
};

export default ColumnGroup;
