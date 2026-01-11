import { ParetoChartBase } from '@variscout/charts';
import { getSample, getCachedComputedData } from '@variscout/data';
import ChartContainer from './ChartContainer';

interface ParetoIslandProps {
  sampleKey: string;
  height?: number;
  showBranding?: boolean;
}

/**
 * Pareto chart island component for Astro pages.
 * Renders a frequency analysis chart with cumulative line.
 */
export default function ParetoIsland({
  sampleKey,
  height = 400,
  showBranding = true,
}: ParetoIslandProps) {
  const sample = getSample(sampleKey);
  const computed = getCachedComputedData(sampleKey);

  if (!sample || !computed || computed.paretoData.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-slate-900 rounded-lg text-slate-500"
        style={{ height }}
      >
        No Pareto data for "{sampleKey}"
      </div>
    );
  }

  // Calculate total count from values
  const totalCount = computed.paretoData.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartContainer height={height}>
      {({ width, height: containerHeight }) => (
        <ParetoChartBase
          data={computed.paretoData}
          totalCount={totalCount}
          parentWidth={width}
          parentHeight={containerHeight}
          showBranding={showBranding}
        />
      )}
    </ChartContainer>
  );
}
