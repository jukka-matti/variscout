import React, { useState } from 'react';
import type { ColumnParsingProfile, ParsingInterpretation } from '@variscout/core/parser';
import { ColumnGroup } from './ColumnGroup';
import { ColumnChipContextMenu } from './ColumnChipContextMenu';
import { ParsingOverridePopover } from './ParsingOverridePopover';
import { ParsingBanner } from './ParsingBanner';
import { SystemHintBanner } from './SystemHintBanner';
import type { SystemHintKind } from './SystemHintBanner';
import type { SuggestedRole } from '../hooks/useGhostSuggestions';

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
  /**
   * Categorical values per column — passthrough channel parallel to
   * `numericValuesByColumn`. D3 Task 8: V1 contains ONLY time-decomposition
   * derived columns (raw categorical values continue to flow via `rows`).
   * Currently held but not consumed inside Palette; downstream Analyze/Explore
   * consumers light up incrementally in F1/H1.
   */
  categoricalValuesByColumn?: Record<string, (string | null)[]>;
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
  /**
   * H1 Task 3: optional callback to focus the paste input from the empty-state
   * CTA. Only wired when the parent has a paste-input ref available (e.g. a
   * DataPastePanel textarea). When omitted, the empty state renders without the
   * "Focus paste input" button.
   */
  onFocusPasteInput?: () => void;
  /**
   * H1 Task 2: ghost-suggested role per column name. Threaded down to each
   * {@link ColumnGroup} and then to {@link ColumnChip}. Columns absent from
   * the map render without a ghost suggestion pill.
   */
  ghostSuggestions?: Record<string, SuggestedRole>;
}

// Each `derived` profile carries a `derivationSource` discriminant; one bucket
// is rendered per discriminant so projects with both timings AND formula derived
// columns get two distinct DERIVED FROM ... sections (e.g., Lead_time alongside
// Yield_pct). 'derived-fallback' catches the rare case of a derived profile
// missing derivationSource.
type GroupKey =
  | 'numeric'
  | 'categorical'
  | 'time-id'
  | 'derived-timings'
  | 'derived-formula'
  | 'derived-time-decomposition'
  | 'derived-bins'
  | 'derived-fallback'
  | 'other';

const GROUP_ORDER: ReadonlyArray<{ key: GroupKey; label: string }> = [
  { key: 'numeric', label: 'Numeric' },
  { key: 'categorical', label: 'Categorical' },
  { key: 'time-id', label: 'Time / ID' },
  { key: 'derived-timings', label: 'DERIVED FROM TIMINGS' },
  { key: 'derived-formula', label: 'DERIVED FROM FORMULA' },
  { key: 'derived-time-decomposition', label: 'DERIVED FROM TIME-DECOMPOSITION' },
  { key: 'derived-bins', label: 'DERIVED FROM BINNING' },
  { key: 'derived-fallback', label: 'DERIVED' },
  { key: 'other', label: 'Other' },
];

function bucketFor(profile: ColumnParsingProfile): GroupKey {
  if (profile.derived) {
    switch (profile.derivationSource) {
      case 'timings':
        return 'derived-timings';
      case 'formula':
        return 'derived-formula';
      case 'time-decomposition':
        return 'derived-time-decomposition';
      case 'bins':
        return 'derived-bins';
      default:
        return 'derived-fallback';
    }
  }
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
  // D3 Task 8: categoricalValuesByColumn is a passthrough channel for derived
  // time-decomposition columns. V1 holds the prop but does not consume it
  // inside Palette — downstream Analyze/Explore consumers light up in F1/H1.
  categoricalValuesByColumn: _categoricalValuesByColumn,
  systemHints,
  ghostSuggestions,
  onMenuItemSelect,
  onOverrideAccept,
  onApplyToSimilar,
  onReviewAllWarnings,
  onFocusPasteInput,
}) => {
  const [openOverlay, setOpenOverlay] = useState<OpenOverlay | null>(null);

  if (profiles.length === 0) {
    return (
      <div
        data-testid="palette-empty"
        className="flex flex-col items-center gap-2 px-3 py-6 text-center"
      >
        {/* Inline paste icon — clipboard glyph */}
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-content-muted"
        >
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        </svg>
        <p className="text-sm text-content-muted">No columns yet — paste data to get started.</p>
        {onFocusPasteInput && (
          <button
            type="button"
            onClick={onFocusPasteInput}
            data-testid="palette-empty-paste-cta"
            className="text-xs font-medium text-cyan-700 underline-offset-2 hover:underline"
          >
            Focus paste input
          </button>
        )}
      </div>
    );
  }

  const warningCount = profiles.filter(p => p.status === 'warning').length;

  const buckets: Record<GroupKey, ColumnParsingProfile[]> = {
    numeric: [],
    categorical: [],
    'time-id': [],
    'derived-timings': [],
    'derived-formula': [],
    'derived-time-decomposition': [],
    'derived-bins': [],
    'derived-fallback': [],
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
          label={label}
          profiles={buckets[key]}
          numericValuesByColumn={numericValuesByColumn}
          ghostSuggestions={ghostSuggestions}
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
