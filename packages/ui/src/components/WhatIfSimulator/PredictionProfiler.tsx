/**
 * @deprecated Use WhatIfExplorer (ModelInformedEstimator mode) from @variscout/ui instead.
 * This component remains until WhatIfPageBase (improvement workflow full page) is migrated.
 */
import React, { useCallback, useMemo } from 'react';
import { AlertTriangle, TrendingUp } from 'lucide-react';

export interface PredictionProfilerFactor {
  name: string;
  type: 'continuous' | 'categorical';
  /** Current setting */
  currentValue: number | string;
  /** For continuous: data range */
  range?: { min: number; max: number };
  /** For continuous: current process mean (shown as ghost marker) */
  processMean?: number;
  /** For continuous: mini prediction trace points */
  predictionTrace?: Array<{ x: number; y: number }>;
  /** For continuous: whether quadratic curve with an optimum */
  hasOptimum?: boolean;
  /** For continuous: optimal value */
  optimumValue?: number;
  /** For categorical: available levels */
  levels?: string[];
  /** For categorical: predicted values per level (for bar chart) */
  levelPredictions?: Array<{ level: string; predicted: number }>;
  /** Effect magnitude (for display, optional) */
  effectMagnitude?: number;
}

export interface PredictionProfilerProps {
  /** Factor configurations */
  factors: PredictionProfilerFactor[];
  /** Current predicted value (recomputed upstream when settings change) */
  predictedValue: number;
  /** Current Cpk (recomputed upstream) */
  predictedCpk?: number;
  /** Outcome label */
  outcomeLabel: string;
  /** Callback when any factor value changes */
  onValueChange: (factorName: string, value: string | number) => void;
  /** Trust level for the model */
  trustLevel?: 'strong' | 'moderate' | 'weak';
  /** R²adj for display */
  rSquaredAdj?: number;
  className?: string;
}

// ─── SVG Trace ───────────────────────────────────────────────────────────────

interface TraceProps {
  trace: Array<{ x: number; y: number }>;
  currentX: number;
  processMeanX?: number;
  range: { min: number; max: number };
  width: number;
  height: number;
}

const TRACE_HEIGHT = 56;
const TRACE_PADDING_Y = 6;

function ContinuousTrace({ trace, currentX, processMeanX, range, width, height }: TraceProps) {
  if (trace.length < 2) return null;

  const yValues = trace.map(p => p.y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const yRange = maxY - minY || 1;
  const xRange = range.max - range.min || 1;

  const toSvgX = (x: number) => ((x - range.min) / xRange) * width;
  const toSvgY = (y: number) =>
    height - TRACE_PADDING_Y - ((y - minY) / yRange) * (height - TRACE_PADDING_Y * 2);

  const points = trace.map(p => `${toSvgX(p.x).toFixed(1)},${toSvgY(p.y).toFixed(1)}`).join(' ');

  const currentSvgX = Math.max(0, Math.min(width, toSvgX(currentX)));
  const currentTraceY = (() => {
    // Interpolate Y at currentX
    for (let i = 0; i < trace.length - 1; i++) {
      if (currentX >= trace[i].x && currentX <= trace[i + 1].x) {
        const t = (currentX - trace[i].x) / (trace[i + 1].x - trace[i].x);
        return toSvgY(trace[i].y + t * (trace[i + 1].y - trace[i].y));
      }
    }
    return toSvgY(trace[trace.length - 1].y);
  })();

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      {/* Trace line */}
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-blue-500"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Process mean ghost marker */}
      {processMeanX != null && (
        <circle
          cx={toSvgX(processMeanX).toFixed(1)}
          cy={(() => {
            for (let i = 0; i < trace.length - 1; i++) {
              if (processMeanX >= trace[i].x && processMeanX <= trace[i + 1].x) {
                const t = (processMeanX - trace[i].x) / (trace[i + 1].x - trace[i].x);
                return toSvgY(trace[i].y + t * (trace[i + 1].y - trace[i].y));
              }
            }
            return toSvgY(trace[trace.length - 1].y);
          })()}
          r="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-slate-400"
        />
      )}

      {/* Current value diamond marker */}
      <polygon
        points={`${currentSvgX},${currentTraceY - 5} ${currentSvgX + 4},${currentTraceY} ${currentSvgX},${currentTraceY + 5} ${currentSvgX - 4},${currentTraceY}`}
        fill="currentColor"
        className="text-blue-500"
      />
    </svg>
  );
}

