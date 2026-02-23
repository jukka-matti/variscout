import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import type { TimeExtractionConfig } from '@variscout/core';

export interface TimeExtractionPanelProps {
  timeColumn: string;
  hasTimeComponent?: boolean;
  onTimeExtractionChange?: (config: TimeExtractionConfig) => void;
}

const TimeExtractionPanel: React.FC<TimeExtractionPanelProps> = ({
  timeColumn,
  hasTimeComponent,
  onTimeExtractionChange,
}) => {
  const [config, setConfig] = useState<TimeExtractionConfig>({
    extractYear: true,
    extractMonth: true,
    extractWeek: false,
    extractDayOfWeek: true,
    extractHour: hasTimeComponent || false,
  });

  const options = [
    { key: 'extractYear' as const, label: 'Year', example: '2025' },
    { key: 'extractMonth' as const, label: 'Month', example: 'Jan' },
    { key: 'extractWeek' as const, label: 'Week', example: 'W03' },
    { key: 'extractDayOfWeek' as const, label: 'Day of Week', example: 'Mon' },
    ...(hasTimeComponent ? [{ key: 'extractHour' as const, label: 'Hour', example: '14:00' }] : []),
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white">
          <Clock size={14} />
        </div>
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
          Extract Time Factors
        </h3>
        <span className="text-xs text-slate-500 ml-auto">Optional</span>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        Create categorical columns from <strong>{timeColumn}</strong> to filter by Year, Month,
        Week, etc.
      </p>

      <div className="space-y-2 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
        {options.map(({ key, label, example }) => (
          <label
            key={key}
            className="flex items-center gap-3 p-2 rounded hover:bg-slate-700/50 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={config[key]}
              onChange={e => {
                const newConfig = { ...config, [key]: e.target.checked };
                setConfig(newConfig);
                onTimeExtractionChange?.(newConfig);
              }}
              className="w-4 h-4 rounded border-slate-600 text-purple-600 focus:ring-purple-600 focus:ring-offset-slate-900"
            />
            <span className="text-sm text-slate-300 flex-1">{label}</span>
            <span className="text-xs text-slate-500 font-mono">{example}</span>
          </label>
        ))}

        <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-700">
          New columns will be added as factors (e.g., "{timeColumn}_Month", "{timeColumn}_Year")
        </p>
      </div>
    </div>
  );
};

export default TimeExtractionPanel;
