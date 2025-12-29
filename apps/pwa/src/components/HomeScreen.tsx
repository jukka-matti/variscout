import React from 'react';
import { Upload, FolderOpen, ArrowRight, BarChart2, FileUp } from 'lucide-react';
import { SAMPLES, SampleDataset } from '../data/sampleData';

interface HomeScreenProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenProjects: () => void;
  onLoadSample: (sample: SampleDataset) => void;
}

/**
 * Landing screen shown when no data is loaded
 * Provides options to upload files, import .vrs, or load sample data
 */
const HomeScreen: React.FC<HomeScreenProps> = ({
  onFileUpload,
  onImportFile,
  onOpenProjects,
  onLoadSample,
}) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-500">
      <div className="max-w-2xl w-full text-center space-y-6 sm:space-y-8">
        <div className="space-y-4">
          <div className="inline-flex p-4 bg-slate-800/50 rounded-full border border-slate-700 mb-4">
            <BarChart2 size={48} className="text-blue-500" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Start Your Analysis</h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-lg mx-auto">
            Import your process data to visualize variability, calculate capability, and identify
            root causes instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
          {/* Left column: Upload options */}
          <div className="space-y-3">
            <label className="flex flex-col items-center justify-center p-6 sm:p-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 border-dashed rounded-2xl cursor-pointer transition-all group">
              <Upload
                size={32}
                className="text-slate-500 group-hover:text-blue-400 mb-4 transition-colors"
              />
              <span className="text-sm font-semibold text-white mb-1">Upload Data</span>
              <span className="text-xs text-slate-500">.csv or .xlsx</span>
              <input type="file" accept=".csv,.xlsx" onChange={onFileUpload} className="hidden" />
            </label>

            {/* Import .vrs file */}
            <label className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl cursor-pointer transition-all group">
              <FileUp size={16} className="text-slate-400 group-hover:text-white" />
              <span className="text-sm text-slate-400 group-hover:text-white">
                Import .vrs file
              </span>
              <input type="file" accept=".vrs" onChange={onImportFile} className="hidden" />
            </label>

            {/* Open saved projects */}
            <button
              onClick={onOpenProjects}
              className="w-full flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl transition-all group"
            >
              <FolderOpen size={16} className="text-slate-400 group-hover:text-white" />
              <span className="text-sm text-slate-400 group-hover:text-white">
                Open Saved Projects
              </span>
            </button>
          </div>

          {/* Right column: Sample data */}
          <div className="flex flex-col gap-3">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider text-left pl-1">
              Load Sample Data
            </div>
            {SAMPLES.map(sample => (
              <button
                key={sample.name}
                onClick={() => onLoadSample(sample)}
                className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl text-left transition-all group"
              >
                <div className="p-2 bg-slate-900 rounded-lg text-slate-400 group-hover:text-white transition-colors">
                  <FolderOpen size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{sample.name}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">
                    {sample.description}
                  </div>
                </div>
                <ArrowRight
                  size={14}
                  className="text-slate-600 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
