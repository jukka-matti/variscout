/**
 * HypothesisCard — status-bordered Mechanism Branch card for a Hypothesis hub.
 *
 * Displays the suspected mechanism, branch status, clue/check counts, and an
 * optional evidence-gap warning badge. Positioned by its center-top point (x, y).
 *
 * Accessibility: role="button", tabIndex={0}, aria-label for screen readers.
 * Keyboard: Enter / Space triggers onSelect.
 * Context menu: onContextMenu is called with preventDefault applied first.
 */

import React from 'react';
import type {
  MechanismBranchViewModel,
  MessageCatalog,
  Hypothesis,
  HypothesisStatus,
} from '@variscout/core';
import type { ColumnTypeMap } from '@variscout/core/findings';
import { formatMessage, getMessage } from '@variscout/core/i18n';
import { chartColors } from '@variscout/charts';
import { useMiniChartData } from '@variscout/hooks';
import { useWallLocale } from './hooks/useWallLocale';
import { TagChip } from './TagChip';
import { OneStepAwayBadge } from './OneStepAwayBadge';
import { MiniIChart } from './MiniIChart';
import { MiniBoxplot } from './MiniBoxplot';
import {
  BrushToFindingFlow,
  CHART_SLOT_X,
  CHART_SLOT_Y,
  CHART_SLOT_W,
  CHART_SLOT_H,
} from './BrushToFindingFlow';

export interface HypothesisCardProps {
  hub: Hypothesis;
  branch?: MechanismBranchViewModel;
  /** The STORED analyst-owned status — what the card's status badge displays. */
  displayStatus: HypothesisStatus;
  /**
   * CS-10 — the DERIVED advisory suggestion (`deriveHypothesisStatus`), passed
   * in by the parent. The presentational card never computes it; it only carries
   * it so `HypothesisCardWithPlans` can surface the suggestion chip. Advisory
   * only — it never overrides `displayStatus`.
   */
  suggestedStatus?: HypothesisStatus;
  x: number;
  y: number;
  hasGap?: boolean;
  /**
   * When true, this hub's condition references a data column that no longer exists
   * (renamed, dropped, or the active dataset shifted). AND-check still correctly
   * returns false for such hubs — this badge surfaces the reason to the analyst.
   */
  missingColumn?: boolean;
  /**
   * Current viewport zoom factor, used to trigger level-of-detail rendering.
   * When defined and below threshold, the card simplifies itself:
   *   - `zoomScale < 0.3` → status-colored glyph only (no text, no chart slot)
   *   - `zoomScale < 0.6` → glyph + hub name (no findings count, no chart slot)
   *   - otherwise         → full card (default)
   * Left `undefined` → full card always (backward compatibility).
   */
  zoomScale?: number;
  /** Dataset rows used to populate the mini-chart slot (full LOD only). */
  rows?: ReadonlyArray<Record<string, unknown>>;
  /** Column-type map from the active dataset parser output. */
  columnTypes?: ColumnTypeMap;
  /** Outcome column name for boxplot charts; omit when no outcome is set. */
  outcomeColumn?: string | null;
  onSelect?: (hubId: string) => void;
  onContextMenu?: (hubId: string, event: React.MouseEvent) => void;
  /**
   * FE-2b — when provided AND this hub is one-step-away (needs-disconfirmation),
   * the OneStepAwayBadge becomes a clickable affordance that opens the test plan
   * pre-staged with "Try to break it". Called with the hubId. When omitted, the
   * badge stays a passive label (the Survey hint remains the only ambient nudge).
   */
  onOneStepAwayAction?: (hubId: string) => void;
  /**
   * CS-13 crossing-back — when provided, renders a → jump button in the card
   * header (top-right). The PARENT resolves the hub's primary factor and gates
   * on data presence (no button when the factor awaits collection — the
   * measurement-plan chip owns that case). Fired with no args.
   */
  onExplore?: () => void;
  /** Pre-formatted aria label for the → button (`wall.exploreJump.aria`). */
  exploreAriaLabel?: string;
}

