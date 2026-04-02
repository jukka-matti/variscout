/**
 * ReportView - Simplified report workspace for PWA
 *
 * Composes ReportViewBase from @variscout/ui with PWA-specific data.
 * Simplified: no SharePoint publish, no Teams share, no AI narratives.
 * Renders basic section content (KPI grids, finding summaries, question summaries).
 */
import React, { useCallback, useRef, useState } from 'react';
import {
  ReportViewBase,
  ReportSection,
  ReportKPIGrid,
  ReportQuestionSummary,
  ReportImprovementSummary,
  ReportCpkLearningLoop,
} from '@variscout/ui';
import { useReportSections, useScrollSpy, copySectionAsHTML } from '@variscout/hooks';
import type { AudienceMode } from '@variscout/hooks';
import type { Finding, Question, SpecLimits, StatsResult, AnalysisMode } from '@variscout/core';
import { formatFindingFilters } from '@variscout/core';
import { resolveMode, getStrategy } from '@variscout/core/strategy';

interface ReportViewProps {
  onClose: () => void;
  // Data
  stats: StatsResult | null;
  specs: SpecLimits;
  findings: Finding[];
  questions: Question[];
  columnAliases: Record<string, string>;
  dataFilename: string | null;
  sampleCount: number;
  analysisMode: AnalysisMode | null;
}

const ReportView: React.FC<ReportViewProps> = ({
  onClose,
  stats,
  specs,
  findings,
  questions,
  columnAliases,
  dataFilename,
  sampleCount,
  analysisMode,
}) => {
  const resolved = resolveMode(analysisMode ?? 'standard');
  const strategy = getStrategy(resolved);

  const [audienceMode, setAudienceMode] = useState<AudienceMode>('technical');

  const { reportType, sections } = useReportSections({
    findings,
    questions,
    stagedComparison: false,
    aiEnabled: false,
    audienceMode,
    analysisMode: resolved === 'capability' ? 'standard' : resolved,
    isCapabilityMode: resolved === 'capability',
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const { activeId, refs: sectionRefs } = useScrollSpy({
    sectionIds: sections.map(s => s.id),
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
    window.print();
  }, []);

  // Build a lookup from section ID to the full descriptor (with findings/questions)
  const sectionMap = new Map(sections.map(s => [s.id, s]));

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

      // Current condition: KPI grid
      if (sectionId === 'current-condition' && stats) {
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
            <ReportKPIGrid stats={stats} specs={specs} sampleCount={sampleCount} />
          </ReportSection>
        );
      }

      // Drivers / Key findings
      if (sectionId === 'drivers' && findings.length > 0) {
        const keyFindings = findings.filter(f => f.tag === 'key-driver');
        const displayFindings = keyFindings.length > 0 ? keyFindings : findings;

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
                  <div className="text-sm font-medium text-content">{f.text || 'Observation'}</div>
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

      // Evidence trail: question summary
      if (sectionId === 'evidence-trail' && questions.length > 0) {
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
            <ReportQuestionSummary questions={questions} />
          </ReportSection>
        );
      }

      // Improvement plan
      if (sectionId === 'improvement-plan') {
        const withIdeas = questions.filter(
          q =>
            (q.status === 'answered' || q.status === 'investigating') &&
            q.ideas &&
            q.ideas.length > 0
        );
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
                questions={withIdeas.map(q => ({
                  id: q.id,
                  text: q.text,
                  causeRole: q.causeRole,
                  ideas: q.ideas ?? [],
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
      findings,
      questions,
      columnAliases,
      strategy,
      sectionRefs,
      sectionMap,
    ]
  );

  return (
    <ReportViewBase
      processName={dataFilename || 'Analysis Report'}
      reportType={reportType}
      sections={sections}
      activeSectionId={activeId}
      audienceMode={audienceMode}
      onAudienceModeChange={setAudienceMode}
      onScrollToSection={handleScrollToSection}
      renderSection={renderSection}
      onCopyAllCharts={handleCopyAllCharts}
      onPrintReport={handlePrintReport}
      onClose={onClose}
      contentRef={contentRef}
    />
  );
};

export default ReportView;
