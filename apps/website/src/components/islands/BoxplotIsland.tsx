import { useState } from 'react';
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
  const [showViolin, setShowViolin] = useState(false);
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
    <div>
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setShowViolin(v => !v)}
          className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
            showViolin
              ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
          }`}
        >
          {showViolin ? 'Violin On' : 'Violin Off'}
        </button>
      </div>
      <ChartContainer height={height}>
        {({ width, height: containerHeight }) => (
          <BoxplotBase
            data={computed.boxplotData}
            specs={computed.specs}
            parentWidth={width}
            parentHeight={containerHeight}
            showBranding={showBranding}
            showViolin={showViolin}
          />
        )}
      </ChartContainer>
    </div>
  );
}
