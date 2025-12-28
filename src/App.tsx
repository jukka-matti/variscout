import React, { useCallback, useState, useEffect } from 'react';
import { Activity, Upload, Settings, Download, Save, FolderOpen, RefreshCw, ArrowRight, BarChart2, HardDrive, FileUp, FileSpreadsheet, Maximize2, Minimize2, Table } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useData } from './context/DataContext';
import { downloadCSV } from './lib/export';
import SettingsModal from './components/SettingsModal';
import SavedProjectsModal from './components/SavedProjectsModal';
import DataTableModal from './components/DataTableModal';
import Dashboard from './components/Dashboard';
import { SAMPLES } from './data/sampleData';
import { useDataIngestion } from './hooks/useDataIngestion';

function App() {
    const {
        rawData,
        filteredData,
        outcome,
        specs,
        currentProjectName,
        hasUnsavedChanges,
        saveProject,
        exportProject,
        importProject,
    } = useData();
    const { handleFileUpload, loadSample, clearData } = useDataIngestion();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isProjectsOpen, setIsProjectsOpen] = useState(false);
    const [isDataTableOpen, setIsDataTableOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveInput, setShowSaveInput] = useState(false);
    const [saveInputName, setSaveInputName] = useState('');
    const [isLargeMode, setIsLargeMode] = useState(() => {
        return localStorage.getItem('variscout-large-mode') === 'true';
    });

    // Toggle large mode class on root element
    useEffect(() => {
        const root = document.getElementById('root');
        if (root) {
            if (isLargeMode) {
                root.classList.add('large-mode');
            } else {
                root.classList.remove('large-mode');
            }
        }
        localStorage.setItem('variscout-large-mode', String(isLargeMode));
    }, [isLargeMode]);

    const handleExport = useCallback(async () => {
        const node = document.getElementById('dashboard-export-container');
        if (!node) return;

        try {
            const dataUrl = await toPng(node, {
                cacheBust: true,
                backgroundColor: '#0f172a'
            });
            const link = document.createElement('a');
            link.download = `variscout-analysis-${new Date().toISOString().split('T')[0]}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Export failed', err);
        }
    }, []);

    const handleExportCSV = useCallback(() => {
        const filename = currentProjectName
            ? `${currentProjectName.replace(/[^a-z0-9]/gi, '_')}.csv`
            : `variscout-data-${new Date().toISOString().split('T')[0]}.csv`;

        downloadCSV(filteredData, outcome, specs, { filename });
    }, [filteredData, outcome, specs, currentProjectName]);

    const handleSaveToBrowser = useCallback(async () => {
        if (currentProjectName) {
            // Quick save with existing name
            setIsSaving(true);
            try {
                await saveProject(currentProjectName);
            } finally {
                setIsSaving(false);
            }
        } else {
            // Show input for new project name
            setShowSaveInput(true);
            setSaveInputName(`Analysis ${new Date().toLocaleDateString()}`);
        }
    }, [currentProjectName, saveProject]);

    const handleSaveWithName = useCallback(async () => {
        if (!saveInputName.trim()) return;
        setIsSaving(true);
        try {
            await saveProject(saveInputName.trim());
            setShowSaveInput(false);
            setSaveInputName('');
        } finally {
            setIsSaving(false);
        }
    }, [saveInputName, saveProject]);

    const handleDownloadFile = useCallback(() => {
        const filename = currentProjectName || `variscout-${new Date().toISOString().split('T')[0]}`;
        exportProject(filename);
    }, [currentProjectName, exportProject]);

    const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.name.endsWith('.vrs')) {
            try {
                await importProject(file);
            } catch (err) {
                console.error('Import failed', err);
                alert('Failed to import file. Make sure it\'s a valid .vrs file.');
            }
        }
        e.target.value = '';
    }, [importProject]);

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-slate-200 font-sans selection:bg-blue-500/30">
            {/* Header */}
            <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 bg-slate-900/50 backdrop-blur-md z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
                        <Activity className="text-white" size={18} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                        <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            VariScout <span className="font-light text-slate-500">Lite</span>
                        </h1>
                        {currentProjectName && (
                            <span className="text-[10px] sm:text-xs text-slate-500 truncate max-w-[120px] sm:max-w-none">
                                {currentProjectName}{hasUnsavedChanges && ' *'}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    {rawData.length > 0 && (
                        <>
                            {/* Save to browser button */}
                            <button
                                onClick={handleSaveToBrowser}
                                disabled={isSaving}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                                title="Save to Browser"
                            >
                                <HardDrive size={18} />
                            </button>
                            {/* Open saved projects */}
                            <button
                                onClick={() => setIsProjectsOpen(true)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                title="Open Saved Projects"
                            >
                                <FolderOpen size={18} />
                            </button>
                            {/* View Data Table */}
                            <button
                                onClick={() => setIsDataTableOpen(true)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                title={`View Data (${rawData.length} rows)`}
                            >
                                <Table size={18} />
                            </button>
                            <div className="hidden sm:block h-4 w-px bg-slate-800 mx-1"></div>
                            {/* Download as file */}
                            <button
                                onClick={handleDownloadFile}
                                className="hidden sm:flex p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                title="Download as File"
                            >
                                <Save size={18} />
                            </button>
                            {/* Export as CSV */}
                            <button
                                onClick={handleExportCSV}
                                className="hidden sm:flex p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                title="Export as CSV"
                            >
                                <FileSpreadsheet size={18} />
                            </button>
                            {/* Export image */}
                            <button
                                onClick={handleExport}
                                className="hidden sm:flex p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                title="Export as Image"
                            >
                                <Download size={18} />
                            </button>
                            <div className="hidden sm:block h-4 w-px bg-slate-800 mx-1"></div>
                            {/* Large Mode toggle */}
                            <button
                                onClick={() => setIsLargeMode(!isLargeMode)}
                                className={`p-2 rounded-lg transition-colors ${
                                    isLargeMode
                                        ? 'text-blue-400 bg-blue-400/10 hover:bg-blue-400/20'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                                title={isLargeMode ? "Exit Large Mode" : "Large Mode (for presentations)"}
                            >
                                {isLargeMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                            </button>
                            {/* Settings */}
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                title="Settings"
                            >
                                <Settings size={18} />
                            </button>
                            {/* Reset */}
                            <button
                                onClick={clearData}
                                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            >
                                <RefreshCw size={14} />
                                <span>Reset</span>
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Save name input modal */}
            {showSaveInput && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-4 w-full max-w-sm">
                        <h3 className="text-sm font-semibold text-white mb-3">Save Project</h3>
                        <input
                            type="text"
                            value={saveInputName}
                            onChange={(e) => setSaveInputName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveWithName();
                                if (e.key === 'Escape') setShowSaveInput(false);
                            }}
                            placeholder="Project name"
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 mb-3"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowSaveInput(false)}
                                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveWithName}
                                disabled={!saveInputName.trim() || isSaving}
                                className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-hidden relative">
                {rawData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-500">
                        <div className="max-w-2xl w-full text-center space-y-6 sm:space-y-8">

                            <div className="space-y-4">
                                <div className="inline-flex p-4 bg-slate-800/50 rounded-full border border-slate-700 mb-4">
                                    <BarChart2 size={48} className="text-blue-500" />
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-white">Start Your Analysis</h2>
                                <p className="text-slate-400 text-base sm:text-lg max-w-lg mx-auto">
                                    Import your process data to visualize variability, calculate capability, and identify root causes instantly.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
                                <div className="space-y-3">
                                    <label className="flex flex-col items-center justify-center p-6 sm:p-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 border-dashed rounded-2xl cursor-pointer transition-all group">
                                        <Upload size={32} className="text-slate-500 group-hover:text-blue-400 mb-4 transition-colors" />
                                        <span className="text-sm font-semibold text-white mb-1">Upload Data</span>
                                        <span className="text-xs text-slate-500">.csv or .xlsx</span>
                                        <input type="file" accept=".csv,.xlsx" onChange={handleFileUpload} className="hidden" />
                                    </label>
                                    {/* Import .vrs file */}
                                    <label className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl cursor-pointer transition-all group">
                                        <FileUp size={16} className="text-slate-400 group-hover:text-white" />
                                        <span className="text-sm text-slate-400 group-hover:text-white">Import .vrs file</span>
                                        <input type="file" accept=".vrs" onChange={handleImportFile} className="hidden" />
                                    </label>
                                    {/* Open saved projects */}
                                    <button
                                        onClick={() => setIsProjectsOpen(true)}
                                        className="w-full flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl transition-all group"
                                    >
                                        <FolderOpen size={16} className="text-slate-400 group-hover:text-white" />
                                        <span className="text-sm text-slate-400 group-hover:text-white">Open Saved Projects</span>
                                    </button>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider text-left pl-1">Load Sample Data</div>
                                    {SAMPLES.map((sample) => (
                                        <button
                                            key={sample.name}
                                            onClick={() => loadSample(sample)}
                                            className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl text-left transition-all group"
                                        >
                                            <div className="p-2 bg-slate-900 rounded-lg text-slate-400 group-hover:text-white transition-colors">
                                                <FolderOpen size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-white">{sample.name}</div>
                                                <div className="text-[10px] text-slate-500 line-clamp-1">{sample.description}</div>
                                            </div>
                                            <ArrowRight size={14} className="text-slate-600 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Dashboard />
                )}
            </main>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <SavedProjectsModal isOpen={isProjectsOpen} onClose={() => setIsProjectsOpen(false)} />
            <DataTableModal isOpen={isDataTableOpen} onClose={() => setIsDataTableOpen(false)} />

            {/* Footer */}
            <footer className="h-8 border-t border-slate-800 bg-slate-900 flex items-center px-4 sm:px-6 text-[10px] text-slate-500 justify-between">
                <div className="hidden sm:block">100% Browser-Based | Your Data Stays On Your Device</div>
                <div className="sm:hidden">Offline-First PWA</div>
                <div className="flex gap-2 sm:gap-4">
                    <span>Rows: {filteredData.length}/{rawData.length}</span>
                    <span className="hidden sm:inline">v1.0.0</span>
                </div>
            </footer>
        </div>
    );
}

export default App;
