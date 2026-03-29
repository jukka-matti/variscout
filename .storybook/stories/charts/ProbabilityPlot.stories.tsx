import type { Meta, StoryObj } from '@storybook/react';
import { ProbabilityPlotBase } from '../../../packages/charts/src/index';
import {
  calculateProbabilityPlotData,
  andersonDarlingTest,
} from '../../../packages/core/src/stats';
import * as d3 from 'd3-array';
import type { ProbabilityPlotSeries } from '../../../packages/core/src/types';

function buildSeries(key: string, data: number[]): ProbabilityPlotSeries {
  const points = calculateProbabilityPlotData(data);
  const mean = d3.mean(data) ?? 0;
  const stdDev = d3.deviation(data) ?? 0;
  const ad = data.length >= 7 ? andersonDarlingTest(data) : null;
  return {
    key,
    points,
    mean,
    stdDev,
    n: data.length,
    adTestPValue: ad?.pValue ?? null,
    originalIndices: Array.from({ length: data.length }, (_, i) => i),
  };
}

const normalData = Array.from({ length: 50 }, () => 10.0 + (Math.random() - 0.5) * 2).sort(
  (a, b) => a - b
);

const meta = {
  title: 'Charts/ProbabilityPlot',
  component: ProbabilityPlotBase,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ProbabilityPlotBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleSeries: Story = {
  args: {
    series: [buildSeries('All', normalData)],
    parentWidth: 600,
    parentHeight: 500,
  },
};

export const MultiSeries: Story = {
  args: {
    series: [
      buildSeries(
        'Shift A',
        Array.from({ length: 30 }, () => 10 + (Math.random() - 0.5) * 1.0)
      ),
      buildSeries(
        'Shift B',
        Array.from({ length: 30 }, () => 10.5 + (Math.random() - 0.5) * 2.0)
      ),
      buildSeries(
        'Shift C',
        Array.from({ length: 30 }, () => 9.5 + (Math.random() - 0.5) * 0.5)
      ),
    ],
    parentWidth: 600,
    parentHeight: 500,
  },
};

export const SkewedData: Story = {
  args: {
    series: [
      buildSeries(
        'All',
        Array.from({ length: 50 }, () => Math.exp(Math.random() * 0.5 + 2)).sort((a, b) => a - b)
      ),
    ],
    parentWidth: 600,
    parentHeight: 500,
  },
};

export const SmallSample: Story = {
  args: {
    series: [buildSeries('All', [9.1, 9.5, 9.8, 10.0, 10.2, 10.5, 10.9])],
    parentWidth: 600,
    parentHeight: 500,
  },
};
