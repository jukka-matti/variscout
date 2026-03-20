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
import type { MessageCatalog } from '@variscout/core/i18n';

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
// i18n key mapping (enum values to MessageCatalog keys)
// ---------------------------------------------------------------------------

const TIMEFRAME_I18N: Record<IdeaTimeframe, keyof MessageCatalog> = {
  'just-do': 'timeframe.justDo',
  days: 'timeframe.days',
  weeks: 'timeframe.weeks',
  months: 'timeframe.months',
};

const COST_I18N: Record<IdeaCostCategory, keyof MessageCatalog> = {
  none: 'cost.none',
  low: 'cost.low',
  medium: 'cost.medium',
  high: 'cost.high',
};

const RISK_I18N: Record<ComputedRiskLevel, keyof MessageCatalog> = {
  low: 'risk.low',
  medium: 'risk.medium',
  high: 'risk.high',
  'very-high': 'risk.veryHigh',
};

const BENEFIT_I18N: Record<IdeaImpact, keyof MessageCatalog> = {
  low: 'benefit.low',
  medium: 'benefit.medium',
  high: 'benefit.high',
};

const AXIS_I18N: Record<MatrixDimension, keyof MessageCatalog> = {
  benefit: 'matrix.axis.benefit',
  timeframe: 'matrix.axis.timeframe',
  cost: 'matrix.axis.cost',
  risk: 'matrix.axis.risk',
};

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
// Ordered labels for axes/legends
// ---------------------------------------------------------------------------

const TIMEFRAME_ORDER: IdeaTimeframe[] = ['just-do', 'days', 'weeks', 'months'];
const COST_ORDER: IdeaCostCategory[] = ['none', 'low', 'medium', 'high'];
const RISK_ORDER: ComputedRiskLevel[] = ['low', 'medium', 'high', 'very-high'];
const BENEFIT_ORDER_Y: IdeaImpact[] = ['high', 'medium', 'low'];

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
    const values = ideas
      .filter(i => i.projection?.projectedCpk != null && !i.impactOverride)
      .map(i => i.projection!.projectedCpk!);

    if (values.length > 0) {
      const range = { min: Math.min(...values), max: Math.max(...values) };
      if (xAxis === 'benefit') xRange = range;
      if (yAxis === 'benefit') yRange = range;
    }
  }

  if (xAxis === 'cost' || yAxis === 'cost') {
    const amounts = ideas.filter(i => i.cost?.amount != null).map(i => i.cost!.amount!);

    if (amounts.length > 0) {
      const range = { min: Math.min(...amounts), max: Math.max(...amounts) };
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
    const normalized = (idea.projection.projectedCpk - range.min) / (range.max - range.min);
    return 0.85 - normalized * 0.7;
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
    case 'benefit':
      return idea.impactOverride ? BENEFIT_COLORS[idea.impactOverride] : GRAY_DOT;
  }
}

// ---------------------------------------------------------------------------
// Tick / legend builders
// ---------------------------------------------------------------------------

interface TickItem {
  i18nKey: keyof MessageCatalog;
  pos: number;
}

function getTickLabels(dimension: MatrixDimension, isYAxis: boolean): TickItem[] {
  switch (dimension) {
    case 'timeframe':
      return TIMEFRAME_ORDER.map(l => ({
        i18nKey: TIMEFRAME_I18N[l],
        pos: TIMEFRAME_POS[l],
      }));
    case 'cost':
      return COST_ORDER.map(l => ({
        i18nKey: COST_I18N[l],
        pos: COST_CATEGORY_POS[l],
      }));
    case 'risk':
      return RISK_ORDER.map(l => ({
        i18nKey: RISK_I18N[l],
        pos: RISK_POS[l],
      }));
    case 'benefit':
      return BENEFIT_ORDER_Y.map(l => ({
        i18nKey: BENEFIT_I18N[l],
        pos: isYAxis ? BENEFIT_MANUAL_POS[l] : 1 - BENEFIT_MANUAL_POS[l],
      }));
  }
}

interface LegendItem {
  i18nKey: keyof MessageCatalog;
  color: string;
}

