/**
 * PerformanceDemo - Performance Analysis demo chart for website
 *
 * Uses the shared PerformanceIChartBase component from @variscout/charts
 * to ensure consistent look and feel with the PWA and Azure apps.
 */

import { useMemo, useState } from 'react';
import { PerformanceIChartBase } from '@variscout/charts';
import { calculateChannelPerformance, type DataRow, type SpecLimits } from '@variscout/core';
import { getSample } from '@variscout/data';
import ChartContainer from './ChartContainer';

interface PerformanceDemoProps {
  sampleKey: string;
  height?: number;
  showBranding?: boolean;
}

/**
 * Performance Analysis demo chart for website tool page.
 * Shows Cpk by channel using the shared PerformanceIChartBase component.
 */
export default function PerformanceDemo({
  sampleKey,
  height = 550,
  showBranding = true,
}: PerformanceDemoProps) {
  const sample = getSample(sampleKey);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  // Calculate channel performance data
  const performanceData = useMemo(() => {
    if (!sample || !sample.config.channelColumns || !sample.config.specs) {
      return null;
    }

    const specs: SpecLimits = sample.config.specs;
    const channels = sample.config.channelColumns;

    // Cast to DataRow[] - sample data structure is compatible
    const data = sample.data as DataRow[];
    return calculateChannelPerformance(data, channels, specs);
  }, [sample]);

  if (!sample || !performanceData) {
    return (
      <div
        className="flex items-center justify-center bg-slate-800 border border-slate-700 rounded-2xl text-slate-500"
        style={{ height }}
      >
        Sample "{sampleKey}" not found or not in wide format
      </div>
    );
  }

  return (
    <ChartContainer height={height}>
      {({ width, height: containerHeight }) => (
        <PerformanceIChartBase
          parentWidth={width}
          parentHeight={containerHeight}
          channels={performanceData.channels}
          selectedMeasure={selectedChannel}
          onChannelClick={channelId =>
            setSelectedChannel(prev => (prev === channelId ? null : channelId))
          }
          showBranding={showBranding}
          capabilityMetric="cpk"
        />
      )}
    </ChartContainer>
  );
}