const CARD_W = 280;
const CARD_H = 288;
const BODY_TOP = 64;
// CHART_SLOT_X/Y/W/H imported from BrushToFindingFlow (single source of truth)
const POST_CHART_Y = CHART_SLOT_Y + CHART_SLOT_H + 8; // 152 — top of remaining body content
const TAG_ROW_Y = POST_CHART_Y;
const TAG_ROW_H = 24;
const TAGGED_READINESS_Y = TAG_ROW_Y + TAG_ROW_H + 8; // 184
const TAGGED_CLUE_COUNT_Y = TAGGED_READINESS_Y + 18; // 202
const DEFAULT_READINESS_Y = POST_CHART_Y + 4; // 156 (no tags)
const DEFAULT_CLUE_COUNT_Y = DEFAULT_READINESS_Y + 18; // 174
/**
 * Y position of the OneStepAwayBadge when it replaces the openChecksLabel row.
 * Badge spans y=228–248; nextMove glyphs at y=252–264 → 4px clearance.
 * CARD_H - 60 = 288 - 60 = 228.
 */
const ONE_STEP_AWAY_Y = CARD_H - 60; // 228

const STATUS_KEY: Record<HypothesisStatus, keyof MessageCatalog> = {
  proposed: 'wall.status.proposed',
  evidenced: 'wall.status.evidenced',
  'evidence-survived-test': 'wall.status.confirmed', // catalog key unchanged — value already 'Supported'
  refuted: 'wall.status.refuted',
  'needs-disconfirmation': 'wall.status.needsDisconfirmation',
};

/** Status-specific border colors sourced from chartColors — no hardcoded hex. */
const STATUS_STROKE: Record<HypothesisStatus, string> = {
  proposed: chartColors.mean, // blue-500 — neutral/open
  evidenced: chartColors.control, // cyan-500 — data linked
  'evidence-survived-test': chartColors.pass, // green-500 — evidence survived test
  refuted: chartColors.fail, // red-500 — mechanism rejected
  'needs-disconfirmation': chartColors.warning, // amber — needs disconfirmation check
};

interface ChartSlotProps {
  hub: Hypothesis;
  rows: ReadonlyArray<Record<string, unknown>>;
  columnTypes: ColumnTypeMap;
  outcomeColumn: string | null;
}

function ChartSlot({ hub, rows, columnTypes, outcomeColumn }: ChartSlotProps) {
  const chart = useMiniChartData(hub, rows, columnTypes, outcomeColumn);
  const factor = chart.factor;

  if (chart.kind === 'i-chart' && chart.values && chart.values.length > 0) {
    return (
      <BrushToFindingFlow hub={hub} factor={factor} outcomeColumn={outcomeColumn} rows={rows}>
        {({ onBrushEnd }) => (
          <foreignObject
            x={CHART_SLOT_X}
            y={CHART_SLOT_Y}
            width={CHART_SLOT_W}
            height={CHART_SLOT_H}
          >
            <MiniIChart
              values={chart.values!}
              width={CHART_SLOT_W}
              height={CHART_SLOT_H}
              onBrushEnd={onBrushEnd}
            />
          </foreignObject>
        )}
      </BrushToFindingFlow>
    );
  }

  if (chart.kind === 'boxplot' && chart.groups && chart.groups.length > 0) {
    return (
      <BrushToFindingFlow hub={hub} factor={factor} outcomeColumn={outcomeColumn} rows={rows}>
        {({ onCategorySelect }) => (
          <foreignObject
            x={CHART_SLOT_X}
            y={CHART_SLOT_Y}
            width={CHART_SLOT_W}
            height={CHART_SLOT_H}
          >
            <MiniBoxplot
              groups={chart.groups!}
              width={CHART_SLOT_W}
              height={CHART_SLOT_H}
              onCategorySelect={onCategorySelect}
            />
          </foreignObject>
        )}
      </BrushToFindingFlow>
    );
  }

  return (
    <foreignObject x={CHART_SLOT_X} y={CHART_SLOT_Y} width={CHART_SLOT_W} height={CHART_SLOT_H}>
      <div
        data-testid="mini-chart-placeholder"
        className="flex h-full w-full items-center justify-center text-[10px] text-content-muted italic"
      >
        {chart.reason === 'no-outcome'
          ? 'Set outcome to enable chart'
          : chart.reason === 'unknown-column'
            ? `Column "${chart.factor}" not found`
            : chart.reason === 'unsupported-type'
              ? 'Chart unavailable for this factor'
              : '+ Add condition'}
      </div>
    </foreignObject>
  );
}