function getLegendEntries(colorBy: MatrixDimension): LegendItem[] {
  switch (colorBy) {
    case 'timeframe':
      return TIMEFRAME_ORDER.map(l => ({
        i18nKey: TIMEFRAME_I18N[l],
        color: TIMEFRAME_COLORS[l],
      }));
    case 'risk':
      return RISK_ORDER.map(l => ({
        i18nKey: RISK_I18N[l],
        color: RISK_COLORS[l],
      }));
    case 'cost':
      return COST_ORDER.map(l => ({
        i18nKey: COST_I18N[l],
        color: COST_COLORS[l],
      }));
    case 'benefit':
      return (['high', 'medium', 'low'] as IdeaImpact[]).map(l => ({
        i18nKey: BENEFIT_I18N[l],
        color: BENEFIT_COLORS[l],
      }));
  }
}

// ---------------------------------------------------------------------------
// Tooltip builder
// ---------------------------------------------------------------------------

function buildTooltip(idea: MatrixIdea, t: (key: keyof MessageCatalog) => string): string {
  const lines: string[] = [idea.text];
  if (idea.timeframe) {
    lines.push(`${t('matrix.axis.timeframe')}: ${t(TIMEFRAME_I18N[idea.timeframe])}`);
  }
  if (idea.cost) {
    const costLabel = t(COST_I18N[idea.cost.category]);
    const amount =
      idea.cost.amount != null ? ` (${idea.cost.currency ?? '\u20AC'}${idea.cost.amount})` : '';
    lines.push(`${t('matrix.axis.cost')}: ${costLabel}${amount}`);
  }
  if (idea.risk) {
    lines.push(`${t('matrix.axis.risk')}: ${t(RISK_I18N[idea.risk.computed])}`);
  }
  if (idea.impactOverride) {
    lines.push(`${t('matrix.axis.benefit')}: ${t(BENEFIT_I18N[idea.impactOverride])}`);
  }
  if (idea.projection?.projectedCpk != null) {
    lines.push(`Cpk: ${idea.projection.projectedCpk.toFixed(2)}`);
  }
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
  t: (key: keyof MessageCatalog) => string;
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
          {t(AXIS_I18N[d])}
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
  const { t } = useTranslation();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const { xRange, yRange } = useMemo(
    () => computeContinuousRanges(ideas, xAxis, yAxis),
    [ideas, xAxis, yAxis]
  );

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

  const showQuickWins = yAxis === 'benefit' && (xAxis === 'timeframe' || xAxis === 'cost');

  return (
    <div
      data-testid="prioritization-matrix"
      className="rounded-lg border border-edge bg-surface-secondary p-4"
    >
      {/* Axis selectors + presets */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <DimensionSelect label="Y:" value={yAxis} onChange={v => onAxisChange('y', v)} t={t} />
        <DimensionSelect label="X:" value={xAxis} onChange={v => onAxisChange('x', v)} t={t} />
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
                {t(p.labelKey as keyof MessageCatalog)}
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
                  key={`xg-${tick.i18nKey}`}
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
                  key={`yg-${tick.i18nKey}`}
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
                key={`xt-${tick.i18nKey}`}
                x={x}
                y={MARGIN.top + CHART_H + 14}
                textAnchor="middle"
                className="fill-content/50"
                fontSize={9}
              >
                {t(tick.i18nKey)}
              </text>
            );
          })}

          {/* Y-axis tick labels */}
          {yTicks.map(tick => {
            const y = MARGIN.top + tick.pos * CHART_H;
            return (
              <text
                key={`yt-${tick.i18nKey}`}
                x={MARGIN.left - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-content/50"
                fontSize={9}
              >
                {t(tick.i18nKey)}
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
            {t(AXIS_I18N[xAxis])}
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
            {t(AXIS_I18N[yAxis])}
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
              {`\u2605 ${t('matrix.quickWins')}`}
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

        <div ref={tooltipRef} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-content/60">
        {legendEntries.map(entry => (
          <span key={entry.i18nKey} className="flex items-center gap-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {t(entry.i18nKey)}
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
