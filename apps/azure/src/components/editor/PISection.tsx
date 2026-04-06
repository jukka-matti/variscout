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
 * Reads from stores: specs, stats, filteredData (via hooks), outcome, cpkTarget,
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
  QuestionsTabContent,
  JournalTabContent,
  DocumentShelfBase,
  WhatIfSimulator,
  computePresets,
} from '@variscout/ui';
import type { PITabConfig, PIOverflowItem } from '@variscout/ui';
import { useIsMobile, BREAKPOINTS, useGlossary } from '@variscout/ui';
import {
  useResizablePanel,
  useFilteredData,
  useAnalysisStats,
  useDocumentShelf,
} from '@variscout/hooks';
import type { UseFindingsReturn, UseQuestionsReturn } from '@variscout/hooks';
import type { BestSubsetsResult, FactorMainEffect } from '@variscout/core/stats';
import type { Question } from '@variscout/core/findings';
import { hasKnowledgeBase, isPreviewEnabled } from '@variscout/core';
import { useProjectStore } from '@variscout/stores';
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
  /** Pre-computed best subsets from useQuestionGeneration — avoids double computation */
  bestSubsets: BestSubsetsResult | null;
  /** Per-question projected Cpk map from useQuestionGeneration */
  projectedCpkMap: Record<string, number>;
  /** Called when a question row is clicked (navigates chart focus) */
  handleQuestionClick: (q: Question) => void;
  /** Called when "Investigate" is clicked on a Factor Intelligence factor */
  onInvestigateFactor?: (effect: FactorMainEffect) => void;
  /** Journey phase badge text from useJourneyPhase (e.g. "INVESTIGATE") */
  phaseBadge?: string;
  /** Questions state from useQuestions — used for add/link callbacks */
  questionsState: UseQuestionsReturn;
  /** Findings state from useFindings — used for add observation callback */
  findingsState: UseFindingsReturn;
  /** Project ID for Document Shelf scoping (Team tier) */
  projectId?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PISection: React.FC<PISectionProps> = ({
  bestSubsets,
  projectedCpkMap,
  handleQuestionClick,
  onInvestigateFactor,
  phaseBadge,
  questionsState,
  findingsState,
  projectId,
}) => {
  const isPhone = useIsMobile(BREAKPOINTS.phone);
  const { getTerm } = useGlossary();

  // Store reads
  const specs = useProjectStore(s => s.specs);
  const outcome = useProjectStore(s => s.outcome);
  const cpkTarget = useProjectStore(s => s.cpkTarget);
  const filters = useProjectStore(s => s.filters);

  // Panel visibility from panelsStore
  const isPISidebarOpen = usePanelsStore(s => s.isPISidebarOpen);
  const highlightedFactor = usePanelsStore(s => s.highlightedFactor);

  // Open question count for badge
  const openQuestionCount = useMemo(
    () =>
      questionsState.questions.filter(q => q.status === 'open' || q.status === 'investigating')
        .length,
    [questionsState.questions]
  );

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

  // Document Shelf (Team tier + KB preview gate)
  const isTeamWithKB = hasKnowledgeBase() && isPreviewEnabled('knowledge-base');
  const documentShelf = useDocumentShelf({
    projectId: projectId ?? undefined,
    enabled: isTeamWithKB,
  });

  // Spec editor overlay state
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);

  // What-If presets
  const presets = useMemo(() => {
    if (!stats || !outcome) return undefined;
    return computePresets(
      { mean: stats.mean, stdDev: stats.stdDev, median: stats.median },
      specs,
      filteredData,
      outcome
    );
  }, [stats, specs, filteredData, outcome]);

  const hasSpecs = specs.usl !== undefined || specs.lsl !== undefined;

  // Callbacks for QuestionsTabContent
  const handleAddQuestion = (text: string): void => {
    questionsState.addQuestion(text);
  };

  const handleAddObservation = (text: string): void => {
    const newFinding = findingsState.addFinding(text, {
      activeFilters: filters,
      cumulativeScope: null,
      stats: stats
        ? {
            mean: stats.mean,
            median: stats.median,
            cpk: stats.cpk ?? undefined,
            samples: filteredData?.length ?? 0,
          }
        : undefined,
    });
    if (questionsState.focusedQuestionId) {
      questionsState.linkFinding(questionsState.focusedQuestionId, newFinding.id);
    }
  };

  const handleLinkObservation = (findingId: string, questionId: string): void => {
    questionsState.linkFinding(questionId, findingId);
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
      id: 'questions',
      label: 'Questions',
      badge: openQuestionCount,
      content: (
        <QuestionsTabContent
          bestSubsets={bestSubsets}
          projectedCpkMap={projectedCpkMap}
          phaseBadge={phaseBadge}
          onQuestionClick={handleQuestionClick}
          onAddQuestion={handleAddQuestion}
          onAddObservation={handleAddObservation}
          onLinkObservation={handleLinkObservation}
          highlightedFactor={highlightedFactor}
          onClearHighlight={() => usePanelsStore.getState().setHighlightedFactor(null)}
          onNavigateToInvestigation={() => usePanelsStore.getState().showInvestigation()}
        />
      ),
    },
    {
      id: 'journal',
      label: 'Journal',
      content: <JournalTabContent />,
    },
  ];

  if (isTeamWithKB) {
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
        <WhatIfSimulator
          currentStats={{ mean: stats.mean, stdDev: stats.stdDev, cpk: stats.cpk }}
          specs={specs}
          defaultExpanded={true}
          cpkTarget={cpkTarget}
          presets={presets}
        />
      ),
    });
  }

  // Data Table opens a modal via panelsStore. We add it as an overflow item
  // whose selection triggers the modal open. Since PIPanelBase renders the
  // overflow item content inline, we render an empty node and open the modal
  // as a side-effect in the onSelect callback — but PIPanelBase doesn't expose
  // a per-item callback. Instead, we use a small React wrapper so the modal
  // opens on mount when this content is shown.
  overflowItems.push({
    id: 'data',
    label: 'Data Table',
    content: <DataTableOverflowTrigger />,
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Spec Editor overlay — rendered above the sidebar */}
      {isEditingSpecs && (
        <SpecEditor
          specs={specs}
          onSave={newSpecs => {
            useProjectStore.getState().setSpecs(newSpecs);
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
          stats={stats}
          specs={specs}
          filteredData={filteredData}
          outcome={outcome}
          getTerm={getTerm}
          sampleCount={filteredData?.length}
          cpkTarget={cpkTarget}
          tabs={tabs}
          overflowItems={overflowItems}
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

// ---------------------------------------------------------------------------
// Internal helper — opens DataTableModal via panelsStore on mount.
// Used as overflow content for the "Data Table" overflow item.
// ---------------------------------------------------------------------------

const DataTableOverflowTrigger: React.FC = () => {
  // Open the Data Table modal as a side-effect when this content is rendered
  // (i.e. when the user selects "Data Table" from the PI overflow menu).
  React.useEffect(() => {
    usePanelsStore.getState().openDataTable();
  }, []);

  return (
    <div className="flex items-center justify-center p-4 text-content-secondary text-sm">
      Opening Data Table…
    </div>
  );
};
