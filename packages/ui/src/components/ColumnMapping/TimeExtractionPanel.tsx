import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import type { TimeExtractionConfig } from '@variscout/core';

export interface TimeExtractionPanelProps {
  timeColumn: string;
  hasTimeComponent?: boolean;
  onTimeExtractionChange?: (config: TimeExtractionConfig) => void;
}

const MINUTE_INTERVAL_OPTIONS = [
  { value: 0, label: 'Hour only' },
  { value: 30, label: 'Every 30 min' },
  { value: 15, label: 'Every 15 min' },
  { value: 5, label: 'Every 5 min' },
  { value: 1, label: 'Every 1 min' },
] as const;

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
            htmlFor={`time-extract-${key}`}
            className="flex items-center gap-3 p-2 rounded hover:bg-slate-700/50 cursor-pointer transition-colors"
          >
            <input
              id={`time-extract-${key}`}
              name={`time-extract-${key}`}
              type="checkbox"
              checked={config[key]}
              onChange={e => {
                const checked = e.target.checked;
                const newConfig = { ...config, [key]: checked };
                // Clear minute interval when Hour is unchecked
                if (key === 'extractHour' && !checked) {
                  newConfig.extractMinuteInterval = undefined;
                }
                setConfig(newConfig);
                onTimeExtractionChange?.(newConfig);
              }}
              className="w-4 h-4 rounded border-slate-600 text-purple-600 focus:ring-purple-600 focus:ring-offset-slate-900"
            />
            <span className="text-sm text-slate-300 flex-1">{label}</span>
            <span className="text-xs text-slate-500 font-mono">{example}</span>
          </label>
        ))}

        {hasTimeComponent && config.extractHour && (
          <div className="ml-9 p-2">
            <label
              htmlFor="time-extract-minute-interval"
              className="block text-xs text-slate-400 mb-1"
            >
              Minute interval
            </label>
            <select
              id="time-extract-minute-interval"
              value={config.extractMinuteInterval ?? 0}
              onChange={e => {
                const value = Number(e.target.value);
                const newConfig = {
                  ...config,
                  extractMinuteInterval: value > 0 ? value : undefined,
                };
                setConfig(newConfig);
                onTimeExtractionChange?.(newConfig);
              }}
              className="w-full rounded border border-slate-600 bg-slate-700 text-sm text-slate-200 px-2 py-1.5 focus:ring-purple-600 focus:border-purple-600"
            >
              {MINUTE_INTERVAL_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-700">
          New columns will be added as factors (e.g., "{timeColumn}_Month", "{timeColumn}_Year")
        </p>
      </div>
    </div>
  );
};

export default TimeExtractionPanel;
