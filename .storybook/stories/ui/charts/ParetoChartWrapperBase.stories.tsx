import type { Meta, StoryObj } from '@storybook/react';
import { ParetoChartWrapperBase } from '../../../../packages/ui/src/index';
import type { ParetoDataPoint } from '../../../../packages/charts/src/index';

const rawCounts = [
  { key: 'Seal defect', value: 42 },
  { key: 'Weight error', value: 28 },
  { key: 'Print smear', value: 15 },
  { key: 'Tear', value: 10 },
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
  title: 'UI/Charts/ParetoChartWrapperBase',
  component: ParetoChartWrapperBase,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ParetoChartWrapperBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: mockData,
    totalCount: total,
    factorName: 'Defect Type',
  },
};
