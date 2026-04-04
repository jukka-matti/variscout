/**
 * Azure IChart - Thin wrapper that connects stores to shared IChartWrapperBase
 */
import { withParentSize } from '@visx/responsive';
import { useProjectStore } from '@variscout/stores';
import {
  useFilteredData,
  useAnalysisStats,
  useStagedAnalysis,
  useCapabilityIChartData,
} from '@variscout/hooks';
import { useChartScale } from '../../hooks/useChartScale';
import { IChartWrapperBase } from '@variscout/ui';
import type { Finding } from '@variscout/core';

interface IChartProps {
  parentWidth: number;
  parentHeight: number;
  onPointClick?: (index: number) => void;
  highlightedPointIndex?: number | null;
  onSpecClick?: (spec: 'usl' | 'lsl' | 'target') => void;
  ichartFindings?: Finding[];
  onCreateObservation?: (anchorX: number, anchorY: number) => void;
  onEditFinding?: (id: string, text: string) => void;
  onDeleteFinding?: (id: string) => void;
}

const IChart = ({ parentWidth, parentHeight, ...props }: IChartProps) => {
  const { filteredData } = useFilteredData();
  const { stats, isComputing } = useAnalysisStats();
  const { stagedData, stagedStats } = useStagedAnalysis();
  const outcome = useProjectStore(s => s.outcome);
  const timeColumn = useProjectStore(s => s.timeColumn);
  const stageColumn = useProjectStore(s => s.stageColumn);
  const specs = useProjectStore(s => s.specs);
  const axisSettings = useProjectStore(s => s.axisSettings);
  const setAxisSettings = useProjectStore(s => s.setAxisSettings);
  const columnAliases = useProjectStore(s => s.columnAliases);
  const displayOptions = useProjectStore(s => s.displayOptions);
  const selectedPoints = useProjectStore(s => s.selectedPoints);
  const setSelectedPoints = useProjectStore(s => s.setSelectedPoints);
  const subgroupConfig = useProjectStore(s => s.subgroupConfig);
  const cpkTarget = useProjectStore(s => s.cpkTarget);
  const { min: autoMin, max: autoMax } = useChartScale();

  const isCapabilityMode = displayOptions.standardIChartMetric === 'capability';

  const capData = useCapabilityIChartData({
    filteredData,
    outcome: outcome ?? '',
    specs,
    subgroupConfig,
    cpkTarget,
    enabled: isCapabilityMode,
  });

  return (
    <div className="relative h-full w-full">
      <IChartWrapperBase
        parentWidth={parentWidth}
        parentHeight={parentHeight}
        filteredData={filteredData}
        outcome={outcome}
        timeColumn={timeColumn}
        stageColumn={stageColumn}
        stagedData={stagedData}
        stats={stats}
        stagedStats={stagedStats}
        specs={specs}
        axisSettings={axisSettings}
        onAxisSettingsChange={setAxisSettings}
        autoMin={autoMin}
        autoMax={autoMax}
        columnAliases={columnAliases}
        displayOptions={displayOptions}
        selectedPoints={selectedPoints}
        onSelectionChange={setSelectedPoints}
        showBranding={false}
        isCapabilityMode={isCapabilityMode}
        capabilityCpkData={isCapabilityMode ? capData.cpkData : undefined}
        capabilityCpData={isCapabilityMode ? capData.cpData : undefined}
        capabilityCpkStats={isCapabilityMode ? capData.cpkStats : undefined}
        capabilityCpStats={isCapabilityMode ? capData.cpStats : undefined}
        cpkTarget={cpkTarget}
        {...props}
      />
      {isComputing && (
        <div className="absolute inset-0 bg-surface-primary/30 pointer-events-none transition-opacity duration-200" />
      )}
    </div>
  );
};

export default withParentSize(IChart);
