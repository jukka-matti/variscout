import type { Meta, StoryObj } from '@storybook/react';
import { BoxplotWrapperBase } from '../../../../packages/ui/src/index';
import type { BoxplotGroupData } from '../../../../packages/charts/src/index';

function makeGroup(key: string, center: number, spread: number): BoxplotGroupData {
  const values: number[] = [];
  for (let i = 0; i < 25; i++) {
    values.push(center + (Math.random() - 0.5) * spread * 2);
  }
  values.sort((a, b) => a - b);
  const q1 = values[6];
  const q3 = values[18];
  const iqr = q3 - q1;
  return {
    key,
    values,
    min: Math.max(values[0], q1 - 1.5 * iqr),
    max: Math.min(values[24], q3 + 1.5 * iqr),
    q1,
    median: values[12],
    mean: values.reduce((a, b) => a + b, 0) / values.length,
    q3,
    outliers: values.filter(v => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr),
    stdDev: spread * 0.6,
  };
}

const meta = {
  title: 'UI/Charts/BoxplotWrapperBase',
  component: BoxplotWrapperBase,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BoxplotWrapperBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: [
      makeGroup('Line A', 10.0, 0.5),
      makeGroup('Line B', 10.3, 0.8),
      makeGroup('Line C', 9.7, 0.4),
    ],
    specs: { usl: 11.0, lsl: 9.0, target: 10.0 },
    factorName: 'Production Line',
  },
};
