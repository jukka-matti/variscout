import React from 'react';
import { Activity, Gauge, GitBranch, Layers3, ShieldCheck } from 'lucide-react';
import type {
  CurrentProcessState,
  Finding,
  ProcessStateItem,
  ProcessStateLens,
  ProcessStateNote,
  ProcessStateResponsePath,
  ProcessStateSeverity,
  ResponsePathAction,
} from '@variscout/core';
import { assertNever } from '@variscout/core';
import { formatPlural, formatStatistic } from '@variscout/core/i18n';

export interface ProcessHubActionsContract {
  actionFor: (item: ProcessStateItem) => ResponsePathAction;
  onInvoke: (item: ProcessStateItem, action: ResponsePathAction) => void;
}

export interface ProcessHubEvidenceContract {
  /** Sync count for the chip — derived from rollup metadata. */
  countFor: (item: ProcessStateItem) => number;
  /** Async load for the sheet — called only when chip is clicked (consumer side). */
  loadFindingsFor: (item: ProcessStateItem) => Promise<readonly Finding[]>;
  /** Fired when chip is clicked — telemetry only. */
  onChipClick: (item: ProcessStateItem) => void;
  /** Fired when user selects a finding in the sheet. */
  onFindingSelect: (item: ProcessStateItem, finding: Finding) => void;
}

export interface ProcessHubNotesContract {
  notesFor: (item: ProcessStateItem) => readonly ProcessStateNote[];
  /** Consumer opens its own drawer/dialog when this fires. */
  onRequestAddNote: (item: ProcessStateItem) => void;
  /** Consumer opens edit drawer/dialog when this fires. */
  onRequestEditNote: (item: ProcessStateItem, note: ProcessStateNote) => void;
  /** Direct delete — consumer may show confirm before invoking. */
  onDeleteNote: (item: ProcessStateItem, noteId: string) => void;
  /** Used to gate edit/delete affordances on own notes. */
  currentUserId: string;
}

