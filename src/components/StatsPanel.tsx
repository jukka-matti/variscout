import React, { useState, useMemo } from 'react';
import { AlertCircle, CheckCircle2, TrendingUp, BarChart3, Settings2, Plus } from 'lucide-react';
import { StatsResult } from '../logic/stats';
import { useData } from '../context/DataContext';
import CapabilityHistogram from './charts/CapabilityHistogram';
import SpecEditor from './SpecEditor';

interface StatsPanelProps {
    stats: StatsResult | null;
    specs: { usl?: number; lsl?: number; target?: number };
    filteredData?: any[];
    outcome?: string | null;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats, specs, filteredData = [], outcome }) => {
    const { displayOptions, setSpecs, setGrades, grades } = useData();
    const [activeTab, setActiveTab] = useState<'summary' | 'histogram'>('summary');
    const [isEditingSpecs, setIsEditingSpecs] = useState(false);

    // Extract numeric values for histogram
    const histogramData = useMemo(() => {
        if (!outcome || filteredData.length === 0) return [];
        return filteredData
            .map((d: any) => Number(d[outcome]))
            .filter((v: number) => !isNaN(v));
    }, [filteredData, outcome]);

    const handleSaveSpecs = (
        newSpecs: { usl?: number; lsl?: number; target?: number },
        newGrades: { max: number; label: string; color: string }[]
    ) => {
        setSpecs(newSpecs);
        setGrades(newGrades);
    };

    return (
        <div className="w-full lg:w-80 bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col gap-4 shadow-lg relative">
            {/* Header / Tab buttons */}
            <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'summary'
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-300'
                            }`}
                    >
                        Summary
                    </button>
                    <button
                        onClick={() => setActiveTab('histogram')}
                        className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'histogram'
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-300'
                            }`}
                    >
                        Histogram
                    </button>
                </div>

                {/* Edit Specs Trigger */}
                <button
                    onClick={() => setIsEditingSpecs(!isEditingSpecs)}
                    className={`p-2 rounded-lg transition-colors border border-transparent ${isEditingSpecs
                        ? 'bg-blue-600/10 text-blue-400 border-blue-600/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                    title="Edit Specifications"
                >
                    <Settings2 size={16} />
                </button>
            </div>

            {/* Spec Editor Popover */}
            {isEditingSpecs && (
                <SpecEditor
                    specs={specs}
                    grades={grades}
                    onSave={handleSaveSpecs}
                    onClose={() => setIsEditingSpecs(false)}
                    style={{ top: '70px', right: '0px', width: '100%', maxWidth: '320px', zIndex: 20 }}
                />
            )}

            {activeTab === 'summary' ? (
                /* Summary Tab Content */
                <>
                    <div className="space-y-4 flex-1">
                        {/* Grade Summary Mode (Coffee/Textiles) */}
                        {stats?.gradeCounts && stats.gradeCounts.length > 0 ? (
                            <div className="space-y-2">
                                {/* Header Row */}
                                <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-2 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                    <span>Grade</span>
                                    <span>Count</span>
                                    <span>%</span>
                                </div>
                                {stats.gradeCounts.map((grade, i) => (
                                    <div key={i} className="grid grid-cols-[1fr_40px_45px] gap-4 items-center p-2 rounded hover:bg-slate-700/30 transition-colors">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: grade.color }}></div>
                                            <span className="text-slate-300 text-sm font-medium truncate" title={grade.label}>{grade.label}</span>
                                        </div>
                                        <div className="text-right text-slate-500 text-xs font-mono">{grade.count}</div>
                                        <div className="text-right text-white font-bold font-mono">{grade.percentage.toFixed(1)}%</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Standard Cp/Cpk Mode */
                            <>
                                <div className="flex items-center justify-between p-2 rounded hover:bg-slate-700/30 transition-colors">
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <CheckCircle2 size={18} className="text-green-500" />
                                        <span>Pass Rate</span>
                                    </div>
                                    <span className="text-xl font-bold text-white">{(100 - (stats?.outOfSpecPercentage || 0)).toFixed(1)}%</span>
                                </div>

                                {displayOptions.showCp && stats?.cp !== undefined && (
                                    <div className="flex items-center justify-between p-2 rounded hover:bg-slate-700/30 transition-colors">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <BarChart3 size={18} className="text-purple-400" />
                                            <span>Cp</span>
                                        </div>
                                        <span className={`text-xl font-bold ${stats.cp < 1.33 ? 'text-yellow-500' : 'text-green-500'}`}>
                                            {stats.cp.toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                {displayOptions.showCpk && (
                                    <div className="flex items-center justify-between p-2 rounded hover:bg-slate-700/30 transition-colors">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <TrendingUp size={18} className="text-blue-400" />
                                            <span>Cpk</span>
                                        </div>
                                        <span className={`text-xl font-bold ${stats?.cpk && stats.cpk < 1.33 ? 'text-yellow-500' : 'text-green-500'}`}>
                                            {stats?.cpk?.toFixed(2) || 'N/A'}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between border-t border-slate-700 pt-4 p-2">
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <AlertCircle size={18} className="text-red-400" />
                                        <span>Rejected</span>
                                    </div>
                                    <span className="text-xl font-bold text-red-400">{stats?.outOfSpecPercentage.toFixed(1)}%</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div
                        className="mt-auto p-4 bg-slate-900/80 rounded-lg text-xs text-slate-500 border border-slate-800 cursor-pointer hover:border-slate-600 transition-colors group"
                        onClick={() => setIsEditingSpecs(true)}
                    >
                        {specs.usl && <div className="flex justify-between"><span>USL:</span> <span className="font-mono text-slate-400 group-hover:text-white">{specs.usl}</span></div>}
                        {specs.lsl && <div className="flex justify-between"><span>LSL:</span> <span className="font-mono text-slate-400 group-hover:text-white">{specs.lsl}</span></div>}
                        {!specs.usl && !specs.lsl && (
                            <div className="italic text-center text-slate-600 group-hover:text-blue-400 flex items-center justify-center gap-2">
                                <Plus size={14} /> Add Specs
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* Histogram Tab Content */
                <div className="flex-1 min-h-[200px]">
                    {histogramData.length > 0 && stats ? (
                        <CapabilityHistogram
                            data={histogramData}
                            specs={specs}
                            mean={stats.mean}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500 italic text-sm">
                            No data available for histogram
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StatsPanel;
