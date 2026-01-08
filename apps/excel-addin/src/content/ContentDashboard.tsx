import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  IChartBase,
  BoxplotBase,
  ParetoChartBase,
  CapabilityHistogramBase,
  ProbabilityPlotBase,
  calculateBoxplotStats,
  type ParetoDataPoint,
} from '@variscout/charts';
import {
  calculateStats,
  calculateStatsByStage,
  sortDataByStage,
  determineStageOrder,
  groupDataByFactor,
  calculateAnova,
  calculateFactorVariations,
  type StagedStatsResult,
} from '@variscout/core';
import type { AddInState } from '../lib/stateBridge';
import { getFilteredTableData } from '../lib/dataFilter';
import { darkTheme } from '../lib/darkTheme';
import FilterBar, { type ActiveFilter } from './FilterBar';
import AnovaResults from './AnovaResults';
import {
  CHART_IDS,
  copyChartsToClipboard,
  insertChartsIntoExcel,
  writeStatsToExcel,
  canInsertImages,
} from '../lib/chartExport';
import { getAllSlicerSelections, clearAllSlicerSelections } from '../lib/slicerManager';

interface ContentDashboardProps {
  state: AddInState;
}

/**
 * Simple error boundary for chart components
 */
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; chartName: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; chartName: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error(`Chart error in ${this.props.chartName}:`, error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            color: darkTheme.colorNeutralForeground2,
            textAlign: 'center',
            padding: darkTheme.spacingL,
          }}
        >
          <p>Chart failed to render</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              marginTop: darkTheme.spacingS,
              padding: `${darkTheme.spacingXS}px ${darkTheme.spacingM}px`,
              backgroundColor: darkTheme.colorNeutralBackground3,
              border: 'none',
              borderRadius: darkTheme.borderRadiusS,
              color: darkTheme.colorNeutralForeground1,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Content Add-in Dashboard
 *
 * Displays I-Chart, Boxplot, and Stats panel.
 * Reads filtered data from Excel Table (respects slicer selections).
 */
type ExportStatus = 'idle' | 'copying' | 'inserting' | 'writing' | 'done' | 'error';

