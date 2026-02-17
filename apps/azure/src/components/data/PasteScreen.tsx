import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight, ClipboardPaste } from 'lucide-react';

interface PasteScreenProps {
  onAnalyze: (text: string) => Promise<void>;
  onCancel: () => void;
  error: string | null;
}

const EXAMPLE_DATA = `Measurement\tShift\tOperator
12.1\tDay\tAlice
11.8\tDay\tBob
12.3\tNight\tAlice
11.5\tNight\tBob
12.0\tDay\tAlice
11.9\tNight\tBob`;

/**
 * Full-screen paste view for importing data from Excel or CSV
 *
 * Paste first → auto-detect columns → confirm mapping → dashboard
 */
const PasteScreen: React.FC<PasteScreenProps> = ({ onAnalyze, onCancel, error }) => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAnalyze = useCallback(async () => {
    if (!text.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      await onAnalyze(text);
    } finally {
      setIsAnalyzing(false);
    }
  }, [text, isAnalyzing, onAnalyze]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAnalyze();
      }
    },
    [handleAnalyze]
  );

  const handleUseExample = useCallback(() => {
    setText(EXAMPLE_DATA);
    textareaRef.current?.focus();
  }, []);

  const hasText = text.trim().length > 0;

  return (
    <div className="h-full flex flex-col items-center justify-start p-4 sm:p-8 overflow-auto">
      <div className="max-w-2xl w-full space-y-5 py-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700">
              <ClipboardPaste size={24} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Paste Your Data</h2>
              <p className="text-xs text-slate-400">
                Columns are detected automatically from headers
              </p>
            </div>
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste rows from Excel, Google Sheets, or a CSV file..."
            autoFocus
            className={`w-full h-64 sm:h-80 p-4 bg-slate-800 border rounded-xl text-sm font-mono text-slate-200 placeholder:text-slate-600 resize-none focus:outline-none focus:ring-2 transition-colors ${
              error
                ? 'border-red-500 focus:ring-red-500/30'
                : 'border-slate-700 focus:ring-blue-500/30 focus:border-blue-500'
            }`}
          />
          {!hasText && (
            <button
              onClick={handleUseExample}
              className="absolute bottom-3 right-3 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Use example data
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <button
            onClick={handleAnalyze}
            disabled={!hasText || isAnalyzing}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-colors"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Data'}
            {!isAnalyzing && <ArrowRight size={16} />}
          </button>
        </div>

        {/* Hint */}
        <p className="text-xs text-slate-500 text-center">
          Tip: {hasText ? 'Press Ctrl+Enter to analyze' : 'Copy rows in Excel, then Ctrl+V here'}
        </p>
      </div>
    </div>
  );
};

export default PasteScreen;
