import type { Meta, StoryObj } from '@storybook/react';
import { StatsPanelBase } from '../../../../packages/ui/src/index';
import type { StatsResult } from '../../../../packages/core/src/types';

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
  outOfSpecPercentage: 0.5,
};

const meta = {
  title: 'UI/Analysis/StatsPanelBase',
  component: StatsPanelBase,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof StatsPanelBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    stats: mockStats,
    specs: { usl: 11.0, lsl: 9.0, target: 10.0 },
    sampleCount: 150,
  },
};

export const NoSpecs: Story = {
  args: {
    stats: { ...mockStats, cp: undefined, cpk: undefined, outOfSpecPercentage: 0 },
    specs: {},
    sampleCount: 150,
  },
};

export const WithEditSpecs: Story = {
  args: {
    stats: mockStats,
    specs: { usl: 11.0, lsl: 9.0, target: 10.0 },
    sampleCount: 150,
    onEditSpecs: () => {},
  },
};
