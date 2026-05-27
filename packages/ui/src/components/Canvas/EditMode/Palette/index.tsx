import React, { useState } from 'react';
import type { ColumnParsingProfile, ParsingInterpretation } from '@variscout/core/parser';
import { ColumnGroup } from './ColumnGroup';
import { ColumnChipContextMenu } from './ColumnChipContextMenu';
import { ParsingOverridePopover } from './ParsingOverridePopover';
import { ParsingBanner } from './ParsingBanner';
import { SystemHintBanner } from './SystemHintBanner';
import type { SystemHintKind } from './SystemHintBanner';

export type { SystemHintKind };

export interface SystemHint {
  id: string;
  kind: SystemHintKind;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
  onDismiss?: () => void;
}

export interface PaletteProps {
  profiles: ColumnParsingProfile[];
  numericValuesByColumn: Record<string, number[]>;
  /** Contextual system hints rendered as banners above the chip groups. */
  systemHints?: SystemHint[];
  /** Notify when a context-menu item is chosen. Routed to no-op by default. */
  onMenuItemSelect?: (columnName: string, itemId: string) => void;
  /** Notify when a user picks a different parsing interpretation. Routed to no-op by default. */
  onOverrideAccept?: (columnName: string, interpretation: ParsingInterpretation) => void;
  /** Notify when "Apply to similar" is clicked. Routed to no-op by default. */
  onApplyToSimilar?: (columnName: string, interpretation: ParsingInterpretation) => void;
  /** Notify when the aggregate-warning banner's Review button is clicked. */
  onReviewAllWarnings?: () => void;
}

type GroupKey = 'numeric' | 'categorical' | 'time-id' | 'derived' | 'other';

const GROUP_ORDER: ReadonlyArray<{ key: GroupKey; label: string }> = [
  { key: 'numeric', label: 'Numeric' },
  { key: 'categorical', label: 'Categorical' },
  { key: 'time-id', label: 'Time / ID' },
  { key: 'derived', label: 'DERIVED FROM TIMINGS' }, // label overridden dynamically per derivationSource
  { key: 'other', label: 'Other' },
];

function labelForDerivedGroup(profiles: ColumnParsingProfile[]): string {
  const source = profiles[0]?.derivationSource ?? 'timings';
  return `DERIVED FROM ${source.toUpperCase()}`;
}

function bucketFor(profile: ColumnParsingProfile): GroupKey {
  if (profile.derived) return 'derived';
  switch (profile.primary?.kind) {
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

type OpenOverlay =
  | { kind: 'menu'; columnName: string; anchor: { x: number; y: number } }
  | { kind: 'popover'; columnName: string; anchor: { x: number; y: number } };

const WARNING_BANNER_THRESHOLD = 3;

export const Palette: React.FC<PaletteProps> = ({
  profiles,
  numericValuesByColumn,
  systemHints,
  onMenuItemSelect,
  onOverrideAccept,
  onApplyToSimilar,
  onReviewAllWarnings,
}) => {
  const [openOverlay, setOpenOverlay] = useState<OpenOverlay | null>(null);

  if (profiles.length === 0) {
    return (
      <p className="text-xs text-content-tertiary" data-testid="palette-empty">
        No columns yet — paste data to get started.
      </p>
    );
  }

  const warningCount = profiles.filter(p => p.status === 'warning').length;

  const buckets: Record<GroupKey, ColumnParsingProfile[]> = {
    numeric: [],
    categorical: [],
    'time-id': [],
    derived: [],
    other: [],
  };
  for (const profile of profiles) {
    buckets[bucketFor(profile)].push(profile);
  }

  const activeProfile = openOverlay && profiles.find(p => p.columnName === openOverlay.columnName);

  return (
    <div className="flex flex-col gap-3" data-testid="palette">
      {systemHints && systemHints.length > 0 && (
        <div data-testid="palette-system-hints" className="flex flex-col gap-2 mb-3">
          {systemHints.map(hint => (
            <SystemHintBanner
              key={hint.id}
              kind={hint.kind}
              message={hint.message}
              ctaLabel={hint.ctaLabel}
              onCta={hint.onCta}
              onDismiss={hint.onDismiss}
            />
          ))}
        </div>
      )}

      {warningCount >= WARNING_BANNER_THRESHOLD && (
        <ParsingBanner warningCount={warningCount} onReviewAll={() => onReviewAllWarnings?.()} />
      )}

      {GROUP_ORDER.filter(({ key }) => buckets[key].length > 0).map(({ key, label }) => (
        <ColumnGroup
          key={key}
          groupKey={key}
          label={key === 'derived' ? labelForDerivedGroup(buckets[key]) : label}
          profiles={buckets[key]}
          numericValuesByColumn={numericValuesByColumn}
          onColumnOverrideOpen={(columnName, anchor) =>
            setOpenOverlay({ kind: 'popover', columnName, anchor })
          }
          onColumnContextMenuOpen={(columnName, anchor) =>
            setOpenOverlay({ kind: 'menu', columnName, anchor })
          }
        />
      ))}

      {openOverlay?.kind === 'menu' && activeProfile && (
        <ColumnChipContextMenu
          columnName={activeProfile.columnName}
          kind={activeProfile.primary?.kind ?? 'text'}
          anchor={openOverlay.anchor}
          onItemSelect={(name, itemId) => onMenuItemSelect?.(name, itemId)}
          onClose={() => setOpenOverlay(null)}
        />
      )}

      {openOverlay?.kind === 'popover' && activeProfile && (
        <ParsingOverridePopover
          columnName={activeProfile.columnName}
          profile={activeProfile}
          anchor={openOverlay.anchor}
          onChoose={(name, interpretation) => onOverrideAccept?.(name, interpretation)}
          onApplyToSimilar={(name, interpretation) => onApplyToSimilar?.(name, interpretation)}
          onClose={() => setOpenOverlay(null)}
        />
      )}
    </div>
  );
};

export default Palette;
