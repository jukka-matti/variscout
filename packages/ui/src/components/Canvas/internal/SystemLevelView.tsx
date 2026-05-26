import React from 'react';
import { chartColors } from '@variscout/charts';
import {
  type DataRow,
  type Finding,
  type Hypothesis,
  type Question,
  type SpecLimits,
  type ProcessHubId,
} from '@variscout/core';
import { formatMessage, formatStatistic, getMessage } from '@variscout/core/i18n';
import type { Locale } from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';
import type { CanvasLensId, CanvasStepCardModel } from '@variscout/hooks';
import { buildSystemOutcomeModel } from '../../DashboardBase/internal/systemOutcomeModel';
import { InboxDigest, type InboxDigestPrompt } from '../../Inbox';
import { useWallLocale } from '../../InvestigationWall/hooks/useWallLocale';

export interface SystemLevelViewProps {
  hubId: ProcessHubId;
  map: ProcessMap;
  rows: readonly DataRow[];
  stepCards?: readonly CanvasStepCardModel[];
  questions?: ReadonlyArray<Question>;
  hypotheses?: ReadonlyArray<Hypothesis>;
  findings?: ReadonlyArray<Finding>;
  activeLens?: CanvasLensId;
  /**
   * Per-column spec registry keyed by column name.
   * `SystemLevelView` derives its L1 spec from `measureSpecs[map.ctsColumn]`.
   *
   * This is the ADR-073-anchored source of truth for the outcome's spec: the
   * view MUST NOT accept a step-level spec here and compute L1 Cpk against it.
   */
  measureSpecs?: Record<string, SpecLimits>;
  onOpenScout?: (hubId: ProcessHubId) => void;
}

const SPARK_WIDTH = 220;
const SPARK_HEIGHT = 56;

function formatMetric(value: number | undefined): string {
  return value === undefined || !Number.isFinite(value) ? '--' : formatStatistic(value, 'en', 2);
}

function formatPercentage(value: number): string {
  return `${formatStatistic(value, 'en', 1)}%`;
}

function sparklinePoints(values: readonly number[]): string {
  if (values.length === 0) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const xStep = values.length > 1 ? SPARK_WIDTH / (values.length - 1) : SPARK_WIDTH;

  return values
    .map((value, index) => {
      const x = index * xStep;
      const y = SPARK_HEIGHT - ((value - min) / range) * SPARK_HEIGHT;
      return `${Math.round(x * 100) / 100},${Math.round(y * 100) / 100}`;
    })
    .join(' ');
}

function inboxPrompts(args: {
  hubId: string;
  outcomeLabel: string;
  outOfSpecPercentage: number;
  drift: string;
  locale: Locale;
}): InboxDigestPrompt[] {
  const prompts: InboxDigestPrompt[] = [];
  if (args.outOfSpecPercentage > 0) {
    prompts.push({
      id: `outcome-spec-${args.hubId}`,
      severity: 'warning',
      message: formatMessage(args.locale, 'canvas.system.outOfSpecMessage', {
        outcome: args.outcomeLabel,
        pct: formatPercentage(args.outOfSpecPercentage),
      }),
      action: { label: getMessage(args.locale, 'canvas.system.reviewAction') },
    });
  } else if (args.drift.includes('trending')) {
    prompts.push({
      id: `outcome-drift-${args.hubId}`,
      severity: 'info',
      message: args.drift,
      action: { label: getMessage(args.locale, 'canvas.system.reviewAction') },
    });
  }
  return prompts;
}

