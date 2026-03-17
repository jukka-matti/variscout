import type { Meta, StoryObj } from '@storybook/react';
import { IChartBase } from '../../../packages/charts/src/index';
import type { IChartDataPoint, StatsResult, SpecLimits } from '../../../packages/charts/src/index';

const mockValues = [
  10.2, 9.8, 10.5, 10.1, 9.9, 10.3, 10.0, 9.7, 10.4, 10.2, 9.8, 10.1, 10.3, 9.9, 10.0, 10.2, 9.8,
  10.5, 10.1, 9.9, 10.6, 9.5, 10.3, 10.0, 9.8, 10.1, 10.4, 9.7, 10.2, 10.0,
];

const mockData: IChartDataPoint[] = mockValues.map((y, i) => ({ x: i, y }));

const mockStats: StatsResult = {
  mean: 10.08,
  median: 10.05,
  stdDev: 0.27,
  sigmaWithin: 0.24,
  mrBar: 0.27,
  ucl: 10.8,
  lcl: 9.36,
  cp: 1.39,
  cpk: 1.28,
  outOfSpecPercentage: 0,
};

const mockSpecs: SpecLimits = { usl: 11.0, lsl: 9.0, target: 10.0 };

const meta = {
  title: 'Charts/IChart',
  component: IChartBase,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof IChartBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: mockData,
    stats: mockStats,
    specs: mockSpecs,
    parentWidth: 800,
    parentHeight: 400,
    yAxisLabel: 'Weight (g)',
  },
};

export const WithoutSpecs: Story = {
  args: {
    data: mockData,
    stats: mockStats,
    specs: {},
    parentWidth: 800,
    parentHeight: 400,
    yAxisLabel: 'Weight (g)',
  },
};

export const WithBranding: Story = {
  args: {
    ...Default.args,
    showBranding: true,
    sampleSize: 30,
  },
};

export const WithLegend: Story = {
  args: {
    ...Default.args,
    showLegend: true,
    legendMode: 'educational',
  },
};

export const Compact: Story = {
  args: {
    ...Default.args,
    parentWidth: 400,
    parentHeight: 250,
  },
};
