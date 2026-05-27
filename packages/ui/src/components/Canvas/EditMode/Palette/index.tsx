import React from 'react';
import type { ColumnParsingProfile, ParsingInterpretation } from '@variscout/core/parser';
import { ColumnGroup } from './ColumnGroup';

export interface PaletteProps {
  profiles: ColumnParsingProfile[];
  numericValuesByColumn: Record<string, number[]>;
  onColumnOverrideOpen?: (columnName: string) => void;
  onColumnContextMenuOpen?: (columnName: string) => void;
}

type GroupKey = 'numeric' | 'categorical' | 'time-id' | 'other';

const GROUP_ORDER: ReadonlyArray<{ key: GroupKey; label: string }> = [
  { key: 'numeric', label: 'Numeric' },
  { key: 'categorical', label: 'Categorical' },
  { key: 'time-id', label: 'Time / ID' },
  { key: 'other', label: 'Other' },
];

function bucketFor(kind: ParsingInterpretation['kind'] | undefined): GroupKey {
  switch (kind) {
    case 'numeric':
      return 'numeric';
    case 'categorical':
      return 'categorical';
    case 'date':
    case 'id':
      return 'time-id';
    default:
      return 'other';
  }
}

export const Palette: React.FC<PaletteProps> = ({
  profiles,
  numericValuesByColumn,
  onColumnOverrideOpen,
  onColumnContextMenuOpen,
}) => {
  if (profiles.length === 0) {
    return (
      <p className="text-xs text-content-tertiary" data-testid="palette-empty">
        No columns yet — paste data to get started.
      </p>
    );
  }

  const buckets: Record<GroupKey, ColumnParsingProfile[]> = {
    numeric: [],
    categorical: [],
    'time-id': [],
    other: [],
  };
  for (const profile of profiles) {
    buckets[bucketFor(profile.primary?.kind)].push(profile);
  }

  return (
    <div className="flex flex-col gap-3" data-testid="palette">
      {GROUP_ORDER.filter(({ key }) => buckets[key].length > 0).map(({ key, label }) => (
        <ColumnGroup
          key={key}
          groupKey={key}
          label={label}
          profiles={buckets[key]}
          numericValuesByColumn={numericValuesByColumn}
          onColumnOverrideOpen={onColumnOverrideOpen}
          onColumnContextMenuOpen={onColumnContextMenuOpen}
        />
      ))}
    </div>
  );
};

export default Palette;
