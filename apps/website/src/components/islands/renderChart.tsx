import {
  IChartBase,
  BoxplotBase,
  ParetoChartBase,
  CapabilityHistogramBase,
  ScatterPlotBase,
  GageRRChartBase,
  InteractionPlotBase,
} from '@variscout/charts';
import type { SampleDataset, ComputedChartData } from '@variscout/data';

export type ChartType =
  | 'ichart'
  | 'boxplot'
  | 'pareto'
  | 'capability'
  | 'scatter'
  | 'regression'
  | 'gagerr';

interface RenderChartParams {
  chartType: ChartType;
  computed: ComputedChartData;
  sample: SampleDataset;
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
  sample,
  width,
  height,
  showBranding,
}: RenderChartParams): React.ReactNode {
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
          data={computed.ichartData.map(d => d.value)}
          stats={computed.stats}
          specs={computed.specs}
          parentWidth={width}
          parentHeight={height}
          showBranding={showBranding}
        />
      );

    case 'scatter':
    case 'regression': {
      const scatterData = sample.data.map((_, i) => ({
        x: i,
        y: computed.ichartData[i]?.value ?? 0,
      }));
      return (
        <ScatterPlotBase
          data={scatterData}
          xLabel="Observation"
          yLabel={sample.config.outcome}
          parentWidth={width}
          parentHeight={height}
          showBranding={showBranding}
        />
      );
    }

    case 'gagerr':
      if (computed.gagerr) {
        const gagerrHeight = Math.floor(height * 0.38);
        const interactionHeight = Math.floor(height * 0.55);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ height: gagerrHeight }}>
              <GageRRChartBase
                pctPart={computed.gagerr.pctPart}
                pctRepeatability={computed.gagerr.pctRepeatability}
                pctReproducibility={computed.gagerr.pctReproducibility}
                pctGRR={computed.gagerr.pctGRR}
                parentWidth={width}
                parentHeight={gagerrHeight}
                showBranding={false}
              />
            </div>
            <div style={{ height: interactionHeight }}>
              <InteractionPlotBase
                data={computed.gagerr.interactionData}
                parentWidth={width}
                parentHeight={interactionHeight}
                showBranding={showBranding}
              />
            </div>
          </div>
        );
      }
      // Fallback to boxplot if no GageRR data available
      return (
        <BoxplotBase
          data={computed.boxplotData}
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
