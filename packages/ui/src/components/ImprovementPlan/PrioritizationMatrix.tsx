import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from '@variscout/hooks';
import type {
  IdeaTimeframe,
  IdeaCost,
  IdeaRiskAssessment,
  IdeaImpact,
  IdeaDirection,
  FindingProjection,
  ComputedRiskLevel,
  IdeaCostCategory,
} from '@variscout/core';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type MatrixDimension = 'benefit' | 'timeframe' | 'cost' | 'risk';

export interface MatrixIdea {
  id: string;
  text: string;
  timeframe?: IdeaTimeframe;
  cost?: IdeaCost;
  risk?: IdeaRiskAssessment;
  impactOverride?: IdeaImpact;
  projection?: FindingProjection;
  direction?: IdeaDirection;
  selected?: boolean;
}

export interface MatrixPreset {
  id: string;
  labelKey: string;
  xAxis: MatrixDimension;
  yAxis: MatrixDimension;
  colorBy: MatrixDimension;
}

export interface PrioritizationMatrixProps {
  ideas: MatrixIdea[];
  xAxis: MatrixDimension;
  yAxis: MatrixDimension;
  colorBy: MatrixDimension;
  onToggleSelect: (ideaId: string) => void;
  onAxisChange: (axis: 'x' | 'y' | 'color', value: MatrixDimension) => void;
  presets?: MatrixPreset[];
  activePreset?: string;
  onPresetChange?: (presetId: string) => void;
}

// ---------------------------------------------------------------------------
// Default presets
// ---------------------------------------------------------------------------

export const DEFAULT_PRESETS: MatrixPreset[] = [
  {
    id: 'bang-for-buck',
    labelKey: 'matrix.preset.bangForBuck',
    xAxis: 'cost',
    yAxis: 'benefit',
    colorBy: 'risk',
  },
  {
    id: 'quick-impact',
    labelKey: 'matrix.preset.quickImpact',
    xAxis: 'timeframe',
    yAxis: 'benefit',
    colorBy: 'risk',
  },
  {
    id: 'risk-reward',
    labelKey: 'matrix.preset.riskReward',
    xAxis: 'risk',
    yAxis: 'benefit',
    colorBy: 'timeframe',
  },
  {
    id: 'budget-view',
    labelKey: 'matrix.preset.budgetView',
    xAxis: 'timeframe',
    yAxis: 'cost',
    colorBy: 'benefit',
  },
];

// ---------------------------------------------------------------------------
// Dimension positioning helpers
// ---------------------------------------------------------------------------

const TIMEFRAME_POS: Record<IdeaTimeframe, number> = {
  'just-do': 0.15,
  days: 0.38,
  weeks: 0.62,
  months: 0.85,
};

const COST_CATEGORY_POS: Record<IdeaCostCategory, number> = {
  none: 0.15,
  low: 0.38,
  medium: 0.62,
  high: 0.85,
};

const RISK_POS: Record<ComputedRiskLevel, number> = {
  low: 0.15,
  medium: 0.38,
  high: 0.62,
  'very-high': 0.85,
};

const BENEFIT_MANUAL_POS: Record<IdeaImpact, number> = {
  low: 0.75,
  medium: 0.5,
  high: 0.25,
};

// ---------------------------------------------------------------------------
// Color mappings for colorBy
// ---------------------------------------------------------------------------

const TIMEFRAME_COLORS: Record<IdeaTimeframe, string> = {
  'just-do': '#22c55e',
  days: '#06b6d4',
  weeks: '#f59e0b',
  months: '#ef4444',
};

const RISK_COLORS: Record<ComputedRiskLevel, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  'very-high': '#991b1b',
};

const COST_COLORS: Record<IdeaCostCategory, string> = {
  none: '#22c55e',
  low: '#06b6d4',
  medium: '#f59e0b',
  high: '#ef4444',
};

const BENEFIT_COLORS: Record<IdeaImpact, string> = {
  low: '#ef4444',
  medium: '#f59e0b',
  high: '#22c55e',
};

const GRAY_DOT = '#64748b';

// ---------------------------------------------------------------------------
// Axis dimension labels (i18n keys for tick labels)
// ---------------------------------------------------------------------------

