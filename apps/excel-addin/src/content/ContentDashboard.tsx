import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  IChartBase,
  BoxplotBase,
  ParetoChartBase,
  CapabilityHistogramBase,
  ProbabilityPlotBase,
  calculateBoxplotStats,
  BoxplotStatsTable,
  type ParetoDataPoint,
} from '@variscout/charts';
import {
  calculateStats,
  calculateStatsByStage,
  sortDataByStage,
  determineStageOrder,
  groupDataByFactor,
  calculateFactorVariations,
  getNextDrillFactor,
  type StagedStatsResult,
} from '@variscout/core';
import type { AddInState } from '../lib/stateBridge';
import { getFilteredTableData } from '../lib/dataFilter';
import { useContentTheme, type ThemeTokens } from './ThemeContext';
import FilterBar, { type ActiveFilter } from './FilterBar';
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
 * Props for ChartErrorBoundary including theme
 */
interface ChartErrorBoundaryProps {
  children: React.ReactNode;
  chartName: string;
  theme: ThemeTokens;
}

/**
 * Simple error boundary for chart components
 */
class ChartErrorBoundary extends React.Component<ChartErrorBoundaryProps, { hasError: boolean }> {
  constructor(props: ChartErrorBoundaryProps) {
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
    const { theme } = this.props;
    if (this.state.hasError) {
      return (
        <div
          style={{
            color: theme.colorNeutralForeground2,
            textAlign: 'center',
            padding: theme.spacingL,
          }}
        >
          <p>Chart failed to render</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              marginTop: theme.spacingS,
              padding: `${theme.spacingXS}px ${theme.spacingM}px`,
              backgroundColor: theme.colorNeutralBackground3,
              border: 'none',
              borderRadius: theme.borderRadiusS,
              color: theme.colorNeutralForeground1,
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
 * Create styles object based on theme tokens
 */
const createStyles = (theme: ThemeTokens): Record<string, React.CSSProperties> => ({
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.colorNeutralBackground1,
    color: theme.colorNeutralForeground1,
    padding: theme.spacingM,
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacingM,
    padding: `${theme.spacingS}px ${theme.spacingM}px`,
    backgroundColor: theme.colorNeutralBackground2,
    borderRadius: theme.borderRadiusM,
    marginBottom: theme.spacingM,
  },
  statsRow: {
    display: 'flex',
    gap: theme.spacingXL,
  },
  exportToolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacingS,
  },
  exportButton: {
    padding: `${theme.spacingXS}px ${theme.spacingM}px`,
    backgroundColor: theme.colorNeutralBackground3,
    border: 'none',
    borderRadius: theme.borderRadiusS,
    color: theme.colorNeutralForeground1,
    fontSize: theme.fontSizeSmall,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  exportButtonDisabled: {
    padding: `${theme.spacingXS}px ${theme.spacingM}px`,
    backgroundColor: theme.colorNeutralBackground3,
    border: 'none',
    borderRadius: theme.borderRadiusS,
    color: theme.colorNeutralForeground3,
    fontSize: theme.fontSizeSmall,
    cursor: 'not-allowed',
    opacity: 0.5,
  },
  exportSuccess: {
    fontSize: theme.fontSizeSmall,
    color: theme.colorStatusSuccessForeground,
    marginRight: theme.spacingXS,
  },
  exportError: {
    fontSize: theme.fontSizeSmall,
    color: theme.colorStatusDangerForeground,
    marginRight: theme.spacingXS,
  },
  exportSpinner: {
    width: 14,
    height: 14,
    border: `2px solid ${theme.colorNeutralStroke1}`,
    borderTopColor: theme.colorBrandForeground1,
    borderRadius: theme.borderRadiusCircular,
    animation: 'spin 1s linear infinite',
    marginRight: theme.spacingXS,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'help',
  },
  statLabel: {
    fontSize: theme.fontSizeCaption,
    color: theme.colorNeutralForeground2,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statValue: {
    fontSize: theme.fontSizeTitle,
    fontWeight: theme.fontWeightSemibold,
    fontFamily: 'monospace',
  },
  cpkLabel: {
    fontSize: theme.fontSizeCaption,
    fontWeight: 400,
    fontFamily: 'system-ui, sans-serif',
    opacity: 0.8,
  },
  topChartsRow: {
    flex: '0 0 45%',
    display: 'flex',
    gap: theme.spacingM,
    minHeight: 0,
  },
  factorSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacingS,
    padding: `${theme.spacingXS}px ${theme.spacingM}px`,
    backgroundColor: theme.colorNeutralBackground2,
    borderRadius: theme.borderRadiusS,
    marginBottom: theme.spacingS,
  },
  factorLabel: {
    fontSize: theme.fontSizeSmall,
    color: theme.colorNeutralForeground2,
  },
  factorSelect: {
    padding: `${theme.spacingXS}px ${theme.spacingS}px`,
    backgroundColor: theme.colorNeutralBackground3,
    border: `1px solid ${theme.colorNeutralStroke1}`,
    borderRadius: theme.borderRadiusS,
    color: theme.colorNeutralForeground1,
    fontSize: theme.fontSizeSmall,
    cursor: 'pointer',
  },
  autoSwitchLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: theme.fontSizeCaption,
    color: theme.colorNeutralForeground3,
    cursor: 'pointer',
    marginLeft: theme.spacingS,
  },
  autoSwitchCheckbox: {
    cursor: 'pointer',
  },
  bottomChartsRow: {
    flex: '0 0 45%',
    display: 'flex',
    gap: theme.spacingM,
    minHeight: 0,
  },
  chartContainerWithToggle: {
    flex: 1,
    backgroundColor: theme.colorNeutralBackground2,
    borderRadius: theme.borderRadiusM,
    padding: theme.spacingS,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  toggleButton: {
    position: 'absolute',
    top: theme.spacingXS,
    right: theme.spacingXS,
    padding: `${theme.spacingXS}px ${theme.spacingS}px`,
    backgroundColor: theme.colorNeutralBackground3,
    border: 'none',
    borderRadius: theme.borderRadiusS,
    color: theme.colorNeutralForeground2,
    fontSize: theme.fontSizeCaption,
    cursor: 'pointer',
    zIndex: 1,
  },
  chartContainer: {
    flex: 1,
    backgroundColor: theme.colorNeutralBackground2,
    borderRadius: theme.borderRadiusM,
    padding: theme.spacingS,
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
    color: theme.colorNeutralForeground2,
  },
  spinner: {
    width: 24,
    height: 24,
    border: `2px solid ${theme.colorNeutralStroke1}`,
    borderTopColor: theme.colorBrandForeground1,
    borderRadius: theme.borderRadiusCircular,
    animation: 'spin 1s linear infinite',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: theme.colorNeutralForeground3,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: theme.spacingL,
  },
  error: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: theme.spacingL,
    textAlign: 'center',
  },
  errorText: {
    color: theme.colorStatusDangerForeground,
    fontSize: theme.fontSizeBody,
    marginBottom: theme.spacingS,
  },
  errorHint: {
    color: theme.colorNeutralForeground2,
    fontSize: theme.fontSizeSmall,
  },
});

/**
 * Content Add-in Dashboard
 *
 * Displays I-Chart, Boxplot, and Stats panel.
 * Reads filtered data from Excel Table (respects slicer selections).
 */
type ExportStatus = 'idle' | 'copying' | 'inserting' | 'writing' | 'done' | 'error';

const ContentDashboard: React.FC<ContentDashboardProps> = ({ state }) => {
  const { theme } = useContentTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 300 });
  const [showProbabilityPlot, setShowProbabilityPlot] = useState(false);
  const [paretoAggregation, setParetoAggregation] = useState<'count' | 'value'>('count');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  // Factor selection with auto-switch support
  const [selectedFactorIndex, setSelectedFactorIndex] = useState(0);
  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const errorCountRef = useRef(0);
  const prevFiltersRef = useRef<string>('');

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

