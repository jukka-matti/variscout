import { getSample, getCachedComputedData } from '@variscout/data';

interface StatsIslandProps {
  sampleKey: string;
  compact?: boolean;
}

/**
 * Statistics display island component for Astro pages.
 * Shows key metrics: n, Mean, StdDev, Cpk.
 */
export default function StatsIsland({ sampleKey, compact = false }: StatsIslandProps) {
  const sample = getSample(sampleKey);
  const computed = getCachedComputedData(sampleKey);

  if (!sample || !computed) {
    return <div className="text-slate-500 text-sm">No data for "{sampleKey}"</div>;
  }

  const { stats, specs } = computed;

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm text-slate-300 font-mono">
        <span>n={stats.n}</span>
        <span>Mean={stats.mean.toFixed(2)}</span>
        <span>StdDev={stats.stdDev.toFixed(2)}</span>
        {stats.cpk !== undefined && (
          <span className={stats.cpk >= 1.33 ? 'text-green-500' : 'text-amber-500'}>
            Cpk={stats.cpk.toFixed(2)}
          </span>
        )}
      </div>
    );
  }

  // Calculate pass rate
  const passRate = 100 - stats.outOfSpecPercentage;

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-slate-500 text-xs uppercase tracking-wider">Sample Size</div>
          <div className="text-white font-mono text-lg">{stats.n}</div>
        </div>
        <div>
          <div className="text-slate-500 text-xs uppercase tracking-wider">Mean</div>
          <div className="text-white font-mono text-lg">{stats.mean.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-slate-500 text-xs uppercase tracking-wider">Std Dev</div>
          <div className="text-white font-mono text-lg">{stats.stdDev.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-slate-500 text-xs uppercase tracking-wider">Pass Rate</div>
          <div
            className={`font-mono text-lg ${passRate >= 95 ? 'text-green-500' : passRate >= 80 ? 'text-amber-500' : 'text-red-500'}`}
          >
            {passRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Specs and capability */}
      {(specs.lsl !== undefined || specs.usl !== undefined) && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex gap-4 text-slate-400">
              {specs.lsl !== undefined && <span>LSL: {specs.lsl}</span>}
              {specs.target !== undefined && <span>Target: {specs.target}</span>}
              {specs.usl !== undefined && <span>USL: {specs.usl}</span>}
            </div>
            {stats.cpk !== undefined && (
              <div
                className={`font-semibold ${stats.cpk >= 1.33 ? 'text-green-500' : stats.cpk >= 1.0 ? 'text-amber-500' : 'text-red-500'}`}
              >
                Cpk: {stats.cpk.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
