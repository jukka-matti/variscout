import React, { useMemo, useState } from 'react';
import { makeStyles, tokens, Dropdown, Option, Label, Card } from '@fluentui/react-components';
import { IChart, Boxplot, calculateBoxplotStats } from '@variscout/charts';
import { calculateStats } from '@variscout/core';
import { SelectedData } from '../../lib/excelData';
import { darkTheme } from '../../lib/darkTheme';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  controls: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  chartContainer: {
    height: '300px',
    backgroundColor: darkTheme.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  label: {
    minWidth: '80px',
  },
});

type ChartType = 'ichart' | 'boxplot';

interface ChartPanelProps {
  data: SelectedData;
  specs: { usl?: number; lsl?: number };
}

export const ChartPanel: React.FC<ChartPanelProps> = ({ data, specs }) => {
  const styles = useStyles();
  const [chartType, setChartType] = useState<ChartType>('ichart');

  // Calculate stats for the data
  const stats = useMemo(() => {
    return calculateStats(data.values, specs.usl, specs.lsl);
  }, [data.values, specs]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return data.values.map((y, x) => ({ x, y }));
  }, [data.values]);

  // Prepare boxplot data if factors are available
  const boxplotData = useMemo(() => {
    if (!data.factors) {
      // Single group if no factors
      return [
        calculateBoxplotStats({
          group: 'All Data',
          values: data.values,
        }),
      ];
    }

    // Group by factor values
    const groups = new Map<string, number[]>();
    data.factors.values.forEach((factor, i) => {
      if (i < data.values.length) {
        const existing = groups.get(factor) || [];
        existing.push(data.values[i]);
        groups.set(factor, existing);
      }
    });

    return Array.from(groups.entries()).map(([group, values]) =>
      calculateBoxplotStats({ group, values })
    );
  }, [data.values, data.factors]);

  return (
    <div className={styles.container}>
      {/* Chart Type Selector */}
      <div className={styles.controls}>
        <Label className={styles.label}>Chart Type:</Label>
        <Dropdown
          value={chartType === 'ichart' ? 'I-Chart' : 'Boxplot'}
          onOptionSelect={(_, opt) => setChartType(opt.optionValue as ChartType)}
        >
          <Option value="ichart">I-Chart</Option>
          <Option value="boxplot">Boxplot</Option>
        </Dropdown>
      </div>

      {/* Chart Display */}
      <Card>
        <div className={styles.chartContainer}>
          {chartType === 'ichart' ? (
            <IChart
              data={chartData}
              stats={stats}
              specs={{
                usl: specs.usl,
                lsl: specs.lsl,
              }}
              showBranding={false}
            />
          ) : (
            <Boxplot
              data={boxplotData}
              specs={{
                usl: specs.usl,
                lsl: specs.lsl,
              }}
              showBranding={false}
            />
          )}
        </div>
      </Card>

      {/* Quick Stats */}
      {stats && (
        <Card>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: tokens.spacingVerticalS,
              padding: tokens.spacingVerticalS,
            }}
          >
            <StatItem label="Mean" value={stats.mean.toFixed(2)} />
            <StatItem label="Std Dev" value={stats.stdDev.toFixed(2)} />
            <StatItem label="n" value={String(data.values.length)} />
            <StatItem label="UCL" value={stats.ucl.toFixed(2)} />
            <StatItem label="LCL" value={stats.lcl.toFixed(2)} />
            {stats.cpk !== undefined && (
              <StatItem
                label="Cpk"
                value={stats.cpk.toFixed(2)}
                color={stats.cpk >= 1.33 ? 'green' : stats.cpk >= 1 ? 'orange' : 'red'}
              />
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

interface StatItemProps {
  label: string;
  value: string;
  color?: 'green' | 'orange' | 'red';
}

const StatItem: React.FC<StatItemProps> = ({ label, value, color }) => {
  const colorMap = {
    green: tokens.colorPaletteGreenForeground1,
    orange: tokens.colorPaletteMarigoldForeground1,
    red: tokens.colorPaletteRedForeground1,
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: tokens.fontSizeBase200,
          color: tokens.colorNeutralForeground2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: tokens.fontSizeBase400,
          fontWeight: tokens.fontWeightSemibold,
          fontFamily: 'monospace',
          color: color ? colorMap[color] : tokens.colorNeutralForeground1,
        }}
      >
        {value}
      </div>
    </div>
  );
};