  // Y-axis domain for charts (uses full data domain when locked, otherwise undefined)
  // For Excel add-in, we use filteredData as "full data" since slicer filtering is external
  const yDomainForCharts = useMemo(() => {
    // Default to locked (true) if displayOptions not set
    const lockYAxis = state.displayOptions?.lockYAxisToFullData !== false;

    // If we have a stored full data domain, use it
    if (lockYAxis && state.fullDataDomain) {
      return state.fullDataDomain;
    }

    return undefined; // Let charts auto-calculate
  }, [state.displayOptions?.lockYAxisToFullData, state.fullDataDomain]);

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

  // Get the currently selected factor (with bounds checking)
  // IMPORTANT: This must be declared before boxplotData and paretoData which depend on it
  const selectedFactor = useMemo(() => {
    if (!state.factorColumns?.length) return null;
    const index = Math.min(selectedFactorIndex, state.factorColumns.length - 1);
    return state.factorColumns[index];
  }, [state.factorColumns, selectedFactorIndex]);

  // Prepare Boxplot data using shared grouping utility (uses selected factor)
  const boxplotData = useMemo(() => {
    if (!filteredData.length || !selectedFactor) return [];

    const groups = groupDataByFactor(filteredData, selectedFactor, state.outcomeColumn);

    return Array.from(groups.entries()).map(([group, values]) =>
      calculateBoxplotStats({ group, values })
    );
  }, [filteredData, state.outcomeColumn, selectedFactor]);

