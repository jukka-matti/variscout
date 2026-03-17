import type { Meta, StoryObj } from '@storybook/react';
import BoxplotStatsTable from '../../../packages/charts/src/BoxplotStatsTable';
import type { BoxplotGroupData } from '../../../packages/charts/src/index';

function makeGroup(key: string, mean: number, stdDev: number): BoxplotGroupData {
  const values = Array.from({ length: 25 }, () => mean + (Math.random() - 0.5) * stdDev * 4);
  values.sort((a, b) => a - b);
  return {
    key,
    values,
    min: values[0],
    max: values[values.length - 1],
    q1: values[6],
    median: values[12],
    mean,
    q3: values[18],
    outliers: [],
    stdDev,
  };
}

const mockData: BoxplotGroupData[] = [
  makeGroup('Monday', 10.1, 0.3),
  makeGroup('Tuesday', 10.3, 0.5),
  makeGroup('Wednesday', 9.8, 0.2),
  makeGroup('Thursday', 10.0, 0.9),
  makeGroup('Friday', 10.2, 0.4),
];

const meta = {
  title: 'Charts/BoxplotStatsTable',
  component: BoxplotStatsTable,
  tags: ['autodocs'],
} satisfies Meta<typeof BoxplotStatsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: mockData,
  },
};

export const WithContributions: Story = {
  args: {
    data: mockData,
    categoryContributions: new Map<string | number, number>([
      ['Monday', 12],
      ['Tuesday', 38],
      ['Wednesday', 8],
      ['Thursday', 32],
      ['Friday', 10],
    ]),
  },
};

export const Compact: Story = {
  args: {
    data: mockData,
    compact: true,
  },
};
