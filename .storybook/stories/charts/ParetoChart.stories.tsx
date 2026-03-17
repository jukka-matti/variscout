import type { Meta, StoryObj } from '@storybook/react';
import { ParetoChartBase } from '../../../packages/charts/src/index';
import type { ParetoDataPoint } from '../../../packages/charts/src/index';

const rawCounts = [
  { key: 'Seal defect', value: 42 },
  { key: 'Weight error', value: 28 },
  { key: 'Print smear', value: 15 },
  { key: 'Tear', value: 10 },
  { key: 'Misalign', value: 5 },
];

const total = rawCounts.reduce((s, d) => s + d.value, 0);
let cumulative = 0;
const mockData: ParetoDataPoint[] = rawCounts.map(d => {
  cumulative += d.value;
  return {
    key: d.key,
    value: d.value,
    cumulative,
    cumulativePercentage: (cumulative / total) * 100,
  };
});

const meta = {
  title: 'Charts/ParetoChart',
  component: ParetoChartBase,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ParetoChartBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: mockData,
    totalCount: total,
    parentWidth: 800,
    parentHeight: 450,
    xAxisLabel: 'Defect Type',
    yAxisLabel: 'Count',
  },
};

export const WithHighlights: Story = {
  args: {
    ...Default.args,
    highlightedCategories: { 'Seal defect': 'red', 'Print smear': 'amber' },
  },
};

export const WithBranding: Story = {
  args: {
    ...Default.args,
    showBranding: true,
  },
};

export const Compact: Story = {
  args: {
    ...Default.args,
    parentWidth: 400,
    parentHeight: 300,
  },
};
