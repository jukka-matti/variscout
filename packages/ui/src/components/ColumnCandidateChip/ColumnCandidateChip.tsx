/**
 * ColumnCandidateChip — load-bearing visual primitive for FRAME b0 column-selection UI.
 *
 * Renders one clickable chip per dataset column showing column name, type glyph,
 * a mini distribution preview (sparkline for numeric, dots for categorical),
 * and a one-line stats summary. Consumed by W3-3 (Y-picker) and W3-4 (X-picker).
 *
 * Hard rules: semantic Tailwind only (no color-scheme props); <button type="button">
 * root for a11y; formatStatistic() for numeric display (ADR-069 B3).
 */

import type { ReactNode } from 'react';
import type { ColumnAnalysis } from '@variscout/core';
import { formatStatistic } from '@variscout/core/i18n';

export type ColumnCandidateChipState =
  | 'idle'
  | 'selected-as-Y'
  | 'selected-as-X'
  | 'disabled-not-applicable';

export interface ColumnCandidateChipProps {
  /** Column metadata (name, inferred type, uniqueCount, hasVariation, etc.). */
  column: ColumnAnalysis;
  /** Numeric values already extracted (required for numeric sparkline). May be empty. */
  numericValues?: readonly number[];
  /** Categorical level breakdown (required for categorical preview). */
  levels?: ReadonlyArray<{ label: string; count: number }>;
  /** Selection state — drives visual styling. */
  state: ColumnCandidateChipState;
  /** Optional disabled-state reason (tooltip / aria-description). */
  disabledReason?: string;
  /** Click handler. Not called when state === 'disabled-not-applicable'. */
  onClick?: () => void;
  /** Optional aria-label override. Defaults to column name + state description. */
  ariaLabel?: string;
  /** Optional className for layout/spacing. */
  className?: string;
}

const SPARK_WIDTH = 80;
const SPARK_HEIGHT = 24;
const SPARK_BARS = 24;
const SPARK_DECIMATE_THRESHOLD = 200;

// Cycling palette for categorical level dots — distinguishability, not statistical meaning.
const LEVEL_DOT_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
] as const;

// Cap dots and labels at the same number so the dot row stays consistent with
// the text stats line. Beyond this, we show a "+N" overflow indicator.
const LEVEL_TRUNCATE = 4;

const STATE_CLASSES: Record<ColumnCandidateChipState, string> = {
  idle: 'bg-surface-secondary border-edge text-content hover:bg-surface-tertiary cursor-pointer',
  'selected-as-Y': 'bg-blue-500 border-blue-500 text-white cursor-pointer',
  'selected-as-X': 'bg-surface-tertiary border-blue-500 text-content cursor-pointer',
  'disabled-not-applicable':
    'opacity-60 bg-surface-secondary border-edge text-content cursor-not-allowed',
};

const TYPE_GLYPHS: Record<ColumnAnalysis['type'], string> = {
  numeric: '●',
  categorical: '▦',
  date: '📅',
  text: 'Aa',
};

const TYPE_DESCRIPTIONS: Record<ColumnAnalysis['type'], string> = {
  numeric: 'numeric column',
  categorical: 'categorical column',
  date: 'date column',
  text: 'text column',
};

const STATE_DESCRIPTIONS: Record<ColumnCandidateChipState, string> = {
  idle: 'not selected',
  'selected-as-Y': 'selected as Y (outcome)',
  'selected-as-X': 'selected as X (factor)',
  'disabled-not-applicable': 'disabled',
};

/** Even-stride decimation: pick `targetCount` evenly-spaced samples. */
function evenStride(values: readonly number[], targetCount: number): number[] {
  if (values.length <= targetCount) return [...values];
  const stride = values.length / targetCount;
  const out: number[] = [];
  for (let i = 0; i < targetCount; i++) out.push(values[Math.floor(i * stride)]);
  return out;
}

function meanAndStdDev(values: readonly number[]): { mean: number; sd: number } | undefined {
  if (values.length === 0) return undefined;
  let sum = 0;
  for (const v of values) sum += v;
  const mean = sum / values.length;
  let sqSum = 0;
  for (const v of values) {
    const d = v - mean;
    sqSum += d * d;
  }
  // Population stddev (÷N) — intentional glance preview; differs from Stats panel which uses N-1.
  return { mean, sd: Math.sqrt(sqSum / values.length) };
}

