/**
 * Azure IChart - Thin wrapper that connects DataContext to shared IChartWrapperBase
 */
import { withParentSize } from '@visx/responsive';
import { useData } from '../../context/DataContext';
import { useChartScale } from '../../hooks/useChartScale';
import { useCapabilityIChartData } from '@variscout/hooks';
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
  const ctx = useData();
  const { min: autoMin, max: autoMax } = useChartScale();

  const isCapabilityMode = ctx.displayOptions.standardIChartMetric === 'capability';

  const capData = useCapabilityIChartData({
    filteredData: ctx.filteredData,
    outcome: ctx.outcome ?? '',
    specs: ctx.specs,
    subgroupConfig: ctx.subgroupConfig,
  });

  return (
    <div className="relative h-full w-full">
      <IChartWrapperBase
        parentWidth={parentWidth}
        parentHeight={parentHeight}
        filteredData={ctx.filteredData}
        outcome={ctx.outcome}
        timeColumn={ctx.timeColumn}
        stageColumn={ctx.stageColumn}
        stagedData={ctx.stagedData}
        stats={ctx.stats}
        stagedStats={ctx.stagedStats}
        specs={ctx.specs}
        axisSettings={ctx.axisSettings}
        onAxisSettingsChange={ctx.setAxisSettings}
        autoMin={autoMin}
        autoMax={autoMax}
        columnAliases={ctx.columnAliases}
        displayOptions={ctx.displayOptions}
        selectedPoints={ctx.selectedPoints}
        onSelectionChange={ctx.setSelectedPoints}
        showBranding={false}
        isCapabilityMode={isCapabilityMode}
        capabilityCpkData={isCapabilityMode ? capData.cpkData : undefined}
        capabilityCpData={isCapabilityMode ? capData.cpData : undefined}
        capabilityCpkStats={isCapabilityMode ? capData.cpkStats : undefined}
        capabilityCpStats={isCapabilityMode ? capData.cpStats : undefined}
        {...props}
      />
      {ctx.isComputing && (
        <div className="absolute inset-0 bg-surface-primary/30 pointer-events-none transition-opacity duration-200" />
      )}
    </div>
  );
};

export default withParentSize(IChart);
