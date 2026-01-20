import React, { useState } from 'react';

type ConceptType = 'xray' | 'chaos';

interface AnimationDemoProps {
  concept: ConceptType;
}

export default function AnimationDemo({ concept }: AnimationDemoProps) {
  if (concept === 'xray') {
    return <XRayScanner />;
  }
  return <ChaosBreakout />;
}

// ==========================================
// CONCEPT A: X-RAY SCANNER
// ==========================================
function XRayScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const toggleScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setRevealed(false);

    // Simulate scan duration
    setTimeout(() => {
      setRevealed(true);
      setIsScanning(false);
    }, 2000);
  };

  const reset = () => {
    setRevealed(false);
    setIsScanning(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-8 bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden relative">
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
          onClick={toggleScan}
          disabled={isScanning || revealed}
          className="px-4 py-2 bg-brand-primary text-white text-sm font-bold rounded-lg disabled:opacity-50 hover:bg-opacity-90 transition-all"
        >
          {isScanning ? 'Scanning...' : 'Start Scan'}
        </button>
        <button
          onClick={reset}
          disabled={!revealed && !isScanning}
          className="px-4 py-2 bg-neutral-700 text-white text-sm font-bold rounded-lg hover:bg-neutral-600 transition-all"
        >
          Reset
        </button>
      </div>

      <div className="text-center mb-12">
        <h3 className="text-2xl font-bold text-white mb-2">Concept A: The X-Ray Scanner</h3>
        <p className="text-neutral-400">Scan the "Average" to reveal existing variation.</p>
      </div>

      <div className="h-64 relative flex items-end justify-center gap-16 px-12">
        {/* Scanner Beam */}
        <div
          className={`absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent z-30 pointer-events-none transition-all duration-[2000ms] ease-linear ${isScanning ? 'left-[120%]' : '-left-24'}`}
          style={{ transitionTimingFunction: 'linear' }}
        />

        {/* CHART BARS */}
        {['Factor A', 'Factor B', 'Factor C'].map((label, idx) => (
          <div
            key={label}
            className="flex flex-col items-center justify-end h-full w-24 relative group"
          >
            {/* CONTAINER FOR BOTH VIEWS */}
            <div className="w-full h-48 relative">
              {/* HIDDEN LAYER: DISTRIBUTION (BOXPLOT/STRIP PLOT) */}
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-1000 ${revealed ? 'opacity-100' : 'opacity-0'}`}
              >
                {/* Boxplot Line */}
                <div className="absolute h-[80%] w-0.5 bg-neutral-600 top-[10%]"></div>
                {/* Box */}
                <div
                  className={`absolute w-full border-2 ${idx === 1 ? 'border-red-500 bg-red-500/10' : 'border-green-500 bg-green-500/10'} h-[40%] top-[30%] left-0 right-0`}
                ></div>
                {/* Median */}
                <div
                  className={`absolute w-full h-0.5 ${idx === 1 ? 'bg-red-500' : 'bg-green-500'} top-[50%]`}
                ></div>

                {/* Random Dots (Jitter) */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className={`absolute w-1.5 h-1.5 rounded-full ${idx === 1 ? 'bg-red-400' : 'bg-green-400'}`}
                    style={{
                      top: `${Math.random() * 80 + 10}%`,
                      left: `${Math.random() * 60 + 20}%`,
                      opacity: 0.8,
                    }}
                  />
                ))}
              </div>

              {/* TOP LAYER: SOLID AVERAGE BAR */}
              <div
                className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-700 ${revealed || isScanning ? 'opacity-10' : 'opacity-100'}`}
                style={{
                  height: idx === 1 ? '92%' : '96%', // Factor B is slightly lower avg
                  backgroundColor: idx === 1 ? '#ef4444' : '#22c55e', // Red vs Green
                }}
              >
                <div className="absolute top-2 w-full text-center text-white font-bold opacity-100">
                  {idx === 1 ? '92%' : '96%'}
                </div>
              </div>
            </div>

            <span className="text-neutral-400 text-sm mt-4 font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Story Overlay */}
      <div
        className={`absolute bottom-4 left-0 right-0 text-center transition-all duration-500 ${revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      >
        <p className="text-xl font-bold text-white bg-black/50 inline-block px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
          "Stable averages hide risky distributions."
        </p>
      </div>
    </div>
  );
}

// ==========================================
// CONCEPT B: CHAOS BREAKOUT
// ==========================================
function ChaosBreakout() {
  const [exploded, setExploded] = useState(false);

  // Generate random data points for the "I-Chart" transformation
  // We need 50 points.
  // Initial state: Clustered inside the bar.
  // Final state: Spread out horizontally (Time Series).
  const points = React.useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => {
      // Target (I-Chart)
      // Linear X spread
      const targetX = (i / 50) * 100;
      // Random Y around a mean (middle of chart is 50%)
      // Add some "out of control" points if it's the "Problem" factor
      const isOutlier = i % 10 === 0;
      const targetY = 50 + (Math.random() - 0.5) * (isOutlier ? 80 : 30);

      return { id: i, targetX, targetY };
    });
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto p-8 bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden min-h-[500px] flex flex-col relative">
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setExploded(!exploded)}
          className="px-4 py-2 bg-brand-primary text-white text-sm font-bold rounded-lg hover:bg-opacity-90 transition-all font-mono"
        >
          {exploded ? 'RESET.exe' : 'EXPLODE.exe'}
        </button>
      </div>

      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Concept B: Chaos Breakout</h3>
        <p className="text-neutral-400">Click to shatter the illusion of stability.</p>
      </div>

      {/* CHART AREA */}
      <div className="flex-1 relative flex items-center justify-center">
        {/* Background Grid (appears on explode) */}
        <div
          className={`absolute inset-0 px-12 py-10 transition-opacity duration-1000 ${exploded ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="w-full h-full border-l border-b border-neutral-700 relative">
            {/* UCL / LCL Lines */}
            <div className="absolute top-[10%] left-0 right-0 border-t border-dashed border-red-500/50 flex">
              <span className="text-red-500 text-xs -mt-5 ml-auto">UCL</span>
            </div>
            <div className="absolute bottom-[10%] left-0 right-0 border-t border-dashed border-red-500/50">
              <span className="text-red-500 text-xs mt-1 ml-auto">LCL</span>
            </div>
            <div className="absolute top-[50%] left-0 right-0 border-t border-blue-500/30"></div>
          </div>
        </div>

        {/* The "Bar" Container */}
        <div className="relative w-full h-64 max-w-lg">
          {/* Label changes */}
          <div
            className={`absolute -bottom-8 w-full text-center transition-all duration-500 ${exploded ? 'opacity-0' : 'opacity-100'}`}
          >
            <span className="text-white font-bold text-lg">Factor A (94%)</span>
            <p className="text-xs text-neutral-500">Tap bar to drill down</p>
          </div>

          {/* PARTICLES */}
          {/* 
            Container logic:
            When NOT exploded: All particles are packed into a single central bar shape.
            When EXPLODED: Particles spread to their 'targetX' and 'targetY' within the full width container.
          */}
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => !exploded && setExploded(true)}
          >
            {points.map(pt => {
              // Initial Position (Bar Shape)
              // Center of container is 50%. Bar width approx 15%?
              // Randomize slightly within bar bounds
              const barX = 50 + (Math.random() - 0.5) * 10;
              const barY = 100 - Math.random() * 90; // 0 to 90% height from bottom

              return (
                <div
                  key={pt.id}
                  className={`absolute rounded-full transition-all duration-[1500ms] custom-bezier
                      ${exploded ? 'w-2 h-2 bg-blue-400 box-shadow-glow' : 'w-full h-1 bg-green-500 opacity-80'}
                    `}
                  style={{
                    // Layout shift logic
                    left: exploded ? `${pt.targetX}%` : `${barX}%`,
                    top: exploded
                      ? `${Math.min(95, Math.max(5, pt.targetY))}%`
                      : `${100 - Math.random() * 94}%`, // Fill bar height randomly
                    width: exploded ? '8px' : '60px', // Bar width vs dot size
                    height: exploded ? '8px' : '4px', // Bar slice height vs dot size
                    marginLeft: exploded ? '0' : '-30px', // Center the bar
                    transform: exploded ? 'scale(1)' : 'scale(1.1)',
                    transitionDelay: exploded ? `${Math.random() * 300}ms` : '0ms',
                    // When in bar mode, we stack them to look solid
                    backgroundColor: exploded
                      ? pt.targetY < 10 || pt.targetY > 90
                        ? '#ef4444'
                        : '#60a5fa'
                      : '#22c55e',
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Text Reveal */}
      <div
        className={`absolute bottom-4 left-0 right-0 text-center transition-all duration-700 delay-500 ${exploded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      >
        <p className="text-xl font-bold text-white bg-black/50 inline-block px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
          "The average was 94%. <br /> The reality is chaos."
        </p>
      </div>

      <style>{`
        .custom-bezier {
          transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .box-shadow-glow {
          box-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
        }
      `}</style>
    </div>
  );
}
