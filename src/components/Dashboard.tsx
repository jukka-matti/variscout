import React from 'react';
import IChart from './charts/IChart';
import Boxplot from './charts/Boxplot';
import ParetoChart from './charts/ParetoChart';
import StatsPanel from './StatsPanel';
import { useData } from '../context/DataContext';
import { Activity } from 'lucide-react';

const Dashboard = () => {
    const { outcome, factors, setOutcome, rawData, stats, specs, filteredData } = useData();

    // Local state for chart configuration
    // Default to first factor for Boxplot, second (or first) for Pareto
    const [boxplotFactor, setBoxplotFactor] = React.useState<string>('');
    const [paretoFactor, setParetoFactor] = React.useState<string>('');

    // Derive available numeric outcomes
    const availableOutcomes = React.useMemo(() => {
        if (rawData.length === 0) return [];
        const row = rawData[0];
        return Object.keys(row).filter(key => typeof row[key] === 'number');
    }, [rawData]);

    // Initialize/Update defaults when factors change
    React.useEffect(() => {
        if (factors.length > 0) {
            if (!boxplotFactor || !factors.includes(boxplotFactor)) {
                setBoxplotFactor(factors[0]);
            }
            if (!paretoFactor || !factors.includes(paretoFactor)) {
                setParetoFactor(factors[1] || factors[0]);
            }
        }
    }, [factors, boxplotFactor, paretoFactor]);

    if (!outcome) return null;

    return (
        <div id="dashboard-export-container" className="flex flex-col h-full overflow-y-auto bg-slate-900 relative">
            {/* Top Section: I-Chart */}
            <div className="flex-none lg:flex-1 min-h-[400px] bg-slate-800/50 rounded-xl border border-slate-700 m-4 p-4">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                            <Activity className="text-blue-400" />
                            I-Chart:
                        </h2>
                        <select
                            value={outcome}
                            onChange={(e) => setOutcome(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-lg font-bold text-white rounded px-3 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-slate-800 transition-colors"
                        >
                            {availableOutcomes.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                    {stats && (
                        <div className="flex gap-4 text-sm bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                            <span className="text-slate-400">UCL: <span className="text-white font-mono">{stats.ucl.toFixed(2)}</span></span>
                            <span className="text-slate-400">Mean: <span className="text-white font-mono">{stats.mean.toFixed(2)}</span></span>
                            <span className="text-slate-400">LCL: <span className="text-white font-mono">{stats.lcl.toFixed(2)}</span></span>
                        </div>
                    )}
                </div>
                <div className="h-[300px] lg:h-[calc(100%-3rem)] w-full">
                    <IChart />
                </div>
            </div>

            {/* Bottom Section: Boxplot & Pareto + Stats */}
            <div className="flex flex-col lg:flex-row h-auto lg:h-[350px] gap-4 px-4 pb-4">

                {/* Secondary Charts Container */}
                <div className="flex flex-1 flex-col md:flex-row gap-4">
                    <div className="flex-1 bg-slate-800/50 rounded-xl border border-slate-700 p-4 min-w-[300px] flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Distribution</h3>
                            <select
                                value={boxplotFactor}
                                onChange={(e) => setBoxplotFactor(e.target.value)}
                                className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-2 py-1 outline-none focus:border-blue-500"
                            >
                                {factors.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 min-h-0">
                            {boxplotFactor && <Boxplot factor={boxplotFactor} />}
                        </div>
                    </div>

                    <div className="flex-1 bg-slate-800/50 rounded-xl border border-slate-700 p-4 min-w-[300px] flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Pareto</h3>
                            <select
                                value={paretoFactor}
                                onChange={(e) => setParetoFactor(e.target.value)}
                                className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-2 py-1 outline-none focus:border-blue-500"
                            >
                                {factors.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 min-h-0">
                            {paretoFactor && <ParetoChart factor={paretoFactor} />}
                        </div>
                    </div>
                </div>

                {/* Stats Panel */}
                <StatsPanel stats={stats} specs={specs} filteredData={filteredData} outcome={outcome} />
            </div>
        </div>
    );
};

export default Dashboard;
