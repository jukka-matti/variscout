import React, { useCallback, useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { useData } from './context/DataContext';
import { downloadCSV } from './lib/export';
import SettingsModal from './components/SettingsModal';
import SavedProjectsModal from './components/SavedProjectsModal';
import DataTableModal from './components/DataTableModal';
import ColumnMapping from './components/ColumnMapping';
import Dashboard from './components/Dashboard';
import HomeScreen from './components/HomeScreen';
import AppHeader from './components/AppHeader';
import AppFooter from './components/AppFooter';
import FilterBar from './components/FilterBar';
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
    setOutcome,
    setFactors,
    factors,
  } = useData();
  const { handleFileUpload: ingestFile, loadSample, clearData } = useDataIngestion();
  const [isMapping, setIsMapping] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isDataTableOpen, setIsDataTableOpen] = useState(false);
  const [highlightRowIndex, setHighlightRowIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveInputName, setSaveInputName] = useState('');
  const [isLargeMode, setIsLargeMode] = useState(() => {
    return localStorage.getItem('variscout-large-mode') === 'true';
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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
        backgroundColor: '#0f172a',
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

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Escape: close any open modal
      if (e.key === 'Escape') {
        if (showSaveInput) setShowSaveInput(false);
        else if (showResetConfirm) setShowResetConfirm(false);
        else if (isSettingsOpen) setIsSettingsOpen(false);
        else if (isProjectsOpen) setIsProjectsOpen(false);
        else if (isDataTableOpen) setIsDataTableOpen(false);
        return;
      }

      // Only trigger shortcuts when not in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // ⌘/Ctrl+S: Save project
      if (isMod && e.key === 's') {
        e.preventDefault();
        if (rawData.length > 0 && !isMapping) {
          handleSaveToBrowser();
        }
      }

      // ⌘/Ctrl+O: Open saved projects
      if (isMod && e.key === 'o') {
        e.preventDefault();
        setIsProjectsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showSaveInput,
    showResetConfirm,
    isSettingsOpen,
    isProjectsOpen,
    isDataTableOpen,
    rawData.length,
    isMapping,
    handleSaveToBrowser,
  ]);

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

  const handleImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.name.endsWith('.vrs')) {
        try {
          await importProject(file);
        } catch (err) {
          console.error('Import failed', err);
          alert("Failed to import file. Make sure it's a valid .vrs file.");
        }
      }
      e.target.value = '';
    },
    [importProject]
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const success = await ingestFile(e);
    if (success) {
      setIsMapping(true);
    }
    // Input reset is handled in the UI element by clearing ref or value if needed,
    // but here we just need to ensuring mapping state
    e.target.value = '';
  };

  const handleMappingConfirm = (newOutcome: string, newFactors: string[]) => {
    setOutcome(newOutcome);
    setFactors(newFactors);
    setIsMapping(false);
  };

  const handleMappingCancel = () => {
    clearData();
    setIsMapping(false);
  };

  // Open data table with a specific row highlighted (from chart point click)
  const openDataTableAtRow = useCallback((index: number) => {
    setHighlightRowIndex(index);
    setIsDataTableOpen(true);
  }, []);

  // Close data table and clear highlight
  const handleCloseDataTable = useCallback(() => {
    setIsDataTableOpen(false);
    setHighlightRowIndex(null);
  }, []);

  // Reset confirmation handlers
  const handleResetRequest = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const handleResetConfirm = useCallback(() => {
    clearData();
    setShowResetConfirm(false);
  }, [clearData]);

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-200 font-sans selection:bg-blue-500/30">
      <AppHeader
        currentProjectName={currentProjectName}
        hasUnsavedChanges={hasUnsavedChanges}
        hasData={rawData.length > 0}
        isLargeMode={isLargeMode}
        isSaving={isSaving}
        onSaveToBrowser={handleSaveToBrowser}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onOpenDataTable={() => {
          setHighlightRowIndex(null); // No highlight when opened from header
          setIsDataTableOpen(true);
        }}
        onDownloadFile={handleDownloadFile}
        onExportCSV={handleExportCSV}
        onExportImage={handleExport}
        onToggleLargeMode={() => setIsLargeMode(!isLargeMode)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReset={handleResetRequest}
      />

      {/* Save name input modal */}
      {showSaveInput && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-4 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-white mb-3">Save Project</h3>
            <input
              type="text"
              value={saveInputName}
              onChange={e => setSaveInputName(e.target.value)}
              onKeyDown={e => {
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

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-4 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-white mb-2">Reset Analysis?</h3>
            <p className="text-xs text-slate-400 mb-4">
              {currentProjectName ? (
                <>
                  All unsaved changes to{' '}
                  <strong className="text-slate-300">{currentProjectName}</strong> will be lost.
                </>
              ) : (
                <>All data will be cleared. This cannot be undone.</>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                className="px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Context Bar - shows active filters when Dashboard is visible */}
      {rawData.length > 0 && !isMapping && <FilterBar />}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {rawData.length === 0 ? (
          <HomeScreen
            onFileUpload={handleFileUpload}
            onImportFile={handleImportFile}
            onOpenProjects={() => setIsProjectsOpen(true)}
            onLoadSample={loadSample}
          />
        ) : isMapping ? (
          <ColumnMapping
            availableColumns={Object.keys(rawData[0])}
            initialOutcome={outcome}
            initialFactors={factors}
            onConfirm={handleMappingConfirm}
            onCancel={handleMappingCancel}
          />
        ) : (
          <Dashboard onPointClick={openDataTableAtRow} />
        )}
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <SavedProjectsModal isOpen={isProjectsOpen} onClose={() => setIsProjectsOpen(false)} />
      <DataTableModal
        isOpen={isDataTableOpen}
        onClose={handleCloseDataTable}
        highlightRowIndex={highlightRowIndex ?? undefined}
      />

      <AppFooter filteredCount={filteredData.length} totalCount={rawData.length} />
    </div>
  );
}

export default App;