const TIMEFRAME_LABELS: IdeaTimeframe[] = ['just-do', 'days', 'weeks', 'months'];
const COST_LABELS: IdeaCostCategory[] = ['none', 'low', 'medium', 'high'];
const RISK_LABELS: ComputedRiskLevel[] = ['low', 'medium', 'high', 'very-high'];
const BENEFIT_LABELS: IdeaImpact[] = ['high', 'medium', 'low']; // top to bottom

// ---------------------------------------------------------------------------
// Positioning logic
// ---------------------------------------------------------------------------

function getCategoricalPosition(dimension: MatrixDimension, idea: MatrixIdea): number | undefined {
  switch (dimension) {
    case 'timeframe':
      return idea.timeframe ? TIMEFRAME_POS[idea.timeframe] : undefined;
    case 'cost':
      return idea.cost ? COST_CATEGORY_POS[idea.cost.category] : undefined;
    case 'risk':
      return idea.risk ? RISK_POS[idea.risk.computed] : undefined;
    case 'benefit': {
      if (idea.impactOverride) return BENEFIT_MANUAL_POS[idea.impactOverride];
      // Continuous benefit handled separately
      return undefined;
    }
  }
}

interface NormRange {
  min: number;
  max: number;
}

function computeContinuousRanges(
  ideas: MatrixIdea[],
  xAxis: MatrixDimension,
  yAxis: MatrixDimension
): { xRange: NormRange | null; yRange: NormRange | null } {
  let xRange: NormRange | null = null;
  let yRange: NormRange | null = null;

  if (xAxis === 'benefit' || yAxis === 'benefit') {
    // Use projectedCpk directly as the continuous value
    const values = ideas
      .filter(i => i.projection?.projectedCpk != null && !i.impactOverride)
      .map(i => i.projection!.projectedCpk!);

    if (values.length > 0) {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = { min, max };
      if (xAxis === 'benefit') xRange = range;
      if (yAxis === 'benefit') yRange = range;
    }
  }

  if (xAxis === 'cost' || yAxis === 'cost') {
    const amounts = ideas.filter(i => i.cost?.amount != null).map(i => i.cost!.amount!);

    if (amounts.length > 0) {
      const min = Math.min(...amounts);
      const max = Math.max(...amounts);
      const range = { min, max };
      if (xAxis === 'cost') xRange = range;
      if (yAxis === 'cost') yRange = range;
    }
  }

  return { xRange, yRange };
}

function getContinuousPosition(
  dimension: MatrixDimension,
  idea: MatrixIdea,
  range: NormRange | null
): number | undefined {
  if (dimension === 'benefit' && idea.projection?.projectedCpk != null && !idea.impactOverride) {
    if (!range || range.max === range.min) return 0.5;
    // Invert: higher Cpk = top (lower y fraction)
    const normalized = (idea.projection.projectedCpk - range.min) / (range.max - range.min);
    return 0.85 - normalized * 0.7; // map to 0.15..0.85 inverted
  }
  if (dimension === 'cost' && idea.cost?.amount != null) {
    if (!range || range.max === range.min) return 0.5;
    const normalized = (idea.cost.amount - range.min) / (range.max - range.min);
    return 0.15 + normalized * 0.7;
  }
  return undefined;
}

function getPosition(
  dimension: MatrixDimension,
  idea: MatrixIdea,
  range: NormRange | null
): number | undefined {
  const categorical = getCategoricalPosition(dimension, idea);
  if (categorical != null) return categorical;
  return getContinuousPosition(dimension, idea, range);
}

function getColor(colorBy: MatrixDimension, idea: MatrixIdea): string {
  switch (colorBy) {
    case 'timeframe':
      return idea.timeframe ? TIMEFRAME_COLORS[idea.timeframe] : GRAY_DOT;
    case 'risk':
      return idea.risk ? RISK_COLORS[idea.risk.computed] : GRAY_DOT;
    case 'cost':
      return idea.cost ? COST_COLORS[idea.cost.category] : GRAY_DOT;
    case 'benefit': {
      const impact = idea.impactOverride;
      return impact ? BENEFIT_COLORS[impact] : GRAY_DOT;
    }
  }
}

