import React from 'react';
import IChart from './charts/IChart';
import Boxplot from './charts/Boxplot';
import ParetoChart from './charts/ParetoChart';
import StatsPanel from './StatsPanel';
import { useData } from '../context/DataContext';
import { Activity } from 'lucide-react';

const Dashboard = () => {
    const { outcome, factors, stats, specs, filteredData } = useData();

    if (!outcome) return null;

    return (
        <div id="dashboard-export-container" className="flex flex-col h-full overflow-y-auto bg-slate-900 relative">
            {/* Watermark - Visible but subtle, effectively serves as brand marking */}
            <div className="absolute top-2 right-4 opacity-50 pointer-events-none z-0 flex items-center gap-2">
                <div className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">
                    International Trade Centre
                </div>
                {/* Simple ITC-style geometric logo using SVG */}
                <svg width="20" height="20" viewBox="0 0 100 100">
                    <path d="M50 0 L100 25 L100 75 L50 100 L0 75 L0 25 Z" fill="#007FBD" />
                    <path d="M50 20 L80 35 L80 65 L50 80 L20 65 L20 35 Z" fill="#FF8213" />
                </svg>
            </div>
            {/* Top Section: I-Chart */}
            <div className="flex-none lg:flex-1 min-h-[400px] bg-slate-800/50 rounded-xl border border-slate-700 m-4 p-4">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        <Activity className="text-blue-400" />
                        I-Chart: {outcome}
                    </h2>
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
                    <div className="flex-1 bg-slate-800/50 rounded-xl border border-slate-700 p-4 min-w-[300px]">
                        <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Distribution: {factors[0]}</h3>
                        <div className="h-48 lg:h-[calc(100%-1.5rem)]">
                            {factors[0] && <Boxplot factor={factors[0]} />}
                        </div>
                    </div>

                    <div className="flex-1 bg-slate-800/50 rounded-xl border border-slate-700 p-4 min-w-[300px]">
                        <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Pareto: {factors[1] || factors[0]}</h3>
                        <div className="h-48 lg:h-[calc(100%-1.5rem)]">
                            {(factors[1] || factors[0]) && <ParetoChart factor={factors[1] || factors[0]} />}
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
