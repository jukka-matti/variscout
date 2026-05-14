import React from 'react';
import type { DataRow, Finding, Hypothesis, ProcessMap } from '@variscout/core';
import { getStepColumnAssignments } from '@variscout/core/frame';
import {
  calculateAnova,
  computeBestSubsets,
  computeMainEffects,
  conditionReferencesStep,
} from '@variscout/core';
import { formatMessage, formatStatistic, getMessage } from '@variscout/core/i18n';
import type { Locale } from '@variscout/core';
import type { ColumnTypeMap } from '@variscout/core/findings';
import { EvidenceMapBase } from '@variscout/charts';
import { useEvidenceMapData } from '@variscout/hooks';
import { useInvestigationStore } from '@variscout/stores';
import type { ProcessHubId } from '@variscout/core/processHub';
import { WallCanvas } from '../../InvestigationWall/WallCanvas';
import { MiniBoxplot } from '../../InvestigationWall/MiniBoxplot';
import { MiniIChart } from '../../InvestigationWall/MiniIChart';
import { useWallLocale } from '../../InvestigationWall/hooks/useWallLocale';
import { LogActionModal, type LogActionPayload } from '../../QuickAction';

export interface LocalMechanismViewProps {
  hubId: ProcessHubId;
  focalStepId: string;
  map: ProcessMap;
  rows?: ReadonlyArray<DataRow>;
  outcomeColumn: string | null | undefined;
  columnTypes: ColumnTypeMap;
  findings: ReadonlyArray<Finding>;
  problemCpk?: number;
  eventsPerWeek?: number;
  activeColumns: ReadonlyArray<string> | undefined;
  onOpenWall?: () => void;
  onSelectWallHub?: (hubId: string) => void;
  onOpenInvestigationFocus?: (focus: { kind: 'question'; id: string; questionId: string }) => void;
  onOpenColumnDetail?: (column: string, stepId: string) => void;
  onLogQuickAction?: (stepId: string, payload: LogActionPayload) => void;
  onFocusedInvestigation?: (stepId: string) => void;
  onCharter?: (stepId: string) => void;
  onSustainment?: (stepId: string) => void;
  onHandoff?: (stepId: string) => void;
}

const EMPTY_ROWS: ReadonlyArray<DataRow> = [];

/**
 * Flat union of every column associated with a focal step — assignments,
 * ctqColumn, and tributaries. Wraps `getStepColumnAssignments` for the
 * column-list view this component renders. Per ADR-074 amendment + ADR-081:
 * Canvas embeds owner-surface computation rather than re-deriving.
 */
function focalStepColumns(map: ProcessMap, focalStepId: string): string[] {
  const { assigned, ctqColumn, tributaryColumns } = getStepColumnAssignments(map, focalStepId);
  return [...assigned, ...(ctqColumn ? [ctqColumn] : []), ...tributaryColumns];
}

function numericValues(rows: ReadonlyArray<DataRow>, column: string): number[] {
  return rows
    .map(row => {
      const value = row[column];
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
      }
      return undefined;
    })
    .filter((value): value is number => value !== undefined && Number.isFinite(value));
}

function distribution(rows: ReadonlyArray<DataRow>, column: string) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = String(row[column] ?? 'Missing');
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 3);
}

function boxplotGroups(
  rows: ReadonlyArray<DataRow>,
  column: string,
  outcomeColumn: string | null | undefined
) {
  if (!outcomeColumn) return [];
  const groups = new Map<string, number[]>();
  for (const row of rows) {
    const rawCategory = row[column];
    const rawOutcome = row[outcomeColumn];
    const value = typeof rawOutcome === 'number' ? rawOutcome : Number(rawOutcome);
    if (!Number.isFinite(value)) continue;
    const category =
      rawCategory === null || rawCategory === undefined || rawCategory === ''
        ? 'Missing'
        : String(rawCategory);
    groups.set(category, [...(groups.get(category) ?? []), value]);
  }
  return [...groups.entries()].map(([category, values]) => ({ category, values }));
}

function conditionMentionsStep(
  hypothesis: Hypothesis,
  stepId: string,
  map: ProcessMap,
  stepColumns: readonly string[]
): boolean {
  if (!hypothesis.condition) return false;
  if (conditionReferencesStep(hypothesis.condition, map, stepId)) return true;

  const referenced = collectConditionColumns(hypothesis.condition);
  return stepColumns.some(column => referenced.has(column));
}

