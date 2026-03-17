import type { Meta, StoryObj } from '@storybook/react';
import ChartSourceBar from '../../../packages/charts/src/ChartSourceBar';

const meta = {
  title: 'Charts/ChartSourceBar',
  component: ChartSourceBar,
  tags: ['autodocs'],
  decorators: [
    Story => (
      <svg width={800} height={40}>
        <Story />
      </svg>
    ),
  ],
} satisfies Meta<typeof ChartSourceBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    width: 800,
    top: 5,
    n: 150,
    forceShow: true,
  },
};

export const WithCustomText: Story = {
  args: {
    width: 800,
    top: 5,
    n: 42,
    brandingText: 'VariScout Azure',
    forceShow: true,
  },
};

export const CustomAccent: Story = {
  args: {
    width: 800,
    top: 5,
    n: 75,
    accentColor: '#22c55e',
    forceShow: true,
  },
};