export const HypothesisCard: React.FC<HypothesisCardProps> = ({
  hub,
  branch,
  displayStatus,
  x,
  y,
  hasGap,
  missingColumn,
  zoomScale,
  rows,
  columnTypes,
  outcomeColumn,
  onSelect,
  onContextMenu,
  onOneStepAwayAction,
  onExplore,
  exploreAriaLabel,
}) => {
  const locale = useWallLocale();
  const statusLabel = getMessage(locale, STATUS_KEY[displayStatus]);
  const branchLabel = getMessage(locale, 'wall.card.hypothesisLabel');
  const supportingCount = branch?.supportingClues.length ?? hub.findingIds.length;
  const counterCount = branch?.counterClues.length ?? 0;
  // "Open checks" now derive from not-yet-tested clues (findings linked to the
  // hub that are neither supporting nor contradicting) — the Question entity
  // that previously seeded this count was retired (IM-1).
  const openCheckCount = branch?.notTestedClues.length ?? 0;
  const mechanismName = branch?.suspectedMechanism ?? hub.name;
  const readinessLabel = branch?.readiness.label;
  const nextMove = branch?.nextMove ?? hub.nextMove;
  const themeTags = (hub.themeTags ?? []).map(tag => tag.trim()).filter(Boolean);
  const supportingLabel = `${supportingCount} supporting clue${supportingCount === 1 ? '' : 's'}`;
  const counterLabel = `${counterCount} counter-clue${counterCount === 1 ? '' : 's'}`;
  const openChecksLabel = `${openCheckCount} open check${openCheckCount === 1 ? '' : 's'}`;
  const label = formatMessage(locale, 'wall.card.ariaLabel', {
    name: mechanismName,
    status: statusLabel,
    count: supportingCount,
  });
  const missingColumnText = getMessage(locale, 'wall.card.missingColumn');
  const missingColumnAria = getMessage(locale, 'wall.card.missingColumnAria');
  const evidenceGapAria = getMessage(locale, 'wall.card.evidenceGap');
  const oneStepAwayText = getMessage(locale, 'wall.card.oneStepAway');

  // When true, the badge occupies the openChecksLabel slot — don't render both.
  const isOneStepAway = displayStatus === 'needs-disconfirmation';

  // LOD thresholds: glyph < 0.3 ≤ medium < 0.6 ≤ full. An undefined zoomScale
  // bypasses LOD entirely (full card — backward compatibility).
  const lod: 'glyph' | 'medium' | 'full' =
    zoomScale === undefined
      ? 'full'
      : zoomScale < 0.3
        ? 'glyph'
        : zoomScale < 0.6
          ? 'medium'
          : 'full';

  const commonHandlers = {
    role: 'button' as const,
    tabIndex: 0,
    'aria-label': label,
    'data-status': displayStatus,
    onClick: () => onSelect?.(hub.id),
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      onContextMenu?.(hub.id, e);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect?.(hub.id);
      }
    },
    className: 'cursor-pointer',
  };

  if (lod === 'glyph') {
    // Smallest LOD: just a status-colored disc centered at (x, y + CARD_H/2).
    // Keeps the click target and aria-label so accessibility + selection
    // still work at any zoom level.
    const cx = x;
    const cy = y + CARD_H / 2;
    return (
      <g data-wall-lod="glyph" {...commonHandlers}>
        <circle
          cx={cx}
          cy={cy}
          r={14}
          className="fill-surface-secondary"
          stroke={STATUS_STROKE[displayStatus]}
          strokeWidth={3}
        />
      </g>
    );
  }

  const isMedium = lod === 'medium';

  return (
    <g data-wall-lod={lod} transform={`translate(${x - CARD_W / 2}, ${y})`} {...commonHandlers}>
      <rect
        className="hub-card fill-surface-secondary"
        width={CARD_W}
        height={isMedium ? 56 : CARD_H}
        rx={12}
        stroke={STATUS_STROKE[displayStatus]}
        strokeWidth={2}
      />
      <text
        x={16}
        y={24}
        className="fill-content-subtle text-[10px] uppercase tracking-wide font-mono"
      >
        {branchLabel} · {statusLabel}
      </text>
      <text x={16} y={48} className="fill-content font-semibold text-sm">
        {mechanismName}
      </text>
      {onExplore && (
        <foreignObject x={CARD_W - 64} y={8} width={26} height={24} data-no-wall-pan>
          {/* CS-13 → jump at x:216–242 — leaves the x:246–272 lane to the hasGap badge (cx=256±10) */}
          <button
            type="button"
            data-testid="hub-explore-jump"
            aria-label={exploreAriaLabel}
            className="flex h-full w-full items-center justify-center rounded border border-edge bg-surface text-xs text-content-muted hover:bg-surface-primary hover:text-content"
            onClick={e => {
              e.stopPropagation();
              onExplore();
            }}
          >
            →
          </button>
        </foreignObject>
      )}
      {!isMedium && (
        <>
          <rect
            x={16}
            y={BODY_TOP}
            width={CARD_W - 32}
            height={CARD_H - BODY_TOP - 16}
            rx={4}
            className="fill-surface"
          />
          {rows && columnTypes ? (
            <ChartSlot
              hub={hub}
              rows={rows}
              columnTypes={columnTypes}
              outcomeColumn={outcomeColumn ?? null}
            />
          ) : null}
          {themeTags.length > 0 && (
            <foreignObject x={24} y={TAG_ROW_Y} width={CARD_W - 48} height={TAG_ROW_H}>
              <div
                data-testid="hypothesis-theme-tags"
                className="flex h-6 min-w-0 items-center gap-1 overflow-hidden"
              >
                {themeTags.map(tag => (
                  <TagChip key={tag} tag={tag} />
                ))}
              </div>
            </foreignObject>
          )}
          <text
            x={24}
            y={themeTags.length > 0 ? TAGGED_READINESS_Y : DEFAULT_READINESS_Y}
            className="fill-content-muted text-xs"
          >
            {readinessLabel ?? statusLabel}
          </text>
          <text
            x={24}
            y={themeTags.length > 0 ? TAGGED_CLUE_COUNT_Y : DEFAULT_CLUE_COUNT_Y}
            className="fill-content-muted text-xs font-mono"
          >
            {supportingLabel} · {counterLabel}
          </text>
          {isOneStepAway ? (
            /* Badge replaces openChecksLabel for needs-disconfirmation.
               y=228, height=20 → spans 228–248; nextMove glyphs at 252–264 → 4px clear. */
            <OneStepAwayBadge
              message={oneStepAwayText}
              x={16}
              y={ONE_STEP_AWAY_Y}
              width={CARD_W - 32}
              height={20}
              onClick={onOneStepAwayAction ? () => onOneStepAwayAction(hub.id) : undefined}
              actionLabel={getMessage(locale, 'wall.affordance.oneStepAwayAction')}
            />
          ) : (
            <text x={16} y={CARD_H - 48} className="fill-content-muted text-xs font-mono">
              {openChecksLabel}
            </text>
          )}
          <text x={16} y={CARD_H - 24} className="fill-content-muted text-xs">
            {nextMove ? `Next: ${nextMove}` : 'Next: choose the next check'}
          </text>
        </>
      )}
      {hasGap && (
        <g aria-label={evidenceGapAria}>
          <circle cx={CARD_W - 24} cy={24} r={10} fill={chartColors.warning} />
          <text
            x={CARD_W - 24}
            y={28}
            textAnchor="middle"
            className="fill-content text-xs font-bold pointer-events-none"
          >
            !
          </text>
        </g>
      )}
      {missingColumn && !isMedium && (
        <g aria-label={missingColumnAria}>
          <rect
            x={CARD_W - 196}
            y={CARD_H - 28}
            width={180}
            height={20}
            rx={4}
            fill={chartColors.warning}
            opacity={0.15}
            stroke={chartColors.warning}
            strokeWidth={1}
          />
          <text
            x={CARD_W - 188}
            y={CARD_H - 14}
            className="text-[10px] font-medium pointer-events-none"
            fill={chartColors.warning}
          >
            {missingColumnText}
          </text>
        </g>
      )}
    </g>
  );
};