// ─── Categorical Bar Chart ────────────────────────────────────────────────────

interface CategoricalBarsProps {
  levelPredictions: Array<{ level: string; predicted: number }>;
  selectedLevel: string;
  onSelect: (level: string) => void;
  width: number;
  height: number;
}

const CAT_BAR_HEIGHT = 36;

function CategoricalBars({
  levelPredictions,
  selectedLevel,
  onSelect,
  width,
  height,
}: CategoricalBarsProps) {
  if (levelPredictions.length === 0) return null;

  const values = levelPredictions.map(lp => lp.predicted);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const valRange = maxVal - minVal || 1;

  const barWidth = Math.floor(
    (width - (levelPredictions.length - 1) * 4) / levelPredictions.length
  );

  return (
    <svg width={width} height={height} aria-label="Predicted values per level" role="img">
      {levelPredictions.map((lp, i) => {
        const isSelected = lp.level === selectedLevel;
        const barH = Math.max(4, ((lp.predicted - minVal) / valRange) * (height - 12));
        const x = i * (barWidth + 4);
        const y = height - barH;

        return (
          <g
            key={lp.level}
            className="cursor-pointer"
            onClick={() => onSelect(lp.level)}
            role="button"
            aria-label={`Select ${lp.level}`}
            aria-pressed={isSelected}
          >
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={2}
              fill={isSelected ? '#22c55e' : '#94a3b8'}
              opacity={isSelected ? 1 : 0.6}
            />
            {barWidth > 20 && (
              <text
                x={x + barWidth / 2}
                y={height}
                textAnchor="middle"
                fontSize="9"
                fill="currentColor"
                className="text-content-muted"
              >
                {lp.level.length > 6 ? lp.level.slice(0, 5) + '…' : lp.level}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Factor Card ──────────────────────────────────────────────────────────────

interface FactorCardProps {
  factor: PredictionProfilerFactor;
  onValueChange: (factorName: string, value: string | number) => void;
}

function FactorCard({ factor, onValueChange }: FactorCardProps) {
  const currentNum = typeof factor.currentValue === 'number' ? factor.currentValue : NaN;

  const isOutsideRange = useMemo(() => {
    if (factor.type !== 'continuous' || !factor.range || isNaN(currentNum)) return false;
    return currentNum < factor.range.min || currentNum > factor.range.max;
  }, [factor.type, factor.range, currentNum]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange(factor.name, parseFloat(e.target.value));
    },
    [factor.name, onValueChange]
  );

  const displayValue =
    typeof factor.currentValue === 'number'
      ? !Number.isFinite(factor.currentValue)
        ? '—'
        : factor.currentValue % 1 === 0
          ? factor.currentValue.toFixed(0)
          : factor.currentValue.toFixed(2)
      : factor.currentValue;

  return (
    <div className="rounded-md border border-edge bg-surface-secondary/50 p-2.5 space-y-2">
      {/* Factor name + current value */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-content truncate">{factor.name}</span>
        <span className="text-xs font-mono text-content-secondary shrink-0">{displayValue}</span>
      </div>

      {factor.type === 'continuous' && factor.range && !isNaN(currentNum) && (
        <>
          {/* Mini prediction trace */}
          {factor.predictionTrace && factor.predictionTrace.length >= 2 && (
            <div className="w-full">
              <ContinuousTrace
                trace={factor.predictionTrace}
                currentX={currentNum}
                processMeanX={factor.processMean}
                range={factor.range}
                width={220}
                height={TRACE_HEIGHT}
              />
            </div>
          )}

          {/* Slider */}
          <div className="space-y-1">
            <input
              type="range"
              min={factor.range.min}
              max={factor.range.max}
              step={(factor.range.max - factor.range.min) / 200}
              value={currentNum}
              onChange={handleSliderChange}
              className="w-full h-1.5 accent-blue-500 cursor-pointer"
              aria-label={`${factor.name} value`}
            />
            <div className="flex justify-between text-[0.625rem] text-content-muted font-mono">
              <span>{factor.range.min}</span>
              <span>{factor.range.max}</span>
            </div>
          </div>

          {/* Optimum indicator */}
          {factor.hasOptimum && factor.optimumValue != null && (
            <div className="flex items-center gap-1 text-[0.625rem] text-purple-400">
              <TrendingUp size={10} />
              <span>
                Optimum:{' '}
                {Number.isFinite(factor.optimumValue) ? factor.optimumValue.toFixed(2) : '—'}
              </span>
            </div>
          )}

          {/* Outside range warning */}
          {isOutsideRange && (
            <div className="flex items-center gap-1 text-[0.625rem] text-amber-500">
              <AlertTriangle size={10} />
              <span>Outside observed range — uncertain</span>
            </div>
          )}
        </>
      )}

      {factor.type === 'categorical' && factor.levels && factor.levelPredictions && (
        <>
          {/* Level selector */}
          <div className="flex flex-wrap gap-1">
            {factor.levels.map(level => (
              <button
                key={level}
                onClick={() => onValueChange(factor.name, level)}
                className={[
                  'px-2 py-0.5 text-[0.625rem] rounded border transition-colors',
                  factor.currentValue === level
                    ? 'border-green-500 bg-green-500/10 text-green-400'
                    : 'border-edge bg-surface text-content-secondary hover:text-content hover:bg-surface-tertiary',
                ].join(' ')}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Bar chart for level predictions */}
          {factor.levelPredictions.length > 0 && (
            <div className="w-full pt-1">
              <CategoricalBars
                levelPredictions={factor.levelPredictions}
                selectedLevel={String(factor.currentValue)}
                onSelect={level => onValueChange(factor.name, level)}
                width={220}
                height={CAT_BAR_HEIGHT}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Trust Badge ──────────────────────────────────────────────────────────────

const TRUST_CONFIG = {
  strong: { dot: 'bg-green-500', label: 'Strong model' },
  moderate: { dot: 'bg-amber-500', label: 'Moderate model' },
  weak: { dot: 'bg-red-400', label: 'Weak model' },
} as const;

// ─── PredictionProfiler ───────────────────────────────────────────────────────

/**
 * JMP-inspired prediction profiler for regression-based what-if exploration.
 * Continuous factors show draggable sliders with mini prediction traces.
 * Categorical factors show level selectors with predicted-value bar charts.
 */
const PredictionProfiler: React.FC<PredictionProfilerProps> = ({
  factors,
  predictedValue,
  predictedCpk,
  outcomeLabel,
  onValueChange,
  trustLevel,
  rSquaredAdj,
  className = '',
}) => {
  const trust = trustLevel ? TRUST_CONFIG[trustLevel] : null;

  const formattedPrediction = !Number.isFinite(predictedValue)
    ? '—'
    : predictedValue % 1 === 0
      ? predictedValue.toFixed(0)
      : predictedValue.toFixed(2);

  const formattedCpk =
    predictedCpk != null && Number.isFinite(predictedCpk) ? predictedCpk.toFixed(2) : null;

  return (
    <div
      className={`rounded-lg border border-edge bg-surface overflow-hidden ${className}`}
      data-testid="prediction-profiler"
    >
      {/* Header: predicted outcome + Cpk + trust */}
      <div className="px-3 py-2.5 border-b border-edge/50 bg-surface-secondary/30">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-xs text-content-secondary">Predicted {outcomeLabel}:</span>
          <span className="text-base font-semibold text-content font-mono">
            {formattedPrediction}
          </span>
          {formattedCpk != null && (
            <>
              <span className="text-xs text-content-muted">·</span>
              <span className="text-xs text-content-secondary">
                Cpk: <span className="font-mono text-content">{formattedCpk}</span>
              </span>
            </>
          )}
        </div>

        {trust && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${trust.dot}`} />
            <span className="text-[0.625rem] text-content-muted">
              {trust.label}
              {rSquaredAdj != null && <> (R²adj {Math.round(rSquaredAdj * 100)}%)</>}
            </span>
          </div>
        )}
      </div>

      {/* Factor cards */}
      <div className="p-2.5 space-y-2">
        {factors.length === 0 ? (
          <p className="text-xs text-content-muted text-center py-4">
            No factors available for prediction.
          </p>
        ) : (
          factors.map(factor => (
            <FactorCard key={factor.name} factor={factor} onValueChange={onValueChange} />
          ))
        )}
      </div>
    </div>
  );
};

export default PredictionProfiler;
