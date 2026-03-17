import type { Meta, StoryObj } from '@storybook/react';
import { PerformanceParetoBase } from '../../../packages/charts/src/index';
import type { ChannelResult } from '../../../packages/charts/src/index';

function makeChannel(id: string, cpk: number): ChannelResult {
  const values = Array.from({ length: 30 }, () => 10 + (Math.random() - 0.5) * 2);
  return {
    id,
    label: id,
    n: 30,
    mean: 10,
    stdDev: 0.3,
    cp: cpk + 0.1,
    cpk,
    min: 9,
    max: 11,
    health:
      cpk >= 1.67 ? 'excellent' : cpk >= 1.33 ? 'capable' : cpk >= 1.0 ? 'warning' : 'critical',
    outOfSpecPercentage: 0,
    values,
  };
}

const mockChannels: ChannelResult[] = [
  makeChannel('Nozzle 1', 0.78),
  makeChannel('Nozzle 2', 1.05),
  makeChannel('Nozzle 3', 1.22),
  makeChannel('Nozzle 4', 1.45),
  makeChannel('Nozzle 5', 1.67),
  makeChannel('Nozzle 6', 1.89),
  makeChannel('Nozzle 7', 2.1),
  makeChannel('Nozzle 8', 0.55),
];

const meta = {
  title: 'Charts/PerformancePareto',
  component: PerformanceParetoBase,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PerformanceParetoBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    channels: mockChannels,
    parentWidth: 800,
    parentHeight: 450,
  },
};

export const WithSelectedChannel: Story = {
  args: {
    ...Default.args,
    selectedMeasure: 'Nozzle 8',
  },
};

export const CustomThresholds: Story = {
  args: {
    ...Default.args,
    cpkThresholds: { critical: 1.0, warning: 1.33, capable: 1.67 },
  },
};
