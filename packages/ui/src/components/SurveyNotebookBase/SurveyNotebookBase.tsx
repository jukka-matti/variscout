import React, { useMemo, useState } from 'react';
import { Check, CheckCircle2, ClipboardList, ShieldCheck, Zap } from 'lucide-react';
import type {
  SurveyEvaluation,
  SurveyPossibilityItem,
  SurveyPowerItem,
  SurveyRecommendation,
  SurveyStatus,
  SurveyTrustItem,
} from '@variscout/core/survey';
import { SURVEY_STATUS_LABELS } from '@variscout/core/survey';

type SurveyNotebookTab = 'possibility' | 'power' | 'trust';

export interface SurveyNotebookBaseProps {
  evaluation: SurveyEvaluation;
  compact?: boolean;
  className?: string;
  defaultTab?: SurveyNotebookTab;
  onAcceptRecommendation?: (recommendation: SurveyRecommendation) => void;
}

interface TabConfig {
  id: SurveyNotebookTab;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  { id: 'possibility', label: 'Possibility', icon: <CheckCircle2 size={14} /> },
  { id: 'power', label: 'Power', icon: <Zap size={14} /> },
  { id: 'trust', label: 'Trust', icon: <ShieldCheck size={14} /> },
];

const STATUS_CLASS: Record<SurveyStatus, string> = {
  'can-do-now': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  'can-do-with-caution': 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  'cannot-do-yet': 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  'ask-for-next': 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
};

function StatusPill({ status }: { status: SurveyStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.68rem] font-medium ${STATUS_CLASS[status]}`}
    >
      {SURVEY_STATUS_LABELS[status]}
    </span>
  );
}

function TabButton({
  tab,
  activeTab,
  onClick,
}: {
  tab: TabConfig;
  activeTab: SurveyNotebookTab;
  onClick: (tab: SurveyNotebookTab) => void;
}) {
  const active = tab.id === activeTab;
  return (
    <button
      type="button"
      data-testid={`survey-tab-${tab.id}`}
      onClick={() => onClick(tab.id)}
      className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors ${
        active
          ? 'bg-surface-tertiary text-content shadow-sm'
          : 'text-content-secondary hover:bg-surface-tertiary hover:text-content'
      }`}
    >
      {tab.icon}
      <span>{tab.label}</span>
    </button>
  );
}

function joinList(values: string[]): string {
  return values.length > 0 ? values.join(', ') : 'None';
}

