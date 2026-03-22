import React, { useState, useCallback } from 'react';
import { Send } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface DashboardSummaryCardProps {
  summary: string | null;
  isLoading: boolean;
  isAIAvailable: boolean;
  onAskCoScout: (question: string) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

const DashboardSummaryCard: React.FC<DashboardSummaryCardProps> = ({
  summary,
  isLoading,
  isAIAvailable,
  onAskCoScout,
}) => {
  const [question, setQuestion] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = question.trim();
      if (!trimmed) return;
      onAskCoScout(trimmed);
      setQuestion('');
    },
    [question, onAskCoScout]
  );

  if (!isAIAvailable) return null;

  return (
    <div
      className="rounded-lg border border-edge bg-surface-secondary p-5 space-y-3"
      data-testid="dashboard-summary-card"
    >
      <h3 className="text-sm font-medium text-content-secondary">AI Summary</h3>

      {/* Summary text or shimmer */}
      {isLoading ? (
        <div className="space-y-2" data-testid="summary-shimmer">
          <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-600 animate-pulse" />
          <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-600 animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-600 animate-pulse" />
        </div>
      ) : summary ? (
        <p className="text-sm text-content leading-relaxed">{summary}</p>
      ) : (
        <p className="text-sm text-content-secondary italic">
          No summary available yet. Ask CoScout a question to get started.
        </p>
      )}

      {/* Ask CoScout input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Ask CoScout..."
          className="flex-1 rounded-md border border-edge bg-surface-primary px-3 py-1.5 text-sm text-content placeholder:text-content-secondary focus:outline-none focus:ring-1 focus:ring-blue-500"
          data-testid="dashboard-coscout-input"
        />
        <button
          type="submit"
          disabled={!question.trim()}
          className="p-1.5 rounded-md text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Send question"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default DashboardSummaryCard;
