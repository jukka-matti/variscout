import React, { useMemo, useState, useEffect } from 'react';
import { GageRRChart, InteractionPlot } from '@variscout/charts';
import { calculateGageRR, type GageRRResult } from '@variscout/core';
import { useData } from '../context/DataContext';
import { ChevronDown, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';

/**
 * GageRRPanel - Gage R&R (Measurement System Analysis) tab
 */
const GageRRPanel: React.FC = () => {
  const { filteredData, outcome, factors } = useData();

  // Column selectors
  const [partColumn, setPartColumn] = useState<string>('');
  const [operatorColumn, setOperatorColumn] = useState<string>('');
  const [measurementColumn, setMeasurementColumn] = useState<string>('');

  // Get available columns
  const categoricalColumns = useMemo(() => {
    if (filteredData.length === 0) return [];
    const row = filteredData[0];
    return Object.keys(row).filter(key => typeof row[key] === 'string');
  }, [filteredData]);

  const numericColumns = useMemo(() => {
    if (filteredData.length === 0) return [];
    const row = filteredData[0];
    return Object.keys(row).filter(key => typeof row[key] === 'number');
  }, [filteredData]);

  // Auto-select defaults
  useEffect(() => {
    if (!partColumn && categoricalColumns.length > 0) {
      // Try to find a column that looks like a part ID
      const partLike = categoricalColumns.find(c => /part|sample|item|piece|unit/i.test(c));
      setPartColumn(partLike || categoricalColumns[0]);
    }
  }, [categoricalColumns, partColumn]);

  useEffect(() => {
    if (!operatorColumn && categoricalColumns.length > 1) {
      // Try to find a column that looks like operator
      const opLike = categoricalColumns.find(c => /operator|op|inspector|measurer|tech/i.test(c));
      setOperatorColumn(opLike || categoricalColumns[1] || categoricalColumns[0]);
    }
  }, [categoricalColumns, operatorColumn]);

  useEffect(() => {
    if (!measurementColumn && numericColumns.length > 0) {
      // Default to current outcome if it's numeric
      if (outcome && numericColumns.includes(outcome)) {
        setMeasurementColumn(outcome);
      } else {
        setMeasurementColumn(numericColumns[0]);
      }
    }
  }, [numericColumns, measurementColumn, outcome]);

  // Calculate Gage R&R
  const result: GageRRResult | null = useMemo(() => {
    if (!partColumn || !operatorColumn || !measurementColumn || filteredData.length === 0) {
      return null;
    }
    return calculateGageRR(filteredData, partColumn, operatorColumn, measurementColumn);
  }, [filteredData, partColumn, operatorColumn, measurementColumn]);

  // Verdict styling
  const getVerdictStyle = (verdict: 'excellent' | 'marginal' | 'unacceptable') => {
    switch (verdict) {
      case 'excellent':
        return { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle };
      case 'marginal':
        return { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: AlertTriangle };
      case 'unacceptable':
        return { bg: 'bg-red-500/20', text: 'text-red-400', icon: AlertCircle };
    }
  };

  if (categoricalColumns.length < 2 || numericColumns.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-2" size={24} />
          <p>Gage R&R requires at least 2 categorical columns</p>
          <p className="text-sm">(Part ID and Operator) and 1 numeric column</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* Column selectors */}
      <div className="flex-none px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Part selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Part:</span>
            <div className="relative">
              <select
                value={partColumn}
                onChange={e => setPartColumn(e.target.value)}
                className="bg-slate-900 border border-slate-600 text-xs text-white rounded px-2 py-1.5 pr-6 outline-none focus:border-blue-500"
              >
                {categoricalColumns.map(col => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Operator selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Operator:</span>
            <div className="relative">
              <select
                value={operatorColumn}
                onChange={e => setOperatorColumn(e.target.value)}
                className="bg-slate-900 border border-slate-600 text-xs text-white rounded px-2 py-1.5 pr-6 outline-none focus:border-blue-500"
              >
                {categoricalColumns.map(col => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Measurement selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Measurement:</span>
            <div className="relative">
              <select
                value={measurementColumn}
                onChange={e => setMeasurementColumn(e.target.value)}
                className="bg-slate-900 border border-slate-600 text-xs text-white rounded px-2 py-1.5 pr-6 outline-none focus:border-blue-500"
              >
                {numericColumns.map(col => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results area */}
      <div className="flex-1 p-4 overflow-auto">
        {!result ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <AlertCircle className="mx-auto mb-2" size={24} />
              <p>Unable to calculate Gage R&R</p>
              <p className="text-sm">Need at least 2 parts, 2 operators, and 2 replicates</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {/* Left column: Variance breakdown chart + stats */}
            <div className="flex flex-col gap-4">
              {/* %GRR Result card */}
              <div
                className={`p-4 rounded-xl border border-slate-700 ${getVerdictStyle(result.verdict).bg}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                      %GRR (Study Variation)
                    </div>
                    <div className={`text-3xl font-bold ${getVerdictStyle(result.verdict).text}`}>
                      {result.pctGRR.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-right">
                    {React.createElement(getVerdictStyle(result.verdict).icon, {
                      size: 32,
                      className: getVerdictStyle(result.verdict).text,
                    })}
                    <div
                      className={`text-sm font-medium ${getVerdictStyle(result.verdict).text} capitalize mt-1`}
                    >
                      {result.verdict}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mt-2">{result.verdictText}</p>
              </div>

              {/* Variance breakdown chart */}
              <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden min-h-[200px]">
                <div className="px-3 py-2 border-b border-slate-700/50">
                  <span className="text-xs font-medium text-slate-300">
                    Variance Components (%Study Variation)
                  </span>
                </div>
                <div className="h-[calc(100%-40px)]">
                  <ErrorBoundary componentName="Gage R&R Chart">
                    <GageRRChart
                      pctPart={result.pctPart}
                      pctRepeatability={result.pctRepeatability}
                      pctReproducibility={result.pctReproducibility}
                      pctGRR={result.pctGRR}
                      showBranding={true}
                    />
                  </ErrorBoundary>
                </div>
              </div>

              {/* Study summary */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                  Study Summary
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Parts:</span>
                    <span className="text-white font-mono">{result.partCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Operators:</span>
                    <span className="text-white font-mono">{result.operatorCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Replicates:</span>
                    <span className="text-white font-mono">{result.replicates}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Measurements:</span>
                    <span className="text-white font-mono">{result.totalMeasurements}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: Interaction plot */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col min-h-[400px]">
              <div className="px-3 py-2 border-b border-slate-700/50">
                <span className="text-xs font-medium text-slate-300">
                  Operator × Part Interaction
                </span>
                <span className="text-xs text-slate-500 ml-2">
                  (parallel lines = no interaction)
                </span>
              </div>
              <div className="flex-1 min-h-0">
                <ErrorBoundary componentName="Interaction Plot">
                  <InteractionPlot data={result.interactionData} showBranding={true} />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AIAG guidelines reference */}
      {result && (
        <div className="flex-none px-4 py-2 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>AIAG Guidelines:</span>
            <span className="text-green-400">&lt;10% Excellent</span>
            <span className="text-amber-400">10-30% Marginal</span>
            <span className="text-red-400">&gt;30% Unacceptable</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GageRRPanel;