function PossibilityTable({ items }: { items: SurveyPossibilityItem[] }) {
  return (
    <div className="overflow-x-auto" data-testid="survey-possibility-table">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="text-content-secondary">
          <tr className="border-b border-edge">
            <th className="py-2 pr-3 font-medium">Instrument</th>
            <th className="py-2 pr-3 font-medium">Status</th>
            <th className="py-2 pr-3 font-medium">Required columns</th>
            <th className="py-2 font-medium">Next unlock</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-b border-edge/60 last:border-0">
              <td className="py-2 pr-3 font-medium text-content">{item.instrument}</td>
              <td className="py-2 pr-3">
                <StatusPill status={item.status} />
              </td>
              <td className="py-2 pr-3 text-content-secondary">{joinList(item.requiredColumns)}</td>
              <td className="py-2 text-content-secondary">{item.nextUnlock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PowerTable({ items }: { items: SurveyPowerItem[] }) {
  return (
    <div className="overflow-x-auto" data-testid="survey-power-table">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="text-content-secondary">
          <tr className="border-b border-edge">
            <th className="py-2 pr-3 font-medium">Check</th>
            <th className="py-2 pr-3 font-medium">Status</th>
            <th className="py-2 pr-3 font-medium">Current power state</th>
            <th className="py-2 pr-3 font-medium">Blind spot</th>
            <th className="py-2 font-medium">Next lever</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-b border-edge/60 last:border-0">
              <td className="py-2 pr-3 font-medium text-content">{item.check}</td>
              <td className="py-2 pr-3">
                <StatusPill status={item.status} />
              </td>
              <td className="py-2 pr-3 text-content-secondary">{item.currentPowerState}</td>
              <td className="py-2 pr-3 text-content-secondary">{item.blindSpot}</td>
              <td className="py-2 text-content-secondary">{item.nextLever}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrustTable({ items }: { items: SurveyTrustItem[] }) {
  return (
    <div className="overflow-x-auto" data-testid="survey-trust-table">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="text-content-secondary">
          <tr className="border-b border-edge">
            <th className="py-2 pr-3 font-medium">Signal</th>
            <th className="py-2 pr-3 font-medium">Status</th>
            <th className="py-2 pr-3 font-medium">Archetype</th>
            <th className="py-2 pr-3 font-medium">Trust label</th>
            <th className="py-2 pr-3 font-medium">Weak link</th>
            <th className="py-2 font-medium">Op-def</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-b border-edge/60 last:border-0">
              <td className="py-2 pr-3 font-medium text-content">{item.signal}</td>
              <td className="py-2 pr-3">
                <StatusPill status={item.status} />
              </td>
              <td className="py-2 pr-3 text-content-secondary">{item.archetype}</td>
              <td className="py-2 pr-3 text-content-secondary">{item.trustLabel}</td>
              <td className="py-2 pr-3 text-content-secondary">{item.weakLink}</td>
              <td className="py-2 text-content-secondary">{item.operationalDefinition}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompactList({
  activeTab,
  evaluation,
}: {
  activeTab: SurveyNotebookTab;
  evaluation: SurveyEvaluation;
}) {
  if (activeTab === 'power') {
    return (
      <div className="space-y-2" data-testid="survey-power-list">
        {evaluation.power.items.map(item => (
          <div key={item.id} className="rounded-lg border border-edge bg-surface-secondary p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-medium text-content">{item.check}</div>
              <StatusPill status={item.status} />
            </div>
            <p className="mt-2 text-xs text-content-secondary">{item.currentPowerState}</p>
            <p className="mt-1 text-xs text-content-secondary">{item.blindSpot}</p>
            <p className="mt-1 text-xs font-medium text-content">{item.nextLever}</p>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === 'trust') {
    return (
      <div className="space-y-2" data-testid="survey-trust-list">
        {evaluation.trust.items.map(item => (
          <div key={item.id} className="rounded-lg border border-edge bg-surface-secondary p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-medium text-content">{item.signal}</div>
              <StatusPill status={item.status} />
            </div>
            <p className="mt-2 text-xs text-content-secondary">{item.weakLink}</p>
            <p className="mt-1 text-xs text-content-secondary">{item.operationalDefinition}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="survey-possibility-list">
      {evaluation.possibility.items.map(item => (
        <div key={item.id} className="rounded-lg border border-edge bg-surface-secondary p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm font-medium text-content">{item.instrument}</div>
            <StatusPill status={item.status} />
          </div>
          <p className="mt-2 text-xs text-content-secondary">{joinList(item.requiredColumns)}</p>
          <p className="mt-1 text-xs font-medium text-content">{item.nextUnlock}</p>
        </div>
      ))}
    </div>
  );
}

function Recommendations({
  recommendations,
  onAcceptRecommendation,
}: {
  recommendations: SurveyRecommendation[];
  onAcceptRecommendation?: (recommendation: SurveyRecommendation) => void;
}) {
  if (recommendations.length === 0) return null;

  return (
    <div className="border-t border-edge pt-3" data-testid="survey-recommendations">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-content">
        <ClipboardList size={14} />
        Next Moves
      </div>
      <div className="space-y-2">
        {recommendations.map(recommendation => (
          <div
            key={recommendation.id}
            className="rounded-lg border border-edge bg-surface-secondary p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-content">{recommendation.title}</div>
                <p className="mt-1 text-xs text-content-secondary">{recommendation.detail}</p>
                <p className="mt-1 text-xs font-medium text-content">{recommendation.actionText}</p>
              </div>
              <StatusPill status={recommendation.status} />
            </div>
            {onAcceptRecommendation && (
              <button
                type="button"
                onClick={() => onAcceptRecommendation(recommendation)}
                aria-label={`Accept next move: ${recommendation.actionText}`}
                className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-md border border-edge bg-surface px-3 text-xs font-medium text-content hover:bg-surface-tertiary"
              >
                <Check size={14} />
                Accept next move
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SurveyNotebookBase({
  evaluation,
  compact = false,
  className,
  defaultTab = 'possibility',
  onAcceptRecommendation,
}: SurveyNotebookBaseProps) {
  const [activeTab, setActiveTab] = useState<SurveyNotebookTab>(defaultTab);
  const activeStatus = useMemo(() => {
    if (activeTab === 'power') return evaluation.power.overallStatus;
    if (activeTab === 'trust') return evaluation.trust.overallStatus;
    return evaluation.possibility.overallStatus;
  }, [activeTab, evaluation]);

  const containerClass = compact
    ? 'flex h-full flex-col gap-3 overflow-auto p-3'
    : 'flex h-full flex-col gap-3';

  return (
    <section
      className={className ? `${containerClass} ${className}` : containerClass}
      data-testid={compact ? 'survey-notebook-compact' : 'survey-notebook'}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase text-content-secondary">Survey</div>
          <div className="text-sm font-semibold text-content">
            {evaluation.diagnostics.rowCount} rows · {evaluation.diagnostics.inferredMode.mode}
          </div>
        </div>
        <StatusPill status={activeStatus} />
      </div>

      <div className="flex gap-1 rounded-lg border border-edge bg-surface/50 p-1">
        {TABS.map(tab => (
          <TabButton key={tab.id} tab={tab} activeTab={activeTab} onClick={setActiveTab} />
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {compact ? (
          <CompactList activeTab={activeTab} evaluation={evaluation} />
        ) : activeTab === 'power' ? (
          <PowerTable items={evaluation.power.items} />
        ) : activeTab === 'trust' ? (
          <TrustTable items={evaluation.trust.items} />
        ) : (
          <PossibilityTable items={evaluation.possibility.items} />
        )}
      </div>

      <Recommendations
        recommendations={evaluation.recommendations}
        onAcceptRecommendation={onAcceptRecommendation}
      />
    </section>
  );
}
