import { BoxplotBase } from '@variscout/charts';
import { getSample, getCachedComputedData } from '@variscout/data';
import ChartContainer from './ChartContainer';

interface BoxplotIslandProps {
  sampleKey: string;
  height?: number;
  showBranding?: boolean;
}

/**
 * Boxplot island component for Astro pages.
 * Renders a factor comparison boxplot with data from @variscout/data.
 */
export default function BoxplotIsland({
  sampleKey,
  height = 400,
  showBranding = true,
}: BoxplotIslandProps) {
  const sample = getSample(sampleKey);
  const computed = getCachedComputedData(sampleKey);

  if (!sample || !computed || computed.boxplotData.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-slate-900 rounded-lg text-slate-500"
        style={{ height }}
      >
        No boxplot data for "{sampleKey}"
      </div>
    );
  }

  return (
    <ChartContainer height={height}>
      {({ width, height: containerHeight }) => (
        <BoxplotBase
          data={computed.boxplotData}
          specs={computed.specs}
          parentWidth={width}
          parentHeight={containerHeight}
          showBranding={showBranding}
        />
      )}
    </ChartContainer>
  );
}
