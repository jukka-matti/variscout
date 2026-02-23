import React, { useState, useRef } from 'react';
import { BarChart3, Upload, X } from 'lucide-react';

export interface ParetoUploadProps {
  paretoMode: 'derived' | 'separate';
  separateParetoFilename: string | null;
  onParetoFileUpload: (file: File) => Promise<boolean>;
  onClearParetoFile?: () => void;
}

const ParetoUpload: React.FC<ParetoUploadProps> = ({
  paretoMode,
  separateParetoFilename,
  onParetoFileUpload,
  onClearParetoFile,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      await onParetoFileUpload(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onParetoFileUpload(file);
    }
    e.target.value = '';
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-600 text-white">
          <BarChart3 size={14} />
        </div>
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
          Pareto Source
        </h3>
        <span className="text-xs text-slate-500 ml-auto">Optional</span>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        By default, Pareto counts from your selected factors. Upload a separate file for
        pre-aggregated counts (e.g., from ERP/MES).
      </p>

      {paretoMode === 'separate' && separateParetoFilename ? (
        <div className="flex items-center justify-between p-3 rounded-lg bg-orange-600/10 border border-orange-600/30">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-orange-400" />
            <span className="text-sm text-orange-300">{separateParetoFilename}</span>
            <span className="text-xs text-slate-500">(separate data)</span>
          </div>
          <button
            onClick={onClearParetoFile}
            className="text-slate-400 hover:text-red-400 p-1 transition-colors"
            title="Remove Pareto file"
            aria-label="Remove Pareto file"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={e => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
            isDragging
              ? 'bg-orange-600/20 border-orange-500'
              : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-700/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload Pareto data file"
          />
          <Upload size={20} className="text-slate-500 mb-2" />
          <span className="text-xs text-slate-500">
            Drop CSV/Excel with category + count columns
          </span>
          <span className="text-xs text-slate-500 mt-1">Not linked to main data filters</span>
        </div>
      )}
    </div>
  );
};

export default ParetoUpload;