function getTickLabels(
  dimension: MatrixDimension,
  isYAxis: boolean
): Array<{ label: string; pos: number }> {
  switch (dimension) {
    case 'timeframe':
      return TIMEFRAME_LABELS.map(l => ({ label: `timeframe.${l}`, pos: TIMEFRAME_POS[l] }));
    case 'cost':
      return COST_LABELS.map(l => ({ label: `cost.${l}`, pos: COST_CATEGORY_POS[l] }));
    case 'risk':
      return RISK_LABELS.map(l => ({ label: `risk.${l}`, pos: RISK_POS[l] }));
    case 'benefit':
      return BENEFIT_LABELS.map(l => ({
        label: `benefit.${l}`,
        pos: isYAxis ? BENEFIT_MANUAL_POS[l] : 1 - BENEFIT_MANUAL_POS[l],
      }));
  }
}

function getLegendEntries(colorBy: MatrixDimension): Array<{ labelKey: string; color: string }> {
  switch (colorBy) {
    case 'timeframe':
      return TIMEFRAME_LABELS.map(l => ({
        labelKey: `timeframe.${l}`,
        color: TIMEFRAME_COLORS[l],
      }));
    case 'risk':
      return RISK_LABELS.map(l => ({ labelKey: `risk.${l}`, color: RISK_COLORS[l] }));
    case 'cost':
      return COST_LABELS.map(l => ({ labelKey: `cost.${l}`, color: COST_COLORS[l] }));
    case 'benefit':
      return (['high', 'medium', 'low'] as IdeaImpact[]).map(l => ({
        labelKey: `benefit.${l}`,
        color: BENEFIT_COLORS[l],
      }));
  }
}

// ---------------------------------------------------------------------------
// Tooltip builder
// ---------------------------------------------------------------------------

