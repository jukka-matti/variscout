/**
 * PISection — PI (Process Intelligence) sidebar section for the Azure editor.
 *
 * Owns:
 * - sidebar resize state (useResizablePanel)
 * - visibility guard (isPISidebarOpen from panelsStore, hidden on phone)
 * - PIPanelBase wiring via the config-driven tabs API (Task 4)
 * - SpecEditor overlay (local open/close state)
 * - What-If simulator overflow item
 *
 * Reads from stores: specs, stats, filteredData (via hooks), outcome, analysisMode,
 * isPISidebarOpen from panelsStore.
 *
 * Accepts props for app-specific data that can't come from stores:
 * bestSubsets, projectedCpkMap, callbacks, phaseBadge, projectId.
 */

import React, { useState, useMemo } from 'react';
import { GripVertical } from 'lucide-react';
import {
  PIPanelBase,
  StatsTabContent,
  JournalTabContent,
  SurveyNotebookBase,
  DocumentShelfBase,
  WhatIfExplorer,
  computePresets,
} from '@variscout/ui';
import type { PITabConfig, PIOverflowItem } from '@variscout/ui';
import { useIsMobile, BREAKPOINTS } from '@variscout/ui';
import {
  useResizablePanel,
  useFilteredData,
  useAnalysisStats,
  useDocumentShelf,
} from '@variscout/hooks';
import type { UseFindingsReturn } from '@variscout/hooks';
import type { BestSubsetsResult, FactorMainEffect } from '@variscout/core/stats';
import { evaluateSurvey, isPreviewEnabled } from '@variscout/core';
import type { SurveyRecommendation } from '@variscout/core/survey';
import { useAnalyzeStore, useProjectStore } from '@variscout/stores';
import { usePanelsStore } from '../../features/panels/panelsStore';
import SpecEditor from '../settings/SpecEditor';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PI_SIDEBAR_STORAGE_KEY = 'variscout-stats-sidebar-width';
const PI_SIDEBAR_MIN = 280;
const PI_SIDEBAR_MAX = 500;
const PI_SIDEBAR_DEFAULT = 320;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PISectionProps {
  /** Pre-computed best subsets (Factor Intelligence) — avoids double computation */
  bestSubsets: BestSubsetsResult | null;
  /** Per-finding projected Cpk map */
  projectedCpkMap: Record<string, number>;
  /** Called when "Investigate" is clicked on a Factor Intelligence factor */
  onInvestigateFactor?: (effect: FactorMainEffect) => void;
  /** Dashboard phase badge text from useJourneyPhase (e.g. "Analyze") */
  phaseBadge?: string;
  /** Findings state from useFindings — used for add observation callback */
  findingsState: UseFindingsReturn;
  /** Project ID for Document Shelf scoping */
  projectId?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PISection: React.FC<PISectionProps> = ({
  bestSubsets,
  projectedCpkMap: _projectedCpkMap,
  onInvestigateFactor,
  phaseBadge: _phaseBadge,
  findingsState: _findingsState,
  projectId,
}) => {
  const isPhone = useIsMobile(BREAKPOINTS.phone);

  // Store reads
  const specs = useProjectStore(s => s.specs);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const factors = useProjectStore(s => s.factors);
  const timeColumn = useProjectStore(s => s.timeColumn);
  const analysisMode = useProjectStore(s => s.analysisMode);
  const defectMapping = useProjectStore(s => s.defectMapping);
  const processContext = useProjectStore(s => s.processContext);
  const setProcessContext = useProjectStore(s => s.setProcessContext);
  const hypotheses = useAnalyzeStore(s => s.hypotheses);

  // Panel visibility and tab state from panelsStore
  const isPISidebarOpen = usePanelsStore(s => s.isPISidebarOpen);
  const piActiveTab = usePanelsStore(s => s.piActiveTab);
  const setPIActiveTab = usePanelsStore(s => s.setPIActiveTab);

  // Sidebar resize
  const piSidebar = useResizablePanel(
    PI_SIDEBAR_STORAGE_KEY,
    PI_SIDEBAR_MIN,
    PI_SIDEBAR_MAX,
    PI_SIDEBAR_DEFAULT,
    'left'
  );

  // Data hooks
  const { filteredData } = useFilteredData();
  const { stats } = useAnalysisStats();

  // Document Shelf (KB preview gate)
  const isKBAvailable = isPreviewEnabled('knowledge-base');
  const documentShelf = useDocumentShelf({
    projectId: projectId ?? undefined,
    enabled: isKBAvailable,
  });

  // Spec editor overlay state
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);

  // Resolve per-measure specs (measureSpecs[outcome] ?? global specs) so the
  // What-If gate + presets see the per-measure spec even when global specs are unset.
  const resolvedSpecs = useMemo(
    () => (outcome ? (measureSpecs[outcome] ?? specs) : specs),
    [measureSpecs, outcome, specs]
  );

  // What-If presets
  const presets = useMemo(() => {
    if (!stats || !outcome) return undefined;
    return computePresets(
      { mean: stats.mean, stdDev: stats.stdDev, median: stats.median },
      resolvedSpecs,
      filteredData,
      outcome
    );
  }, [stats, resolvedSpecs, filteredData, outcome]);

  const hasSpecs = resolvedSpecs.usl !== undefined || resolvedSpecs.lsl !== undefined;

  const surveyEvaluation = useMemo(
    () =>
      evaluateSurvey({
        data: rawData,
        outcomeColumn: outcome,
        factorColumns: factors,
        timeColumn,
        specs,
        defectMapping,
        processContext: processContext ?? undefined,
        findings: _findingsState.findings,
        branches: hypotheses,
      }),
    [
      rawData,
      outcome,
      factors,
      timeColumn,
      specs,
      defectMapping,
      processContext,
      _findingsState.findings,
      hypotheses,
    ]
  );

  const handleAcceptSurveyRecommendation = (recommendation: SurveyRecommendation): void => {
    setProcessContext({
      ...(processContext ?? {}),
      nextMove: recommendation.actionText,
    });
  };

  // Don't render on phone or when closed
  if (!isPISidebarOpen || isPhone) {
    return null;
  }

  // ── Config-driven tabs ────────────────────────────────────────────────────

  const tabs: PITabConfig[] = [
    {
      id: 'stats',
      label: 'Stats',
      content: (
        <StatsTabContent
          bestSubsets={bestSubsets}
          onEditSpecs={() => setIsEditingSpecs(true)}
          onInvestigateFactor={onInvestigateFactor}
          showCpk={true}
        />
      ),
    },
    {
      id: 'journal',
      label: 'Journal',
      content: <JournalTabContent />,
    },
    {
      id: 'survey',
      label: 'Survey',
      badge: surveyEvaluation.recommendations.length,
      content: (
        <SurveyNotebookBase
          compact={true}
          evaluation={surveyEvaluation}
          onAcceptRecommendation={handleAcceptSurveyRecommendation}
        />
      ),
    },
  ];

  if (isKBAvailable) {
    tabs.push({
      id: 'docs',
      label: 'Docs',
      badge: documentShelf.documents.length,
      content: (
        <DocumentShelfBase
          documents={documentShelf.documents}
          onUpload={documentShelf.upload}
          onDelete={documentShelf.remove}
          onDownload={documentShelf.download}
          isUploading={documentShelf.isUploading}
          uploadProgress={documentShelf.uploadProgress}
          error={documentShelf.error}
        />
      ),
    });
  }

  // ── Overflow items (What-If, Data Table) ──────────────────────────────────

  const overflowItems: PIOverflowItem[] = [];

  if (hasSpecs && stats) {
    overflowItems.push({
      id: 'whatif',
      label: 'What-If',
      content: (
        <WhatIfExplorer
          mode={analysisMode ?? 'standard'}
          currentStats={{ mean: stats.mean, stdDev: stats.stdDev, cpk: stats.cpk }}
          specs={resolvedSpecs}
          presets={presets}
        />
      ),
    });
  }

  // Data Table opens a modal via panelsStore. We use the onSelect callback
  // pattern so the modal opens immediately without rendering inline content.
  overflowItems.push({
    id: 'data',
    label: 'Data Table',
    onSelect: () => usePanelsStore.getState().openDataTable(),
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Spec Editor overlay — rendered above the sidebar */}
      {isEditingSpecs && outcome && (
        <SpecEditor
          specs={measureSpecs[outcome] ?? {}}
          onSave={newSpecs => {
            useProjectStore.getState().setMeasureSpec(outcome, newSpecs);
            setIsEditingSpecs(false);
          }}
          onClose={() => setIsEditingSpecs(false)}
          style={{ top: '70px', right: '0px', width: '100%', maxWidth: '320px', zIndex: 20 }}
        />
      )}

      {/* Resizable sidebar container */}
      <div
        className="flex flex-col flex-shrink-0 bg-surface-secondary overflow-y-auto"
        style={{ width: piSidebar.width }}
      >
        <PIPanelBase
          compact={true}
          tabs={tabs}
          overflowItems={overflowItems}
          activeTab={piActiveTab}
          onTabChange={setPIActiveTab}
        />
      </div>

      {/* Resize handle */}
      <div
        className={`w-1 flex-shrink-0 flex items-center justify-center cursor-col-resize transition-colors ${
          piSidebar.isDragging ? 'bg-blue-500' : 'bg-surface-tertiary hover:bg-blue-500'
        }`}
        onMouseDown={piSidebar.handleMouseDown}
      >
        <GripVertical size={12} className="text-content-muted" />
      </div>
    </>
  );
};