  // Prepare Pareto data from selected factor column
  const paretoData = useMemo((): ParetoDataPoint[] => {
    if (!filteredData.length || !selectedFactor) return [];

    let sorted: [string, number][];

    if (paretoAggregation === 'value' && state.outcomeColumn) {
      // Sum outcome values per category
      const sums = new Map<string, number>();
      filteredData.forEach(row => {
        const category = String(row[selectedFactor] ?? 'Unknown');
        const value = Number(row[state.outcomeColumn]) || 0;
        sums.set(category, (sums.get(category) || 0) + value);
      });
      sorted = Array.from(sums.entries()).sort((a, b) => b[1] - a[1]);
    } else {
      // Count occurrences per category
      const counts = new Map<string, number>();
      filteredData.forEach(row => {
        const category = String(row[selectedFactor] ?? 'Unknown');
        counts.set(category, (counts.get(category) || 0) + 1);
      });
      sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    }

    // Build Pareto data with cumulative values
    const total = sorted.reduce((sum, [_, v]) => sum + v, 0);
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
  }, [filteredData, selectedFactor, paretoAggregation, state.outcomeColumn]);

  // Prepare histogram data (raw numeric values)
  const histogramData = useMemo(() => {
    if (!filteredData.length || !state.outcomeColumn) return [];

    return filteredData.map(d => Number(d[state.outcomeColumn])).filter(v => !isNaN(v));
  }, [filteredData, state.outcomeColumn]);

  // Calculate factor variations for ALL factors (for auto-switch)
  const factorVariations = useMemo(() => {
    if (!filteredData.length || !state.factorColumns?.length || !state.outcomeColumn) {
      return new Map<string, number>();
    }

    return calculateFactorVariations(
      filteredData,
      state.factorColumns,
      state.outcomeColumn,
      [] // Include all factors
    );
  }, [filteredData, state.outcomeColumn, state.factorColumns]);

  // Calculate factor variation for the SELECTED factor (for drill suggestion on boxplot)
  const factorVariationPct = useMemo(() => {
    if (!selectedFactor) return undefined;
    return factorVariations.get(selectedFactor);
  }, [factorVariations, selectedFactor]);

