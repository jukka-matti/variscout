import React from 'react';
import { AlertTriangle, CheckCircle, Info, FileText, Eye, Table } from 'lucide-react';
import type { DataQualityReport, ColumnIssue } from '../logic/parser';

interface DataQualityBannerProps {
  report: DataQualityReport;
  filename?: string | null;
  onViewExcludedRows?: () => void;
  onViewAllData?: () => void;
  onContinue?: () => void;
  showActions?: boolean;
}

const DataQualityBanner: React.FC<DataQualityBannerProps> = ({
  report,
  filename,
  onViewExcludedRows,
  onViewAllData,
  onContinue,
  showActions = true,
}) => {
  const { totalRows, validRows, excludedRows, columnIssues } = report;
  const hasIssues = excludedRows.length > 0 || columnIssues.length > 0;
  const excludedCount = excludedRows.length;

  // Group issues by type for display
  const issuesByType = columnIssues.reduce(
    (acc, issue) => {
      if (!acc[issue.type]) {
        acc[issue.type] = [];
      }
      acc[issue.type].push(issue);
      return acc;
    },
    {} as Record<string, ColumnIssue[]>
  );

  const formatIssueType = (type: string): string => {
    switch (type) {
      case 'missing':
        return 'missing values';
      case 'non_numeric':
        return 'non-numeric values';
      case 'no_variation':
        return 'no variation (all values identical)';
      case 'all_empty':
        return 'empty column';
      default:
        return type;
    }
  };

  return (
    <div className="bg-surface-secondary border border-edge rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-edge">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-blue-400" />
          <span className="text-white font-medium">{filename || 'Data File'}</span>
          <span className="text-content-secondary text-sm">{totalRows} rows</span>
        </div>
        {!hasIssues && (
          <span className="flex items-center gap-1 text-green-500 text-sm">
            <CheckCircle size={16} />
            All data valid
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Valid rows count */}
        <div className="flex items-center gap-2">
          <CheckCircle size={18} className="text-green-500" />
          <span className="text-content">
            <span className="font-medium text-white">{validRows}</span> rows ready for analysis
          </span>
        </div>

        {/* Issues */}
        {excludedCount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              <span className="text-amber-400">
                <span className="font-medium">{excludedCount}</span> rows excluded:
              </span>
            </div>
            <ul className="ml-7 space-y-1 text-sm text-content-secondary">
              {Object.entries(issuesByType).map(([type, issues]) => {
                const totalCount = issues.reduce((sum, i) => sum + i.count, 0);
                const columns = issues.map(i => i.column).join(', ');
                return (
                  <li key={type} className="flex items-start gap-1">
                    <span className="text-content-muted">•</span>
                    <span>
                      {totalCount} {formatIssueType(type)} in {columns}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* No variation warning (info level) */}
        {columnIssues.some(i => i.type === 'no_variation') && (
          <div className="flex items-center gap-2 text-sm text-content-secondary">
            <Info size={16} className="text-blue-400" />
            <span>
              Outcome column has no variation - all values are identical. Control charts will show
              no variation.
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (onViewExcludedRows || onViewAllData || onContinue) && (
        <div className="flex items-center gap-3 p-4 border-t border-edge bg-surface-secondary/50">
          {onViewExcludedRows && excludedCount > 0 && (
            <button
              onClick={onViewExcludedRows}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 rounded-lg transition-colors"
            >
              <Eye size={16} />
              View Excluded Rows
            </button>
          )}
          {onViewAllData && (
            <button
              onClick={onViewAllData}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-surface-tertiary hover:bg-surface-elevated text-white rounded-lg transition-colors"
            >
              <Table size={16} />
              View All Data
            </button>
          )}
          {onContinue && (
            <button
              onClick={onContinue}
              className="ml-auto px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DataQualityBanner;
