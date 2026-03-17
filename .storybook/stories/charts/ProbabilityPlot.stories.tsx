import type { Meta, StoryObj } from '@storybook/react';
import { ProbabilityPlotBase } from '../../../packages/charts/src/index';

const mockValues = Array.from({ length: 50 }, () => 10.0 + (Math.random() - 0.5) * 2).sort(
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

export const Default: Story = {
  args: {
    data: mockValues,
    mean: 10.0,
    stdDev: 0.58,
    parentWidth: 600,
    parentHeight: 500,
  },
};

export const SkewedData: Story = {
  args: {
    data: Array.from({ length: 50 }, () => Math.exp(Math.random() * 0.5 + 2)).sort((a, b) => a - b),
    mean: 8.2,
    stdDev: 2.1,
    parentWidth: 600,
    parentHeight: 500,
  },
};

export const SmallSample: Story = {
  args: {
    data: [9.1, 9.5, 9.8, 10.0, 10.2, 10.5, 10.9],
    mean: 10.0,
    stdDev: 0.58,
    parentWidth: 600,
    parentHeight: 500,
  },
};
