import type { Meta, StoryObj } from '@storybook/react';
import { PerformanceIChartBase } from '../../../packages/charts/src/index';
import type { ChannelResult } from '../../../packages/charts/src/index';

function makeChannel(id: string, cpk: number): ChannelResult {
  const values = Array.from({ length: 30 }, () => 10 + (Math.random() - 0.5) * (2 / cpk));
  return {
    id,
    label: id,
    n: values.length,
    mean: values.reduce((a, b) => a + b, 0) / values.length,
    stdDev: 1 / (3 * cpk),
    cp: cpk + 0.1,
    cpk,
    min: Math.min(...values),
    max: Math.max(...values),
    health:
      cpk >= 1.67 ? 'excellent' : cpk >= 1.33 ? 'capable' : cpk >= 1.0 ? 'warning' : 'critical',
    outOfSpecPercentage: cpk >= 1.33 ? 0 : 2.5,
    values,
  };
}

const mockChannels: ChannelResult[] = [
  makeChannel('Valve 1', 1.85),
  makeChannel('Valve 2', 1.45),
  makeChannel('Valve 3', 0.92),
  makeChannel('Valve 4', 1.67),
  makeChannel('Valve 5', 1.12),
  makeChannel('Valve 6', 2.01),
];

const meta = {
  title: 'Charts/PerformanceIChart',
  component: PerformanceIChartBase,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PerformanceIChartBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    channels: mockChannels,
    parentWidth: 800,
    parentHeight: 400,
  },
};

export const WithSelectedChannel: Story = {
  args: {
    ...Default.args,
    selectedMeasure: 'Valve 3',
  },
};

export const CpMetric: Story = {
  args: {
    ...Default.args,
    capabilityMetric: 'cp',
  },
};

export const BothMetrics: Story = {
  args: {
    ...Default.args,
    capabilityMetric: 'both',
  },
};

export const CustomTarget: Story = {
  args: {
    ...Default.args,
    cpkTargets: [1.67],
  },
};