function buildTooltip(idea: MatrixIdea, t: (key: string) => string): string {
  const lines: string[] = [idea.text];
  if (idea.timeframe)
    lines.push(`${t('matrix.axis.timeframe')}: ${t(`timeframe.${idea.timeframe}`)}`);
  if (idea.cost) {
    const costLabel = t(`cost.${idea.cost.category}`);
    const amount =
      idea.cost.amount != null ? ` (${idea.cost.currency ?? '€'}${idea.cost.amount})` : '';
    lines.push(`${t('matrix.axis.cost')}: ${costLabel}${amount}`);
  }
  if (idea.risk) lines.push(`${t('matrix.axis.risk')}: ${t(`risk.${idea.risk.computed}`)}`);
  if (idea.impactOverride)
    lines.push(`${t('matrix.axis.benefit')}: ${t(`benefit.${idea.impactOverride}`)}`);
  if (idea.projection?.projectedCpk != null)
    lines.push(`Cpk: ${idea.projection.projectedCpk.toFixed(2)}`);
  lines.push(`\n${t('matrix.clickToSelect')}`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// SVG chart constants
// ---------------------------------------------------------------------------

const VIEWBOX_W = 600;
const VIEWBOX_H = 300;
const MARGIN = { top: 20, right: 20, bottom: 32, left: 48 };
const CHART_W = VIEWBOX_W - MARGIN.left - MARGIN.right;
const CHART_H = VIEWBOX_H - MARGIN.top - MARGIN.bottom;
const DOT_R = 14;

// ---------------------------------------------------------------------------
// Dimension selector dropdown
// ---------------------------------------------------------------------------

const DIMENSIONS: MatrixDimension[] = ['benefit', 'timeframe', 'cost', 'risk'];

interface DimensionSelectProps {
  label: string;
  value: MatrixDimension;
  onChange: (v: MatrixDimension) => void;
  t: (key: string) => string;
}

const DimensionSelect: React.FC<DimensionSelectProps> = ({ label, value, onChange, t }) => (
  <label className="flex items-center gap-1 text-xs text-content/70">
    {label}
    <select
      className="rounded border border-edge bg-surface px-1.5 py-0.5 text-xs text-content focus:outline-none focus:ring-1 focus:ring-blue-500"
      value={value}
      onChange={e => onChange(e.target.value as MatrixDimension)}
    >
      {DIMENSIONS.map(d => (
        <option key={d} value={d}>
          {t(`matrix.axis.${d}`)}
        </option>
      ))}
    </select>
  </label>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PrioritizationMatrix: React.FC<PrioritizationMatrixProps> = ({
  ideas,
  xAxis,
  yAxis,
  colorBy,
  onToggleSelect,
  onAxisChange,
  presets = DEFAULT_PRESETS,
  activePreset,
  onPresetChange,
}) => {
  const { t: t_ } = useTranslation();
  // Widen t to accept computed string keys (e.g., `matrix.axis.${d}`)
  const t = t_ as (key: string) => string;
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const { xRange, yRange } = useMemo(
    () => computeContinuousRanges(ideas, xAxis, yAxis),
    [ideas, xAxis, yAxis]
  );

  // Compute positioned dots
  const dots = useMemo(() => {
    return ideas
      .map((idea, index) => {
        const xFrac = getPosition(xAxis, idea, xRange);
        const yFrac = getPosition(yAxis, idea, yRange);
        if (xFrac == null || yFrac == null) return null;
        return {
          idea,
          index: index + 1,
          cx: MARGIN.left + xFrac * CHART_W,
          cy: MARGIN.top + yFrac * CHART_H,
          color: getColor(colorBy, idea),
        };
      })
      .filter(Boolean) as Array<{
      idea: MatrixIdea;
      index: number;
      cx: number;
      cy: number;
      color: string;
    }>;
  }, [ideas, xAxis, yAxis, colorBy, xRange, yRange]);

  const xTicks = useMemo(() => getTickLabels(xAxis, false), [xAxis]);
  const yTicks = useMemo(() => getTickLabels(yAxis, true), [yAxis]);
  const legendEntries = useMemo(() => getLegendEntries(colorBy), [colorBy]);

  // Determine if quick-wins label should show (benefit on Y, low-cost or fast on X)
  const showQuickWins = yAxis === 'benefit' && (xAxis === 'timeframe' || xAxis === 'cost');

  return (
    <div
      data-testid="prioritization-matrix"
      className="rounded-lg border border-edge bg-surface-secondary p-4"
    >
      {/* Axis selectors + presets */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <DimensionSelect label={`Y:`} value={yAxis} onChange={v => onAxisChange('y', v)} t={t} />
        <DimensionSelect label={`X:`} value={xAxis} onChange={v => onAxisChange('x', v)} t={t} />
        <DimensionSelect
          label={`${t('matrix.color')}:`}
          value={colorBy}
          onChange={v => onAxisChange('color', v)}
          t={t}
        />

        {presets.length > 0 && (
          <div className="flex flex-wrap gap-1.5 ml-auto">
            {presets.map(p => (
              <button
                key={p.id}
                data-testid={`matrix-preset-${p.id}`}
                className={`rounded-full px-2.5 py-0.5 text-xs border transition-colors ${
                  activePreset === p.id
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400 font-medium'
                    : 'border-edge text-content/60 hover:border-blue-400 hover:text-content'
                }`}
                onClick={() => onPresetChange?.(p.id)}
              >
                {t(p.labelKey)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SVG chart */}
      <div className="relative">
        <svg
          data-testid="matrix-chart"
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
          className="w-full"
          style={{ maxHeight: 300 }}
        >
          {/* Grid lines */}
          <g>
            {xTicks.map(tick => {
              const x = MARGIN.left + tick.pos * CHART_W;
              return (
                <line
                  key={`xg-${tick.label}`}
                  x1={x}
                  y1={MARGIN.top}
                  x2={x}
                  y2={MARGIN.top + CHART_H}
                  stroke="currentColor"
                  className="text-content/10"
                  strokeDasharray="2 4"
                />
              );
            })}
            {yTicks.map(tick => {
              const y = MARGIN.top + tick.pos * CHART_H;
              return (
                <line
                  key={`yg-${tick.label}`}
                  x1={MARGIN.left}
                  y1={y}
                  x2={MARGIN.left + CHART_W}
                  y2={y}
                  stroke="currentColor"
                  className="text-content/10"
                  strokeDasharray="2 4"
                />
              );
            })}
          </g>

          {/* Axes */}
          <line
            x1={MARGIN.left}
            y1={MARGIN.top}
            x2={MARGIN.left}
            y2={MARGIN.top + CHART_H}
            stroke="currentColor"
            className="text-content/30"
          />
          <line
            x1={MARGIN.left}
            y1={MARGIN.top + CHART_H}
            x2={MARGIN.left + CHART_W}
            y2={MARGIN.top + CHART_H}
            stroke="currentColor"
            className="text-content/30"
          />

          {/* X-axis tick labels */}
          {xTicks.map(tick => {
            const x = MARGIN.left + tick.pos * CHART_W;
            return (
              <text
                key={`xt-${tick.label}`}
                x={x}
                y={MARGIN.top + CHART_H + 14}
                textAnchor="middle"
                className="fill-content/50"
                fontSize={9}
              >
                {t(tick.label)}
              </text>
            );
          })}

          {/* Y-axis tick labels */}
          {yTicks.map(tick => {
            const y = MARGIN.top + tick.pos * CHART_H;
            return (
              <text
                key={`yt-${tick.label}`}
                x={MARGIN.left - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-content/50"
                fontSize={9}
              >
                {t(tick.label)}
              </text>
            );
          })}

          {/* Axis titles */}
          <text
            x={MARGIN.left + CHART_W / 2}
            y={VIEWBOX_H - 2}
            textAnchor="middle"
            className="fill-content/70"
            fontSize={10}
            fontWeight={500}
          >
            {t(`matrix.axis.${xAxis}`)}
          </text>
          <text
            x={12}
            y={MARGIN.top + CHART_H / 2}
            textAnchor="middle"
            className="fill-content/70"
            fontSize={10}
            fontWeight={500}
            transform={`rotate(-90, 12, ${MARGIN.top + CHART_H / 2})`}
          >
            {t(`matrix.axis.${yAxis}`)}
          </text>

          {/* Quick Wins label */}
          {showQuickWins && (
            <text
              data-testid="matrix-quick-wins"
              x={MARGIN.left + 8}
              y={MARGIN.top + 14}
              className="fill-green-500/60"
              fontSize={10}
              fontWeight={600}
            >
              {`★ ${t('matrix.quickWins')}`}
            </text>
          )}

          {/* Dots */}
          {dots.map(({ idea, index, cx, cy, color }) => (
            <g
              key={idea.id}
              data-testid={`matrix-dot-${idea.id}`}
              className="cursor-pointer"
              onClick={() => onToggleSelect(idea.id)}
              onMouseEnter={() => setHoveredId(idea.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <title>{buildTooltip(idea, t)}</title>

              {/* Selection ring */}
              {idea.selected && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={DOT_R + 3}
                  fill="none"
                  stroke="white"
                  strokeWidth={2}
                  opacity={0.9}
                />
              )}

              {/* Hover ring */}
              {hoveredId === idea.id && !idea.selected && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={DOT_R + 2}
                  fill="none"
                  stroke="white"
                  strokeWidth={1}
                  opacity={0.4}
                />
              )}

              {/* Main dot */}
              <circle
                cx={cx}
                cy={cy}
                r={DOT_R}
                fill={color}
                opacity={0.85}
                stroke={idea.selected ? 'white' : 'none'}
                strokeWidth={idea.selected ? 2 : 0}
              />

              {/* Number label */}
              <text
                x={cx}
                y={cy + 3.5}
                textAnchor="middle"
                fill="white"
                fontSize={10}
                fontWeight={600}
                pointerEvents="none"
              >
                {index}
              </text>
            </g>
          ))}
        </svg>

        {/* Hidden tooltip ref for potential future custom tooltip */}
        <div ref={tooltipRef} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-content/60">
        {legendEntries.map(entry => (
          <span key={entry.labelKey} className="flex items-center gap-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {t(entry.labelKey)}
          </span>
        ))}
        <span className="flex items-center gap-1 ml-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-white/80 bg-transparent" />
          {t('matrix.selected')}
        </span>
      </div>
    </div>
  );
};
