/**
 * Azure ReportView - Thin wrapper connecting DataContext to ReportViewBase.
 * Composes the scouting report from current analysis state, findings, and hypotheses.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useData } from '../../context/DataContext';
import { hasTeamFeatures } from '@variscout/core';
import {
  ReportViewBase,
  ReportSection,
  ReportKPIGrid,
  ReportChartSnapshot,
  ErrorBoundary,
  StagedComparisonCard,
  CapabilityHistogram,
  VerificationEvidenceBase,
} from '@variscout/ui';
import {
  useReportSections,
  useScrollSpy,
  useSnapshotData,
  useChartCopy,
  useVerificationCharts,
  useBoxplotData,
  useBoxplotWrapperData,
  useIChartData,
  copySectionAsHTML,
} from '@variscout/hooks';
import type { ReportSectionDescriptor, VerificationChartId } from '@variscout/hooks';
import type { Finding, SpecLimits } from '@variscout/core';
import { formatFindingFilters, calculateStagedComparison } from '@variscout/core';
import { IChartBase, BoxplotBase, ParetoChartBase } from '@variscout/charts';
import IChart from '../charts/IChart';
import Boxplot from '../charts/Boxplot';
import ParetoChart from '../charts/ParetoChart';
import { usePublishReport } from '../../hooks/usePublishReport';

interface ReportViewProps {
  onClose: () => void;
  onShareReport?: () => void;
  canShareViaTeams?: boolean;
  // AI enhancement (Phase 5)
  aiEnabled?: boolean;
  narrative?: string | null;
}

// ---------------------------------------------------------------------------
// Sub-component: renders a KPI snapshot for a finding's filter state
// ---------------------------------------------------------------------------

const FindingChartSnapshot: React.FC<{
  finding: Finding;
  rawData: import('@variscout/core').DataRow[];
  outcome: string;
  specs: SpecLimits;
  columnAliases?: Record<string, string>;
}> = ({ finding, rawData, outcome, specs, columnAliases }) => {
  const { stats, values } = useSnapshotData({
    rawData,
    outcome,
    specs,
    activeFilters: finding.context.activeFilters,
  });

  const filterLabel = formatFindingFilters(finding.context, columnAliases);

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-600 dark:text-slate-400">
        {finding.text || 'Observation'}
        {filterLabel && (
          <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">({filterLabel})</span>
        )}
      </div>
      <ReportKPIGrid stats={stats} specs={specs} sampleCount={values.length} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Chart size constants for report snapshots
// ---------------------------------------------------------------------------

const REPORT_CHART_MAX_WIDTH = 720;
const REPORT_CHART_HEIGHT = 320;
const REPORT_HISTOGRAM_HEIGHT = 280;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const ReportView: React.FC<ReportViewProps> = ({
  onClose,
  onShareReport,
  canShareViaTeams,
  aiEnabled,
  narrative,
}) => {
  const {
    rawData,
    outcome,
    factors,
    specs,
    stats,
    filteredData,
    findings: persistedFindings,
    hypotheses: persistedHypotheses,
    columnAliases,
    processContext,
    stageColumn,
    stagedStats,
    cpkTarget,
    displayOptions,
  } = useData();

  const findings = persistedFindings ?? [];
  const hypotheses = persistedHypotheses ?? [];

  // ---------------------------------------------------------------------------
  // Responsive chart width — clamp to container width on small screens
  // ---------------------------------------------------------------------------
  const contentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(REPORT_CHART_MAX_WIDTH);

  React.useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        // Subtract padding (px-6 = 24px each side = 48px total)
        const w = Math.floor(entry.contentRect.width) - 48;
        setContainerWidth(Math.max(280, Math.min(w, REPORT_CHART_MAX_WIDTH)));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const REPORT_CHART_WIDTH = containerWidth;

  // ---------------------------------------------------------------------------
  // Staged comparison (computed locally, not from DataContext)
  // ---------------------------------------------------------------------------
  const stagedComparison = useMemo(
    () => (stagedStats ? calculateStagedComparison(stagedStats) : null),
    [stagedStats]
  );

  const hasStagedComparison = stagedComparison !== null;

  // ---------------------------------------------------------------------------
  // Staged data preparation for verification charts
  // ---------------------------------------------------------------------------
  const firstFactor = factors.length > 0 ? factors[0] : null;
  const stageOrder = useMemo(() => stagedStats?.stageOrder ?? [], [stagedStats]);

  // I-Chart data for staged view
  const ichartData = useIChartData(filteredData, outcome, stageColumn, null);

  // Boxplot data for staged view
  const { data: boxplotData, stageInfo } = useBoxplotData(
    filteredData,
    firstFactor ?? '',
    outcome,
    false,
    stageColumn ?? undefined,
    stageOrder
  );

  const { fillOverrides, xTickFormat } = useBoxplotWrapperData({
    data: boxplotData,
    specs,
    displayOptions: displayOptions ?? { showSpecs: true },
    parentWidth: REPORT_CHART_WIDTH,
    stageInfo,
  });

  // Histogram data: last stage rows
  const { histogramValues, histogramMean } = useMemo(() => {
    if (!stagedStats || !outcome || !stageColumn || stageOrder.length === 0) {
      return { histogramValues: [], histogramMean: 0 };
    }
    const lastStageKey = stageOrder[stageOrder.length - 1];
    const lastStageRows = filteredData.filter(r => String(r[stageColumn]) === lastStageKey);
    const values = lastStageRows.map(r => Number(r[outcome])).filter(v => !isNaN(v));
    const lastStageStats = stagedStats.stages.get(lastStageKey);
    return {
      histogramValues: values,
      histogramMean: lastStageStats?.mean ?? 0,
    };
  }, [stagedStats, outcome, stageColumn, stageOrder, filteredData]);

  // Cpk before/after from staged comparison
  const cpkBefore = stagedComparison?.stages?.[0]?.stats?.cpk;
  const cpkAfter =
    stagedComparison && stagedComparison.stages.length > 1
      ? stagedComparison.stages[stagedComparison.stages.length - 1].stats.cpk
      : undefined;

  // Pareto comparison data: group before-stage rows by first factor
  const paretoComparisonData = useMemo<Map<string, number> | null>(() => {
    if (!firstFactor || !stageColumn || stageOrder.length < 2) return null;
    const firstStageKey = stageOrder[0];
    const beforeRows = rawData.filter(r => String(r[stageColumn]) === firstStageKey);
    if (beforeRows.length === 0) return null;
    const counts = new Map<string, number>();
    for (const row of beforeRows) {
      const cat = String(row[firstFactor]);
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
    return counts;
  }, [rawData, firstFactor, stageColumn, stageOrder]);

  // Pareto data for after-stage
  const { paretoData, paretoTotalCount } = useMemo(() => {
    if (!firstFactor || !stageColumn || stageOrder.length < 2 || !outcome) {
      return { paretoData: [], paretoTotalCount: 0 };
    }
    const lastStageKey = stageOrder[stageOrder.length - 1];
    const afterRows = filteredData.filter(r => String(r[stageColumn]) === lastStageKey);
    const counts = new Map<string, number>();
    for (const row of afterRows) {
      const cat = String(row[firstFactor]);
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
    // Sort descending by count
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((sum, [, c]) => sum + c, 0);
    let cumulative = 0;
    const data = sorted.map(([key, count]) => {
      cumulative += count;
      return {
        key,
        value: count,
        count,
        cumulative,
        cumulativePercentage: total > 0 ? (cumulative / total) * 100 : 0,
      };
    });
    return { paretoData: data, paretoTotalCount: total };
  }, [filteredData, firstFactor, stageColumn, stageOrder, outcome]);

  // ---------------------------------------------------------------------------
  // Verification chart toggle state
  // ---------------------------------------------------------------------------
  const {
    charts: verificationCharts,
    activeCharts: activeVerificationCharts,
    toggleChart: toggleVerificationChart,
    hasAnyAvailable,
  } = useVerificationCharts({
    stagedComparison,
    stagedStats,
    factors,
    specs,
    stageColumn,
    comparisonData: paretoComparisonData,
  });

  // Derive report sections from analysis state
  const { reportType, sections } = useReportSections({
    findings,
    hypotheses,
    stagedComparison: hasStagedComparison,
    aiEnabled: aiEnabled ?? false,
  });

  // Scroll spy for sidebar highlighting
  const { activeId: activeSectionId, refs: sectionRefs } = useScrollSpy({
    sectionIds: sections.map(s => s.id),
  });

  // Chart copy utilities
  const { copyFeedback, handleCopyChart } = useChartCopy();

  // Section copy feedback state
  const [sectionCopyFeedback, setSectionCopyFeedback] = useState<string | null>(null);

  const handleCopySectionAsSlide = useCallback(
    async (sectionId: string) => {
      const el = sectionRefs[sectionId]?.current;
      if (!el) return;
      const ok = await copySectionAsHTML(el);
      if (ok) {
        setSectionCopyFeedback(sectionId);
        setTimeout(() => setSectionCopyFeedback(null), 2000);
      }
    },
    [sectionRefs]
  );

  const handleScrollToSection = useCallback(
    (id: string) => {
      const ref = sectionRefs[id];
      ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [sectionRefs]
  );

  // Process name for the report header
  const processName = processContext?.problemStatement || outcome || 'Analysis';

  // Publish to SharePoint (ADR-026)
  const canPublish = hasTeamFeatures();
  const {
    publish,
    publishReplace,
    status: publishStatus,
    error: publishError,
    publishedUrl,
    reset: publishReset,
  } = usePublishReport({
    projectName: processName,
    processName: processContext?.description,
    reportType,
    sections,
    hypotheses,
    processContext,
    stats: stats ?? undefined,
    sampleCount: filteredData.length,
    aiNarrative: narrative ?? undefined,
  });

  // Build a lookup map for extended section data
  const sectionMap = useMemo(() => {
    const map = new Map<string, ReportSectionDescriptor>();
    for (const s of sections) map.set(s.id, s);
    return map;
  }, [sections]);

  // Render a staged verification chart by ID
  const renderVerificationChart = useCallback(
    (id: VerificationChartId): React.ReactNode | null => {
      switch (id) {
        case 'stats':
          return stagedComparison ? (
            <div className="p-4">
              <StagedComparisonCard comparison={stagedComparison} cpkTarget={cpkTarget} />
            </div>
          ) : null;

        case 'ichart':
          return stagedStats && stats && outcome ? (
            <div style={{ pointerEvents: 'none' }}>
              <IChartBase
                data={ichartData}
                stats={stats}
                stagedStats={stagedStats}
                specs={specs}
                parentWidth={REPORT_CHART_WIDTH}
                parentHeight={REPORT_CHART_HEIGHT}
                showBranding={false}
              />
            </div>
          ) : null;

        case 'boxplot':
          return boxplotData.length > 0 ? (
            <div style={{ pointerEvents: 'none' }}>
              <BoxplotBase
                data={boxplotData}
                specs={specs}
                parentWidth={REPORT_CHART_WIDTH}
                parentHeight={REPORT_CHART_HEIGHT}
                showBranding={false}
                fillOverrides={fillOverrides}
                groupSize={stageInfo?.groupSize}
                xTickFormat={xTickFormat}
              />
            </div>
          ) : null;

        case 'histogram':
          return histogramValues.length > 0 ? (
            <div style={{ pointerEvents: 'none' }}>
              <CapabilityHistogram
                parentWidth={REPORT_CHART_WIDTH}
                parentHeight={REPORT_HISTOGRAM_HEIGHT}
                data={histogramValues}
                specs={specs}
                mean={histogramMean}
                cpkBefore={cpkBefore}
                cpkAfter={cpkAfter}
              />
            </div>
          ) : null;

        case 'pareto':
          return paretoData.length > 0 ? (
            <div style={{ pointerEvents: 'none' }}>
              <ParetoChartBase
                data={paretoData}
                totalCount={paretoTotalCount}
                parentWidth={REPORT_CHART_WIDTH}
                parentHeight={REPORT_CHART_HEIGHT}
                showBranding={false}
                comparisonData={paretoComparisonData ?? undefined}
                showRankChange
              />
            </div>
          ) : null;

        default:
          return null;
      }
    },
    [
      stagedComparison,
      cpkTarget,
      stagedStats,
      stats,
      outcome,
      ichartData,
      specs,
      boxplotData,
      fillOverrides,
      stageInfo,
      xTickFormat,
      histogramValues,
      histogramMean,
      cpkBefore,
      cpkAfter,
      paretoData,
      paretoTotalCount,
      paretoComparisonData,
      REPORT_CHART_WIDTH,
    ]
  );

  // Render a single section based on its descriptor
  const renderSection = useCallback(
    (section: {
      id: string;
      stepNumber: number;
      title: string;
      status: 'done' | 'active' | 'future';
    }) => {
      const extendedSection = sectionMap.get(section.id);
      const ref = sectionRefs[section.id];

      return (
        <ReportSection
          key={section.id}
          id={section.id}
          stepNumber={section.stepNumber}
          title={section.title}
          status={section.status}
          sectionRef={ref}
          onCopyAsSlide={() => handleCopySectionAsSlide(section.id)}
          copyFeedback={sectionCopyFeedback === section.id}
          defaultOpen={section.status !== 'future'}
        >
          {section.id === 'current-condition' && stats && outcome && (
            <div className="space-y-4">
              <ReportKPIGrid stats={stats} specs={specs} sampleCount={filteredData.length} />
              <ReportChartSnapshot
                id="report-snapshot-ichart"
                chartType="ichart"
                filterLabel="Current state"
                renderChart={() => <IChart />}
                onCopyChart={async (containerId, chartName) => {
                  await handleCopyChart(containerId, chartName);
                }}
                copyFeedback={copyFeedback}
              />
              {aiEnabled && narrative && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {narrative}
                  </p>
                </div>
              )}
            </div>
          )}

          {section.id === 'drivers' && firstFactor && (
            <div className="space-y-4">
              <ReportChartSnapshot
                id="report-snapshot-boxplot"
                chartType="boxplot"
                filterLabel={`Factor: ${columnAliases?.[firstFactor] || firstFactor}`}
                renderChart={() => <Boxplot factor={firstFactor} />}
                onCopyChart={async (containerId, chartName) => {
                  await handleCopyChart(containerId, chartName);
                }}
                copyFeedback={copyFeedback}
              />
              <ReportChartSnapshot
                id="report-snapshot-pareto"
                chartType="pareto"
                filterLabel={`Factor: ${columnAliases?.[firstFactor] || firstFactor}`}
                renderChart={() => <ParetoChart factor={firstFactor} />}
                onCopyChart={async (containerId, chartName) => {
                  await handleCopyChart(containerId, chartName);
                }}
                copyFeedback={copyFeedback}
              />
            </div>
          )}

          {section.id === 'hypotheses' && outcome && (
            <div className="space-y-4">
              {(extendedSection?.findings ?? []).length > 0 ? (
                (extendedSection?.findings ?? []).map(finding => (
                  <FindingChartSnapshot
                    key={finding.id}
                    finding={finding}
                    rawData={rawData}
                    outcome={outcome}
                    specs={specs}
                    columnAliases={columnAliases}
                  />
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  No hypotheses have been linked to findings yet.
                </p>
              )}
            </div>
          )}

          {section.id === 'actions' && (
            <div className="space-y-3">
              {(extendedSection?.findings ?? []).length > 0 ? (
                (extendedSection?.findings ?? []).map(finding => (
                  <div
                    key={finding.id}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                      {finding.text || 'Observation'}
                    </p>
                    <ul className="space-y-1">
                      {finding.actions?.map(action => (
                        <li
                          key={action.id}
                          className={`text-sm flex items-center gap-2 ${
                            action.completedAt
                              ? 'text-green-600 dark:text-green-400 line-through'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              action.completedAt ? 'bg-green-500' : 'bg-slate-400'
                            }`}
                          />
                          {action.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  No actions have been recorded yet.
                </p>
              )}
            </div>
          )}

          {section.id === 'verification' && (
            <div className="space-y-3">
              {/* Finding outcomes list (always shown) */}
              {(extendedSection?.findings ?? []).length > 0 &&
                (extendedSection?.findings ?? []).map(finding => (
                  <div
                    key={finding.id}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {finding.text || 'Observation'}
                    </p>
                    {finding.outcome && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Outcome: {finding.outcome.effective}
                        {finding.outcome.notes && ` - ${finding.outcome.notes}`}
                      </p>
                    )}
                  </div>
                ))}

              {/* Staged verification evidence (replaces old placeholder callout) */}
              {hasStagedComparison && hasAnyAvailable && (
                <VerificationEvidenceBase
                  charts={verificationCharts}
                  activeCharts={activeVerificationCharts}
                  onToggleChart={toggleVerificationChart}
                  renderChart={renderVerificationChart}
                />
              )}

              {/* Empty state when no findings and no staged data */}
              {(extendedSection?.findings ?? []).length === 0 && !hasStagedComparison && (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  Verification data will appear once actions are evaluated.
                </p>
              )}
            </div>
          )}
        </ReportSection>
      );
    },
    [
      sectionRefs,
      sectionMap,
      sectionCopyFeedback,
      handleCopySectionAsSlide,
      stats,
      outcome,
      specs,
      filteredData,
      firstFactor,
      columnAliases,
      rawData,
      copyFeedback,
      handleCopyChart,
      aiEnabled,
      narrative,
      hasStagedComparison,
      hasAnyAvailable,
      verificationCharts,
      activeVerificationCharts,
      toggleVerificationChart,
      renderVerificationChart,
    ]
  );

  if (!outcome) return null;

  return (
    <ErrorBoundary componentName="Report View">
      <ReportViewBase
        contentRef={contentRef}
        processName={processName}
        reportType={reportType}
        sections={sections}
        activeSectionId={activeSectionId}
        onScrollToSection={handleScrollToSection}
        renderSection={renderSection}
        onShareReport={onShareReport}
        onPublishToSharePoint={canPublish ? publish : undefined}
        onPublishReplace={publishReplace}
        publishStatus={publishStatus}
        publishError={publishError}
        onPublishReset={publishReset}
        publishedUrl={publishedUrl}
        onClose={onClose}
        canShareViaTeams={canShareViaTeams}
      />
    </ErrorBoundary>
  );
};

export default ReportView;
