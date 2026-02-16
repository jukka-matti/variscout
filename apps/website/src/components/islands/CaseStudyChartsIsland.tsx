import { getSample, getCachedComputedData } from '@variscout/data';
import ChartContainer from './ChartContainer';
import StatsIsland from './StatsIsland';
import { renderChartContent } from './renderChart';

type CaseChartType = 'ichart' | 'boxplot' | 'pareto' | 'stats' | 'regression';

interface CaseStudyChartsIslandProps {
  sampleKey: string;
  tools: CaseChartType[];
  height?: number;
  showBranding?: boolean;
}

/**
 * Case study charts island - renders multiple chart types for case studies.
 * Displays charts in a grid layout based on the case's tool requirements.
 */
export default function CaseStudyChartsIsland({
  sampleKey,
  tools,
  height = 350,
  showBranding = true,
}: CaseStudyChartsIslandProps) {
  const sample = getSample(sampleKey);
  const computed = getCachedComputedData(sampleKey);

  if (!sample || !computed) {
    return (
      <div
        className="flex items-center justify-center bg-slate-900 rounded-lg text-slate-500"
        style={{ height: height * 2 }}
      >
        Sample "{sampleKey}" not found
      </div>
    );
  }

  const renderChart = (chartType: CaseChartType, chartHeight: number) => {
    if (chartType === 'stats') {
      return <StatsIsland sampleKey={sampleKey} />;
    }

    // All other chart types use the shared renderer
    return (
      <ChartContainer height={chartHeight}>
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
  };

  // Get primary charts (first 2-3) and secondary
  const primaryTools = tools.filter(t => t !== 'stats').slice(0, 2);
  const hasStats = tools.includes('stats');

  return (
    <div className="space-y-4">
      {/* Stats bar if included */}
      {hasStats && (
        <div className="bg-slate-800/50 rounded-lg p-4">
          <StatsIsland sampleKey={sampleKey} compact />
        </div>
      )}

      {/* Primary charts grid */}
      <div className={`grid gap-4 ${primaryTools.length > 1 ? 'md:grid-cols-2' : ''}`}>
        {primaryTools.map(tool => (
          <div key={tool} className="bg-slate-900 rounded-lg overflow-hidden">
            {renderChart(tool, height)}
          </div>
        ))}
      </div>

      {/* Additional charts if more than 2 tools */}
      {tools.filter(t => t !== 'stats').length > 2 && (
        <div className="bg-slate-900 rounded-lg overflow-hidden">
          {renderChart(tools.filter(t => t !== 'stats')[2], height)}
        </div>
      )}
    </div>
  );
}
