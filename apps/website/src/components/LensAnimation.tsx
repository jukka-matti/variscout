import React, { useEffect, useRef, useState, useMemo } from 'react';

// --- Seeded PRNG (Mulberry32) ---
function seededRandom(seed: number): number {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function generateNormal(mean: number, stdDev: number, seed1: number, seed2: number): number {
  const u1 = seededRandom(seed1);
  const u2 = seededRandom(seed2);
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z * stdDev;
}

// --- Quantile (linear interpolation, matches d3.quantile) ---
function quantile(sorted: number[], p: number): number {
  const n = sorted.length;
  const i = (n - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  const h = i - lo;
  return sorted[lo] * (1 - h) + sorted[hi] * h;
}

// --- Data types ---
interface DataPoint {
  id: number;
  factorIdx: number;
  val: number;
  boxX: number; // jittered X position within boxplot group
  chartX: number; // time-axis X position (0-100)
  shift: 'Day' | 'Night';
  failCategory: 'Setup' | 'Material' | 'Equipment' | 'Other';
  isOutOfControl: boolean;
}

interface FactorStats {
  mean: number;
  q1: number;
  median: number;
  q3: number;
  min: number;
  max: number;
  stdDev: number;
  ucl: number;
  lcl: number;
}

// --- Phase definitions ---
type Phase = 'bars' | 'boxplot' | 'ichart' | 'staged' | 'pareto' | 'conclusion';

const PHASE_LABELS: Record<Phase, string> = {
  bars: 'AVERAGES',
  boxplot: 'FLOW',
  ichart: 'CHANGE',
  staged: 'DRILL-DOWN',
  pareto: 'FAILURE',
  conclusion: 'INSIGHT',
};

const PHASE_COLORS: Record<Phase, string> = {
  bars: '#94a3b8',
  boxplot: '#f97316',
  ichart: '#3b82f6',
  staged: '#a855f7',
  pareto: '#ef4444',
  conclusion: '#22c55e',
};

// --- Scroll thresholds ---
const THRESHOLDS = {
  bars: [0, 0.15],
  boxplot: [0.15, 0.3],
  ichart: [0.3, 0.5],
  staged: [0.5, 0.65],
  pareto: [0.65, 0.85],
  conclusion: [0.85, 1.0],
} as const;

function getPhase(progress: number): Phase {
  if (progress < THRESHOLDS.boxplot[0]) return 'bars';
  if (progress < THRESHOLDS.ichart[0]) return 'boxplot';
  if (progress < THRESHOLDS.staged[0]) return 'ichart';
  if (progress < THRESHOLDS.pareto[0]) return 'staged';
  if (progress < THRESHOLDS.conclusion[0]) return 'pareto';
  return 'conclusion';
}

// Sub-progress within a phase (0-1)
function phaseProgress(progress: number, phase: Phase): number {
  const [start, end] = THRESHOLDS[phase];
  return Math.max(0, Math.min(1, (progress - start) / (end - start)));
}

// Lerp utility
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// --- Main Component ---
export default function LensAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const { top, height } = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const startOffset = -top;
      const totalScrollable = height - windowHeight;
      setProgress(Math.max(0, Math.min(1, startOffset / totalScrollable)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Generate deterministic data for Factor B (the "problem" factor)
  const { dots, stats, paretoCategories } = useMemo(() => {
    const points: DataPoint[] = [];
    const n = 50;

    for (let i = 0; i < n; i++) {
      const baseSeed = 10000 + i * 3;

      // Factor B story: first 25 stable & high, last 25 shifted low & variable
      let val: number;
      if (i < 25) {
        val = generateNormal(97, 1.5, baseSeed, baseSeed + 1);
      } else {
        val = generateNormal(85, 3.5, baseSeed, baseSeed + 1);
      }
      val = Math.max(60, Math.min(99, val));

      // Shift assignment: Day for first 25, Night for last 25 (with some mixing)
      const shiftRand = seededRandom(baseSeed + 10);
      const shift: 'Day' | 'Night' =
        i < 25 ? (shiftRand > 0.15 ? 'Day' : 'Night') : shiftRand > 0.2 ? 'Night' : 'Day';

      // Fail category for out-of-control points
      const catRand = seededRandom(baseSeed + 20);
      let failCategory: 'Setup' | 'Material' | 'Equipment' | 'Other';
      if (shift === 'Night') {
        // Night shift: mostly Setup issues
        if (catRand < 0.5) failCategory = 'Setup';
        else if (catRand < 0.75) failCategory = 'Material';
        else if (catRand < 0.9) failCategory = 'Equipment';
        else failCategory = 'Other';
      } else {
        if (catRand < 0.3) failCategory = 'Setup';
        else if (catRand < 0.55) failCategory = 'Material';
        else if (catRand < 0.8) failCategory = 'Equipment';
        else failCategory = 'Other';
      }

      points.push({
        id: i,
        factorIdx: 1,
        val,
        boxX: 20 + seededRandom(baseSeed + 2) * 60,
        chartX: (i / n) * 100,
        shift,
        failCategory,
        isOutOfControl: false, // computed after stats
      });
    }

    // Compute stats
    const values = points.map(d => d.val).sort((a, b) => a - b);
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
    const stdDev = Math.sqrt(variance);
    const factorStats: FactorStats = {
      mean,
      q1: quantile(values, 0.25),
      median: quantile(values, 0.5),
      q3: quantile(values, 0.75),
      min: values[0],
      max: values[values.length - 1],
      stdDev,
      ucl: mean + 3 * stdDev,
      lcl: Math.max(60, mean - 3 * stdDev),
    };

    // Mark out-of-control points
    points.forEach(p => {
      p.isOutOfControl = p.val > factorStats.ucl || p.val < factorStats.lcl;
    });

    // Pareto categories
    const oocPoints = points.filter(p => p.isOutOfControl);
    const catCounts: Record<string, number> = { Setup: 0, Material: 0, Equipment: 0, Other: 0 };
    oocPoints.forEach(p => {
      catCounts[p.failCategory]++;
    });
    // If few natural OOC points, also count the shifted ones (val < mean - stdDev)
    const lowPoints = points.filter(p => p.val < mean - stdDev && !p.isOutOfControl);
    lowPoints.forEach(p => {
      catCounts[p.failCategory]++;
    });

    const categories = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
    const totalFailures = categories.reduce((s, c) => s + c.count, 0);

    return {
      dots: points,
      stats: factorStats,
      paretoCategories: categories.map((c, i, arr) => ({
        ...c,
        pct: totalFailures > 0 ? (c.count / totalFailures) * 100 : 0,
        cumPct:
          totalFailures > 0
            ? (arr.slice(0, i + 1).reduce((s, x) => s + x.count, 0) / totalFailures) * 100
            : 0,
      })),
    };
  }, []);

  // Stable data for Factors A and C (used in bar/boxplot phases)
  const sideFactors = useMemo(() => {
    return [
      { label: 'Factor A', mean: 96, color: '#22c55e' },
      { label: 'Factor C', mean: 95, color: '#22c55e' },
    ];
  }, []);

  const phase = getPhase(progress);
  const pProg = phaseProgress(progress, phase);

  // Y-axis scaling
  const dataMin = Math.min(stats.min, stats.lcl) - 3;
  const dataMax = Math.max(stats.max, stats.ucl) + 3;
  const scaleY = (value: number): number => {
    return 5 + ((value - dataMin) / (dataMax - dataMin)) * 90;
  };

  // Compute how much the side factors have faded
  const sideOpacity = phase === 'bars' ? 1 : phase === 'boxplot' ? Math.max(0, 1 - pProg * 2) : 0;
  // Factor B expansion: starts filling viewport after boxplot
  const bExpanded = phase === 'bars' || phase === 'boxplot' ? false : true;

  // Night shift filter progress (in staged phase)
  const nightFilterProg =
    phase === 'staged' ? pProg : phase === 'pareto' || phase === 'conclusion' ? 1 : 0;

  // Pareto transition
  const paretoProg = phase === 'pareto' ? pProg : phase === 'conclusion' ? 1 : 0;

  // Narrative text per phase
  const narratives: Record<Phase, { title: string; sub: string; color: string }> = {
    bars: {
      title: 'Average looks fine',
      sub: '94% average. Management is satisfied.',
      color: '#94a3b8',
    },
    boxplot: {
      title: 'FLOW lens: Which factor drives variation?',
      sub: 'Same average. Very different spread. Factor B has 3\u00d7 the variation.',
      color: '#f97316',
    },
    ichart: {
      title: 'CHANGE lens: What\u2019s shifting over time?',
      sub: 'Something changed around observation 25. The average hid a process shift.',
      color: '#3b82f6',
    },
    staged: {
      title: 'Drill-down: Filter to isolate',
      sub: 'Night shift explains 67% of the variation. Now we see exactly where.',
      color: '#a855f7',
    },
    pareto: {
      title: 'FAILURE lens: Where do problems concentrate?',
      sub: 'Setup procedure on Night shift: 46% of all out-of-control points.',
      color: '#ef4444',
    },
    conclusion: {
      title: 'Three lenses. Same data. Found it.',
      sub: 'FLOW found the factor. CHANGE showed when. FAILURE showed why.',
      color: '#22c55e',
    },
  };

  const narrative = narratives[phase];

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: '600vh' }}>
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden bg-neutral-900">
        {/* Phase indicator pills */}
        <div className="absolute top-4 left-0 right-0 z-50 flex justify-center gap-2 px-4">
          {(Object.keys(PHASE_LABELS) as Phase[]).map(p => (
            <div
              key={p}
              className="flex items-center gap-1.5 transition-all duration-300"
              style={{ opacity: phase === p ? 1 : 0.3 }}
            >
              <span
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: PHASE_COLORS[p],
                  transform: phase === p ? 'scale(1.5)' : 'scale(1)',
                }}
              />
              <span
                className="text-xs font-medium hidden sm:inline transition-all duration-300"
                style={{ color: phase === p ? PHASE_COLORS[p] : '#64748b' }}
              >
                {PHASE_LABELS[p]}
              </span>
            </div>
          ))}
        </div>

        {/* Narrative text */}
        <div className="absolute top-12 sm:top-16 left-0 right-0 text-center z-40 px-4">
          <h3
            className="text-xl sm:text-2xl md:text-3xl font-bold transition-colors duration-500"
            style={{ color: narrative.color }}
          >
            {narrative.title}
          </h3>
          <p className="text-sm sm:text-base text-neutral-400 mt-2 max-w-xl mx-auto">
            {narrative.sub}
          </p>
        </div>

        {/* Filter chip (staged phase) */}
        <div
          className="absolute top-28 sm:top-32 left-1/2 -translate-x-1/2 z-40 transition-all duration-500"
          style={{
            opacity: nightFilterProg > 0.1 ? Math.min(1, nightFilterProg * 2) : 0,
            transform: `translate(-50%, ${nightFilterProg > 0.1 ? 0 : 10}px)`,
          }}
        >
          <span className="inline-flex items-center gap-1.5 bg-purple-500/20 border border-purple-500/40 text-purple-300 text-sm font-medium px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            Shift: Night
            <span className="text-purple-400 font-bold ml-1">67%</span>
          </span>
        </div>

        {/* Main visualization area */}
        <div
          className="relative w-full max-w-4xl px-4 sm:px-8 md:px-12"
          style={{ height: '60vh', maxHeight: '400px' }}
        >
          <div className="h-full flex items-end justify-center gap-4 sm:gap-8 md:gap-12 relative">
            {/* Side factor bars (A and C) */}
            {sideFactors.map((factor, idx) => (
              <div
                key={factor.label}
                className="flex flex-col items-center justify-end h-full transition-all duration-700"
                style={{
                  opacity: sideOpacity,
                  width: sideOpacity > 0 ? '80px' : '0px',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <div
                  className="w-16 rounded-t-lg relative transition-all duration-700"
                  style={{
                    height: `${factor.mean}%`,
                    backgroundColor: factor.color,
                    opacity: phase === 'bars' ? 1 : Math.max(0, 1 - pProg * 3),
                  }}
                >
                  <div className="absolute top-2 w-full text-center text-white font-bold text-sm">
                    {factor.mean}%
                  </div>
                </div>
                <span className="text-neutral-400 text-xs sm:text-sm mt-2 font-medium whitespace-nowrap">
                  {factor.label}
                </span>
              </div>
            ))}

            {/* Factor B: The hero visualization */}
            <div
              className="flex flex-col items-center justify-end h-full relative transition-all duration-700"
              style={{
                width: bExpanded ? '100%' : '80px',
                maxWidth: bExpanded ? '100%' : '80px',
                flexGrow: bExpanded ? 1 : 0,
              }}
            >
              <div className="w-full h-full relative">
                {/* Solid bar (bars phase) */}
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 rounded-t-lg transition-all duration-700 z-10"
                  style={{
                    height: `${stats.mean}%`,
                    backgroundColor: '#3b82f6',
                    opacity: phase === 'bars' ? 1 : 0,
                    transform: `translateX(-50%) scaleY(${phase === 'bars' ? 1 : 0})`,
                    transformOrigin: 'bottom',
                  }}
                >
                  <div className="absolute top-2 w-full text-center text-white font-bold text-sm">
                    {Math.round(stats.mean)}%
                  </div>
                </div>

                {/* Boxplot overlay (boxplot phase) */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 transition-all duration-500 z-5"
                  style={{
                    width: bExpanded ? '60px' : '60px',
                    height: '100%',
                    bottom: 0,
                    opacity: phase === 'boxplot' ? 1 : 0,
                  }}
                >
                  {/* Whiskers */}
                  <div
                    className="absolute bg-white/50 left-1/2 -translate-x-1/2"
                    style={{
                      width: '1px',
                      bottom: `${scaleY(stats.min)}%`,
                      height: `${scaleY(stats.q1) - scaleY(stats.min)}%`,
                    }}
                  />
                  <div
                    className="absolute bg-white/50 left-1/2 -translate-x-1/2"
                    style={{
                      width: '1px',
                      bottom: `${scaleY(stats.q3)}%`,
                      height: `${scaleY(stats.max) - scaleY(stats.q3)}%`,
                    }}
                  />
                  {/* Caps */}
                  <div
                    className="absolute bg-white/50 left-1/2 -translate-x-1/2 w-4"
                    style={{ height: '1px', bottom: `${scaleY(stats.min)}%` }}
                  />
                  <div
                    className="absolute bg-white/50 left-1/2 -translate-x-1/2 w-4"
                    style={{ height: '1px', bottom: `${scaleY(stats.max)}%` }}
                  />
                  {/* Box */}
                  <div
                    className="absolute w-8 left-1/2 -translate-x-1/2 border border-white/60 bg-white/10"
                    style={{
                      bottom: `${scaleY(stats.q1)}%`,
                      height: `${scaleY(stats.q3) - scaleY(stats.q1)}%`,
                    }}
                  />
                  {/* Median */}
                  <div
                    className="absolute w-8 left-1/2 -translate-x-1/2 bg-orange-400 z-10"
                    style={{ height: '2px', bottom: `${scaleY(stats.median)}%` }}
                  />
                </div>

                {/* I-Chart grid & control limits (ichart+ phases) */}
                {bExpanded && (
                  <div
                    className="absolute inset-0 transition-opacity duration-700"
                    style={{
                      opacity:
                        phase === 'ichart' || phase === 'staged'
                          ? 1
                          : phase === 'pareto'
                            ? Math.max(0, 1 - paretoProg * 2)
                            : 0,
                    }}
                  >
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between py-4 px-2">
                      {[0, 1, 2, 3, 4].map(l => (
                        <div key={l} className="w-full bg-white/5" style={{ height: '1px' }} />
                      ))}
                    </div>
                    {/* UCL */}
                    <div
                      className="absolute left-0 right-0 border-t border-dashed border-red-500/50 mx-2"
                      style={{ bottom: `${scaleY(stats.ucl)}%` }}
                    >
                      <span className="text-[9px] sm:text-[10px] text-red-500 absolute -mt-3.5 right-0">
                        UCL {stats.ucl.toFixed(0)}
                      </span>
                    </div>
                    {/* Mean */}
                    <div
                      className="absolute left-0 right-0 border-t border-blue-500/50 mx-2"
                      style={{ bottom: `${scaleY(stats.mean)}%` }}
                    >
                      <span className="text-[9px] sm:text-[10px] text-blue-400 absolute -mt-3.5 right-0">
                        x&#772; {stats.mean.toFixed(0)}
                      </span>
                    </div>
                    {/* LCL */}
                    <div
                      className="absolute left-0 right-0 border-t border-dashed border-red-500/50 mx-2"
                      style={{ bottom: `${scaleY(stats.lcl)}%` }}
                    >
                      <span className="text-[9px] sm:text-[10px] text-red-500 absolute mt-0.5 right-0">
                        LCL {stats.lcl.toFixed(0)}
                      </span>
                    </div>
                  </div>
                )}

                {/* I-Chart connecting line (ichart+ phases) */}
                {bExpanded && (phase === 'ichart' || phase === 'staged') && (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-15"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={{
                      opacity: phase === 'ichart' ? Math.min(1, pProg * 3) : 1,
                    }}
                  >
                    <polyline
                      points={dots
                        .filter(d => {
                          if (phase !== 'staged' || nightFilterProg < 0.5) return true;
                          return d.shift === 'Night';
                        })
                        .map(d => `${d.chartX},${100 - scaleY(d.val)}`)
                        .join(' ')}
                      fill="none"
                      stroke={phase === 'staged' ? '#c084fc' : '#60a5fa'}
                      strokeWidth="0.5"
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.6"
                    />
                  </svg>
                )}

                {/* Pareto bars (pareto phase) */}
                {bExpanded && paretoProg > 0 && (
                  <div
                    className="absolute inset-0 flex items-end justify-around px-2 sm:px-8 z-20"
                    style={{ opacity: Math.min(1, paretoProg * 2) }}
                  >
                    {paretoCategories.map((cat, i) => {
                      const maxCount = paretoCategories[0].count;
                      const barHeight = maxCount > 0 ? (cat.count / maxCount) * 70 : 0;
                      return (
                        <div
                          key={cat.name}
                          className="flex flex-col items-center gap-1"
                          style={{ width: `${100 / paretoCategories.length - 2}%` }}
                        >
                          {/* Count label */}
                          <span
                            className="text-xs text-white font-bold"
                            style={{ opacity: paretoProg > 0.5 ? 1 : 0 }}
                          >
                            {cat.count}
                          </span>
                          {/* Bar */}
                          <div
                            className="w-full rounded-t transition-all duration-500"
                            style={{
                              height: `${barHeight * paretoProg}%`,
                              backgroundColor:
                                i === 0
                                  ? '#ef4444'
                                  : i === 1
                                    ? '#f97316'
                                    : i === 2
                                      ? '#f59e0b'
                                      : '#6b7280',
                            }}
                          />
                          {/* Category label */}
                          <span className="text-[10px] sm:text-xs text-neutral-400 mt-1 text-center whitespace-nowrap">
                            {cat.name}
                          </span>
                          {/* Percentage */}
                          <span
                            className="text-[10px] text-neutral-500"
                            style={{ opacity: paretoProg > 0.5 ? 1 : 0 }}
                          >
                            {cat.pct.toFixed(0)}%
                          </span>
                        </div>
                      );
                    })}

                    {/* Cumulative line */}
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      style={{
                        opacity: paretoProg > 0.6 ? Math.min(1, (paretoProg - 0.6) * 3) : 0,
                      }}
                    >
                      <polyline
                        points={paretoCategories
                          .map((cat, i) => {
                            const x = ((i + 0.5) / paretoCategories.length) * 100;
                            const y = 100 - (cat.cumPct * 0.7 + 10);
                            return `${x},${y}`;
                          })
                          .join(' ')}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {paretoCategories.map((cat, i) => {
                        const x = ((i + 0.5) / paretoCategories.length) * 100;
                        const y = 100 - (cat.cumPct * 0.7 + 10);
                        return (
                          <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="3"
                            fill="#fbbf24"
                            vectorEffect="non-scaling-stroke"
                          />
                        );
                      })}
                    </svg>
                  </div>
                )}

                {/* Data dots */}
                <div className="absolute inset-0 mx-2 z-25">
                  {dots.map(d => {
                    // Position calculation depends on phase
                    let x: number;
                    let y: number;
                    let opacity = 1;
                    let size = 6;
                    let color = '#60a5fa';

                    if (phase === 'bars') {
                      // Hidden in bar phase
                      x = 50;
                      y = scaleY(d.val);
                      opacity = 0;
                    } else if (phase === 'boxplot') {
                      // Clustered in boxplot position
                      x = d.boxX;
                      y = scaleY(d.val);
                      opacity = Math.min(1, pProg * 3);
                      size = 5;
                    } else if (phase === 'ichart') {
                      // Transition from boxplot to time axis
                      const t = Math.min(1, pProg * 1.5);
                      x = lerp(d.boxX, d.chartX, t);
                      y = scaleY(d.val);
                      size = 6;
                      // Color by whether OOC
                      if (d.isOutOfControl) color = '#ef4444';
                    } else if (phase === 'staged') {
                      // I-chart positions, color by shift
                      x = d.chartX;
                      y = scaleY(d.val);
                      size = 7;

                      if (d.shift === 'Night') {
                        color = '#c084fc'; // purple for Night
                        opacity = 1;
                      } else {
                        color = '#60a5fa'; // blue for Day
                        opacity = Math.max(0.15, 1 - nightFilterProg * 1.2);
                      }
                    } else if (phase === 'pareto') {
                      // Dots fade out as Pareto bars appear
                      x = d.chartX;
                      y = scaleY(d.val);
                      opacity = Math.max(0, 1 - paretoProg * 2);
                      if (d.isOutOfControl) {
                        color = '#ef4444';
                        opacity = Math.max(0.3, 1 - paretoProg * 1.5);
                      }
                    } else {
                      // Conclusion: minimal dots
                      x = d.chartX;
                      y = scaleY(d.val);
                      opacity = 0.1;
                    }

                    return (
                      <div
                        key={d.id}
                        className="absolute rounded-full"
                        style={{
                          left: `${x}%`,
                          bottom: `${y}%`,
                          width: `${size}px`,
                          height: `${size}px`,
                          backgroundColor: color,
                          opacity,
                          transform: 'translate(-50%, 50%)',
                          transition:
                            'left 0.8s ease-out, bottom 0.3s ease-out, opacity 0.5s, background-color 0.5s, width 0.3s, height 0.3s',
                          boxShadow:
                            d.isOutOfControl && (phase === 'ichart' || phase === 'staged')
                              ? '0 0 6px rgba(239,68,68,0.5)'
                              : 'none',
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Factor B label */}
              <span
                className="text-neutral-400 text-xs sm:text-sm mt-2 font-medium transition-opacity duration-500"
                style={{ opacity: phase === 'bars' || phase === 'boxplot' ? 1 : 0 }}
              >
                Factor B
              </span>
            </div>
          </div>
        </div>

        {/* Conclusion overlay */}
        <div
          className="absolute bottom-16 sm:bottom-20 left-0 right-0 text-center transition-all duration-700 px-4"
          style={{
            opacity: phase === 'conclusion' ? 1 : 0,
            transform: `translateY(${phase === 'conclusion' ? 0 : 20}px)`,
          }}
        >
          <p className="text-lg sm:text-xl font-bold text-white bg-black/50 inline-block px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
            Night shift setup procedure wasn't standardized. Now it is.
          </p>
        </div>

        {/* Scroll hint (only at very start) */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 transition-opacity duration-500"
          style={{ opacity: progress < 0.05 ? 1 : 0 }}
        >
          <div className="flex flex-col items-center gap-2 text-neutral-500">
            <span className="text-xs">Scroll to explore</span>
            <svg
              className="w-5 h-5 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>

        {/* Progress bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800">
          <div
            className="h-full transition-all duration-100"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: PHASE_COLORS[phase],
            }}
          />
        </div>
      </div>
    </div>
  );
}
