/**
 * Azure ReportView - Thin wrapper connecting DataContext to ReportViewBase.
 * Composes the scouting report from current analysis state, findings, and hypotheses.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  ReportViewBase,
  ReportSection,
  ReportKPIGrid,
  ReportChartSnapshot,
  ErrorBoundary,
} from '@variscout/ui';
import {
  useReportSections,
  useScrollSpy,
  useSnapshotData,
  useChartCopy,
  copySectionAsHTML,
} from '@variscout/hooks';
import type { ReportSectionDescriptor } from '@variscout/hooks';
import type { Finding } from '@variscout/core';
import { formatFindingFilters } from '@variscout/core';
import IChart from '../charts/IChart';
import Boxplot from '../charts/Boxplot';
import ParetoChart from '../charts/ParetoChart';

interface ReportViewProps {
  onClose: () => void;
  onShareReport?: () => void;
  canShareViaTeams?: boolean;
  // AI enhancement (Phase 5)
  aiEnabled?: boolean;
  narrative?: string | null;
  stagedComparison?: boolean;
}

// ---------------------------------------------------------------------------
// Sub-component: renders a KPI snapshot for a finding's filter state
// ---------------------------------------------------------------------------

const FindingChartSnapshot: React.FC<{
  finding: Finding;
  rawData: import('@variscout/core').DataRow[];
  outcome: string;
  specs: import('@variscout/core').SpecLimits;
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
// Main component
// ---------------------------------------------------------------------------

const ReportView: React.FC<ReportViewProps> = ({
  onClose,
  onShareReport,
  canShareViaTeams,
  aiEnabled,
  narrative,
  stagedComparison,
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
  } = useData();

  const findings = persistedFindings ?? [];
  const hypotheses = persistedHypotheses ?? [];

  // Derive report sections from analysis state
  const { reportType, sections } = useReportSections({
    findings,
    hypotheses,
    stagedComparison: stagedComparison ?? false,
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

  // First factor for driver charts
  const firstFactor = factors.length > 0 ? factors[0] : null;

  // Process name for the report header
  const processName = processContext?.problemStatement || outcome || 'Analysis';

  // Build a lookup map for extended section data
  const sectionMap = useMemo(() => {
    const map = new Map<string, ReportSectionDescriptor>();
    for (const s of sections) map.set(s.id, s);
    return map;
  }, [sections]);

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
              {(extendedSection?.findings ?? []).length > 0 ? (
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
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  Verification data will appear once actions are evaluated.
                </p>
              )}
              {stagedComparison && (
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Staged Comparison
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Before/after comparison data is available. View the full staged analysis in the
                    dashboard.
                  </p>
                </div>
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
      stagedComparison,
    ]
  );

  if (!outcome) return null;

  return (
    <ErrorBoundary componentName="Report View">
      <ReportViewBase
        processName={processName}
        reportType={reportType}
        sections={sections}
        activeSectionId={activeSectionId}
        onScrollToSection={handleScrollToSection}
        renderSection={renderSection}
        onShareReport={onShareReport}
        onClose={onClose}
        canShareViaTeams={canShareViaTeams}
      />
    </ErrorBoundary>
  );
};

export default ReportView;