export interface ProcessHubCurrentStatePanelProps {
  state: CurrentProcessState;
  actions: ProcessHubActionsContract;
  evidence: ProcessHubEvidenceContract;
  notes: ProcessHubNotesContract;
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

const UNSUPPORTED_PILL_LABEL: Record<'planned' | 'informational', string> = {
  planned: 'Planned',
  informational: 'Informational',
};

const UNSUPPORTED_TOOLTIP: Record<'planned' | 'informational', string> = {
  planned: 'This response path is planned for a future horizon.',
  informational: 'No action needed — this item is informational only.',
};

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

const EvidenceChip: React.FC<{
  count: number;
  onClick: () => void;
}> = ({ count, onClick }) => {
  if (count === 0) return null;
  const label = formatPlural(count, { one: 'finding', other: 'findings' });
  return (
    <button
      type="button"
      onClick={event => {
        event.stopPropagation();
        onClick();
      }}
      data-testid="current-state-evidence-chip"
      className="inline-flex items-center gap-1 rounded-sm border border-edge px-2 py-0.5 text-xs font-medium text-content-secondary hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <span aria-hidden>ⓘ</span>
      {count} {label}
    </button>
  );
};

const StateItemCard: React.FC<{
  item: ProcessStateItem;
  action: ResponsePathAction;
  onInvoke: (item: ProcessStateItem, action: ResponsePathAction) => void;
  count: number;
  onChipClick: () => void;
  notes: readonly ProcessStateNote[];
  currentUserId: string;
  onRequestAddNote: () => void;
  onRequestEditNote: (note: ProcessStateNote) => void;
  onDeleteNote: (noteId: string) => void;
}> = ({
  item,
  action,
  onInvoke,
  count,
  onChipClick,
  notes,
  currentUserId,
  onRequestAddNote,
  onRequestEditNote,
  onDeleteNote,
}) => {
  const detail = formatStateDetail(item);
  const isSupported = action.kind !== 'unsupported';

  const handleActivate = () => {
    if (isSupported) onInvoke(item, action);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isSupported) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onInvoke(item, action);
    }
  };

  let unsupportedReason: 'planned' | 'informational' | null = null;
  let tooltipText: string | undefined;
  switch (action.kind) {
    case 'unsupported':
      unsupportedReason = action.reason;
      tooltipText = UNSUPPORTED_TOOLTIP[action.reason];
      break;
    case 'open-investigation':
    case 'open-sustainment':
      tooltipText = undefined;
      break;
    default:
      assertNever(action);
      tooltipText = undefined;
  }

  const interactiveProps = isSupported
    ? {
        role: 'button' as const,
        tabIndex: 0,
        onClick: handleActivate,
        onKeyDown: handleKeyDown,
        'aria-label': `${item.label} — ${RESPONSE_LABELS[item.responsePath]}`,
      }
    : {};

  return (
    // Outer wrapper: visual chrome only (border, severity colour). Not interactive.
    <div
      className={`rounded-md border bg-surface ${SEVERITY_CLASS[item.severity]}`}
      aria-disabled={!isSupported || undefined}
    >
      {/* Interactive region: card body + pill + chip. Holds role=button only when supported.
          data-testid and title live here so tests can find and interact with the card. */}
      <div
        data-testid="current-state-item"
        // title attribute is unreachable on touch and unreliable for screen
        // readers (WCAG 1.3.3 / 4.1.2). Visible 'Planned'/'Informational'
        // pill text already conveys the state. Replace with a Tooltip /
        // Popover primitive when the design system grows one.
        title={tooltipText}
        className={`px-3 py-2 ${
          isSupported
            ? 'cursor-pointer transition-colors hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-blue-500'
            : ''
        }`}
        {...interactiveProps}
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
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="inline-flex rounded-sm border border-edge px-2 py-0.5 text-xs font-medium text-content-secondary">
            <span>{RESPONSE_LABELS[item.responsePath]}</span>
            {unsupportedReason !== null && (
              <span> · {UNSUPPORTED_PILL_LABEL[unsupportedReason]}</span>
            )}
          </p>
          <EvidenceChip count={count} onClick={onChipClick} />
        </div>
      </div>

      {/* Non-interactive sibling region: notes affordance + list.
          Buttons here are NOT descendants of the interactive div — no HTML nesting violation. */}
      <div className="border-t border-edge px-3 py-2">
        <button
          type="button"
          data-testid="current-state-add-note"
          aria-label={`Add note for ${item.label}`}
          className="text-xs font-medium text-content-secondary hover:text-content"
          onClick={onRequestAddNote}
        >
          + note
        </button>
        {notes.length > 0 && (
          <ul data-testid="current-state-notes-list" className="mt-2 space-y-1">
            {notes.map(note => (
              <li key={note.id} className="text-xs text-content-secondary">
                <span className="font-semibold uppercase tracking-wide">[{note.kind}]</span>{' '}
                <span>{note.author}</span>{' '}
                <span>· {new Date(note.createdAt).toLocaleString()}</span> <span>{note.text}</span>
                {note.author === currentUserId && (
                  <>
                    {' '}
                    <button
                      type="button"
                      data-testid={`current-state-note-edit-${note.id}`}
                      onClick={() => onRequestEditNote(note)}
                      className="text-blue-400 hover:underline"
                    >
                      Edit
                    </button>{' '}
                    <button
                      type="button"
                      data-testid={`current-state-note-delete-${note.id}`}
                      onClick={() => onDeleteNote(note.id)}
                      className="text-rose-400 hover:underline"
                    >
                      Delete
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export const ProcessHubCurrentStatePanel: React.FC<ProcessHubCurrentStatePanelProps> = ({
  state,
  actions,
  evidence,
  notes,
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
            <StateItemCard
              key={item.id}
              item={item}
              action={actions.actionFor(item)}
              onInvoke={actions.onInvoke}
              count={evidence.countFor(item)}
              onChipClick={() => evidence.onChipClick(item)}
              notes={notes.notesFor(item)}
              currentUserId={notes.currentUserId}
              onRequestAddNote={() => notes.onRequestAddNote(item)}
              onRequestEditNote={note => notes.onRequestEditNote(item, note)}
              onDeleteNote={noteId => notes.onDeleteNote(item, noteId)}
            />
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