function collectConditionColumns(condition: NonNullable<Hypothesis['condition']>): Set<string> {
  const columns = new Set<string>();
  const walk = (node: NonNullable<Hypothesis['condition']>): void => {
    if (node.kind === 'leaf') {
      columns.add(node.column);
      return;
    }
    if (node.kind === 'not') {
      walk(node.child);
      return;
    }
    node.children.forEach(walk);
  };
  walk(condition);
  return columns;
}

function hasInvestigationContext(
  questions: ReturnType<typeof useInvestigationStore.getState>['questions'],
  hypotheses: Hypothesis[],
  focalStepId: string,
  map: ProcessMap,
  stepColumns: readonly string[]
): boolean {
  const stepColumnSet = new Set(stepColumns);
  const hasOpenQuestion = questions.some(
    question => question.status === 'open' && question.factor && stepColumnSet.has(question.factor)
  );
  if (hasOpenQuestion) return true;

  return hypotheses.some(hypothesis =>
    conditionMentionsStep(hypothesis, focalStepId, map, stepColumns)
  );
}

function contributionRankings(
  rows: ReadonlyArray<DataRow>,
  outcomeColumn: string | null | undefined,
  stepColumns: readonly string[]
) {
  if (!outcomeColumn) return [];

  return stepColumns
    .map(column => {
      const result = calculateAnova([...rows], outcomeColumn, column);
      return result ? { column, etaSquared: result.etaSquared } : null;
    })
    .filter((item): item is { column: string; etaSquared: number } => item !== null)
    .sort((a, b) => b.etaSquared - a.etaSquared);
}

function withColumnContext(payload: LogActionPayload, column: string): LogActionPayload {
  return {
    ...payload,
    text: `[${column}] ${payload.text}`,
  };
}

function ColumnMiniChart({
  column,
  kind,
  rows,
  outcomeColumn,
  locale,
  onOpenColumnDetail,
  onOpenQuickAction,
  onFocusedInvestigation,
  onCharter,
  onSustainment,
  onHandoff,
}: {
  column: string;
  kind: string | undefined;
  rows: ReadonlyArray<DataRow>;
  outcomeColumn: string | null | undefined;
  locale: Locale;
  onOpenColumnDetail?: (column: string) => void;
  onOpenQuickAction: (column: string) => void;
  onFocusedInvestigation?: (column: string) => void;
  onCharter?: (column: string) => void;
  onSustainment?: (column: string) => void;
  onHandoff?: (column: string) => void;
}) {
  const values = numericValues(rows, column);
  const categories = distribution(rows, column);
  const groups = boxplotGroups(rows, column, outcomeColumn);
  const maxCategoryCount = Math.max(1, ...categories.map(item => item.count));
  const numeric = kind === 'numeric' || kind === 'date';

  return (
    <article className="rounded-md border border-edge bg-surface-primary p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <button
          type="button"
          className="min-w-0 truncate text-left text-sm font-medium text-content hover:underline"
          aria-label={formatMessage(locale, 'canvas.localMechanism.openColumnAria', { column })}
          onClick={() => onOpenColumnDetail?.(column)}
        >
          {column}
        </button>
        <button
          type="button"
          className="shrink-0 rounded border border-edge px-2 py-1 text-xs text-content-secondary hover:bg-surface-secondary"
          aria-label={formatMessage(locale, 'canvas.localMechanism.logActionAria', { column })}
          onClick={() => onOpenQuickAction(column)}
        >
          {getMessage(locale, 'canvas.localMechanism.actionButton')}
        </button>
      </div>
      {onFocusedInvestigation || onCharter || onSustainment || onHandoff ? (
        <div className="flex flex-wrap gap-1" data-testid="response-path-ctas">
          {onFocusedInvestigation ? (
            <button
              type="button"
              className="rounded border border-edge px-2 py-1 text-xs text-content-secondary hover:bg-surface-secondary"
              aria-label={formatMessage(locale, 'canvas.localMechanism.focusedInvestigationAria', {
                column,
              })}
              onClick={() => onFocusedInvestigation(column)}
            >
              {getMessage(locale, 'canvas.localMechanism.focusedInvestigation')}
            </button>
          ) : null}
          {onCharter ? (
            <button
              type="button"
              className="rounded border border-edge px-2 py-1 text-xs text-content-secondary hover:bg-surface-secondary"
              aria-label={formatMessage(locale, 'canvas.localMechanism.charterAria', { column })}
              onClick={() => onCharter(column)}
            >
              {getMessage(locale, 'canvas.localMechanism.charter')}
            </button>
          ) : null}
          {onSustainment ? (
            <button
              type="button"
              className="rounded border border-edge px-2 py-1 text-xs text-content-secondary hover:bg-surface-secondary"
              aria-label={formatMessage(locale, 'canvas.localMechanism.sustainmentAria', {
                column,
              })}
              onClick={() => onSustainment(column)}
            >
              {getMessage(locale, 'canvas.localMechanism.sustainment')}
            </button>
          ) : null}
          {onHandoff ? (
            <button
              type="button"
              className="rounded border border-edge px-2 py-1 text-xs text-content-secondary hover:bg-surface-secondary"
              aria-label={formatMessage(locale, 'canvas.localMechanism.handoffAria', { column })}
              onClick={() => onHandoff(column)}
            >
              {getMessage(locale, 'canvas.localMechanism.handoff')}
            </button>
          ) : null}
        </div>
      ) : null}
      <button
        type="button"
        data-testid="column-mini-chart"
        className="block h-14 w-full rounded bg-surface-secondary p-2 text-left"
        aria-label={formatMessage(locale, 'canvas.localMechanism.openChartAria', { column })}
        onClick={() => onOpenColumnDetail?.(column)}
      >
        {numeric ? (
          values.length > 0 ? (
            <MiniIChart values={values} width={160} height={40} />
          ) : (
            <span className="text-xs text-content-muted">
              {getMessage(locale, 'canvas.localMechanism.noNumericValues')}
            </span>
          )
        ) : groups.length > 0 ? (
          <MiniBoxplot groups={groups} width={160} height={40} />
        ) : (
          <div className="space-y-1">
            {categories.map(item => (
              <div
                key={item.label}
                className="flex items-center gap-2 text-[11px] text-content-muted"
              >
                <span className="w-16 truncate">{item.label}</span>
                <span
                  className="h-1.5 rounded-full bg-status-warning/80"
                  style={{ width: `${Math.max(16, (item.count / maxCategoryCount) * 96)}px` }}
                />
                <span>{item.count}</span>
              </div>
            ))}
          </div>
        )}
      </button>
    </article>
  );
}

