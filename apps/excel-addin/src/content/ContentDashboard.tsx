import React, { useState, useEffect, useMemo, useRef } from 'react';
import { IChartBase, BoxplotBase, calculateBoxplotStats } from '@variscout/charts';
import { calculateStats, groupDataByFactor } from '@variscout/core';
import type { AddInState } from '../lib/stateBridge';
import { getFilteredTableData } from '../lib/dataFilter';
import { darkTheme } from '../lib/darkTheme';

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
const ContentDashboard: React.FC<ContentDashboardProps> = ({ state }) => {
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 300 });
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

  // Prepare I-Chart data
  const chartData = useMemo(() => {
    if (!filteredData.length || !state.outcomeColumn) return [];

    return filteredData.map((d, i) => ({
      x: i,
      y: Number(d[state.outcomeColumn]),
    }));
  }, [filteredData, state.outcomeColumn]);

  // Prepare Boxplot data using shared grouping utility
  const boxplotData = useMemo(() => {
    if (!filteredData.length || !state.factorColumns?.[0]) return [];

    const factor = state.factorColumns[0];
    const groups = groupDataByFactor(filteredData, factor, state.outcomeColumn);

    return Array.from(groups.entries()).map(([group, values]) =>
      calculateBoxplotStats({ group, values })
    );
  }, [filteredData, state.outcomeColumn, state.factorColumns]);

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
      {/* Header with stats summary */}
      <div style={styles.header}>
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

      {/* Charts row */}
      <div style={styles.chartsRow} ref={containerRef}>
        {/* I-Chart */}
        <div style={styles.chartContainer}>
          <ChartErrorBoundary chartName="I-Chart">
            <IChartBase
              data={chartData}
              stats={stats ?? null}
              specs={state.specs || {}}
              parentWidth={Math.max(
                200,
                (containerSize.width - 36) * (boxplotData.length > 0 ? 0.6 : 1)
              )}
              parentHeight={Math.max(150, containerSize.height - 80)}
              showBranding={false}
            />
          </ChartErrorBoundary>
        </div>

        {/* Boxplot */}
        {boxplotData.length > 0 && (
          <div style={styles.chartContainer}>
            <ChartErrorBoundary chartName="Boxplot">
              <BoxplotBase
                data={boxplotData}
                specs={state.specs || {}}
                parentWidth={Math.max(150, (containerSize.width - 36) * 0.4)}
                parentHeight={Math.max(150, containerSize.height - 80)}
                showBranding={false}
              />
            </ChartErrorBoundary>
          </div>
        )}
      </div>
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
    gap: darkTheme.spacingXL,
    padding: `${darkTheme.spacingS}px ${darkTheme.spacingM}px`,
    backgroundColor: darkTheme.colorNeutralBackground2,
    borderRadius: darkTheme.borderRadiusM,
    marginBottom: darkTheme.spacingM,
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
  chartsRow: {
    flex: 1,
    display: 'flex',
    gap: darkTheme.spacingM,
    minHeight: 0,
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