export const SystemLevelView: React.FC<SystemLevelViewProps> = ({
  hubId,
  map,
  rows,
  questions = [],
  hypotheses = [],
  findings = [],
  activeLens,
  measureSpecs,
  onOpenScout,
}) => {
  const locale = useWallLocale();
  const outcomeLabel = map.ctsColumn ?? 'Outcome not selected';
  // ADR-073: derive from the outcome's own spec entry in measureSpecs.
  const resolvedSpecLimits = map.ctsColumn ? measureSpecs?.[map.ctsColumn] : undefined;
  const model = buildSystemOutcomeModel({
    rows,
    outcomeColumn: map.ctsColumn,
    specLimits: resolvedSpecLimits,
    questions,
    hypotheses,
    findings,
  });
  const values = model.values;
  const bins = model.bins;
  const maxBin = Math.max(1, ...bins.map(bin => bin.count));
  const prompts = inboxPrompts({
    hubId,
    outcomeLabel,
    outOfSpecPercentage: model.outOfSpecPercentage,
    drift: model.drift.label,
    locale,
  });

  return (
    <section className="bg-surface-background p-4 text-content">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-content-muted">{hubId}</p>
              <h2 className="text-lg font-semibold text-content">{outcomeLabel}</h2>
              {activeLens ? (
                <p className="text-xs text-content-muted">
                  {formatMessage(locale, 'canvas.system.lensLabel', { lens: activeLens })}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="rounded-md border border-edge bg-surface px-3 py-2 text-sm font-medium text-content transition-colors enabled:hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!onOpenScout}
              onClick={() => onOpenScout?.(hubId)}
            >
              {getMessage(locale, 'canvas.system.openScout')}
            </button>
          </header>

          <div className="grid gap-3 md:grid-cols-2">
            <section
              className="rounded-lg border border-edge bg-surface p-4"
              data-testid="outcome-distribution"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-content">
                  {getMessage(locale, 'canvas.system.outcomeDistribution')}
                </h3>
                <span className="text-xs font-medium text-content-muted">n={values.length}</span>
              </div>
              {bins.length > 0 ? (
                <div className="flex h-24 items-end gap-1" aria-label={`${outcomeLabel} histogram`}>
                  {bins.map((bin, index) => (
                    <span
                      key={`${bin.x0}-${bin.x1}-${index}`}
                      className="w-full rounded-sm"
                      style={{
                        backgroundColor: `${chartColors.mean}99`,
                        height: `${Math.max(8, (bin.count / maxBin) * 100)}%`,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-content-muted">
                  {getMessage(locale, 'canvas.system.noNumericOutcome')}
                </p>
              )}
            </section>

            <section className="rounded-lg border border-edge bg-surface p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-content">
                  {getMessage(locale, 'canvas.system.outcomeDrift')}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${model.drift.tone}`}
                  data-testid="drift-indicator"
                >
                  {model.drift.label}
                </span>
              </div>
              <div
                className="flex h-24 items-center"
                data-testid="outcome-time-series"
                aria-label={`${outcomeLabel} time series`}
              >
                {values.length > 0 ? (
                  <svg
                    viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
                    width="100%"
                    height={SPARK_HEIGHT}
                    role="img"
                    aria-label={`${outcomeLabel} outcome time series`}
                    preserveAspectRatio="none"
                  >
                    <polyline
                      fill="none"
                      stroke={chartColors.mean}
                      strokeWidth={2}
                      points={sparklinePoints(values)}
                    />
                  </svg>
                ) : (
                  <p className="text-sm text-content-muted">
                    {getMessage(locale, 'canvas.system.noOutcomeTrend')}
                  </p>
                )}
              </div>
            </section>
          </div>

          <section
            className="grid gap-3 rounded-lg border border-edge bg-surface p-4 sm:grid-cols-4"
            data-testid="outcome-capability"
          >
            <div>
              <div className="text-xs text-content-muted">Cp</div>
              <div className="text-lg font-semibold text-content">{formatMetric(model.cp)}</div>
            </div>
            <div>
              <div className="text-xs text-content-muted">Cpk</div>
              <div className="text-lg font-semibold text-content">{formatMetric(model.cpk)}</div>
            </div>
            <div>
              <div className="text-xs text-content-muted">
                {getMessage(locale, 'canvas.system.conformance')}
              </div>
              <div className="text-lg font-semibold text-content">
                {formatPercentage(model.conformancePercentage)}
              </div>
            </div>
            <div>
              <div className="text-xs text-content-muted">{getMessage(locale, 'stats.target')}</div>
              <div className="text-lg font-semibold text-content">
                {formatMetric(resolvedSpecLimits?.cpkTarget)}
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-3">
          <div data-testid="inbox-digest">
            {prompts.length > 0 ? (
              <InboxDigest prompts={prompts} onNavigate={() => undefined} />
            ) : (
              <section className="rounded-lg border border-edge bg-surface p-4">
                <h3 className="text-sm font-semibold text-content">
                  {getMessage(locale, 'canvas.system.inbox')}
                </h3>
                <p className="mt-2 text-sm text-content-muted">
                  {getMessage(locale, 'canvas.system.noOutcomePrompts')}
                </p>
              </section>
            )}
          </div>

          <section
            className="rounded-lg border border-edge bg-surface p-4"
            data-testid="active-investigations-summary"
          >
            <h3 className="text-sm font-semibold text-content">
              {getMessage(locale, 'canvas.system.activeInvestigations')}
            </h3>
            <p className="mt-2 text-sm text-content-muted">{model.activeSummary}</p>
          </section>
        </aside>
      </div>
    </section>
  );
};
