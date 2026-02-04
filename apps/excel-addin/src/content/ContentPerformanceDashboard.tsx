/**
 * ContentPerformanceDashboard - Performance Mode for Excel Content Add-in
 *
 * Displays multi-channel performance analysis with simplified layout:
 * - I-Chart showing Cpk by channel (full width)
 * - Boxplot showing worst 15 channels (full width)
 *
 * Optimized for 100+ column datasets - uses base chart variants for explicit sizing.
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { PerformanceIChartBase, PerformanceBoxplotBase } from '@variscout/charts';
import { calculateChannelPerformance } from '@variscout/core';
import type { AddInState } from '../lib/stateBridge';
import { getFilteredTableData } from '../lib/dataFilter';
import { useContentTheme, type ThemeTokens } from './ThemeContext';

interface ContentPerformanceDashboardProps {
  state: AddInState;
  onSelectMeasure?: (measureId: string | null) => void;
  onDrillToMeasure?: (measureId: string) => void;
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
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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
  headerButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacingS,
  },
  drillButton: {
    padding: `${theme.spacingXS}px ${theme.spacingM}px`,
    backgroundColor: theme.colorBrandForeground1,
    border: 'none',
    borderRadius: theme.borderRadiusS,
    color: theme.colorNeutralForeground1,
    fontSize: theme.fontSizeSmall,
    fontWeight: theme.fontWeightSemibold,
    cursor: 'pointer',
  },
  clearButton: {
    padding: `${theme.spacingXS}px ${theme.spacingM}px`,
    backgroundColor: 'transparent',
    border: 'none',
    color: theme.colorNeutralForeground2,
    fontSize: theme.fontSizeSmall,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  topRow: {
    flex: '0 0 40%',
    display: 'flex',
    flexDirection: 'column',
    marginBottom: theme.spacingM,
  },
  bottomRow: {
    flex: '0 0 50%',
    display: 'flex',
    flexDirection: 'column',
  },
  chartSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.colorNeutralBackground2,
    borderRadius: theme.borderRadiusM,
    overflow: 'hidden',
  },
  chartLabel: {
    fontSize: theme.fontSizeCaption,
    color: theme.colorNeutralForeground2,
    padding: `${theme.spacingXS}px ${theme.spacingS}px`,
    backgroundColor: theme.colorNeutralBackground3,
  },
  chartContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacingS,
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
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: theme.colorNeutralForeground3,
    textAlign: 'center',
  },
  error: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  errorText: {
    color: theme.colorStatusDangerForeground,
    fontSize: theme.fontSizeBody,
  },
});

const ContentPerformanceDashboard: React.FC<ContentPerformanceDashboardProps> = ({
  state,
  onSelectMeasure,
  onDrillToMeasure,
}) => {
  const { theme } = useContentTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [selectedMeasure, setSelectedMeasure] = useState<string | null>(
    state.selectedMeasure ?? null
  );
  // Cp/Cpk toggle state (includes 'both' option)
  const [capabilityMetric, setCapabilityMetric] = useState<'cp' | 'cpk' | 'both'>('cpk');

  // Cpk target threshold state
  const [cpkTarget, setCpkTarget] = useState<number>(1.33);

  const containerRef = useRef<HTMLDivElement>(null);

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

  // Load data from Excel Table
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const tableData = await getFilteredTableData(
          state.dataSheetName,
          state.tableName,
          state.measureColumns?.[0] ?? '', // Use first measure column for validation
          [] // No factors for performance mode
        );
        if (isMounted) {
          setData(tableData);
          setError(null);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        console.error('Failed to load data:', err);
        if (isMounted) {
          setError('Unable to read data from table.');
          setIsLoading(false);
        }
      }
    };

    loadData();

    // Poll for data changes
    const interval = setInterval(loadData, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [state.dataSheetName, state.tableName, state.measureColumns]);

  // Calculate performance results
  const performanceResult = useMemo(() => {
    if (!data.length || !state.measureColumns?.length) return null;

    const specs = {
      usl: state.specs?.usl,
      lsl: state.specs?.lsl,
      target: state.specs?.target,
    };

    return calculateChannelPerformance(data, state.measureColumns, specs);
  }, [data, state.measureColumns, state.specs]);

  const handleMeasureClick = useCallback(
    (measureId: string) => {
      const newSelection = selectedMeasure === measureId ? null : measureId;
      setSelectedMeasure(newSelection);
      onSelectMeasure?.(newSelection);
    },
    [selectedMeasure, onSelectMeasure]
  );

  const handleBoxplotClick = useCallback(
    (measureId: string) => {
      // Show confirmation and drill to Dashboard
      if (
        window.confirm(
          `Analyze ${measureId} in detail? This will switch to standard Dashboard view.`
        )
      ) {
        onDrillToMeasure?.(measureId);
      }
    },
    [onDrillToMeasure]
  );

  // Chart dimensions
  const topChartWidth = Math.max(200, containerSize.width - 32);
  const topChartHeight = Math.max(120, (containerSize.height - 120) * 0.4);
  const bottomChartWidth = Math.max(200, containerSize.width - 32);
  const bottomChartHeight = Math.max(100, (containerSize.height - 120) * 0.5);

  if (isLoading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p>Loading performance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <p style={styles.errorText}>{error}</p>
      </div>
    );
  }

  if (!performanceResult || performanceResult.channels.length === 0) {
    return (
      <div style={styles.empty}>
        <p>No performance data available</p>
        <p style={{ fontSize: theme.fontSizeSmall, marginTop: theme.spacingS }}>
          Check that measure columns are configured correctly.
        </p>
      </div>
    );
  }

  const { summary } = performanceResult;

  return (
    <div style={styles.container} ref={containerRef}>
      {/* Header with summary stats */}
      <div style={styles.header}>
        <div style={styles.statsRow}>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Channels</span>
            <span style={styles.statValue}>{summary.totalChannels}</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Avg Cpk</span>
            <span style={styles.statValue}>{summary.overall.meanCpk.toFixed(2)}</span>
          </div>
          {summary.needsAttentionCount > 0 && (
            <div style={{ ...styles.stat, color: theme.colorStatusWarningForeground }}>
              <span style={styles.statLabel}>Below Target</span>
              <span style={styles.statValue}>{summary.needsAttentionCount}</span>
            </div>
          )}
        </div>
        <div style={styles.headerButtons}>
          {selectedMeasure && onDrillToMeasure && (
            <button onClick={() => onDrillToMeasure(selectedMeasure)} style={styles.drillButton}>
              View in I-Chart &rarr;
            </button>
          )}
          {selectedMeasure && (
            <button onClick={() => handleMeasureClick(selectedMeasure)} style={styles.clearButton}>
              Clear selection
            </button>
          )}
        </div>
      </div>

      {/* Top row: I-Chart */}
      <div style={styles.topRow}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: `${theme.spacingXS}px ${theme.spacingS}px`,
            backgroundColor: theme.colorNeutralBackground3,
          }}
        >
          <div style={styles.chartLabel}>
            {capabilityMetric === 'cp' ? 'Cp' : capabilityMetric === 'cpk' ? 'Cpk' : 'Cp & Cpk'} by{' '}
            {state.measureLabel || 'Measure'}
          </div>
          {/* Controls container */}
          <div style={{ display: 'flex', alignItems: 'center', gap: `${theme.spacingS}px` }}>
            {/* Cpk Target Adjustment */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: `${theme.spacingXS}px`,
              }}
            >
              <label
                htmlFor="cpk-target-input"
                style={{
                  fontSize: theme.fontSizeCaption,
                  color: theme.colorNeutralForeground2,
                }}
              >
                Target Cpk:
              </label>
              <input
                id="cpk-target-input"
                type="number"
                min="0.5"
                max="3.0"
                step="0.01"
                value={cpkTarget}
                onChange={e => setCpkTarget(parseFloat(e.target.value) || 1.33)}
                style={{
                  width: 60,
                  padding: `${theme.spacingXS}px ${theme.spacingXS}px`,
                  fontSize: theme.fontSizeSmall,
                  backgroundColor: theme.colorNeutralBackground2,
                  color: theme.colorNeutralForeground1,
                  border: `1px solid ${theme.colorNeutralStroke1}`,
                  borderRadius: `${theme.borderRadiusS}px`,
                  textAlign: 'center',
                  fontFamily: 'monospace',
                }}
                title="Industry standard: 1.33 (4σ), 1.67 (5σ), 2.00 (6σ)"
              />
            </div>
            {/* Cp/Cpk/Both Toggle */}
            <div style={{ display: 'flex', gap: '2px' }}>
              <button
                onClick={() => setCapabilityMetric('cpk')}
                style={{
                  padding: `${theme.spacingXS}px ${theme.spacingS}px`,
                  backgroundColor:
                    capabilityMetric === 'cpk'
                      ? '#3b82f6' // Blue (matches chart)
                      : theme.colorNeutralBackground2,
                  color:
                    capabilityMetric === 'cpk'
                      ? theme.colorNeutralForeground1
                      : theme.colorNeutralForeground2,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: theme.fontSizeCaption,
                  fontWeight: theme.fontWeightSemibold,
                  transition: 'all 0.2s ease',
                }}
              >
                Cpk
              </button>
              <button
                onClick={() => setCapabilityMetric('cp')}
                style={{
                  padding: `${theme.spacingXS}px ${theme.spacingS}px`,
                  backgroundColor:
                    capabilityMetric === 'cp'
                      ? '#a855f7' // Purple (matches chart)
                      : theme.colorNeutralBackground2,
                  color:
                    capabilityMetric === 'cp'
                      ? theme.colorNeutralForeground1
                      : theme.colorNeutralForeground2,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: theme.fontSizeCaption,
                  fontWeight: theme.fontWeightSemibold,
                  transition: 'all 0.2s ease',
                }}
              >
                Cp
              </button>
              <button
                onClick={() => setCapabilityMetric('both')}
                style={{
                  padding: `${theme.spacingXS}px ${theme.spacingS}px`,
                  background:
                    capabilityMetric === 'both'
                      ? 'linear-gradient(90deg, #3b82f6 0%, #a855f7 100%)' // Blue-to-purple gradient
                      : theme.colorNeutralBackground2,
                  color:
                    capabilityMetric === 'both'
                      ? theme.colorNeutralForeground1
                      : theme.colorNeutralForeground2,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: theme.fontSizeCaption,
                  fontWeight: theme.fontWeightSemibold,
                  transition: 'all 0.2s ease',
                }}
              >
                Both
              </button>
            </div>
          </div>
        </div>
        <div style={styles.chartContainer}>
          <ChartErrorBoundary chartName="PerformanceIChart" theme={theme}>
            <PerformanceIChartBase
              channels={performanceResult.channels}
              selectedMeasure={selectedMeasure}
              onChannelClick={handleMeasureClick}
              parentWidth={topChartWidth}
              parentHeight={topChartHeight}
              showBranding={false}
              capabilityMetric={capabilityMetric}
              cpkTarget={cpkTarget}
            />
          </ChartErrorBoundary>
        </div>
      </div>

      {/* Bottom row: Single Boxplot chart */}
      <div style={styles.bottomRow}>
        <div style={styles.chartSection}>
          <div style={styles.chartLabel}>Worst 15 Channels (Click to Analyze)</div>
          <div style={styles.chartContainer}>
            <ChartErrorBoundary chartName="PerformanceBoxplot" theme={theme}>
              <PerformanceBoxplotBase
                channels={performanceResult.channels}
                specs={state.specs || {}}
                selectedMeasure={selectedMeasure}
                onChannelClick={handleBoxplotClick}
                parentWidth={bottomChartWidth}
                parentHeight={bottomChartHeight}
                showBranding={false}
                maxDisplayed={15}
              />
            </ChartErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentPerformanceDashboard;