const ContentDashboard: React.FC<ContentDashboardProps> = ({ state }) => {
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 300 });
  const [showProbabilityPlot, setShowProbabilityPlot] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const containerRef = useRef<HTMLDivElement>(null);
  const errorCountRef = useRef(0);

  // Observe container size for responsive charts
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Reset loading state when dependencies change
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    errorCountRef.current = 0;
  }, [state.dataSheetName, state.tableName, state.outcomeColumn, state.factorColumns]);

  // Load data from Excel Table
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const data = await getFilteredTableData(
          state.dataSheetName,
          state.tableName,
          state.outcomeColumn,
          state.factorColumns
        );
        if (isMounted) {
          setFilteredData(data);
          setError(null);
          errorCountRef.current = 0;
          setIsLoading(false);
        }
      } catch (err: unknown) {
        console.error('Failed to load data:', err);
        if (isMounted) {
          errorCountRef.current++;
          // Only show error after 3 consecutive failures (to avoid flashing errors during polling)
          if (errorCountRef.current >= 3) {
            setError(
              `Unable to read data from table "${state.tableName}". Check that the table still exists.`
            );
          }
          setIsLoading(false);
        }
      }
    };

    loadData();

    // Poll for slicer changes (no native events available)
    // Using 1000ms to reduce Excel API calls while staying responsive
    const interval = setInterval(loadData, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [state.dataSheetName, state.tableName, state.outcomeColumn, state.factorColumns]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!filteredData.length || !state.outcomeColumn) return null;

    const values = filteredData.map(d => Number(d[state.outcomeColumn])).filter(v => !isNaN(v));

    if (values.length === 0) return null;

    return calculateStats(values, state.specs?.usl, state.specs?.lsl);
  }, [filteredData, state.outcomeColumn, state.specs]);

  // Calculate staged statistics (when stage column is configured)
  const stagedStats = useMemo((): StagedStatsResult | null => {
    if (!state.stageColumn || !filteredData.length || !state.outcomeColumn) return null;

    return calculateStatsByStage(
      filteredData,
      state.outcomeColumn,
      state.stageColumn,
      state.specs || {}
    );
  }, [filteredData, state.outcomeColumn, state.stageColumn, state.specs]);

  // Sort data by stage when staging is active
  const sortedData = useMemo(() => {
    if (!state.stageColumn) return filteredData;

    const stageValues = filteredData.map(d => String(d[state.stageColumn!] ?? ''));
    const stageOrder = determineStageOrder(stageValues, state.stageOrderMode || 'auto');
    return sortDataByStage(filteredData, state.stageColumn, stageOrder);
  }, [filteredData, state.stageColumn, state.stageOrderMode]);

  // Prepare I-Chart data (use sorted data when staging is active)
  const chartData = useMemo(() => {
    if (!filteredData.length || !state.outcomeColumn) return [];

    const sourceData = state.stageColumn ? sortedData : filteredData;
    return sourceData.map((d, i) => ({
      x: i,
      y: Number(d[state.outcomeColumn]),
      stage: state.stageColumn ? String(d[state.stageColumn] ?? '') : undefined,
    }));
  }, [filteredData, sortedData, state.outcomeColumn, state.stageColumn]);

  // Prepare Boxplot data using shared grouping utility
  const boxplotData = useMemo(() => {
    if (!filteredData.length || !state.factorColumns?.[0]) return [];

    const factor = state.factorColumns[0];
    const groups = groupDataByFactor(filteredData, factor, state.outcomeColumn);

    return Array.from(groups.entries()).map(([group, values]) =>
      calculateBoxplotStats({ group, values })
    );
  }, [filteredData, state.outcomeColumn, state.factorColumns]);

  // Prepare Pareto data from first factor column
  const paretoData = useMemo((): ParetoDataPoint[] => {
    if (!filteredData.length || !state.factorColumns?.[0]) return [];

    const factor = state.factorColumns[0];

    // Count occurrences per category
    const counts = new Map<string, number>();
    filteredData.forEach(row => {
      const category = String(row[factor] ?? 'Unknown');
      counts.set(category, (counts.get(category) || 0) + 1);
    });

    // Sort by count descending
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

    // Build Pareto data with cumulative values
    const total = filteredData.length;
    let cumulative = 0;

    return sorted.map(([key, value]) => {
      cumulative += value;
      return {
        key,
        value,
        cumulative,
        cumulativePercentage: (cumulative / total) * 100,
      };
    });
  }, [filteredData, state.factorColumns]);

  // Prepare histogram data (raw numeric values)
  const histogramData = useMemo(() => {
    if (!filteredData.length || !state.outcomeColumn) return [];

    return filteredData.map(d => Number(d[state.outcomeColumn])).filter(v => !isNaN(v));
  }, [filteredData, state.outcomeColumn]);

  // Calculate factor variation for the active factor (for drill suggestion on boxplot)
  const factorVariationPct = useMemo(() => {
    if (!filteredData.length || !state.factorColumns?.[0] || !state.outcomeColumn) {
      return undefined;
    }

    const factor = state.factorColumns[0];
    const variations = calculateFactorVariations(
      filteredData,
      [factor],
      state.outcomeColumn,
      [] // No excluded factors since this is based on current slicer view
    );

    return variations.get(factor);
  }, [filteredData, state.outcomeColumn, state.factorColumns]);

  // Calculate ANOVA for factor comparison
  const anovaResult = useMemo(() => {
    if (!filteredData.length || !state.factorColumns?.[0] || !state.outcomeColumn) {
      return null;
    }

    const factor = state.factorColumns[0];

    // Need at least 2 groups with 2+ samples each for valid ANOVA
    const groupCounts = new Map<string, number>();
    filteredData.forEach(d => {
      const g = String(d[factor]);
      groupCounts.set(g, (groupCounts.get(g) || 0) + 1);
    });
    const validGroups = Array.from(groupCounts.values()).filter(c => c >= 2);
    if (validGroups.length < 2) return null;

    try {
      return calculateAnova(filteredData, state.outcomeColumn, factor);
    } catch (e) {
      console.warn('ANOVA calculation failed:', e);
      return null;
    }
  }, [filteredData, state.outcomeColumn, state.factorColumns]);

  // Load active slicer filters
  useEffect(() => {
    if (!state.slicerNames?.length) {
      setActiveFilters([]);
      return;
    }

    let isMounted = true;

    const loadFilters = async () => {
      try {
        const selections = await getAllSlicerSelections(state.dataSheetName, state.slicerNames);
        if (!isMounted) return;

        const filters: ActiveFilter[] = [];
        // Map slicer names to factor columns for display
        const factorColumns = state.factorColumns || [];

        for (let i = 0; i < state.slicerNames.length; i++) {
          const slicerName = state.slicerNames[i];
          const selected = selections.get(slicerName);

          // If selected is an array with items, some items are filtered (not "all")
          if (selected && selected.length > 0) {
            // Use factor column name if available, otherwise slicer name
            const displayName = factorColumns[i] || slicerName;
            filters.push({
              column: displayName,
              values: selected,
            });
          }
        }

        setActiveFilters(filters);
      } catch (err) {
        console.warn('Failed to load slicer filters:', err);
      }
    };

    loadFilters();
    // Poll for filter changes (slicers have no events)
    const interval = setInterval(loadFilters, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [state.dataSheetName, state.slicerNames, state.factorColumns]);

  // Export handlers
  const handleCopyAll = useCallback(async () => {
    setExportStatus('copying');
    try {
      await copyChartsToClipboard();
      setExportStatus('done');
      setTimeout(() => setExportStatus('idle'), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  }, []);

  const handleInsertCharts = useCallback(async () => {
    if (!canInsertImages()) {
      alert('Image insertion requires Excel 2019 or later');
      return;
    }
    setExportStatus('inserting');
    try {
      await insertChartsIntoExcel();
      setExportStatus('done');
      setTimeout(() => setExportStatus('idle'), 2000);
    } catch (err) {
      console.error('Insert failed:', err);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  }, []);

  const handleWriteStats = useCallback(async () => {
    if (!stats) return;
    setExportStatus('writing');
    try {
      await writeStatsToExcel(stats, state.specs || {}, filteredData.length);
      setExportStatus('done');
      setTimeout(() => setExportStatus('idle'), 2000);
    } catch (err) {
      console.error('Write stats failed:', err);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  }, [stats, state.specs, filteredData.length]);

  const handleClearFilters = useCallback(async () => {
    if (!state.slicerNames?.length) return;
    try {
      await clearAllSlicerSelections(state.dataSheetName, state.slicerNames);
    } catch (err) {
      console.error('Failed to clear filters:', err);
    }
  }, [state.dataSheetName, state.slicerNames]);

  // Check if any export is in progress
  const isExporting =
    exportStatus !== 'idle' && exportStatus !== 'done' && exportStatus !== 'error';

  if (isLoading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p>Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <p style={styles.errorText}>{error}</p>
        <p style={styles.errorHint}>Try refreshing the add-in or reconfiguring in the Task Pane.</p>
      </div>
    );
  }

  if (!filteredData.length) {
    return (
      <div style={styles.empty}>
        <p>No data visible. This may be due to slicer filters excluding all rows.</p>
        <p style={{ fontSize: darkTheme.fontSizeSmall, marginTop: darkTheme.spacingS }}>
          Clear your slicer selections to see all data.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header with stats summary and export toolbar */}
      <div style={styles.header}>
        <div style={styles.statsRow}>
          <div style={styles.stat} title="Sample size: number of data points">
            <span style={styles.statLabel}>n</span>
            <span style={styles.statValue}>{filteredData.length}</span>
          </div>
          {stats && (
            <>
              <div style={styles.stat} title="Arithmetic mean: average of all values">
                <span style={styles.statLabel}>Mean</span>
                <span style={styles.statValue}>{stats.mean.toFixed(2)}</span>
              </div>
              <div style={styles.stat} title="Standard deviation: measure of data spread">
                <span style={styles.statLabel}>StdDev</span>
                <span style={styles.statValue}>{stats.stdDev.toFixed(2)}</span>
              </div>
              {stats.cpk !== undefined &&
                (() => {
                  const cpkTarget = state.specs?.cpkTarget ?? 1.33;
                  return (
                    <div
                      style={styles.stat}
                      title={`Process capability index: ≥${cpkTarget} is good (green), <${cpkTarget} needs improvement (red)`}
                    >
                      <span style={styles.statLabel}>Cpk</span>
                      <span
                        style={{
                          ...styles.statValue,
                          color:
                            stats.cpk >= cpkTarget
                              ? darkTheme.colorStatusSuccessForeground
                              : darkTheme.colorStatusDangerForeground,
                        }}
                      >
                        {stats.cpk.toFixed(2)}
                        <span style={styles.cpkLabel}>
                          {stats.cpk >= cpkTarget ? ' (Good)' : ' (Poor)'}
                        </span>
                      </span>
                    </div>
                  );
                })()}
            </>
          )}
        </div>

        {/* Export toolbar */}
        <div style={styles.exportToolbar}>
          {exportStatus === 'done' && <span style={styles.exportSuccess}>Done</span>}
          {exportStatus === 'error' && <span style={styles.exportError}>Failed</span>}
          {isExporting && <span style={styles.exportSpinner} />}
          <button
            onClick={handleCopyAll}
            disabled={isExporting}
            style={isExporting ? styles.exportButtonDisabled : styles.exportButton}
            title="Copy all charts to clipboard"
          >
            Copy
          </button>
          <button
            onClick={handleInsertCharts}
            disabled={isExporting || !canInsertImages()}
            style={
              isExporting || !canInsertImages() ? styles.exportButtonDisabled : styles.exportButton
            }
            title={canInsertImages() ? 'Insert charts into worksheet' : 'Requires Excel 2019+'}
          >
            Insert
          </button>
          <button
            onClick={handleWriteStats}
            disabled={isExporting || !stats}
            style={isExporting || !stats ? styles.exportButtonDisabled : styles.exportButton}
            title="Write statistics to cells"
          >
            Stats
          </button>
        </div>
      </div>

      {/* Active filters bar */}
      <FilterBar filters={activeFilters} onClearAll={handleClearFilters} />

      {/* Top row: I-Chart (full width) */}
      <div style={styles.topChartsRow} ref={containerRef}>
        <div id={CHART_IDS.iChart} style={styles.chartContainer}>
          <ChartErrorBoundary chartName="I-Chart">
            <IChartBase
              data={chartData}
              stats={stats ?? null}
              stagedStats={stagedStats}
              specs={state.specs || {}}
              parentWidth={Math.max(200, containerSize.width - 36)}
              parentHeight={Math.max(120, (containerSize.height - 100) * 0.45)}
              showBranding={false}
            />
          </ChartErrorBoundary>
        </div>
      </div>

      {/* Bottom row: Boxplot, Pareto, Histogram/ProbPlot */}
      <div style={styles.bottomChartsRow}>
        {/* Boxplot with variation % indicator */}
        {boxplotData.length > 0 && (
          <div id={CHART_IDS.boxplot} style={styles.chartContainer}>
            <ChartErrorBoundary chartName="Boxplot">
              <BoxplotBase
                data={boxplotData}
                specs={state.specs || {}}
                xAxisLabel={state.factorColumns?.[0] || 'Group'}
                parentWidth={Math.max(120, (containerSize.width - 48) / 3)}
                parentHeight={Math.max(100, (containerSize.height - 100) * 0.45)}
                showBranding={false}
                variationPct={factorVariationPct}
              />
            </ChartErrorBoundary>
          </div>
        )}

        {/* Pareto Chart */}
        {paretoData.length > 0 && (
          <div id={CHART_IDS.pareto} style={styles.chartContainer}>
            <ChartErrorBoundary chartName="Pareto">
              <ParetoChartBase
                data={paretoData}
                totalCount={filteredData.length}
                xAxisLabel={state.factorColumns?.[0] || 'Category'}
                parentWidth={Math.max(120, (containerSize.width - 48) / 3)}
                parentHeight={Math.max(100, (containerSize.height - 100) * 0.45)}
                showBranding={false}
              />
            </ChartErrorBoundary>
          </div>
        )}

        {/* Histogram / Probability Plot with toggle */}
        {histogramData.length > 0 && stats && (
          <div id={CHART_IDS.histogram} style={styles.chartContainerWithToggle}>
            <button
              onClick={() => setShowProbabilityPlot(!showProbabilityPlot)}
              style={styles.toggleButton}
              title={showProbabilityPlot ? 'Show Histogram' : 'Show Probability Plot'}
            >
              {showProbabilityPlot ? 'Histogram' : 'Prob Plot'}
            </button>
            <ChartErrorBoundary chartName={showProbabilityPlot ? 'Probability Plot' : 'Histogram'}>
              {showProbabilityPlot ? (
                <ProbabilityPlotBase
                  data={histogramData}
                  mean={stats.mean}
                  stdDev={stats.stdDev}
                  parentWidth={Math.max(120, (containerSize.width - 48) / 3)}
                  parentHeight={Math.max(100, (containerSize.height - 100) * 0.45 - 28)}
                  showBranding={false}
                />
              ) : (
                <CapabilityHistogramBase
                  data={histogramData}
                  specs={state.specs || {}}
                  mean={stats.mean}
                  parentWidth={Math.max(120, (containerSize.width - 48) / 3)}
                  parentHeight={Math.max(100, (containerSize.height - 100) * 0.45 - 28)}
                  showBranding={false}
                />
              )}
            </ChartErrorBoundary>
          </div>
        )}
      </div>

      {/* ANOVA Results - shows when factor column exists */}
      {anovaResult && state.factorColumns?.[0] && (
        <AnovaResults result={anovaResult} factorLabel={state.factorColumns[0]} />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: darkTheme.colorNeutralBackground1,
    color: darkTheme.colorNeutralForeground1,
    padding: darkTheme.spacingM,
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: darkTheme.spacingM,
    padding: `${darkTheme.spacingS}px ${darkTheme.spacingM}px`,
    backgroundColor: darkTheme.colorNeutralBackground2,
    borderRadius: darkTheme.borderRadiusM,
    marginBottom: darkTheme.spacingM,
  },
  statsRow: {
    display: 'flex',
    gap: darkTheme.spacingXL,
  },
  exportToolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: darkTheme.spacingS,
  },
  exportButton: {
    padding: `${darkTheme.spacingXS}px ${darkTheme.spacingM}px`,
    backgroundColor: darkTheme.colorNeutralBackground3,
    border: 'none',
    borderRadius: darkTheme.borderRadiusS,
    color: darkTheme.colorNeutralForeground1,
    fontSize: darkTheme.fontSizeSmall,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  exportButtonDisabled: {
    padding: `${darkTheme.spacingXS}px ${darkTheme.spacingM}px`,
    backgroundColor: darkTheme.colorNeutralBackground3,
    border: 'none',
    borderRadius: darkTheme.borderRadiusS,
    color: darkTheme.colorNeutralForeground3,
    fontSize: darkTheme.fontSizeSmall,
    cursor: 'not-allowed',
    opacity: 0.5,
  },
  exportSuccess: {
    fontSize: darkTheme.fontSizeSmall,
    color: darkTheme.colorStatusSuccessForeground,
    marginRight: darkTheme.spacingXS,
  },
  exportError: {
    fontSize: darkTheme.fontSizeSmall,
    color: darkTheme.colorStatusDangerForeground,
    marginRight: darkTheme.spacingXS,
  },
  exportSpinner: {
    width: 14,
    height: 14,
    border: `2px solid ${darkTheme.colorNeutralStroke1}`,
    borderTopColor: darkTheme.colorBrandForeground1,
    borderRadius: darkTheme.borderRadiusCircular,
    animation: 'spin 1s linear infinite',
    marginRight: darkTheme.spacingXS,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'help',
  },
  statLabel: {
    fontSize: darkTheme.fontSizeCaption,
    color: darkTheme.colorNeutralForeground2,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statValue: {
    fontSize: darkTheme.fontSizeTitle,
    fontWeight: darkTheme.fontWeightSemibold,
    fontFamily: 'monospace',
  },
  cpkLabel: {
    fontSize: darkTheme.fontSizeCaption,
    fontWeight: 400,
    fontFamily: 'system-ui, sans-serif',
    opacity: 0.8,
  },
  topChartsRow: {
    flex: '0 0 45%',
    display: 'flex',
    gap: darkTheme.spacingM,
    minHeight: 0,
  },
  bottomChartsRow: {
    flex: '0 0 45%',
    display: 'flex',
    gap: darkTheme.spacingM,
    minHeight: 0,
  },
  chartContainerWithToggle: {
    flex: 1,
    backgroundColor: darkTheme.colorNeutralBackground2,
    borderRadius: darkTheme.borderRadiusM,
    padding: darkTheme.spacingS,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  toggleButton: {
    position: 'absolute',
    top: darkTheme.spacingXS,
    right: darkTheme.spacingXS,
    padding: `${darkTheme.spacingXS}px ${darkTheme.spacingS}px`,
    backgroundColor: darkTheme.colorNeutralBackground3,
    border: 'none',
    borderRadius: darkTheme.borderRadiusS,
    color: darkTheme.colorNeutralForeground2,
    fontSize: darkTheme.fontSizeCaption,
    cursor: 'pointer',
    zIndex: 1,
  },
  chartContainer: {
    flex: 1,
    backgroundColor: darkTheme.colorNeutralBackground2,
    borderRadius: darkTheme.borderRadiusM,
    padding: darkTheme.spacingS,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: darkTheme.colorNeutralForeground2,
  },
  spinner: {
    width: 24,
    height: 24,
    border: `2px solid ${darkTheme.colorNeutralStroke1}`,
    borderTopColor: darkTheme.colorBrandForeground1,
    borderRadius: darkTheme.borderRadiusCircular,
    animation: 'spin 1s linear infinite',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: darkTheme.colorNeutralForeground3,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: darkTheme.spacingL,
  },
  error: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: darkTheme.spacingL,
    textAlign: 'center',
  },
  errorText: {
    color: darkTheme.colorStatusDangerForeground,
    fontSize: darkTheme.fontSizeBody,
    marginBottom: darkTheme.spacingS,
  },
  errorHint: {
    color: darkTheme.colorNeutralForeground2,
    fontSize: darkTheme.fontSizeSmall,
  },
};

export default ContentDashboard;
