/**
 * Azure IChart - Thin wrapper that connects DataContext to shared IChartWrapperBase
 */
import { withParentSize } from '@visx/responsive';
import { useData } from '../../context/DataContext';
import { useChartScale } from '../../hooks/useChartScale';
import { IChartWrapperBase } from '@variscout/ui';
import type { ChartAnnotation } from '@variscout/hooks';

interface IChartProps {
  parentWidth: number;
  parentHeight: number;
  onPointClick?: (index: number) => void;
  highlightedPointIndex?: number | null;
  onSpecClick?: (spec: 'usl' | 'lsl' | 'target') => void;
  ichartAnnotations?: ChartAnnotation[];
  onCreateAnnotation?: (anchorX: number, anchorY: number) => void;
  onAnnotationsChange?: (annotations: ChartAnnotation[]) => void;
}

const IChart = ({ parentWidth, parentHeight, ...props }: IChartProps) => {
  const ctx = useData();
  const { min: autoMin, max: autoMax } = useChartScale();

  return (
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
      {...props}
    />
  );
};

export default withParentSize(IChart);