export function LocalMechanismView({
  hubId,
  focalStepId,
  map,
  rows,
  outcomeColumn,
  columnTypes,
  findings,
  problemCpk,
  eventsPerWeek,
  activeColumns,
  onOpenWall,
  onSelectWallHub,
  onOpenInvestigationFocus,
  onOpenColumnDetail,
  onLogQuickAction,
  onFocusedInvestigation,
  onCharter,
  onSustainment,
  onHandoff,
}: LocalMechanismViewProps) {
  const locale = useWallLocale();
  const questions = useInvestigationStore(state => state.questions);
  const hypotheses = useInvestigationStore(state => state.hypotheses);
  const causalLinks = useInvestigationStore(state => state.causalLinks);
  const [quickActionColumn, setQuickActionColumn] = React.useState<string | null>(null);
  const safeRows = rows ?? EMPTY_ROWS;
  const dataRows = React.useMemo(() => [...safeRows] as DataRow[], [safeRows]);
  const safeFindings = React.useMemo(() => [...findings], [findings]);

  const stepColumns = React.useMemo(() => focalStepColumns(map, focalStepId), [focalStepId, map]);
  const statisticalFactors = React.useMemo(
    () => stepColumns.filter(column => column !== outcomeColumn),
    [outcomeColumn, stepColumns]
  );

  const bestSubsets = React.useMemo(
    () =>
      outcomeColumn && safeRows.length >= 3 && statisticalFactors.length > 0
        ? computeBestSubsets(dataRows, outcomeColumn, statisticalFactors)
        : null,
    [dataRows, outcomeColumn, safeRows.length, statisticalFactors]
  );
  const mainEffects = React.useMemo(
    () =>
      outcomeColumn && safeRows.length >= 3 && statisticalFactors.length > 0
        ? computeMainEffects(dataRows, outcomeColumn, statisticalFactors)
        : null,
    [dataRows, outcomeColumn, safeRows.length, statisticalFactors]
  );
  const evidenceMapData = useEvidenceMapData({
    bestSubsets,
    mainEffects,
    interactions: null,
    containerSize: { width: 680, height: 360 },
    mode: 'capability',
    causalLinks: [...causalLinks],
    questions: [...questions],
    findings: safeFindings,
    hypotheses: [...hypotheses],
  });
  const showRankings = hasInvestigationContext(
    questions,
    hypotheses,
    focalStepId,
    map,
    stepColumns
  );
  const stepScopedQuestions = React.useMemo(
    () =>
      questions.filter(question =>
        question.factor ? stepColumns.includes(question.factor) : false
      ),
    [questions, stepColumns]
  );
  const rankings = React.useMemo(
    () => contributionRankings(safeRows, outcomeColumn, statisticalFactors),
    [outcomeColumn, safeRows, statisticalFactors]
  );

  const handleSelectWallHub = React.useCallback(
    (selectedHubId: string) => {
      onSelectWallHub?.(selectedHubId);
      onOpenWall?.();
    },
    [onOpenWall, onSelectWallHub]
  );

  const handleLogQuickAction = React.useCallback(
    (payload: LogActionPayload) => {
      if (!quickActionColumn) return;
      onLogQuickAction?.(focalStepId, withColumnContext(payload, quickActionColumn));
      setQuickActionColumn(null);
    },
    [focalStepId, onLogQuickAction, quickActionColumn]
  );
  const handleEvidenceFactorClick = React.useCallback(
    (factor: string) => {
      const matchingQuestion =
        questions.find(question => question.factor === factor && question.status === 'open') ??
        questions.find(question => question.factor === factor);
      if (!matchingQuestion) return;
      onOpenInvestigationFocus?.({
        kind: 'question',
        id: matchingQuestion.id,
        questionId: matchingQuestion.id,
      });
    },
    [onOpenInvestigationFocus, questions]
  );

  return (
    <section className="space-y-4" data-testid="local-mechanism-view">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stepColumns.map(column => (
          <ColumnMiniChart
            key={column}
            column={column}
            kind={columnTypes[column]}
            rows={safeRows}
            outcomeColumn={outcomeColumn}
            locale={locale}
            onOpenColumnDetail={columnName => onOpenColumnDetail?.(columnName, focalStepId)}
            onOpenQuickAction={setQuickActionColumn}
            onFocusedInvestigation={
              onFocusedInvestigation ? () => onFocusedInvestigation(focalStepId) : undefined
            }
            onCharter={onCharter ? () => onCharter(focalStepId) : undefined}
            onSustainment={onSustainment ? () => onSustainment(focalStepId) : undefined}
            onHandoff={onHandoff ? () => onHandoff(focalStepId) : undefined}
          />
        ))}
      </div>

      <section
        className="rounded-md border border-edge bg-surface p-3"
        data-testid="evidence-map-base"
        data-step-columns={stepColumns.join('|')}
      >
        <h3 className="mb-2 text-sm font-semibold text-content">
          {getMessage(locale, 'canvas.localMechanism.evidenceMap')}
        </h3>
        <EvidenceMapBase
          parentWidth={680}
          parentHeight={360}
          outcomeNode={evidenceMapData.outcomeNode}
          factorNodes={evidenceMapData.factorNodes}
          relationshipEdges={evidenceMapData.relationshipEdges}
          equation={evidenceMapData.equation}
          causalEdges={evidenceMapData.causalEdges}
          convergencePoints={evidenceMapData.convergencePoints}
          compact
          stepColumns={stepColumns}
          onFactorClick={handleEvidenceFactorClick}
        />
      </section>

      <section className="rounded-md border border-edge bg-surface p-3" data-testid="wall-canvas">
        <h3 className="mb-2 text-sm font-semibold text-content">
          {getMessage(locale, 'canvas.localMechanism.investigationWall')}
        </h3>
        <WallCanvas
          hubId={hubId}
          hubs={hypotheses}
          findings={safeFindings}
          questions={stepScopedQuestions}
          processMap={map}
          problemCpk={problemCpk ?? 0}
          eventsPerWeek={eventsPerWeek ?? 0}
          activeColumns={activeColumns}
          mode="overlay"
          filterByStepId={focalStepId}
          rows={safeRows}
          columnTypes={columnTypes}
          outcomeColumn={outcomeColumn ?? null}
          onSelectHub={handleSelectWallHub}
        />
      </section>

      {showRankings ? (
        <section
          className="rounded-md border border-edge bg-surface p-3"
          data-testid="factor-contribution-rankings"
        >
          <h3 className="text-sm font-semibold text-content">
            {getMessage(locale, 'canvas.localMechanism.factorContribution')}
          </h3>
          <ol className="mt-2 space-y-1">
            {rankings.map(item => (
              <li key={item.column} className="flex justify-between gap-3 text-sm">
                <span className="text-content">{item.column}</span>
                <span className="text-content-secondary">
                  {formatMessage(locale, 'canvas.localMechanism.etaSquaredLabel', {
                    value: formatStatistic(item.etaSquared, locale, 2),
                  })}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {quickActionColumn ? (
        <LogActionModal
          cardTitle={formatMessage(locale, 'canvas.localMechanism.quickActionTitle', {
            column: quickActionColumn,
          })}
          onCancel={() => setQuickActionColumn(null)}
          onLog={handleLogQuickAction}
        />
      ) : null}
    </section>
  );
}
