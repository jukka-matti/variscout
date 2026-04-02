import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileJson, Copy, Sparkles, Check, Loader2 } from 'lucide-react';
import type { Finding, Question, ProcessContext } from '@variscout/core';
import { downloadFindingsCSV, downloadFindingsJSON } from '@variscout/core';
import { copyFindingsToClipboard } from './export';

export interface FindingsExportMenuProps {
  findings: Finding[];
  questions?: Question[];
  processContext?: ProcessContext;
  onGenerateAIReport?: () => Promise<string>;
  columnAliases?: Record<string, string>;
  className?: string;
}

export default function FindingsExportMenu({
  findings,
  questions,
  processContext,
  onGenerateAIReport,
  columnAliases,
  className,
}: FindingsExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleCopyText = async () => {
    const success = await copyFindingsToClipboard(findings, columnAliases);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setIsOpen(false);
  };

  const handleDownloadCSV = () => {
    downloadFindingsCSV(findings, questions);
    setIsOpen(false);
  };

  const handleDownloadJSON = () => {
    downloadFindingsJSON(findings, questions, processContext);
    setIsOpen(false);
  };

  const handleAIReport = async () => {
    if (!onGenerateAIReport) return;
    setGenerating(true);
    try {
      const report = await onGenerateAIReport();
      // Copy report to clipboard
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('[FindingsExportMenu] Report generation failed:', err);
    } finally {
      setGenerating(false);
      setIsOpen(false);
    }
  };

  if (findings.length === 0) return null;

  return (
    <div ref={menuRef} className={`relative inline-block ${className || ''}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
        title="Export findings"
        aria-label="Export findings"
      >
        {copied ? <Check size={14} className="text-green-500" /> : <Download size={14} />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
          <button
            onClick={handleCopyText}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Copy size={14} />
            Copy as text
          </button>
          <button
            onClick={handleDownloadCSV}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <FileText size={14} />
            Download CSV
          </button>
          <button
            onClick={handleDownloadJSON}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <FileJson size={14} />
            Download JSON
          </button>
          {onGenerateAIReport && (
            <>
              <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
              <button
                onClick={handleAIReport}
                disabled={generating}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                Generate AI report
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