  // Auto-switch to highest variation factor when slicer filters change
  useEffect(() => {
    if (!autoSwitchEnabled || !state.factorColumns?.length || factorVariations.size === 0) {
      return;
    }

    // Serialize current filters for comparison
    const currentFilters = JSON.stringify(activeFilters);

    // Only auto-switch when filters actually change (not on initial load)
    if (prevFiltersRef.current && prevFiltersRef.current !== currentFilters) {
      // Find factor with highest variation using core utility
      const currentFactor = selectedFactor || state.factorColumns[0];
      const nextFactor = getNextDrillFactor(factorVariations, currentFactor, 5);

      if (nextFactor) {
        const nextIndex = state.factorColumns.indexOf(nextFactor);
        if (nextIndex !== -1 && nextIndex !== selectedFactorIndex) {
          setSelectedFactorIndex(nextIndex);
        }
      }
    }

    prevFiltersRef.current = currentFilters;
  }, [
    activeFilters,
    autoSwitchEnabled,
    factorVariations,
    selectedFactor,
    selectedFactorIndex,
    state.factorColumns,
  ]);

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
        <p style={{ fontSize: theme.fontSizeSmall, marginTop: theme.spacingS }}>
          Clear your slicer selections to see all data.
        </p>
      </div>
    );
  }

  const cpkTarget = state.specs?.cpkTarget ?? 1.33;

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
              {stats.cpk !== undefined && (
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
                          ? theme.colorStatusSuccessForeground
                          : theme.colorStatusDangerForeground,
                    }}
                  >
                    {stats.cpk.toFixed(2)}
                    <span style={styles.cpkLabel}>
                      {stats.cpk >= cpkTarget ? ' (Good)' : ' (Poor)'}
                    </span>
                  </span>
                </div>
              )}
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
          <ChartErrorBoundary chartName="I-Chart" theme={theme}>
            <IChartBase
              data={chartData}
              stats={stats ?? null}
              stagedStats={stagedStats || undefined}
              specs={state.specs || {}}
              yDomainOverride={yDomainForCharts}
              parentWidth={Math.max(200, containerSize.width - 36)}
              parentHeight={Math.max(120, (containerSize.height - 100) * 0.45)}
              showBranding={false}
            />
          </ChartErrorBoundary>
        </div>
      </div>

      {/* Factor selector (when multiple factors available) */}
      {state.factorColumns && state.factorColumns.length > 1 && (
        <div style={styles.factorSelector}>
          <label style={styles.factorLabel}>Factor:</label>
          <select
            value={selectedFactorIndex}
            onChange={e => {
              setSelectedFactorIndex(Number(e.target.value));
              setAutoSwitchEnabled(false); // Disable auto-switch on manual selection
            }}
            style={styles.factorSelect}
          >
            {state.factorColumns.map((factor, idx) => {
              const variation = factorVariations.get(factor);
              return (
                <option key={factor} value={idx}>
                  {factor}
                  {variation !== undefined ? ` (${variation.toFixed(0)}%)` : ''}
                </option>
              );
            })}
          </select>
          <label
            style={styles.autoSwitchLabel}
            title="Auto-switch to highest variation factor when filters change"
          >
            <input
              type="checkbox"
              checked={autoSwitchEnabled}
              onChange={e => setAutoSwitchEnabled(e.target.checked)}
              style={styles.autoSwitchCheckbox}
            />
            Auto
          </label>
        </div>
      )}

      {/* Bottom row: Boxplot, Pareto, Histogram/ProbPlot */}
      <div style={styles.bottomChartsRow}>
        {/* Boxplot with variation % indicator */}
        {boxplotData.length > 0 && (
          <div id={CHART_IDS.boxplot} style={styles.chartContainer}>
            <ChartErrorBoundary chartName="Boxplot" theme={theme}>
              <BoxplotBase
                data={boxplotData}
                specs={state.specs || {}}
                xAxisLabel={selectedFactor || 'Group'}
                yDomainOverride={yDomainForCharts}
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
          <div id={CHART_IDS.pareto} style={styles.chartContainerWithToggle}>
            {state.outcomeColumn && (
              <button
                onClick={() => setParetoAggregation(prev => (prev === 'count' ? 'value' : 'count'))}
                style={styles.toggleButton}
                title={paretoAggregation === 'count' ? 'Show sum of values' : 'Show count'}
              >
                {paretoAggregation === 'count' ? 'Count' : state.outcomeColumn}
              </button>
            )}
            <ChartErrorBoundary chartName="Pareto" theme={theme}>
              <ParetoChartBase
                data={paretoData}
                totalCount={
                  paretoAggregation === 'count'
                    ? filteredData.length
                    : paretoData.reduce((s, d) => s + d.value, 0)
                }
                xAxisLabel={selectedFactor || 'Category'}
                yAxisLabel={paretoAggregation === 'count' ? 'Count' : state.outcomeColumn}
                parentWidth={Math.max(120, (containerSize.width - 48) / 3)}
                parentHeight={Math.max(
                  100,
                  (containerSize.height - 100) * 0.45 - (state.outcomeColumn ? 28 : 0)
                )}
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
            <ChartErrorBoundary
              chartName={showProbabilityPlot ? 'Probability Plot' : 'Histogram'}
              theme={theme}
            >
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

      {/* Boxplot Stats Table */}
      {boxplotData.length > 0 && boxplotData.length <= 8 && (
        <div style={{ marginTop: theme.spacingS }}>
          <BoxplotStatsTable data={boxplotData} compact />
        </div>
      )}
    </div>
  );
};

export default ContentDashboard;
