import type { Meta, StoryObj } from '@storybook/react';
import { BoxplotBase } from '../../../packages/charts/src/index';
import type { BoxplotGroupData, SpecLimits } from '../../../packages/charts/src/index';

function makeGroup(key: string, center: number, spread: number): BoxplotGroupData {
  const values: number[] = [];
  for (let i = 0; i < 30; i++) {
    values.push(center + (Math.random() - 0.5) * spread * 2);
  }
  values.sort((a, b) => a - b);
  const q1 = values[7];
  const median = values[15];
  const q3 = values[22];
  const iqr = q3 - q1;
  return {
    key,
    values,
    min: Math.max(values[0], q1 - 1.5 * iqr),
    max: Math.min(values[29], q3 + 1.5 * iqr),
    q1,
    median,
    mean: values.reduce((a, b) => a + b, 0) / values.length,
    q3,
    outliers: values.filter(v => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr),
    stdDev: spread * 0.6,
  };
}

const mockData: BoxplotGroupData[] = [
  makeGroup('Line A', 10.0, 0.5),
  makeGroup('Line B', 10.3, 0.8),
  makeGroup('Line C', 9.7, 0.4),
  makeGroup('Line D', 10.1, 1.0),
];

const mockSpecs: SpecLimits = { usl: 11.0, lsl: 9.0, target: 10.0 };

const meta = {
  title: 'Charts/Boxplot',
  component: BoxplotBase,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BoxplotBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: mockData,
    specs: mockSpecs,
    parentWidth: 800,
    parentHeight: 500,
    yAxisLabel: 'Weight (g)',
    xAxisLabel: 'Production Line',
  },
};

export const WithViolin: Story = {
  args: {
    ...Default.args,
    showViolin: true,
  },
};

export const WithContributions: Story = {
  args: {
    ...Default.args,
    categoryContributions: new Map([
      ['Line A', 15],
      ['Line B', 45],
      ['Line C', 10],
      ['Line D', 30],
    ]),
    showContributionLabels: true,
    showContributionBars: true,
  },
};

export const WithHighlights: Story = {
  args: {
    ...Default.args,
    highlightedCategories: { 'Line B': 'red', 'Line C': 'green' },
  },
};

export const Compact: Story = {
  args: {
    ...Default.args,
    parentWidth: 400,
    parentHeight: 300,
  },
};
