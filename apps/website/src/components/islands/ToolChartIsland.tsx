import {
  IChartBase,
  BoxplotBase,
  ParetoChartBase,
  CapabilityHistogramBase,
  ScatterPlotBase,
  GageRRChartBase,
} from '@variscout/charts';
import { getSample, getCachedComputedData } from '@variscout/data';
import ChartContainer from './ChartContainer';

interface ToolChartIslandProps {
  toolSlug: string;
  sampleKey: string;
  height?: number;
  showBranding?: boolean;
}

// Map tool slugs to chart types
type ChartType = 'ichart' | 'boxplot' | 'pareto' | 'capability' | 'scatter' | 'gage-rr';

const TOOL_CHART_MAP: Record<string, ChartType> = {
  'i-chart': 'ichart',
  boxplot: 'boxplot',
  pareto: 'pareto',
  capability: 'capability',
  regression: 'scatter',
  'gage-rr': 'gage-rr',
};

/**
 * Tool page chart island - renders the appropriate chart type based on tool slug.
 * Used on tool demo pages to show interactive examples.
 */
export default function ToolChartIsland({
  toolSlug,
  sampleKey,
  height = 550,
  showBranding = true,
}: ToolChartIslandProps) {
  const sample = getSample(sampleKey);
  const computed = getCachedComputedData(sampleKey);
  const chartType = TOOL_CHART_MAP[toolSlug];

  if (!sample || !computed) {
    return (
      <div
        className="flex items-center justify-center bg-slate-900 rounded-lg text-slate-500"
        style={{ height }}
      >
        Sample "{sampleKey}" not found
      </div>
    );
  }

  if (!chartType) {
    return (
      <div
        className="flex items-center justify-center bg-slate-900 rounded-lg text-slate-500"
        style={{ height }}
      >
        Unknown tool type: {toolSlug}
      </div>
    );
  }

  return (
    <ChartContainer height={height}>
      {({ width, height: containerHeight }) => {
        switch (chartType) {
          case 'ichart':
            return (
              <IChartBase
                data={computed.ichartData}
                stats={computed.stats}
                specs={computed.specs}
                parentWidth={width}
                parentHeight={containerHeight}
                showBranding={showBranding}
              />
            );

          case 'boxplot':
            return (
              <BoxplotBase
                data={computed.boxplotData}
                specs={computed.specs}
                parentWidth={width}
                parentHeight={containerHeight}
                showBranding={showBranding}
              />
            );

          case 'pareto':
            const totalCount = computed.paretoData.reduce((sum, item) => sum + item.value, 0);
            return (
              <ParetoChartBase
                data={computed.paretoData}
                totalCount={totalCount}
                parentWidth={width}
                parentHeight={containerHeight}
                showBranding={showBranding}
              />
            );

          case 'capability':
            return (
              <CapabilityHistogramBase
                data={computed.ichartData.map(d => d.value)}
                stats={computed.stats}
                specs={computed.specs}
                parentWidth={width}
                parentHeight={containerHeight}
                showBranding={showBranding}
              />
            );

          case 'scatter':
            // For scatter/regression, we need X and Y values
            // Using first two numeric columns from raw data
            const scatterData = sample.data.map((row, i) => ({
              x: i,
              y: computed.ichartData[i]?.value ?? 0,
            }));
            return (
              <ScatterPlotBase
                data={scatterData}
                xLabel="Observation"
                yLabel={sample.config.outcome}
                parentWidth={width}
                parentHeight={containerHeight}
                showBranding={showBranding}
              />
            );

          case 'gage-rr':
            // GageRR requires specific data structure with operators and parts
            // Fall back to boxplot view for now
            return (
              <BoxplotBase
                data={computed.boxplotData}
                specs={computed.specs}
                parentWidth={width}
                parentHeight={containerHeight}
                showBranding={showBranding}
              />
            );

          default:
            return null;
        }
      }}
    </ChartContainer>
  );
}
