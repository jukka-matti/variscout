import type { Meta, StoryObj } from '@storybook/react';
import ChartLegend from '../../../packages/charts/src/ChartLegend';

const meta = {
  title: 'Charts/ChartLegend',
  component: ChartLegend,
  tags: ['autodocs'],
  decorators: [
    Story => (
      <svg width={800} height={80}>
        <Story />
      </svg>
    ),
  ],
} satisfies Meta<typeof ChartLegend>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Educational: Story = {
  args: {
    mode: 'educational',
    width: 800,
    top: 10,
    show: true,
  },
};

export const Practical: Story = {
  args: {
    mode: 'practical',
    width: 800,
    top: 10,
    show: true,
  },
};

export const Hidden: Story = {
  args: {
    mode: 'educational',
    width: 800,
    top: 10,
    show: false,
  },
};

export const Narrow: Story = {
  args: {
    mode: 'educational',
    width: 400,
    top: 10,
    show: true,
  },
};
