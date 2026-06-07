/**
 * ReportView - Simplified report workspace for PWA
 *
 * Composes ReportViewBase from @variscout/ui with PWA-specific data.
 * Simplified: no SharePoint publish, no Teams share, no AI narratives.
 * Renders basic section content (KPI grids, finding summaries, question summaries).
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ReportViewBase,
  ReportSection,
  ReportKPIGrid,
  ReportDefectKPIGrid,
  ReportImprovementSummary,
  ReportCpkLearningLoop,
  ActiveIPScopeRibbon,
  IPContextChip,
  HubPortfolioReport,
  IPTechnicalReport,
} from '@variscout/ui';
import type { ActiveIPScopeLabels } from '@variscout/ui';
import type { ReportDefectKPIGridProps } from '@variscout/ui';
import { useReportSections, useScrollSpy, copySectionAsHTML } from '@variscout/hooks';
import type { AudienceMode } from '@variscout/hooks';
import type {
  ControlHandoff,
  Finding,
  Hypothesis,
  ProcessHub,
  SpecLimits,
  StatsResult,
  AnalysisMode,
  DataRow,
  ControlRecord,
} from '@variscout/core';
import {
  deriveHubPortfolioReport,
  deriveIPCauseRows,
  deriveIPReportNarrative,
  formatFindingFilters,
  humanizeReportFindingLabel,
  selectIPReportScope,
} from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { resolveMode, getStrategy } from '@variscout/core/strategy';

interface ReportViewProps {
  onClose: () => void;
  // Data
  stats: StatsResult | null;
  specs: SpecLimits;
  findings: Finding[];
  columnAliases: Record<string, string>;
  dataFilename: string | null;
  sampleCount: number;
  analysisMode: AnalysisMode | null;
  filteredData?: DataRow[];
  outcome?: string | null;
  /** Defect mode KPI data — when provided, renders defect-specific KPIs */
  defectSummary?: ReportDefectKPIGridProps | null;
  hub?: ProcessHub | null;
  activeIP?: ImprovementProject | null;
  hypotheses?: Hypothesis[];
  controlRecords?: ControlRecord[];
  controlHandoffs?: ControlHandoff[];
  activeIPScope?: { title: string; labels: ActiveIPScopeLabels } | null;
  activeIPTitle?: string | null;
  onOpenActiveIP?: () => void;
  onExitActiveIP?: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({
  onClose,
  stats,
  specs,
  findings,
  columnAliases,
  dataFilename,
  sampleCount,
  analysisMode,
  filteredData = [],
  outcome,
  defectSummary,
  hub,
  activeIP,
  hypotheses = [],
  controlRecords = [],
  controlHandoffs = [],
  activeIPScope,
  activeIPTitle,
  onOpenActiveIP,
  onExitActiveIP,
}) => {
  const resolved = resolveMode(analysisMode ?? 'standard');
  const strategy = getStrategy(resolved);

  const [reportAudienceMode, setReportAudienceMode] = useState<'overview' | 'technical'>(
    'overview'
  );
  const audienceMode: AudienceMode = reportAudienceMode === 'overview' ? 'summary' : 'technical';

  const ipReportScope = useMemo(
    () =>
      activeIP
        ? selectIPReportScope({
            ip: activeIP,
            hypotheses,
            findings,
            controlRecords,
            controlHandoffs,
          })
        : null,
    [activeIP, controlHandoffs, findings, hypotheses, controlRecords]
  );

  const ipNarrative = useMemo(
    () =>
      activeIP && ipReportScope
        ? deriveIPReportNarrative({
            ip: activeIP,
            hypotheses: ipReportScope.hypotheses,
            findings: ipReportScope.findings,
            controlRecord: ipReportScope.controlRecord,
            controlHandoff: ipReportScope.controlHandoff,
          })
        : [],
    [activeIP, ipReportScope]
  );

  const ipCauseRows = useMemo(
    () =>
      activeIP && ipReportScope
        ? deriveIPCauseRows({
            ip: activeIP,
            hypotheses: ipReportScope.hypotheses,
            findings: ipReportScope.findings,
            controlRecord: ipReportScope.controlRecord,
          })
        : [],
    [activeIP, ipReportScope]
  );

  const hubPortfolio = useMemo(() => (hub ? deriveHubPortfolioReport({ hub }) : null), [hub]);
  const reportFindings = activeIP && ipReportScope ? ipReportScope.findings : findings;
  // IM-1: improvement summary derives from hypothesis hubs (Question entity retired).
  const reportHypotheses = activeIP && ipReportScope ? ipReportScope.hypotheses : hypotheses;
  const technicalOutcomeSeries = useMemo(
    () =>
      outcome
        ? filteredData
            .map((row, index) => ({ x: index + 1, y: Number(row[outcome]) }))
            .filter(point => Number.isFinite(point.y))
        : [],
    [filteredData, outcome]
  );
  const technicalValues = useMemo(
    () => technicalOutcomeSeries.map(point => point.y),
    [technicalOutcomeSeries]
  );
  const technicalChannels = useMemo(() => {
    if (!stats || technicalValues.length === 0) return [];
    return [
      {
        id: outcome ?? 'outcome',
        label: outcome ?? 'Outcome',
        n: technicalValues.length,
        mean: stats.mean,
        stdDev: stats.stdDev,
        cp: stats.cp,
        cpk: stats.cpk,
        min: Math.min(...technicalValues),
        max: Math.max(...technicalValues),
        health:
          stats.cpk != null && stats.cpk >= 1.67
            ? 'excellent'
            : stats.cpk != null && stats.cpk >= 1.33
              ? 'capable'
              : stats.cpk != null && stats.cpk >= 1
                ? 'warning'
                : 'critical',
        outOfSpecPercentage: stats.outOfSpecPercentage,
        values: technicalValues,
      },
    ] as const;
  }, [outcome, stats, technicalValues]);

  const { reportType, sections } = useReportSections({
    findings: reportFindings,
    stagedComparison: false,
    aiEnabled: false,
    audienceMode,
    analysisMode: resolved === 'capability' ? 'standard' : resolved,
    isCapabilityMode: resolved === 'capability',
  });

  const plan4Sections = useMemo(() => {
    if (activeIP && reportAudienceMode === 'overview') {
      return ipNarrative.map((section, index) => ({
        id: `ip-overview-${index}`,
        stepNumber: index + 1,
        title: section.title,
        status: 'done' as const,
        workspace:
          index <= 2
            ? ('analysis' as const)
            : index <= 4
              ? ('findings' as const)
              : ('improvement' as const),
        items: section.items,
      }));
    }
    if (activeIP && reportAudienceMode === 'technical') return sections;
    if (!activeIP && hubPortfolio) {
      return [
        {
          id: 'hub-portfolio',
          stepNumber: 1,
          title: 'Hub portfolio',
          status: 'active' as const,
          workspace: 'analysis' as const,
        },
      ];
    }
    return sections;
  }, [activeIP, hubPortfolio, ipNarrative, reportAudienceMode, sections]);

  const contentRef = useRef<HTMLDivElement>(null);
  const { activeId, refs: sectionRefs } = useScrollSpy({
    sectionIds: plan4Sections.map(s => s.id),
  });

  // Scroll to section by ID
  const handleScrollToSection = useCallback(
    (id: string) => {
      const ref = sectionRefs[id];
      if (ref?.current) {
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [sectionRefs]
  );

  // Copy report content
  const handleCopyAllCharts = useCallback(() => {
    const el = contentRef.current;
    if (el) {
      copySectionAsHTML(el);
    }
  }, []);

  // Print report
  const handlePrintReport = useCallback(() => {
    const previousTitle = document.title;
    const date = new Date().toISOString().slice(0, 10);
    const hubName = hub?.name ?? 'Hub';
    const subject = activeIP?.metadata.title ?? 'Hub portfolio';
    const layer = activeIP
      ? reportAudienceMode === 'overview'
        ? 'Overview'
        : 'Technical'
      : 'Overview';
    document.title = `${hubName}-${subject}-${layer}-${date}.pdf`;
    window.print();
    document.title = previousTitle;
  }, [activeIP, hub?.name, reportAudienceMode]);

  // Render section content based on section descriptor
  // The callback receives SectionDescriptor (subset), we look up the full descriptor
  const renderSection = useCallback(
    (section: {
      id: string;
      stepNumber: number;
      title: string;
      status: 'done' | 'active' | 'future';
      workspace: 'analysis' | 'findings' | 'improvement';
    }) => {
      const sectionId = section.id;
      const ref = sectionRefs[sectionId];

      if (activeIP && reportAudienceMode === 'overview' && sectionId.startsWith('ip-overview-')) {
        const overviewSection = ipNarrative[section.stepNumber - 1];
        return (
          <ReportSection
            key={sectionId}
            id={sectionId}
            stepNumber={section.stepNumber}
            title={section.title}
            status={section.status}
            workspace={section.workspace}
            sectionRef={ref}
          >
            <ul className="space-y-2">
              {(overviewSection?.items ?? []).map(item => (
                <li key={item} className="text-sm text-content-secondary">
                  {item}
                </li>
              ))}
            </ul>
            {section.title === 'What we found + what we did' && ipCauseRows.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {ipCauseRows.map(row => (
                  <div
                    key={row.hypothesisId}
                    className="rounded-lg border border-edge bg-surface-secondary p-3"
                  >
                    <p className="text-sm font-medium text-content">{row.title}</p>
                    <p className="mt-1 text-sm text-content-secondary">{row.synthesis}</p>
                    <p className="mt-2 text-xs text-content-tertiary">
                      {row.selectedIdea ?? 'No selected idea yet'} · {row.actionProgressLabel} ·{' '}
                      {row.verificationLabel} · {row.miniChartType}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </ReportSection>
        );
      }

      if (!activeIP && hubPortfolio && sectionId === 'hub-portfolio') {
        return (
          <ReportSection
            key={sectionId}
            id={sectionId}
            stepNumber={section.stepNumber}
            title={section.title}
            status={section.status}
            workspace={section.workspace}
            sectionRef={ref}
          >
            <HubPortfolioReport report={hubPortfolio} />
          </ReportSection>
        );
      }

      // Current condition: KPI grid (defect mode uses defect-specific KPIs)
      if (sectionId === 'current-condition' && (stats || defectSummary)) {
        return (
          <ReportSection
            key={sectionId}
            id={sectionId}
            stepNumber={section.stepNumber}
            title={section.title}
            status={section.status}
            workspace={section.workspace}
            sectionRef={ref}
          >
            {defectSummary ? (
              <ReportDefectKPIGrid {...defectSummary} />
            ) : stats ? (
              <ReportKPIGrid stats={stats} specs={specs} sampleCount={sampleCount} />
            ) : null}
            {activeIP && reportAudienceMode === 'technical' ? (
              <div className="mt-4">
                <IPTechnicalReport
                  outcomeSeries={technicalOutcomeSeries}
                  stats={stats}
                  specs={specs}
                  afterValues={technicalValues}
                  afterMean={stats?.mean}
                  channels={technicalChannels}
                />
              </div>
            ) : null}
          </ReportSection>
        );
      }

      // Drivers / Key findings
      if (sectionId === 'drivers' && reportFindings.length > 0) {
        const keyFindings = reportFindings.filter(f => f.tag === 'key-driver');
        const displayFindings = keyFindings.length > 0 ? keyFindings : reportFindings;

        return (
          <ReportSection
            key={sectionId}
            id={sectionId}
            stepNumber={section.stepNumber}
            title={section.title}
            status={section.status}
            workspace={section.workspace}
            sectionRef={ref}
          >
            <div className="space-y-3">
              {displayFindings.map(f => (
                <div key={f.id} className="border border-edge rounded-lg p-3 bg-surface-secondary">
                  <div className="text-sm font-medium text-content">
                    {humanizeReportFindingLabel(f, columnAliases)}
                  </div>
                  {f.context?.activeFilters && (
                    <div className="text-xs text-content-tertiary mt-1">
                      {formatFindingFilters(f.context, columnAliases)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ReportSection>
        );
      }

      // Evidence trail — IM-1 (ADR-085): the Question entity is retired, so the
      // standalone question-tree summary is gone. Findings carry the trail.

      // Improvement plan — ideas live on hypothesis hubs; cause "role" derives
      // from Hypothesis.status.
      if (sectionId === 'improvement-plan') {
        const withIdeas = reportHypotheses.filter(h => (h.ideas?.length ?? 0) > 0);
        if (withIdeas.length > 0) {
          return (
            <ReportSection
              key={sectionId}
              id={sectionId}
              stepNumber={section.stepNumber}
              title={section.title}
              status={section.status}
              workspace={section.workspace}
              sectionRef={ref}
            >
              <ReportImprovementSummary
                questions={withIdeas.map(h => ({
                  id: h.id,
                  text: h.name,
                  status: h.status,
                  ideas: h.ideas ?? [],
                }))}
              />
            </ReportSection>
          );
        }
      }

      // Verification: learning loop (Cpk progress)
      if (sectionId === 'verification' && stats?.cpk != null) {
        return (
          <ReportSection
            key={sectionId}
            id={sectionId}
            stepNumber={section.stepNumber}
            title={section.title}
            status={section.status}
            workspace={section.workspace}
            sectionRef={ref}
          >
            <ReportCpkLearningLoop
              valueBefore={stats.cpk}
              metricLabel={strategy.metricLabel(specs.usl != null || specs.lsl != null)}
            />
          </ReportSection>
        );
      }

      // Default: render section with placeholder
      return (
        <ReportSection
          key={sectionId}
          id={sectionId}
          stepNumber={section.stepNumber}
          title={section.title}
          status={section.status}
          workspace={section.workspace}
          sectionRef={ref}
        >
          <p className="text-sm text-content-tertiary italic">
            This section will be populated as you progress through the analysis.
          </p>
        </ReportSection>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      stats,
      specs,
      sampleCount,
      reportFindings,
      reportHypotheses,
      columnAliases,
      strategy,
      sectionRefs,
      activeIP,
      hubPortfolio,
      ipCauseRows,
      ipNarrative,
      plan4Sections,
      reportAudienceMode,
      technicalChannels,
      technicalOutcomeSeries,
      technicalValues,
    ]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {activeIPScope ? (
        <ActiveIPScopeRibbon
          title={activeIPScope.title}
          labels={activeIPScope.labels}
          surface="Report"
        />
      ) : null}
      <ReportViewBase
        processName={
          activeIPScope ? `IP Report: ${activeIPScope.title}` : dataFilename || 'Analysis Report'
        }
        reportType={reportType}
        sections={plan4Sections}
        activeSectionId={activeId}
        reportingOnLabel={activeIP?.metadata.title ?? 'Hub portfolio'}
        reportAudienceMode={activeIP ? reportAudienceMode : 'overview'}
        onReportAudienceModeChange={activeIP ? setReportAudienceMode : undefined}
        onScrollToSection={handleScrollToSection}
        renderSection={renderSection}
        onCopyAllCharts={handleCopyAllCharts}
        onPrintReport={handlePrintReport}
        onClose={onClose}
        activeIPContextChip={
          activeIPTitle && onOpenActiveIP && onExitActiveIP ? (
            <IPContextChip
              title={activeIPTitle}
              onTitleClick={onOpenActiveIP}
              onExitIP={onExitActiveIP}
            />
          ) : null
        }
        contentRef={contentRef}
      />
    </div>
  );
};

export default ReportView;
