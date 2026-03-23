/**
 * Azure ReportView - Workspace-aligned report with audience toggle.
 *
 * Composes the report from current analysis state, findings, hypotheses,
 * and improvement data. Supports 3 report types (Analysis Snapshot,
 * Investigation Report, Improvement Story) with Technical/Summary audience modes.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  SynthesisCard,
  ReportHypothesisSummary,
  ReportImprovementSummary,
  ReportCpkLearningLoop,
  ReportYamazumiKPIGrid,
  ReportCapabilityKPIGrid,
  ReportPerformanceKPIGrid,
  ReportActivityBreakdown,
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
  useYamazumiChartData,
  useCapabilityIChartData,
  copySectionAsHTML,
} from '@variscout/hooks';
import type { ReportSectionDescriptor, VerificationChartId, AudienceMode } from '@variscout/hooks';
import type { Finding, SpecLimits } from '@variscout/core';
import {
  formatFindingFilters,
  calculateStagedComparison,
  computeYamazumiSummary,
} from '@variscout/core';
import { IChartBase, BoxplotBase, ParetoChartBase, YamazumiChartBase } from '@variscout/charts';
import IChart from '../charts/IChart';
import Boxplot from '../charts/Boxplot';
import ParetoChart from '../charts/ParetoChart';
import { usePublishReport } from '../../hooks/usePublishReport';

interface ReportViewProps {
  onClose: () => void;
  onShareReport?: () => void;
  canShareViaTeams?: boolean;
  // AI enhancement
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
    analysisMode,
    yamazumiMapping,
    subgroupConfig,
    performanceResult,
  } = useData();

  const findings = useMemo(() => persistedFindings ?? [], [persistedFindings]);
  const hypotheses = useMemo(() => persistedHypotheses ?? [], [persistedHypotheses]);

  // ---------------------------------------------------------------------------
  // Yamazumi mode data
  // ---------------------------------------------------------------------------
  const isYamazumi = analysisMode === 'yamazumi';
  const isCapabilityMode =
    analysisMode === 'standard' && displayOptions?.standardIChartMetric === 'capability';

  const yamazumiBarData = useYamazumiChartData({
    filteredData: isYamazumi ? filteredData : [],
    mapping: isYamazumi ? (yamazumiMapping ?? null) : null,
  });

  const yamazumiSummary = useMemo(
    () =>
      isYamazumi && yamazumiBarData.length > 0
        ? computeYamazumiSummary(yamazumiBarData, yamazumiMapping?.taktTime)
        : null,
    [isYamazumi, yamazumiBarData, yamazumiMapping?.taktTime]
  );

  // ---------------------------------------------------------------------------
  // Capability mode data
  // ---------------------------------------------------------------------------
  const capabilityIChartData = useCapabilityIChartData({
    filteredData: isCapabilityMode ? filteredData : [],
    outcome: outcome ?? '',
    specs: specs ?? {},
    subgroupConfig: subgroupConfig ?? { method: 'fixed-size', size: 5 },
    cpkTarget,
  });

  const capabilityKPIs = useMemo(() => {
    if (!isCapabilityMode || !capabilityIChartData.cpkStats) return null;
    const results = capabilityIChartData.subgroupResults;
    const target = cpkTarget ?? 1.33;
    const cpkValues = results.map(r => r.cpk).filter((v): v is number => v !== undefined);
    const cpValues = results.map(r => r.cp).filter((v): v is number => v !== undefined);
    return {
      meanCpk: cpkValues.length > 0 ? cpkValues.reduce((a, b) => a + b, 0) / cpkValues.length : 0,
      meanCp:
        cpValues.length > 0 ? cpValues.reduce((a, b) => a + b, 0) / cpValues.length : undefined,
      subgroupCount: results.length,
      passingCount: cpkValues.filter(v => v >= target).length,
    };
  }, [isCapabilityMode, capabilityIChartData, cpkTarget]);

  // ---------------------------------------------------------------------------
  // Audience mode state
  // ---------------------------------------------------------------------------
  const [audienceMode, setAudienceMode] = useState<AudienceMode>('technical');
  const isSummary = audienceMode === 'summary';

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
  // Best projected Cpk from improvement ideas (for learning loop)
  // ---------------------------------------------------------------------------
  const bestProjectedCpk = useMemo(() => {
    const projections: number[] = [];
    for (const h of hypotheses) {
      if (h.ideas) {
        for (const idea of h.ideas) {
          if (idea.selected && idea.projection?.projectedCpk != null) {
            projections.push(idea.projection.projectedCpk);
          }
        }
      }
    }
    return projections.length > 0 ? Math.max(...projections) : undefined;
  }, [hypotheses]);

  // ---------------------------------------------------------------------------
  // First finding with outcome (for learning loop verdict)
  // ---------------------------------------------------------------------------
  const primaryOutcome = useMemo(() => {
    const f = findings.find(f => f.outcome != null);
    return f?.outcome ?? null;
  }, [findings]);

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
    audienceMode,
    analysisMode: analysisMode ?? 'standard',
    isCapabilityMode,
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

  // ---------------------------------------------------------------------------
  // Print / Save as PDF
  // ---------------------------------------------------------------------------
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useCallback(() => {
    // Force-expand all sections
    setIsPrinting(true);

    // Switch to light theme for print
    const prevTheme = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'light');

    // Wait for React re-render, then print
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });

    // Restore after print dialog closes
    const restore = () => {
      if (prevTheme) {
        document.documentElement.setAttribute('data-theme', prevTheme);
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      setIsPrinting(false);
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
  }, []);

  // Cleanup afterprint listener on unmount
  useEffect(() => {
    return () => {
      // Safety: if component unmounts while print dialog is open, restore won't leak
    };
  }, []);

  // Build a lookup map for extended section data
  const sectionMap = useMemo(() => {
    const map = new Map<string, ReportSectionDescriptor>();
    for (const s of sections) map.set(s.id, s);
    return map;
  }, [sections]);

  // Render a staged verification chart by ID
  const renderVerificationChart = (id: VerificationChartId): React.ReactNode | null => {
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
  };

  // Render a single section based on its descriptor
  const renderSection = (section: {
    id: string;
    stepNumber: number;
    title: string;
    status: 'done' | 'active' | 'future';
    workspace: 'analysis' | 'findings' | 'improvement';
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
          workspace={section.workspace}
          sectionRef={ref}
          onCopyAsSlide={() => handleCopySectionAsSlide(section.id)}
          copyFeedback={sectionCopyFeedback === section.id}
          defaultOpen={section.status !== 'future'}
          forceOpen={isPrinting}
        >
          {/* Step 1: Current Condition / Time Composition */}
          {section.id === 'current-condition' && outcome && (
            <div className="space-y-4">
              {isYamazumi && yamazumiSummary ? (
                <>
                  <ReportYamazumiKPIGrid summary={yamazumiSummary} />
                  {!isSummary && yamazumiBarData.length > 0 && (
                    <div style={{ pointerEvents: 'none' }}>
                      <YamazumiChartBase
                        data={yamazumiBarData}
                        taktTime={yamazumiMapping?.taktTime}
                        parentWidth={REPORT_CHART_WIDTH}
                        parentHeight={REPORT_CHART_HEIGHT}
                        showBranding={false}
                      />
                    </div>
                  )}
                </>
              ) : isCapabilityMode && capabilityKPIs ? (
                <>
                  <ReportCapabilityKPIGrid
                    meanCpk={capabilityKPIs.meanCpk}
                    meanCp={capabilityKPIs.meanCp}
                    cpkTarget={cpkTarget ?? 1.33}
                    subgroupCount={capabilityKPIs.subgroupCount}
                    passingCount={capabilityKPIs.passingCount}
                  />
                  {!isSummary && (
                    <ReportChartSnapshot
                      id="report-snapshot-capability-ichart"
                      chartType="capability-ichart"
                      filterLabel="Capability per subgroup"
                      renderChart={() => <IChart />}
                      onCopyChart={async (containerId, chartName) => {
                        await handleCopyChart(containerId, chartName);
                      }}
                      copyFeedback={copyFeedback}
                    />
                  )}
                </>
              ) : analysisMode === 'performance' && performanceResult ? (
                (() => {
                  const target = cpkTarget ?? 1.33;
                  const withCpk = performanceResult.channels.filter(c => c.cpk !== undefined);
                  const worst =
                    withCpk.length > 0 ? withCpk.reduce((w, c) => (c.cpk! < w.cpk! ? c : w)) : null;
                  return (
                    <>
                      <ReportPerformanceKPIGrid
                        totalChannels={performanceResult.channels.length}
                        passingChannels={withCpk.filter(c => c.cpk! >= target).length}
                        worstCpk={worst?.cpk ?? 0}
                        worstChannelName={worst?.label ?? '—'}
                        meanCpk={
                          withCpk.length > 0
                            ? withCpk.reduce((s, c) => s + c.cpk!, 0) / withCpk.length
                            : 0
                        }
                        cpkTarget={target}
                      />
                      {!isSummary && (
                        <ReportChartSnapshot
                          id="report-snapshot-performance-ichart"
                          chartType="performance-ichart"
                          filterLabel="Channel performance"
                          renderChart={() => <IChart />}
                          onCopyChart={async (containerId, chartName) => {
                            await handleCopyChart(containerId, chartName);
                          }}
                          copyFeedback={copyFeedback}
                        />
                      )}
                    </>
                  );
                })()
              ) : (
                stats && (
                  <>
                    <ReportKPIGrid stats={stats} specs={specs} sampleCount={filteredData.length} />
                    {!isSummary && (
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
                    )}
                  </>
                )
              )}
              {!isSummary && aiEnabled && narrative && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {narrative}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Variation Drivers / Activity Composition */}
          {section.id === 'drivers' &&
            (() => {
              // Audience-aware findings filter
              const rawFindings = extendedSection?.findings ?? [];
              const driverFindings = (() => {
                if (!isSummary) {
                  // Technical: all findings, key-driver first
                  return [...rawFindings].sort((a, b) => {
                    if (a.tag === 'key-driver' && b.tag !== 'key-driver') return -1;
                    if (b.tag === 'key-driver' && a.tag !== 'key-driver') return 1;
                    return 0;
                  });
                }
                // Summary (improvement-story): only findings with actions
                const withActions = rawFindings.filter(f => f.actions && f.actions.length > 0);
                if (withActions.length > 0) return withActions;
                // Fallback: key-driver tagged, or all
                const keyDrivers = rawFindings.filter(f => f.tag === 'key-driver');
                return keyDrivers.length > 0 ? keyDrivers : rawFindings;
              })();

              return (
                <div className="space-y-4">
                  {driverFindings.length > 0 ? (
                    // Finding-driven content (all modes)
                    isSummary ? (
                      // Summary: finding text + key driver name
                      driverFindings.map(finding => (
                        <div
                          key={finding.id}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3"
                        >
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {finding.text || 'Observation'}
                          </p>
                        </div>
                      ))
                    ) : (
                      // Technical: finding text + chart context
                      driverFindings.map(finding => (
                        <div key={finding.id} className="space-y-3">
                          <div className="flex items-start gap-2">
                            <span
                              className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                                finding.status === 'observed'
                                  ? 'bg-amber-400'
                                  : finding.status === 'investigating'
                                    ? 'bg-blue-400'
                                    : finding.status === 'analyzed'
                                      ? 'bg-purple-400'
                                      : 'bg-green-400'
                              }`}
                            />
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {finding.text || 'Observation'}
                            </p>
                          </div>
                          {/* Yamazumi: show activity breakdown for the step */}
                          {isYamazumi &&
                            finding.source &&
                            'category' in finding.source &&
                            (() => {
                              const { category } = finding.source as { category: string };
                              const barData = yamazumiBarData.find(b => b.key === category);
                              return barData ? (
                                <ReportActivityBreakdown stepName={category} barData={barData} />
                              ) : null;
                            })()}
                          {/* SPC: show KPI snapshot */}
                          {!isYamazumi && outcome && (
                            <FindingChartSnapshot
                              finding={finding}
                              rawData={rawData}
                              outcome={outcome}
                              specs={specs}
                              columnAliases={columnAliases}
                            />
                          )}
                        </div>
                      ))
                    )
                  ) : // Fallback: no findings
                  isYamazumi ? (
                    // Yamazumi fallback: show yamazumi chart as overview
                    !isSummary && yamazumiBarData.length > 0 ? (
                      <div style={{ pointerEvents: 'none' }}>
                        <YamazumiChartBase
                          data={yamazumiBarData}
                          taktTime={yamazumiMapping?.taktTime}
                          parentWidth={REPORT_CHART_WIDTH}
                          parentHeight={REPORT_CHART_HEIGHT}
                          showBranding={false}
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                        Pin observations on the yamazumi chart to see activity breakdowns here.
                      </p>
                    )
                  ) : firstFactor ? (
                    // Standard SPC fallback (unchanged)
                    isSummary ? (
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          Key driver:{' '}
                          <span className="font-medium">
                            {columnAliases?.[firstFactor] || firstFactor}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <>
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
                      </>
                    )
                  ) : null}
                </div>
              );
            })()}

          {/* Step 3: Evidence Trail */}
          {section.id === 'evidence-trail' && outcome && (
            <div className="space-y-4">
              {/* Synthesis card (always shown) */}
              {processContext?.synthesis && (
                <div className="mb-2">
                  <SynthesisCard synthesis={processContext.synthesis} readOnly />
                </div>
              )}

              {/* Hypothesis tree (technical only) */}
              {!isSummary && (extendedSection?.hypotheses ?? []).length > 0 && (
                <ReportHypothesisSummary hypotheses={extendedSection?.hypotheses ?? []} />
              )}

              {/* Finding snapshots (technical only) */}
              {!isSummary && (extendedSection?.findings ?? []).length > 0 ? (
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
              ) : !isSummary ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  No hypotheses have been linked to findings yet.
                </p>
              ) : null}
            </div>
          )}

          {/* Step 4: Improvement Plan (Improvement Story only) */}
          {section.id === 'improvement-plan' && (
            <div className="space-y-3">
              {(extendedSection?.hypotheses ?? []).length > 0 ? (
                <ReportImprovementSummary
                  hypotheses={(extendedSection?.hypotheses ?? []).map(h => ({
                    id: h.id,
                    text: h.text,
                    causeRole: h.causeRole,
                    ideas: h.ideas ?? [],
                  }))}
                  summaryOnly={isSummary}
                  targetCpk={cpkTarget}
                />
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  No improvement ideas have been recorded yet.
                </p>
              )}
            </div>
          )}

          {/* Step 5: Actions Taken (Improvement Story only) */}
          {section.id === 'actions-taken' && (
            <div className="space-y-3">
              {(extendedSection?.findings ?? []).length > 0 ? (
                isSummary ? (
                  // Summary: action count + completion %
                  (() => {
                    const allActions = (extendedSection?.findings ?? []).flatMap(
                      f => f.actions ?? []
                    );
                    const completed = allActions.filter(a => a.completedAt);
                    const pct =
                      allActions.length > 0
                        ? Math.round((completed.length / allActions.length) * 100)
                        : 0;
                    return (
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          <span className="font-medium">{allActions.length}</span> actions
                          {' · '}
                          <span
                            className={
                              completed.length === allActions.length
                                ? 'text-green-600 dark:text-green-400 font-medium'
                                : ''
                            }
                          >
                            {pct}% complete
                          </span>
                        </p>
                      </div>
                    );
                  })()
                ) : (
                  // Technical: full action list
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
                            {action.assignee && (
                              <span className="text-xs text-slate-400">
                                ({action.assignee.displayName})
                              </span>
                            )}
                            {action.dueDate && (
                              <span className="text-xs text-slate-400">due {action.dueDate}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  No actions have been recorded yet.
                </p>
              )}
            </div>
          )}

          {/* Step 6: Verification (Improvement Story only) */}
          {section.id === 'verification' && (
            <div className="space-y-3">
              {/* Cpk learning loop */}
              {(cpkBefore != null || cpkAfter != null) &&
                (() => {
                  const hasSpecs = specs.usl !== undefined || specs.lsl !== undefined;
                  const loopMetricLabel = isYamazumi
                    ? 'VA Ratio'
                    : isCapabilityMode
                      ? 'Mean Cpk'
                      : analysisMode === 'performance'
                        ? 'Worst Channel Cpk'
                        : hasSpecs
                          ? 'Cpk'
                          : 'σ';
                  const loopFormatValue = isYamazumi
                    ? (v: number) => `${Math.round(v * 100)}%`
                    : undefined;
                  return (
                    <ReportCpkLearningLoop
                      valueBefore={cpkBefore}
                      projectedValue={bestProjectedCpk}
                      valueAfter={cpkAfter}
                      verdict={primaryOutcome?.effective}
                      metricLabel={loopMetricLabel}
                      formatValue={loopFormatValue}
                    />
                  );
                })()}

              {/* Finding outcomes list (technical only) */}
              {!isSummary &&
                (extendedSection?.findings ?? []).length > 0 &&
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

              {/* Staged verification evidence (technical only) */}
              {!isSummary && hasStagedComparison && hasAnyAvailable && (
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
  };

  if (!outcome) return null;

  return (
    <ErrorBoundary componentName="Report View">
      <ReportViewBase
        contentRef={contentRef}
        processName={processName}
        reportType={reportType}
        sections={sections}
        activeSectionId={activeSectionId}
        audienceMode={audienceMode}
        onAudienceModeChange={setAudienceMode}
        onScrollToSection={handleScrollToSection}
        renderSection={renderSection}
        onPrintReport={handlePrint}
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
