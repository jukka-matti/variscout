import React, { useState, useEffect, useMemo } from 'react';
import { IChartBase, BoxplotBase, calculateBoxplotStats } from '@variscout/charts';
import { calculateStats } from '@variscout/core';
import type { AddInState } from '../lib/stateBridge';
import { getFilteredTableData } from '../lib/dataFilter';

interface ContentDashboardProps {
  state: AddInState;
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

  // Load data from Excel Table
  useEffect(() => {
    let errorCount = 0;

    const loadData = async () => {
      try {
        const data = await getFilteredTableData(
          state.tableName,
          state.outcomeColumn,
          state.factorColumns
        );
        setFilteredData(data);
        setError(null);
        errorCount = 0;
      } catch (err) {
        console.error('Failed to load data:', err);
        errorCount++;
        // Only show error after 3 consecutive failures (to avoid flashing errors during polling)
        if (errorCount >= 3) {
          setError(
            `Unable to read data from table "${state.tableName}". Check that the table still exists.`
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Poll for slicer changes (no native events available)
    const interval = setInterval(loadData, 500);
    return () => clearInterval(interval);
  }, [state.tableName, state.outcomeColumn, state.factorColumns]);

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

  // Prepare Boxplot data
  const boxplotData = useMemo(() => {
    if (!filteredData.length || !state.factorColumns?.[0]) return [];

    const factor = state.factorColumns[0];
    const groups = new Map<string, number[]>();

    filteredData.forEach(d => {
      const key = String(d[factor] ?? 'Unknown');
      const value = Number(d[state.outcomeColumn]);
      if (!isNaN(value)) {
        const existing = groups.get(key) || [];
        existing.push(value);
        groups.set(key, existing);
      }
    });

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
        <p style={{ fontSize: 12, marginTop: 8 }}>Clear your slicer selections to see all data.</p>
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
            {stats.cpk !== undefined && (
              <div
                style={styles.stat}
                title="Process capability index: ≥1.33 is good (green), ≥1.0 is acceptable (yellow), <1.0 needs improvement (red)"
              >
                <span style={styles.statLabel}>Cpk</span>
                <span
                  style={{
                    ...styles.statValue,
                    color: stats.cpk >= 1.33 ? '#22c55e' : stats.cpk >= 1.0 ? '#eab308' : '#ef4444',
                  }}
                >
                  {stats.cpk.toFixed(2)}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Charts row */}
      <div style={styles.chartsRow}>
        {/* I-Chart */}
        <div style={styles.chartContainer}>
          <IChartBase
            data={chartData}
            stats={stats ?? null}
            specs={state.specs || {}}
            parentWidth={450}
            parentHeight={200}
            showBranding={false}
          />
        </div>

        {/* Boxplot */}
        {boxplotData.length > 0 && (
          <div style={styles.chartContainer}>
            <BoxplotBase
              data={boxplotData}
              specs={state.specs || {}}
              parentWidth={300}
              parentHeight={200}
              showBranding={false}
            />
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
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
    padding: 12,
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    gap: 24,
    padding: '8px 12px',
    backgroundColor: '#334155',
    borderRadius: 8,
    marginBottom: 12,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'help',
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 600,
    fontFamily: 'monospace',
  },
  chartsRow: {
    flex: 1,
    display: 'flex',
    gap: 12,
    minHeight: 0,
  },
  chartContainer: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 8,
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
    color: '#94a3b8',
  },
  spinner: {
    width: 24,
    height: 24,
    border: '2px solid #475569',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  error: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: 20,
    textAlign: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 8,
  },
  errorHint: {
    color: '#94a3b8',
    fontSize: 12,
  },
};

export default ContentDashboard;
