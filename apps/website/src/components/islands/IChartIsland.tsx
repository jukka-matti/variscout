import { IChartBase } from '@variscout/charts';
import { getSample, getCachedComputedData } from '@variscout/data';
import ChartContainer from './ChartContainer';

interface IChartIslandProps {
  sampleKey: string;
  height?: number;
  showBranding?: boolean;
}

/**
 * I-Chart (Individual Values Chart) island component for Astro pages.
 * Renders a time-series control chart with data from @variscout/data.
 */
export default function IChartIsland({
  sampleKey,
  height = 400,
  showBranding = true,
}: IChartIslandProps) {
  const sample = getSample(sampleKey);
  const computed = getCachedComputedData(sampleKey);

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

  return (
    <ChartContainer height={height}>
      {({ width, height: containerHeight }) => (
        <IChartBase
          data={computed.ichartData}
          stats={computed.stats}
          specs={computed.specs}
          parentWidth={width}
          parentHeight={containerHeight}
          showBranding={showBranding}
        />
      )}
    </ChartContainer>
  );
}
