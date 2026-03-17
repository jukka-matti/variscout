import {
  IChartBase,
  BoxplotBase,
  ParetoChartBase,
  CapabilityHistogramBase,
} from '@variscout/charts';
import type { ComputedChartData } from '@variscout/data';

export type ChartType = 'ichart' | 'boxplot' | 'pareto' | 'capability';

interface RenderChartParams {
  chartType: ChartType;
  computed: ComputedChartData;
  width: number;
  height: number;
  showBranding: boolean;
}

/**
 * Shared chart renderer used by ToolChartIsland and CaseStudyChartsIsland.
 * Returns chart JSX for the given chart type and dimensions.
 */
export function renderChartContent({
  chartType,
  computed,
  width,
  height,
  showBranding,
}: RenderChartParams) {
  switch (chartType) {
    case 'ichart':
      return (
        <IChartBase
          data={computed.ichartData}
          stats={computed.stats}
          specs={computed.specs}
          parentWidth={width}
          parentHeight={height}
          showBranding={showBranding}
        />
      );

    case 'boxplot':
      return (
        <BoxplotBase
          data={computed.boxplotData}
          specs={computed.specs}
          parentWidth={width}
          parentHeight={height}
          showBranding={showBranding}
        />
      );

    case 'pareto': {
      const totalCount = computed.paretoData.reduce((sum, item) => sum + item.value, 0);
      return (
        <ParetoChartBase
          data={computed.paretoData}
          totalCount={totalCount}
          parentWidth={width}
          parentHeight={height}
          showBranding={showBranding}
        />
      );
    }

    case 'capability':
      return (
        <CapabilityHistogramBase
          data={computed.ichartData.map(d => d.y)}
          mean={computed.stats.mean}
          specs={computed.specs}
          parentWidth={width}
          parentHeight={height}
          showBranding={showBranding}
        />
      );

    default:
      return null;
  }
}
