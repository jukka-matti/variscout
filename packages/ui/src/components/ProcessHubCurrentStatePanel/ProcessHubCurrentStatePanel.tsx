import React from 'react';
import { Activity, Gauge, GitBranch, Layers3, ShieldCheck } from 'lucide-react';
import type {
  CurrentProcessState,
  ProcessStateItem,
  ProcessStateLens,
  ProcessStateResponsePath,
  ProcessStateSeverity,
} from '@variscout/core';
import { formatPlural, formatStatistic } from '@variscout/core/i18n';

export interface ProcessHubCurrentStatePanelProps {
  state: CurrentProcessState;
}

const LENS_LABELS: Record<ProcessStateLens, string> = {
  outcome: 'Outcome',
  flow: 'Flow',
  conversion: 'Conversion',
  measurement: 'Measurement',
  sustainment: 'Sustainment',
};

const RESPONSE_LABELS: Record<ProcessStateResponsePath, string> = {
  monitor: 'Monitor',
  'quick-action': 'Quick action',
  'focused-investigation': 'Focused investigation',
  'chartered-project': 'Chartered project',
  'measurement-system-work': 'Measurement system work',
  'sustainment-review': 'Sustainment review',
  'control-handoff': 'Control handoff',
};

const SEVERITY_LABELS: Record<ProcessStateSeverity, string> = {
  red: 'Red',
  amber: 'Amber',
  neutral: 'Neutral',
  green: 'Green',
};

const SEVERITY_CLASS: Record<ProcessStateSeverity, string> = {
  red: 'border-rose-500/40 text-rose-400',
  amber: 'border-amber-500/40 text-amber-400',
  neutral: 'border-edge text-content-secondary',
  green: 'border-emerald-500/40 text-emerald-400',
};

const LENS_ICONS: Record<ProcessStateLens, React.ReactNode> = {
  outcome: <Gauge size={15} />,
  flow: <GitBranch size={15} />,
  conversion: <Layers3 size={15} />,
  measurement: <Activity size={15} />,
  sustainment: <ShieldCheck size={15} />,
};

const LENSES: ProcessStateLens[] = ['outcome', 'flow', 'conversion', 'measurement', 'sustainment'];

const formatMetric = (value: number): string => formatStatistic(value, 'en', 2);

const formatChangeSignals = (count: number): string =>
  `${count} ${formatPlural(count, { one: 'change signal', other: 'change signals' })}`;

const StateCountCard: React.FC<{ lens: ProcessStateLens; count: number }> = ({ lens, count }) => (
  <div className="rounded-md border border-edge bg-surface px-3 py-2">
    <div className="flex items-center gap-2 text-xs font-medium text-content-secondary">
      {LENS_ICONS[lens]}
      <span>{LENS_LABELS[lens]}</span>
    </div>
    <p
      className="mt-1 text-xl font-semibold text-content"
      data-testid={`current-state-lens-${lens}`}
    >
      {count}
    </p>
  </div>
);

const formatStateDetail = (item: ProcessStateItem): string | null => {
  const metric = item.metric;
  if (metric?.cpk !== undefined && metric.cpkTarget !== undefined) {
    return `Cpk ${formatMetric(metric.cpk)} vs target ${formatMetric(metric.cpkTarget)}`;
  }
  if (metric?.changeSignalCount !== undefined) {
    return formatChangeSignals(metric.changeSignalCount);
  }
  if (metric?.variationPct !== undefined) {
    return `${formatMetric(metric.variationPct)}% variation`;
  }
  if (item.count !== undefined) {
    return formatMetric(item.count);
  }
  return item.detail ?? null;
};

const StateItemCard: React.FC<{ item: ProcessStateItem }> = ({ item }) => {
  const detail = formatStateDetail(item);

  return (
    <div
      className={`rounded-md border bg-surface px-3 py-2 ${SEVERITY_CLASS[item.severity]}`}
      data-testid="current-state-item"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
            {LENS_LABELS[item.lens]}
          </p>
          <p className="mt-1 text-sm font-medium text-content">{item.label}</p>
          {detail && <p className="mt-1 text-xs text-content-secondary">{detail}</p>}
        </div>
        <span className="rounded-sm border border-current px-2 py-0.5 text-xs font-medium">
          {SEVERITY_LABELS[item.severity]}
        </span>
      </div>
      <p className="mt-2 inline-flex rounded-sm border border-edge px-2 py-0.5 text-xs font-medium text-content-secondary">
        {RESPONSE_LABELS[item.responsePath]}
      </p>
    </div>
  );
};

export const ProcessHubCurrentStatePanel: React.FC<ProcessHubCurrentStatePanelProps> = ({
  state,
}) => {
  const visibleItems = state.items.slice(0, 6);
  const hiddenCount = Math.max(0, state.items.length - visibleItems.length);

  return (
    <div className="mt-4" data-testid="current-process-state">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-content">
          <Activity size={16} />
          <h4>Current Process State</h4>
        </div>
        <span
          className={`rounded-sm border px-2 py-0.5 text-xs font-medium ${SEVERITY_CLASS[state.overallSeverity]}`}
        >
          {SEVERITY_LABELS[state.overallSeverity]}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-5">
        {LENSES.map(lens => (
          <StateCountCard key={lens} lens={lens} count={state.lensCounts[lens]} />
        ))}
      </div>

      {visibleItems.length > 0 ? (
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {visibleItems.map(item => (
            <StateItemCard key={item.id} item={item} />
          ))}
          {hiddenCount > 0 && (
            <p className="rounded-md border border-dashed border-edge px-3 py-3 text-sm text-content-secondary">
              +{hiddenCount} more current-state items
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3 rounded-md border border-dashed border-edge px-3 py-3 text-sm text-content-secondary">
          No current process state signals yet
        </p>
      )}
    </div>
  );
};
