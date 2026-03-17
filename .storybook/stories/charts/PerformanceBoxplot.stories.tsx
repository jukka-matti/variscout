import type { Meta, StoryObj } from '@storybook/react';
import { PerformanceBoxplotBase } from '../../../packages/charts/src/index';
import type { ChannelResult } from '../../../packages/charts/src/index';

function makeChannel(id: string, mean: number, spread: number): ChannelResult {
  const values = Array.from({ length: 30 }, () => mean + (Math.random() - 0.5) * spread * 2);
  const cpk = 1.0 / (spread * 3);
  return {
    id,
    label: id,
    n: values.length,
    mean,
    stdDev: spread,
    cp: cpk + 0.1,
    cpk,
    min: Math.min(...values),
    max: Math.max(...values),
    health:
      cpk >= 1.67 ? 'excellent' : cpk >= 1.33 ? 'capable' : cpk >= 1.0 ? 'warning' : 'critical',
    outOfSpecPercentage: 0,
    values,
  };
}

const mockChannels: ChannelResult[] = [
  makeChannel('Head 1', 100.2, 0.3),
  makeChannel('Head 2', 99.8, 0.5),
  makeChannel('Head 3', 100.5, 0.2),
  makeChannel('Head 4', 100.0, 0.8),
  makeChannel('Head 5', 99.5, 0.4),
];

const meta = {
  title: 'Charts/PerformanceBoxplot',
  component: PerformanceBoxplotBase,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PerformanceBoxplotBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    channels: mockChannels,
    specs: { usl: 101.5, lsl: 98.5, target: 100.0 },
    parentWidth: 800,
    parentHeight: 500,
  },
};

export const WithSelectedChannel: Story = {
  args: {
    ...Default.args,
    selectedMeasure: 'Head 4',
  },
};

export const WithStatsTable: Story = {
  args: {
    ...Default.args,
    showStatsTable: true,
  },
};

export const WithViolin: Story = {
  args: {
    ...Default.args,
    showViolin: true,
  },
};
