import React, { useCallback, useRef, useState } from 'react';
import { EvidenceMapBase } from '@variscout/charts';
import { useEvidenceMapData } from '@variscout/hooks';
import type { UseEvidenceMapDataOptions } from '@variscout/hooks';
import { NodeContextMenu, CausalLinkCreator, SweetSpotCard } from '@variscout/ui';
import type { CausalEdgeData } from '@variscout/charts';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { ArrowRight, X, Pencil, Trash2 } from 'lucide-react';

interface InvestigationMapViewProps {
  /** All options for useEvidenceMapData EXCEPT containerSize (computed internally) */
  mapOptions: Omit<UseEvidenceMapDataOptions, 'containerSize'>;
  /** Context menu action callbacks (threaded from InvestigationWorkspace) */
  onAskQuestion?: (factor: string) => void;
  onCreateFinding?: (factor: string) => void;
  onAskCoScout?: (factor: string) => void;
  onDrillDown?: (factor: string) => void;
  /** Causal link CRUD */
  onConfirmCausalLink?: (
    from: string,
    to: string,
    params: {
      whyStatement: string;
      direction: 'drives' | 'modulates' | 'confounds';
      evidenceType: 'data' | 'gemba' | 'expert' | 'unvalidated';
    }
  ) => void;
  onRemoveCausalLink?: (id: string) => void;
  onUpdateCausalLink?: (
    id: string,
    params: {
      whyStatement: string;
      direction: 'drives' | 'modulates' | 'confounds';
      evidenceType: 'data' | 'gemba' | 'expert' | 'unvalidated';
    }
  ) => void;
  /** Whether a causal link from→to would create a cycle */
  wouldCreateCycle?: (from: string, to: string) => boolean;
}

