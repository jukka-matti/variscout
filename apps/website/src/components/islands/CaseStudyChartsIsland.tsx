import {
  IChartBase,
  BoxplotBase,
  ParetoChartBase,
  ScatterPlotBase,
  GageRRChartBase,
} from '@variscout/charts';
import { getSample, getCachedComputedData } from '@variscout/data';
import ChartContainer from './ChartContainer';
import StatsIsland from './StatsIsland';

type ChartType = 'ichart' | 'boxplot' | 'pareto' | 'stats' | 'regression' | 'gagerr';

interface CaseStudyChartsIslandProps {
  sampleKey: string;
  tools: ChartType[];
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

  const renderChart = (chartType: ChartType, chartHeight: number) => {
    switch (chartType) {
      case 'ichart':
        return (
          <ChartContainer height={chartHeight}>
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

      case 'boxplot':
        return (
          <ChartContainer height={chartHeight}>
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

      case 'pareto':
        const totalCount = computed.paretoData.reduce((sum, item) => sum + item.value, 0);
        return (
          <ChartContainer height={chartHeight}>
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

      case 'stats':
        return <StatsIsland sampleKey={sampleKey} />;

      case 'regression':
        const scatterData = sample.data.map((row, i) => ({
          x: i,
          y: computed.ichartData[i]?.value ?? 0,
        }));
        return (
          <ChartContainer height={chartHeight}>
            {({ width, height: containerHeight }) => (
              <ScatterPlotBase
                data={scatterData}
                xLabel="Observation"
                yLabel={sample.config.outcome}
                parentWidth={width}
                parentHeight={containerHeight}
                showBranding={showBranding}
              />
            )}
          </ChartContainer>
        );

      case 'gagerr':
        // GageRR requires specific data structure - fall back to boxplot
        return (
          <ChartContainer height={chartHeight}>
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

      default:
        return null;
    }
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
