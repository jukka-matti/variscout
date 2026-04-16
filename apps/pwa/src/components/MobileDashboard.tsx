import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Activity,
  BarChart3,
  PieChart,
  TrendingUp,
  GitBranch,
} from 'lucide-react';
import { useTranslation, useEvidenceMapData, useDefectEvidenceMap } from '@variscout/hooks';
import type { DefectMapView } from '@variscout/hooks';
import { EvidenceMap } from '@variscout/charts';
import IChart from './charts/IChart';
import Boxplot from './charts/Boxplot';
import ParetoChart from './charts/ParetoChart';
import ProcessIntelligencePanel from './ProcessIntelligencePanel';
import {
  AnovaResults,
  ErrorBoundary,
  FactorSelector,
  FilterBreadcrumb,
  MobileCategorySheet,
  EvidenceMapNodeSheet,
  EvidenceMapEdgeSheet,
  DefectTypeSelector,
  CrossTypeEvidenceMap,
  InsufficientDataState,
} from '@variscout/ui';
import {
  computeBestSubsets,
  computeMainEffects,
  computeInteractionEffects,
} from '@variscout/core/stats';
import type { StatsResult, AnovaResult, DataRow, Finding } from '@variscout/core';
import type { DefectTransformResult, DefectMapping } from '@variscout/core';
import type { FilterChipData } from '@variscout/ui';

type ChartView = 'ichart' | 'boxplot' | 'pareto' | 'stats' | 'map';

