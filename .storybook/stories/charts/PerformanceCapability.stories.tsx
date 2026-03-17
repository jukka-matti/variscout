import type { Meta, StoryObj } from '@storybook/react';
import { PerformanceCapabilityBase } from '../../../packages/charts/src/index';
import type { ChannelResult } from '../../../packages/charts/src/index';

const capableChannel: ChannelResult = {
  id: 'Valve 1',
  label: 'Valve 1',
  n: 50,
  mean: 100.0,
  stdDev: 0.3,
  cp: 1.67,
  cpk: 1.55,
  min: 98.8,
  max: 101.2,
  health: 'capable',
  outOfSpecPercentage: 0,
  values: Array.from({ length: 50 }, () => 100 + (Math.random() - 0.5) * 1.2),
};

const criticalChannel: ChannelResult = {
  id: 'Valve 3',
  label: 'Valve 3',
  n: 50,
  mean: 100.8,
  stdDev: 0.6,
  cp: 0.83,
  cpk: 0.72,
  min: 98.5,
  max: 102.5,
  health: 'critical',
  outOfSpecPercentage: 4.5,
  values: Array.from({ length: 50 }, () => 100.8 + (Math.random() - 0.5) * 3),
};

const meta = {
  title: 'Charts/PerformanceCapability',
  component: PerformanceCapabilityBase,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PerformanceCapabilityBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CapableChannel: Story = {
  args: {
    channel: capableChannel,
    specs: { usl: 101.5, lsl: 98.5, target: 100.0 },
    parentWidth: 600,
    parentHeight: 400,
  },
};

export const CriticalChannel: Story = {
  args: {
    channel: criticalChannel,
    specs: { usl: 101.5, lsl: 98.5, target: 100.0 },
    parentWidth: 600,
    parentHeight: 400,
  },
};

export const NoChannel: Story = {
  args: {
    channel: null,
    specs: { usl: 101.5, lsl: 98.5 },
    parentWidth: 600,
    parentHeight: 400,
  },
};
