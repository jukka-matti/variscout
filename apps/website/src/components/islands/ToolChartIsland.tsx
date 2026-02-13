import { getSample, getCachedComputedData } from '@variscout/data';
import ChartContainer from './ChartContainer';
import PerformanceDemo from './PerformanceDemo';
import { renderChartContent, type ChartType } from './renderChart';

interface ToolChartIslandProps {
  toolSlug: string;
  sampleKey: string;
  height?: number;
  showBranding?: boolean;
}

const TOOL_CHART_MAP: Record<string, ChartType | 'performance'> = {
  'i-chart': 'ichart',
  boxplot: 'boxplot',
  pareto: 'pareto',
  capability: 'capability',
  regression: 'scatter',
  'gage-rr': 'gagerr',
  performance: 'performance',
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

  // Performance demo has its own ChartContainer, render directly
  if (chartType === 'performance') {
    return <PerformanceDemo sampleKey={sampleKey} height={height} showBranding={showBranding} />;
  }

  return (
    <ChartContainer height={height}>
      {({ width, height: containerHeight }) =>
        renderChartContent({
          chartType,
          computed,
          sample,
          width,
          height: containerHeight,
          showBranding,
        })
      }
    </ChartContainer>
  );
}
