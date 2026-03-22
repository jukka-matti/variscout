import React from 'react';
import { Upload, FileText, PenLine, ClipboardPaste, Database, RefreshCw } from 'lucide-react';
import { hasTeamFeatures } from '@variscout/core';
import { SAMPLES } from '@variscout/data';
import { FileBrowseButton, type FilePickerResult } from '../FileBrowseButton';
import type { UseEditorDataFlowReturn } from '../../hooks/useEditorDataFlow';

type LoadErrorCode = 'not-found' | 'forbidden' | 'plan-mismatch' | 'offline' | 'auth' | 'unknown';

interface LoadError {
  code: LoadErrorCode;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface EditorEmptyStateProps {
  dataFlow: UseEditorDataFlowReturn;
  loadError: LoadError | null;
  onSharePointFileImport: (items: FilePickerResult[]) => void;
}

export const EditorEmptyState: React.FC<EditorEmptyStateProps> = ({
  dataFlow,
  loadError,
  onSharePointFileImport,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-start p-8 overflow-y-auto relative">
      {/* Loading overlay for project load or file parse */}
      {(dataFlow.isLoadingProject || dataFlow.isParsingFile) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/60">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={32} className="text-blue-400 animate-spin" />
            <span className="text-sm text-content">
              {dataFlow.isLoadingProject ? 'Loading project...' : 'Parsing file...'}
            </span>
          </div>
        </div>
      )}
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-surface-secondary rounded-full flex items-center justify-center">
          <FileText size={32} className="text-content-secondary" />
        </div>
        <h3 className="text-xl font-semibold text-content mb-2">Start Your Analysis</h3>
        <p className="text-content-secondary mb-6">
          Upload your data, paste from Excel, enter manually, or try a sample dataset.
        </p>

        <input
          ref={dataFlow.fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={dataFlow.handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {hasTeamFeatures() ? (
            <>
              <FileBrowseButton
                mode="files"
                filters={['.csv', '.xlsx', '.xls']}
                onPick={onSharePointFileImport}
                onLocalFile={file => dataFlow.handleFile(file)}
                label="Open from SharePoint"
                localLabel="Browse this device"
                showLocalFallback={true}
                size="md"
              />
            </>
          ) : (
            <button
              onClick={dataFlow.triggerFileUpload}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Upload size={20} />
              Upload File
            </button>
          )}

          <button
            onClick={() => dataFlow.startPaste()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-tertiary text-content rounded-lg hover:bg-surface-tertiary/80 transition-colors font-medium"
          >
            <ClipboardPaste size={20} />
            Paste Data
          </button>

          <button
            onClick={() => dataFlow.startManualEntry()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-tertiary text-content rounded-lg hover:bg-surface-tertiary/80 transition-colors font-medium"
          >
            <PenLine size={20} />
            Manual Entry
          </button>
        </div>

        {loadError && (
          <div className="mx-4 mt-4 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-200">
            <p className="text-sm">{loadError.message}</p>
            {loadError.action && (
              <button
                onClick={loadError.action.onClick}
                className="mt-2 text-xs font-medium underline underline-offset-2 hover:no-underline"
              >
                {loadError.action.label}
              </button>
            )}
          </div>
        )}
        <p className="text-xs text-content-muted mb-6">Supports CSV, XLSX, and XLS files</p>

        {/* Sample Datasets */}
        <div className="text-left">
          <h4 className="text-sm font-medium text-content mb-3 flex items-center gap-2">
            <Database size={14} />
            Sample Datasets
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SAMPLES.filter(s => s.featured || s.category === 'cases')
              .slice(0, 8)
              .map(sample => (
                <button
                  key={sample.urlKey}
                  data-testid={`sample-${sample.urlKey}`}
                  onClick={() => dataFlow.handleLoadSample(sample)}
                  className="text-left p-3 bg-surface-secondary hover:bg-surface-tertiary border border-edge hover:border-blue-500/50 rounded-lg transition-all group"
                >
                  <span className="text-sm font-medium text-content group-hover:text-blue-300 block truncate">
                    {sample.name}
                  </span>
                  <span className="text-xs text-content-muted line-clamp-1">
                    {sample.description}
                  </span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