export const InvestigationMapView: React.FC<InvestigationMapViewProps> = ({
  mapOptions,
  onAskQuestion,
  onCreateFinding,
  onAskCoScout,
  onDrillDown,
  onConfirmCausalLink,
  onRemoveCausalLink,
  onUpdateCausalLink,
  wouldCreateCycle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 600, height: 400 });

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const mapData = useEvidenceMapData({ ...mapOptions, containerSize });

  // ── Context menu state ──────────────────────────────────────────────────
  const [contextMenu, setContextMenu] = useState<{ factor: string; x: number; y: number } | null>(
    null
  );

  // ── Causal link creation: two-step flow ─────────────────────────────────
  const [pendingFromFactor, setPendingFromFactor] = useState<string | null>(null);
  const [causalLinkDraft, setCausalLinkDraft] = useState<{ from: string; to: string } | null>(null);

  // ── Causal edge detail ──────────────────────────────────────────────────
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [editingEdge, setEditingEdge] = useState<CausalEdgeData | null>(null);

  const selectedEdge = selectedEdgeId
    ? (mapData.causalEdges.find(e => e.id === selectedEdgeId) ?? null)
    : null;

  // Sweet spot detection: show SweetSpotCard when a quadratic factor is selected
  const highlightedFactor = usePanelsStore(s => s.highlightedFactor);
  const sweetSpotNode = highlightedFactor
    ? (mapData.factorNodes.find(
        n =>
          n.factor === highlightedFactor &&
          (n.trendGlyph === '∩' || n.trendGlyph === '∪') &&
          n.optimum !== undefined
      ) ?? null)
    : null;

  const handleFactorClick = useCallback(
    (factor: string) => {
      // If pending causal link creation, complete the two-step flow
      if (pendingFromFactor) {
        if (factor !== pendingFromFactor) {
          setCausalLinkDraft({ from: pendingFromFactor, to: factor });
        }
        setPendingFromFactor(null);
        return;
      }
      usePanelsStore.getState().setHighlightedFactor(factor);
    },
    [pendingFromFactor]
  );

  const handleContextMenu = useCallback((factor: string, x: number, y: number) => {
    setPendingFromFactor(null); // Cancel any pending link creation
    setContextMenu({ factor, x, y });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleCreateCausalLink = useCallback((factor: string) => {
    setPendingFromFactor(factor);
  }, []);

  const handleConfirmCausalLink = useCallback(
    (params: {
      whyStatement: string;
      direction: 'drives' | 'modulates' | 'confounds';
      evidenceType: 'data' | 'gemba' | 'expert' | 'unvalidated';
    }) => {
      if (causalLinkDraft) {
        onConfirmCausalLink?.(causalLinkDraft.from, causalLinkDraft.to, params);
      } else if (editingEdge) {
        onUpdateCausalLink?.(editingEdge.id, params);
      }
      setCausalLinkDraft(null);
      setEditingEdge(null);
    },
    [causalLinkDraft, editingEdge, onConfirmCausalLink, onUpdateCausalLink]
  );

  const handleCancelCausalLink = useCallback(() => {
    setCausalLinkDraft(null);
    setEditingEdge(null);
  }, []);

  // Cancel pending link on Escape
  React.useEffect(() => {
    if (!pendingFromFactor) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPendingFromFactor(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingFromFactor]);

  const cycleWarning = causalLinkDraft
    ? (wouldCreateCycle?.(causalLinkDraft.from, causalLinkDraft.to) ?? false)
    : false;

  return (
    <div ref={containerRef} className="flex-1 min-h-0 bg-surface-secondary relative">
      {mapData.isEmpty ? (
        <div className="flex items-center justify-center h-full text-content-tertiary text-sm">
          Select at least 2 factors to see the Evidence Map
        </div>
      ) : (
        <EvidenceMapBase
          parentWidth={containerSize.width}
          parentHeight={containerSize.height}
          outcomeNode={mapData.outcomeNode}
          factorNodes={mapData.factorNodes}
          relationshipEdges={mapData.relationshipEdges}
          equation={mapData.equation}
          causalEdges={mapData.causalEdges}
          convergencePoints={mapData.convergencePoints}
          enableZoom
          onFactorClick={handleFactorClick}
          onFactorContextMenu={handleContextMenu}
          onCausalEdgeClick={setSelectedEdgeId}
          onConvergenceClick={handleFactorClick}
        />
      )}

      {/* Pending causal link banner */}
      {pendingFromFactor && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-30">
          <ArrowRight size={12} />
          Click target factor to link from{' '}
          <span className="font-semibold">{pendingFromFactor}</span>
          <button
            onClick={() => setPendingFromFactor(null)}
            className="ml-1 p-0.5 hover:bg-blue-500 rounded transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <NodeContextMenu
          factor={contextMenu.factor}
          x={contextMenu.x}
          y={contextMenu.y}
          onAskQuestion={factor => onAskQuestion?.(factor)}
          onCreateFinding={factor => onCreateFinding?.(factor)}
          onAskCoScout={factor => onAskCoScout?.(factor)}
          onDrillDown={factor => onDrillDown?.(factor)}
          onCreateCausalLink={onConfirmCausalLink ? handleCreateCausalLink : undefined}
          onClose={handleCloseContextMenu}
        />
      )}

      {/* CausalLinkCreator modal (new link) */}
      {causalLinkDraft && (
        <CausalLinkCreator
          fromFactor={causalLinkDraft.from}
          toFactor={causalLinkDraft.to}
          onConfirm={handleConfirmCausalLink}
          onCancel={handleCancelCausalLink}
          cycleWarning={cycleWarning}
        />
      )}

      {/* CausalLinkCreator modal (editing existing) */}
      {editingEdge && (
        <CausalLinkCreator
          fromFactor={editingEdge.fromFactor}
          toFactor={editingEdge.toFactor}
          onConfirm={handleConfirmCausalLink}
          onCancel={handleCancelCausalLink}
        />
      )}

      {/* Causal edge detail card */}
      {selectedEdge && !editingEdge && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-surface border border-edge rounded-lg shadow-lg p-3 z-30 w-[min(90%,360px)]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-content flex items-center gap-1.5">
              <span>{selectedEdge.fromFactor}</span>
              <ArrowRight size={12} className="text-content-secondary" />
              <span>{selectedEdge.toFactor}</span>
              <span
                className={`ml-1.5 px-1.5 py-0.5 rounded text-[0.625rem] font-medium ${
                  selectedEdge.direction === 'drives'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : selectedEdge.direction === 'modulates'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                }`}
              >
                {selectedEdge.direction}
              </span>
            </div>
            <button
              onClick={() => setSelectedEdgeId(null)}
              className="p-0.5 text-content-tertiary hover:text-content rounded transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-xs text-content-secondary mb-2">{selectedEdge.whyStatement}</p>
          <div className="flex items-center gap-3 text-[0.625rem] text-content-tertiary mb-2">
            <span
              className={`px-1.5 py-0.5 rounded ${
                selectedEdge.evidenceType === 'data'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
                  : selectedEdge.evidenceType === 'gemba'
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300'
                    : selectedEdge.evidenceType === 'expert'
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {selectedEdge.evidenceType}
            </span>
            {selectedEdge.questionCount > 0 && (
              <span>
                {selectedEdge.questionCount} question{selectedEdge.questionCount !== 1 ? 's' : ''}
              </span>
            )}
            {selectedEdge.findingCount > 0 && (
              <span>
                {selectedEdge.findingCount} finding{selectedEdge.findingCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex justify-end gap-2">
            {onRemoveCausalLink && (
              <button
                onClick={() => {
                  onRemoveCausalLink(selectedEdge.id);
                  setSelectedEdgeId(null);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                <Trash2 size={12} />
                Delete
              </button>
            )}
            {onUpdateCausalLink && (
              <button
                onClick={() => {
                  setEditingEdge(selectedEdge);
                  setSelectedEdgeId(null);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs text-content-secondary hover:bg-surface-secondary rounded transition-colors"
              >
                <Pencil size={12} />
                Edit
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sweet spot card for quadratic factors */}
      {sweetSpotNode && !selectedEdge && !causalLinkDraft && !editingEdge && (
        <div className="absolute top-3 right-3 z-20 w-64">
          <SweetSpotCard
            factorName={sweetSpotNode.factor}
            optimumValue={sweetSpotNode.optimum!}
            predictedAtOptimum={0}
            onCreateAction={() => usePanelsStore.getState().showImprovement()}
          />
        </div>
      )}
    </div>
  );
};