interface MobileDashboardProps {
  outcome: string | null;
  factors: string[];
  stats: StatsResult | null;
  specs: { usl?: number; lsl?: number; target?: number };
  boxplotFactor: string;
  paretoFactor: string;
  filteredData: DataRow[];
  anovaResult: AnovaResult | null;
  filters: Record<string, (string | number)[]>;
  columnAliases?: Record<string, string>;
  onSetBoxplotFactor: (f: string) => void;
  onSetParetoFactor: (f: string) => void;
  onPointClick?: (index: number) => void;
  onDrillDown?: (factor: string, value: string) => void;
  onRemoveFilter?: (factor: string) => void;
  onClearAllFilters?: () => void;
  // Filter chip props for enhanced breadcrumb
  filterChipData?: FilterChipData[];
  onUpdateFilterValues?: (factor: string, newValues: (string | number)[]) => void;
  // Pareto empty state actions
  onHideParetoPanel?: () => void;
  onUploadPareto?: () => void;
  // Pareto aggregation
  paretoAggregation?: 'count' | 'value';
  onToggleParetoAggregation?: () => void;
  // Findings integration
  onPinFinding?: (text: string, chartType?: string, category?: string) => void;
  findings?: Finding[];
  onEditFinding?: (id: string, text: string) => void;
  onDeleteFinding?: (id: string) => void;
  // Defect mode Evidence Map integration
  defectResult?: DefectTransformResult | null;
  defectMapping?: DefectMapping | null;
  isDefectMode?: boolean;
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({
  outcome,
  factors,
  stats,
  specs,
  boxplotFactor,
  paretoFactor,
  filteredData,
  anovaResult,
  filters,
  columnAliases = {},
  onSetBoxplotFactor,
  onSetParetoFactor,
  onPointClick,
  onDrillDown,
  onRemoveFilter,
  onClearAllFilters,
  filterChipData = [],
  onUpdateFilterValues,
  onHideParetoPanel,
  onUploadPareto,
  paretoAggregation = 'count',
  onToggleParetoAggregation,
  onPinFinding,
  findings,
  onEditFinding,
  onDeleteFinding,
  defectResult,
  defectMapping,
  isDefectMode = false,
}) => {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<ChartView>('ichart');
  const [defectMapView, setDefectMapView] = useState<DefectMapView>('all');

  // ── Factor Intelligence for Evidence Map (requires 2+ factors) ──
  const hasFactorIntelligence = factors.length >= 2 && !!outcome && filteredData.length > 0;

  // TODO: consider useAsyncStats / Web Worker for large mobile datasets
  const bestSubsets = useMemo(() => {
    if (!hasFactorIntelligence) return null;
    return computeBestSubsets(filteredData, outcome!, factors);
  }, [filteredData, outcome, factors, hasFactorIntelligence]);

  const mainEffects = useMemo(() => {
    if (!hasFactorIntelligence) return null;
    return computeMainEffects(filteredData, outcome!, factors);
  }, [filteredData, outcome, factors, hasFactorIntelligence]);

  const interactionEffects = useMemo(() => {
    if (!hasFactorIntelligence) return null;
    return computeInteractionEffects(filteredData, outcome!, factors);
  }, [filteredData, outcome, factors, hasFactorIntelligence]);

  // ── Defect Evidence Map integration ──────────────────────────────────────
  const defectEvidenceMap = useDefectEvidenceMap(
    isDefectMode ? (defectResult ?? null) : null,
    isDefectMode ? (defectMapping ?? null) : null,
    isDefectMode ? bestSubsets : null,
    isDefectMode ? defectMapView : 'all',
    factors
  );

  // Override bestSubsets for Evidence Map when viewing per-type defect analysis
  const mapBestSubsets =
    isDefectMode && defectMapView !== 'all' ? defectEvidenceMap.bestSubsets : bestSubsets;

  // Evidence Map data — only compute when bestSubsets has a meaningful model
  const bestModel = mapBestSubsets?.subsets[0];
  const showMapTab = !!bestModel && bestModel.rSquaredAdj > 0.05;

  // In defect mode, also show map tab when viewing cross-type (even without bestSubsets)
  const showMapTabDefect = isDefectMode && defectMapView === 'cross-type';

  // Reset to I-Chart if map tab disappears while active (legitimate redirect, not cascading)

  useEffect(() => {
    if (!showMapTab && !showMapTabDefect && activeView === 'map') {
      setActiveView('ichart');
    }
  }, [showMapTab, showMapTabDefect, activeView]);

  const evidenceMapData = useEvidenceMapData({
    bestSubsets: showMapTab || showMapTabDefect ? mapBestSubsets : null,
    mainEffects: showMapTab || showMapTabDefect ? mainEffects : null,
    interactions: showMapTab || showMapTabDefect ? interactionEffects : null,
    // Layout positions are computed at a reference size; the responsive wrapper + zoom
    // transform in EvidenceMap handles actual viewport fitting.
    containerSize: { width: 400, height: 350 },
    mode: 'standard',
  });

  // Evidence Map sheet state
  const [nodeSheet, setNodeSheet] = useState<{
    factor: string;
    rSquaredAdj: number;
    levelEffects: Array<{ level: string; effect: number }>;
    relationships: Array<{ otherFactor: string; type: string; strength: number }>;
  } | null>(null);

  const [edgeSheet, setEdgeSheet] = useState<{
    factorA: string;
    factorB: string;
    relationshipType: string;
    strength: number;
  } | null>(null);

  const handleNodeTap = useCallback(
    (factor: string) => {
      const node = evidenceMapData.factorNodes.find(n => n.factor === factor);
      if (!node) return;
      const relationships = evidenceMapData.relationshipEdges
        .filter(e => e.factorA === factor || e.factorB === factor)
        .map(e => ({
          otherFactor: e.factorA === factor ? e.factorB : e.factorA,
          type: e.type,
          strength: e.strength,
        }));
      setNodeSheet({
        factor,
        rSquaredAdj: node.rSquaredAdj,
        levelEffects: node.levelEffects,
        relationships,
      });
    },
    [evidenceMapData.factorNodes, evidenceMapData.relationshipEdges]
  );

  const handleEdgeTap = useCallback(
    (factorA: string, factorB: string) => {
      const edge = evidenceMapData.relationshipEdges.find(
        e =>
          (e.factorA === factorA && e.factorB === factorB) ||
          (e.factorA === factorB && e.factorB === factorA)
      );
      if (!edge) return;
      setEdgeSheet({
        factorA: edge.factorA,
        factorB: edge.factorB,
        relationshipType: edge.type,
        strength: edge.strength,
      });
    },
    [evidenceMapData.relationshipEdges]
  );

  const handleNodeSheetDrillDown = useCallback(
    (factor: string) => {
      if (onDrillDown) {
        // Drill down on the factor's worst level (highest absolute effect)
        const node = evidenceMapData.factorNodes.find(n => n.factor === factor);
        if (node && node.levelEffects.length > 0) {
          const sorted = [...node.levelEffects].sort(
            (a, b) => Math.abs(b.effect) - Math.abs(a.effect)
          );
          onDrillDown(factor, sorted[0].level);
        }
      }
      setNodeSheet(null);
    },
    [onDrillDown, evidenceMapData.factorNodes]
  );

  // MobileCategorySheet state
  const [sheetData, setSheetData] = useState<{
    categoryKey: string;
    chartType: 'boxplot' | 'pareto';
    etaSquaredPct?: number;
  } | null>(null);
  const [sheetFactor, setSheetFactor] = useState('');

  const handleBoxplotDrillIntercept = useCallback((factor: string, value: string) => {
    setSheetFactor(factor);
    setSheetData({
      categoryKey: value,
      chartType: 'boxplot',
    });
  }, []);

  const handleParetoDrillIntercept = useCallback((factor: string, value: string) => {
    setSheetFactor(factor);
    setSheetData({
      categoryKey: value,
      chartType: 'pareto',
    });
  }, []);

  const handleSheetDrillDown = useCallback(() => {
    if (onDrillDown && sheetData) {
      onDrillDown(sheetFactor, sheetData.categoryKey);
    }
    setSheetData(null);
  }, [onDrillDown, sheetData, sheetFactor]);

  const handleSheetPinFinding = useCallback(
    (noteText: string) => {
      if (onPinFinding && sheetData) {
        onPinFinding(
          noteText || `${sheetData.categoryKey} (${sheetData.chartType})`,
          sheetData.chartType,
          sheetData.categoryKey
        );
      }
      setSheetData(null);
    },
    [onPinFinding, sheetData]
  );

  const views: { key: ChartView; label: string; icon: React.ReactNode }[] = useMemo(() => {
    const base: { key: ChartView; label: string; icon: React.ReactNode }[] = [
      { key: 'ichart', label: t('chart.type.ichart'), icon: <Activity size={18} /> },
      { key: 'boxplot', label: t('chart.type.boxplot'), icon: <BarChart3 size={18} /> },
      { key: 'pareto', label: t('chart.type.pareto'), icon: <PieChart size={18} /> },
      { key: 'stats', label: t('view.stats'), icon: <TrendingUp size={18} /> },
    ];
    if (showMapTab || showMapTabDefect) {
      base.push({ key: 'map', label: 'Map', icon: <GitBranch size={18} /> });
    }
    return base;
  }, [t, showMapTab, showMapTabDefect]);

  const currentIndex = views.findIndex(v => v.key === activeView);

  const goToView = (direction: 'prev' | 'next') => {
    const newIndex =
      direction === 'next'
        ? (currentIndex + 1) % views.length
        : (currentIndex - 1 + views.length) % views.length;
    setActiveView(views[newIndex].key);
  };

  // Swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    // Skip carousel swipe when Evidence Map is active — pinch-zoom takes priority
    if (activeView === 'map') return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToView('next');
    }
    if (isRightSwipe) {
      goToView('prev');
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-surface"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Chart Header with Navigation */}
      <div className="flex items-center justify-between px-2 py-2 bg-surface-secondary/50 border-b border-edge">
        <button
          onClick={() => goToView('prev')}
          aria-label="Previous chart"
          className="p-2 touch-feedback rounded-lg text-content-secondary hover:text-white"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex gap-1">
          {views.map(v => (
            <button
              key={v.key}
              onClick={() => setActiveView(v.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-feedback
                                ${
                                  activeView === v.key
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-surface-tertiary/50 text-content-secondary hover:text-white'
                                }`}
              style={{ minHeight: 36 }}
            >
              {v.icon}
              <span className="hidden xs:inline">{v.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => goToView('next')}
          aria-label="Next chart"
          className="p-2 touch-feedback rounded-lg text-content-secondary hover:text-white"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Filter Breadcrumb (chip-based for mobile) */}
      {filterChipData.length > 0 && onUpdateFilterValues && onRemoveFilter && (
        <FilterBreadcrumb
          filterChipData={filterChipData}
          columnAliases={columnAliases}
          onUpdateFilterValues={onUpdateFilterValues}
          onRemoveFilter={onRemoveFilter}
          onClearAll={onClearAllFilters}
        />
      )}

      {/* Factor Selector (for boxplot/pareto) */}
      {(activeView === 'boxplot' || activeView === 'pareto') && factors.length > 0 && (
        <div className="px-3 py-2 bg-surface/50 border-b border-edge/50 flex justify-center">
          <FactorSelector
            factors={factors}
            selected={activeView === 'boxplot' ? boxplotFactor : paretoFactor}
            onChange={f =>
              activeView === 'boxplot' ? onSetBoxplotFactor(f) : onSetParetoFactor(f)
            }
            hasActiveFilter={
              activeView === 'boxplot'
                ? !!filters[boxplotFactor]?.length
                : !!filters[paretoFactor]?.length
            }
            columnAliases={columnAliases}
            size="md"
          />
        </div>
      )}

      {/* Chart Content Area */}
      <div className="flex-1 min-h-0 p-2 overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 bg-surface-secondary/50 rounded-xl border border-edge overflow-hidden">
          <ErrorBoundary componentName={views.find(v => v.key === activeView)?.label || ''}>
            {activeView === 'ichart' && <IChart onPointClick={onPointClick} />}
            {activeView === 'boxplot' && boxplotFactor && (
              <Boxplot
                factor={boxplotFactor}
                onDrillDown={handleBoxplotDrillIntercept}
                findings={findings?.filter(f => f.source?.chart === 'boxplot')}
                onEditFinding={onEditFinding}
                onDeleteFinding={onDeleteFinding}
              />
            )}
            {activeView === 'pareto' && paretoFactor && (
              <ParetoChart
                factor={paretoFactor}
                onDrillDown={handleParetoDrillIntercept}
                onHide={onHideParetoPanel}
                onUploadPareto={onUploadPareto}
                availableFactors={factors}
                aggregation={paretoAggregation}
                onToggleAggregation={onToggleParetoAggregation}
                findings={findings?.filter(f => f.source?.chart === 'pareto')}
                onEditFinding={onEditFinding}
                onDeleteFinding={onDeleteFinding}
              />
            )}
            {activeView === 'stats' && (
              <ProcessIntelligencePanel
                stats={stats}
                specs={specs}
                filteredData={filteredData}
                outcome={outcome}
                compact
              />
            )}
            {activeView === 'map' && (showMapTab || showMapTabDefect) && (
              <div className="flex flex-col h-full">
                {/* Defect type selector (defect mode only) */}
                {isDefectMode && (
                  <div className="flex-none px-2 py-1.5 border-b border-edge">
                    <DefectTypeSelector
                      selectedView={defectMapView}
                      onViewChange={setDefectMapView}
                      defectTypes={defectEvidenceMap.totalTypes}
                      analyzedTypes={defectEvidenceMap.analyzedTypes}
                      totalTypeCount={defectEvidenceMap.totalTypes.length}
                      analyzedTypeCount={defectEvidenceMap.analyzedTypes.length}
                    />
                  </div>
                )}

                <div className="flex-1 min-h-0">
                  {/* Insufficient data state */}
                  {isDefectMode &&
                  defectEvidenceMap.insufficient &&
                  defectMapView !== 'all' &&
                  defectMapView !== 'cross-type' ? (
                    <InsufficientDataState
                      typeName={String(defectMapView)}
                      have={defectEvidenceMap.insufficient.have}
                      need={defectEvidenceMap.insufficient.need}
                    />
                  ) : isDefectMode &&
                    defectMapView === 'cross-type' &&
                    defectEvidenceMap.crossTypeMatrix ? (
                    <CrossTypeEvidenceMap
                      crossTypeMatrix={defectEvidenceMap.crossTypeMatrix}
                      analyzedCount={defectEvidenceMap.analyzedTypes.length}
                      totalCount={defectEvidenceMap.totalTypes.length}
                      containerWidth={400}
                      containerHeight={350}
                    />
                  ) : (
                    <EvidenceMap
                      outcomeNode={evidenceMapData.outcomeNode}
                      factorNodes={evidenceMapData.factorNodes}
                      relationshipEdges={evidenceMapData.relationshipEdges}
                      equation={evidenceMapData.equation}
                      enableZoom={true}
                      compact={true}
                      onNodeTap={handleNodeTap}
                      onEdgeTap={handleEdgeTap}
                    />
                  )}
                </div>
              </div>
            )}
          </ErrorBoundary>
        </div>
        {activeView === 'boxplot' && anovaResult && (
          <div className="flex-none mt-2">
            <AnovaResults result={anovaResult} factorLabel={boxplotFactor} />
          </div>
        )}
      </div>

      {/* Swipe Indicator Dots */}
      <div className="flex justify-center gap-1 py-2 bg-surface/50">
        {views.map(v => (
          <button
            key={v.key}
            onClick={() => setActiveView(v.key)}
            className="p-2 flex items-center justify-center"
            aria-label={`Go to ${v.label}`}
          >
            <span
              className={`w-2 h-2 rounded-full transition-colors ${activeView === v.key ? 'bg-blue-500' : 'bg-surface-elevated'}`}
            />
          </button>
        ))}
      </div>

      {/* Mobile Category Sheet */}
      <MobileCategorySheet
        data={sheetData}
        factor={sheetFactor}
        onDrillDown={handleSheetDrillDown}
        onSetHighlight={() => {}} // PWA: highlights not persisted
        onPinFinding={handleSheetPinFinding}
        onClose={() => setSheetData(null)}
      />

      {/* Evidence Map Node Sheet */}
      {nodeSheet && (
        <EvidenceMapNodeSheet
          onClose={() => setNodeSheet(null)}
          factor={nodeSheet.factor}
          rSquaredAdj={nodeSheet.rSquaredAdj}
          levelEffects={nodeSheet.levelEffects}
          relationships={nodeSheet.relationships}
          onDrillDown={onDrillDown ? handleNodeSheetDrillDown : undefined}
        />
      )}

      {/* Evidence Map Edge Sheet */}
      {edgeSheet && (
        <EvidenceMapEdgeSheet
          onClose={() => setEdgeSheet(null)}
          factorA={edgeSheet.factorA}
          factorB={edgeSheet.factorB}
          relationshipType={edgeSheet.relationshipType}
          strength={edgeSheet.strength}
        />
      )}
    </div>
  );
};

export default MobileDashboard;
