import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useData } from '../context/DataContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
    const {
        rawData,
        outcome,
        factors,
        specs,
        grades,
        axisSettings,
        displayOptions,
        setOutcome,
        setFactors,
        setSpecs,
        setGrades,
        setAxisSettings,
        setDisplayOptions
    } = useData();

    // Local state for form inputs
    const [localOutcome, setLocalOutcome] = useState<string>('');
    const [localFactors, setLocalFactors] = useState<string[]>([]);
    const [localSpecs, setLocalSpecs] = useState<{ usl?: string, lsl?: string, target?: string }>({});
    const [localGrades, setLocalGrades] = useState<{ max: number; label: string; color: string }[]>([]);
    const [localAxis, setLocalAxis] = useState<{ min: string, max: string }>({ min: '', max: '' });
    const [localDisplayOptions, setLocalDisplayOptions] = useState<{ showCp: boolean, showCpk: boolean }>({ showCp: false, showCpk: true });

    // Populate local state when modal opens
    useEffect(() => {
        if (isOpen) {
            setLocalOutcome(outcome || '');
            setLocalFactors(factors || []);
            setLocalSpecs({
                usl: specs.usl?.toString() || '',
                lsl: specs.lsl?.toString() || '',
                target: specs.target?.toString() || ''
            });
            setLocalGrades(grades || []);
            setLocalAxis({
                min: axisSettings.min !== undefined ? axisSettings.min.toString() : '',
                max: axisSettings.max !== undefined ? axisSettings.max.toString() : ''
            });
            setLocalDisplayOptions(displayOptions);
        }
    }, [isOpen, outcome, factors, specs, grades, axisSettings, displayOptions]);

    if (!isOpen) return null;

    const availableColumns = rawData.length > 0 ? Object.keys(rawData[0]) : [];

    const handleSave = () => {
        setOutcome(localOutcome);
        setFactors(localFactors);
        setSpecs({
            usl: localSpecs.usl ? parseFloat(localSpecs.usl) : undefined,
            lsl: localSpecs.lsl ? parseFloat(localSpecs.lsl) : undefined,
            target: localSpecs.target ? parseFloat(localSpecs.target) : undefined
        });
        setGrades(localGrades.sort((a, b) => a.max - b.max));
        setAxisSettings({
            min: localAxis.min ? parseFloat(localAxis.min) : undefined,
            max: localAxis.max ? parseFloat(localAxis.max) : undefined
        });
        setDisplayOptions(localDisplayOptions);
        onClose();
    };

    const toggleFactor = (col: string) => {
        if (localFactors.includes(col)) {
            setLocalFactors(localFactors.filter(f => f !== col));
        } else {
            if (localFactors.length < 3) {
                setLocalFactors([...localFactors, col]);
            }
        }
    };

    const addGrade = () => {
        setLocalGrades([...localGrades, { max: 0, label: 'New Grade', color: '#cccccc' }]);
    };

    const updateGrade = (index: number, field: keyof typeof localGrades[0], value: any) => {
        const newGrades = [...localGrades];
        newGrades[index] = { ...newGrades[index], [field]: value };
        setLocalGrades(newGrades);
    };

    const removeGrade = (index: number) => {
        setLocalGrades(localGrades.filter((_, i) => i !== index));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">Analysis Settings</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Section 1: Column Mapping */}
                    <div>
                        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">1. Data Mapping</h3>

                        <div className="mb-4">
                            <label className="block text-sm text-slate-400 mb-1">Outcome Column (Numeric)</label>
                            <select
                                value={localOutcome}
                                onChange={(e) => setLocalOutcome(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="" disabled>Select outcome...</option>
                                {availableColumns.map(col => (
                                    <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Factor Columns (Categorical) - Max 3</label>
                            <div className="flex flex-wrap gap-2">
                                {availableColumns.map(col => (
                                    <button
                                        key={col}
                                        onClick={() => toggleFactor(col)}
                                        disabled={!localFactors.includes(col) && localFactors.length >= 3}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${localFactors.includes(col)
                                            ? 'bg-blue-600 border-blue-500 text-white'
                                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                                            }`}
                                    >
                                        {col}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Specifications */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">2. Specifications</h3>

                            {/* Standard Limits */}
                            <div className="mb-6">
                                <h4 className="text-xs font-semibold text-slate-300 mb-2">Standard Limits (for Cp/Cpk)</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">LSL</label>
                                        <input
                                            type="number" step="any"
                                            value={localSpecs.lsl} onChange={(e) => setLocalSpecs({ ...localSpecs, lsl: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm outline-none focus:border-blue-500"
                                            placeholder="Min"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Target</label>
                                        <input
                                            type="number" step="any"
                                            value={localSpecs.target} onChange={(e) => setLocalSpecs({ ...localSpecs, target: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm outline-none focus:border-blue-500"
                                            placeholder="Goal"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">USL</label>
                                        <input
                                            type="number" step="any"
                                            value={localSpecs.usl} onChange={(e) => setLocalSpecs({ ...localSpecs, usl: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm outline-none focus:border-blue-500"
                                            placeholder="Max"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Multi-Tier Grading */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xs font-semibold text-slate-300">Multi-Tier Grading (e.g., Coffee/Textiles)</h4>
                                    <button onClick={addGrade} className="text-xs text-blue-400 hover:text-blue-300 font-medium">+ Add Tier</button>
                                </div>
                                <p className="text-[10px] text-slate-500 mb-3">Define upper limits for each grade (lower is better). Example: Specialty &lt; 5.</p>

                                <div className="space-y-2">
                                    {localGrades.map((grade, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                value={grade.label}
                                                onChange={(e) => updateGrade(idx, 'label', e.target.value)}
                                                className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                                placeholder="Grade Name"
                                            />
                                            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded px-2 py-1">
                                                <span className="text-xs text-slate-500">≤</span>
                                                <input
                                                    type="number"
                                                    value={grade.max}
                                                    onChange={(e) => updateGrade(idx, 'max', parseFloat(e.target.value))}
                                                    className="w-16 bg-transparent border-none text-xs text-white outline-none text-right"
                                                    placeholder="Max"
                                                />
                                            </div>
                                            <input
                                                type="color"
                                                value={grade.color}
                                                onChange={(e) => updateGrade(idx, 'color', e.target.value)}
                                                className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                                            />
                                            <button onClick={() => removeGrade(idx)} className="text-slate-600 hover:text-red-400">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {localGrades.length === 0 && (
                                        <div className="text-center p-3 border border-dashed border-slate-700 rounded-lg text-slate-600 text-xs italic">
                                            No grades defined. Use USL/LSL for standard pass/fail.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section 3: Visualization Settings */}
                            <div>
                                <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4 border-t border-slate-700 pt-6">3. Visualization</h3>

                                {/* Display Options */}
                                <div className="mb-6">
                                    <h4 className="text-xs font-semibold text-slate-300 mb-2">Capability Metrics Display</h4>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={localDisplayOptions.showCp}
                                                onChange={(e) => setLocalDisplayOptions({ ...localDisplayOptions, showCp: e.target.checked })}
                                                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
                                            />
                                            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                                                Show Cp <span className="text-slate-500 text-xs">(requires both USL and LSL)</span>
                                            </span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={localDisplayOptions.showCpk}
                                                onChange={(e) => setLocalDisplayOptions({ ...localDisplayOptions, showCpk: e.target.checked })}
                                                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
                                            />
                                            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                                                Show Cpk
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <h4 className="text-xs font-semibold text-slate-300 mb-2">Y-Axis Scaling (Manual Override)</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Min Y</label>
                                            <input
                                                type="number" step="any"
                                                value={localAxis.min}
                                                onChange={(e) => setLocalAxis({ ...localAxis, min: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm outline-none focus:border-blue-500"
                                                placeholder="Auto"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Max Y</label>
                                            <input
                                                type="number" step="any"
                                                value={localAxis.max}
                                                onChange={(e) => setLocalAxis({ ...localAxis, max: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm outline-none focus:border-blue-500"
                                                placeholder="Auto"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2">Leave blank for automatic scaling. Both charts will use these limits.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-400 hover:text-white dark:hover:bg-slate-700 rounded-lg transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-bold shadow-lg shadow-blue-900/20"
                    >
                        <Save size={18} />
                        Apply Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