function renderSparkline(values: readonly number[]) {
  const sample =
    values.length > SPARK_DECIMATE_THRESHOLD
      ? evenStride(values, SPARK_DECIMATE_THRESHOLD)
      : [...values];
  if (sample.length === 0) return null;
  let min = sample[0];
  let max = sample[0];
  for (const v of sample) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min || 1;
  const barCount = Math.min(SPARK_BARS, sample.length);
  const counts = new Array<number>(barCount).fill(0);
  for (const v of sample) {
    const idx = Math.min(barCount - 1, Math.floor(((v - min) / range) * barCount));
    counts[idx]++;
  }
  const maxCount = Math.max(...counts) || 1;
  const barWidth = SPARK_WIDTH / barCount;
  return (
    <svg
      width={SPARK_WIDTH}
      height={SPARK_HEIGHT}
      viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
      className="text-current opacity-70"
      aria-hidden="true"
    >
      {counts.map((c, i) => {
        const h = (c / maxCount) * SPARK_HEIGHT;
        return (
          <rect
            key={i}
            x={i * barWidth}
            y={SPARK_HEIGHT - h}
            width={Math.max(0.5, barWidth - 0.5)}
            height={h}
            fill="currentColor"
          />
        );
      })}
    </svg>
  );
}

function renderLevelDots(levels: ReadonlyArray<{ label: string; count: number }>) {
  // Cap dot count at LEVEL_TRUNCATE so the dot row stays consistent with the
  // text stats line (which also caps at LEVEL_TRUNCATE). Without a cap, a
  // column with >5 levels would cycle palette colors and visually imply that
  // dot 1 (blue) and dot 6 (blue) represent the same level — they don't.
  const shown = levels.slice(0, LEVEL_TRUNCATE);
  const overflow = levels.length - LEVEL_TRUNCATE;
  return (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      {shown.map((lvl, i) => (
        <span
          key={`${lvl.label}-${i}`}
          className={`inline-block w-2 h-2 rounded-full ${LEVEL_DOT_COLORS[i % LEVEL_DOT_COLORS.length]}`}
        />
      ))}
      {overflow > 0 && <span className="text-xs opacity-60">+{overflow}</span>}
    </span>
  );
}

function numericStatsLine(values: readonly number[]): string {
  const stats = meanAndStdDev(values);
  if (!stats) return `n=${values.length}`;
  return `${formatStatistic(stats.mean)} ± ${formatStatistic(stats.sd)}   n=${values.length}`;
}

function categoricalStatsLine(levels: ReadonlyArray<{ label: string; count: number }>): string {
  const total = levels.reduce((s, l) => s + l.count, 0);
  const shown = levels.slice(0, LEVEL_TRUNCATE).map(l => l.label);
  const labelStr = levels.length > LEVEL_TRUNCATE ? `${shown.join(' · ')} · …` : shown.join(' · ');
  return `${labelStr}   n=${total}`;
}

function dateStatsLine(column: ColumnAnalysis): string {
  const first = column.sampleValues[0] ?? '—';
  const last = column.sampleValues[column.sampleValues.length - 1] ?? '—';
  return `${first} → ${last}`;
}

export function ColumnCandidateChip({
  column,
  numericValues,
  levels,
  state,
  disabledReason,
  onClick,
  ariaLabel,
  className,
}: ColumnCandidateChipProps) {
  const isDisabled = state === 'disabled-not-applicable';
  const isPressed = state === 'selected-as-Y' || state === 'selected-as-X';
  const handleClick = () => {
    if (isDisabled) return;
    onClick?.();
  };
  const defaultAriaLabel = `${column.name}, ${TYPE_DESCRIPTIONS[column.type]}, ${STATE_DESCRIPTIONS[state]}`;

  let preview: ReactNode = null;
  let statsLine = '';
  if (column.type === 'numeric') {
    const hasVals = !!numericValues && numericValues.length > 0;
    preview = hasVals ? renderSparkline(numericValues!) : null;
    statsLine = hasVals ? numericStatsLine(numericValues!) : '';
  } else if (column.type === 'categorical') {
    const hasLevels = !!levels && levels.length > 0;
    preview = hasLevels ? renderLevelDots(levels!) : null;
    statsLine = hasLevels ? categoricalStatsLine(levels!) : '';
  } else if (column.type === 'date') {
    statsLine = dateStatsLine(column);
  } else {
    statsLine = `unique=${column.uniqueCount}`;
  }

  const containerClass = [
    'inline-flex flex-col items-start gap-1 px-3 py-2 rounded-lg border text-left transition-colors min-w-0 max-w-full',
    STATE_CLASSES[state],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isPressed}
      aria-disabled={isDisabled}
      aria-label={ariaLabel ?? defaultAriaLabel}
      title={isDisabled ? disabledReason : undefined}
      data-testid="column-candidate-chip"
      data-state={state}
      className={containerClass}
    >
      <span className="inline-flex items-center gap-2 text-sm font-medium min-w-0 max-w-full">
        <span aria-hidden="true" className="opacity-80 shrink-0">
          {TYPE_GLYPHS[column.type]}
        </span>
        <span className="truncate">{column.name}</span>
        {preview && <span className="shrink-0">{preview}</span>}
      </span>
      {statsLine && <span className="text-xs opacity-75 truncate max-w-full">{statsLine}</span>}
    </button>
  );
}
