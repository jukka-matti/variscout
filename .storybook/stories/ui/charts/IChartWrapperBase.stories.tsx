import type { Meta, StoryObj } from '@storybook/react';
import { IChartWrapperBase } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Charts/IChartWrapperBase',
  component: IChartWrapperBase,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof IChartWrapperBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: Array.from({ length: 25 }, (_, i) => ({
      x: i,
      y: 10 + (Math.random() - 0.5) * 1.5,
    })),
    stats: {
      mean: 10.0,
      median: 10.0,
      stdDev: 0.28,
      sigmaWithin: 0.25,
      mrBar: 0.28,
      ucl: 10.75,
      lcl: 9.25,
      cp: 1.33,
      cpk: 1.25,
      outOfSpecPercentage: 0,
    },
    specs: { usl: 11.0, lsl: 9.0, target: 10.0 },
  },
};
