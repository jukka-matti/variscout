import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';

interface SpecEditorProps {
    specs: { usl?: number; lsl?: number; target?: number };
    grades: { max: number; label: string; color: string }[];
    onSave: (
        specs: { usl?: number; lsl?: number; target?: number },
        grades: { max: number; label: string; color: string }[]
    ) => void;
    onClose: () => void;
    style?: React.CSSProperties;
}

const SpecEditor = ({ specs, grades, onSave, onClose, style }: SpecEditorProps) => {
    const [localSpecs, setLocalSpecs] = useState<{ usl: string; lsl: string; target: string }>({
        usl: specs.usl?.toString() || '',
        lsl: specs.lsl?.toString() || '',
        target: specs.target?.toString() || ''
    });
    const [localGrades, setLocalGrades] = useState(grades || []);

    const handleSave = () => {
        const parsedSpecs = {
            usl: localSpecs.usl ? parseFloat(localSpecs.usl) : undefined,
            lsl: localSpecs.lsl ? parseFloat(localSpecs.lsl) : undefined,
            target: localSpecs.target ? parseFloat(localSpecs.target) : undefined
        };
        // Sort grades by max value to ensure correct banding
        const sortedGrades = [...localGrades].sort((a, b) => a.max - b.max);

        onSave(parsedSpecs, sortedGrades);
        onClose();
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
        <div
            className="absolute z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl p-4 flex flex-col gap-4 w-80"
            style={style}
        >
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                <h3 className="text-sm font-bold text-white">Edit Specifications</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white">
                    <X size={16} />
                </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* Standard Limits */}
                <div>
                    <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Limits</h4>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="block text-[10px] text-slate-400 mb-1">LSL (Min)</label>
                            <input
                                type="number" step="any"
                                value={localSpecs.lsl}
                                onChange={(e) => setLocalSpecs({ ...localSpecs, lsl: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-slate-400 mb-1">Target</label>
                            <input
                                type="number" step="any"
                                value={localSpecs.target}
                                onChange={(e) => setLocalSpecs({ ...localSpecs, target: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-slate-400 mb-1">USL (Max)</label>
                            <input
                                type="number" step="any"
                                value={localSpecs.usl}
                                onChange={(e) => setLocalSpecs({ ...localSpecs, usl: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Grades */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Grades</h4>
                        <button
                            onClick={addGrade}
                            className="text-[10px] bg-slate-700 hover:bg-slate-600 text-white px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                        >
                            <Plus size={10} /> Add
                        </button>
                    </div>

                    {localGrades.length === 0 ? (
                        <div className="text-center p-3 border border-dashed border-slate-700 rounded text-slate-600 text-[10px] italic">
                            No grades defined.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex gap-2 text-[10px] text-slate-500 px-1">
                                <span className="flex-1">Label</span>
                                <span className="w-12 text-right">Max</span>
                                <span className="w-6"></span>
                                <span className="w-4"></span>
                            </div>
                            {localGrades.map((grade, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={grade.label}
                                        onChange={(e) => updateGrade(idx, 'label', e.target.value)}
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500"
                                        placeholder="Name"
                                    />
                                    <input
                                        type="number" step="any"
                                        value={grade.max}
                                        onChange={(e) => updateGrade(idx, 'max', parseFloat(e.target.value))}
                                        className="w-12 bg-slate-900 border border-slate-700 rounded px-1 py-1 text-xs text-white text-right outline-none focus:border-blue-500"
                                    />
                                    <input
                                        type="color"
                                        value={grade.color}
                                        onChange={(e) => updateGrade(idx, 'color', e.target.value)}
                                        className="w-6 h-6 rounded cursor-pointer border-none bg-transparent p-0"
                                    />
                                    <button
                                        onClick={() => removeGrade(idx)}
                                        className="text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={handleSave}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 rounded flex justify-center items-center gap-2 transition-colors shadow-lg"
            >
                <Save size={14} /> Save Changes
            </button>
        </div>
    );
};

export default SpecEditor;
