import type { Meta, StoryObj } from '@storybook/react';
import { AnovaResults } from '../../../../packages/ui/src/index';
import type { AnovaResult } from '../../../../packages/core/src/types';

const significantResult: AnovaResult = {
  groups: [
    { name: 'Line A', n: 30, mean: 10.1, stdDev: 0.3 },
    { name: 'Line B', n: 30, mean: 10.5, stdDev: 0.4 },
    { name: 'Line C', n: 30, mean: 9.8, stdDev: 0.2 },
  ],
  ssb: 7.35,
  ssw: 8.12,
  dfBetween: 2,
  dfWithin: 87,
  msb: 3.675,
  msw: 0.093,
  fStatistic: 39.5,
  pValue: 0.0001,
  isSignificant: true,
  etaSquared: 0.475,
  insight: 'Machine explains 47.5% of variation. Line B runs significantly higher than Line C.',
};

const nonSignificantResult: AnovaResult = {
  groups: [
    { name: 'Shift 1', n: 25, mean: 10.02, stdDev: 0.31 },
    { name: 'Shift 2', n: 25, mean: 10.05, stdDev: 0.29 },
  ],
  ssb: 0.01,
  ssw: 4.52,
  dfBetween: 1,
  dfWithin: 48,
  msb: 0.01,
  msw: 0.094,
  fStatistic: 0.11,
  pValue: 0.74,
  isSignificant: false,
  etaSquared: 0.002,
  insight: 'No significant difference between shifts. Shift explains only 0.2% of variation.',
};

const largeDatasetResult: AnovaResult = {
  groups: [
    { name: 'Machine 1', n: 50, mean: 10.2, stdDev: 0.5 },
    { name: 'Machine 2', n: 50, mean: 10.8, stdDev: 0.6 },
    { name: 'Machine 3', n: 50, mean: 10.0, stdDev: 0.4 },
    { name: 'Machine 4', n: 50, mean: 11.1, stdDev: 0.7 },
    { name: 'Machine 5', n: 50, mean: 9.9, stdDev: 0.3 },
  ],
  ssb: 4278,
  ssw: 2761,
  dfBetween: 4,
  dfWithin: 245,
  msb: 1069.5,
  msw: 11.3,
  fStatistic: 94.6,
  pValue: 0.00001,
  isSignificant: true,
  etaSquared: 0.608,
  insight: 'Machines explain 60.8% of variation.',
};

const meta = {
  title: 'UI/Analysis/AnovaResults',
  component: AnovaResults,
  tags: ['autodocs'],
} satisfies Meta<typeof AnovaResults>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Significant: Story = {
  args: {
    result: significantResult,
    factorLabel: 'Machine',
  },
};

export const NotSignificant: Story = {
  args: {
    result: nonSignificantResult,
    factorLabel: 'Shift',
  },
};

export const LargeDataset: Story = {
  args: {
    result: largeDatasetResult,
    factorLabel: 'Machine',
  },
};
