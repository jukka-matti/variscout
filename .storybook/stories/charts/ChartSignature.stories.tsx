import type { Meta, StoryObj } from '@storybook/react';
import ChartSignature from '../../../packages/charts/src/ChartSignature';

const meta = {
  title: 'Charts/ChartSignature',
  component: ChartSignature,
  tags: ['autodocs'],
  decorators: [
    Story => (
      <svg width={400} height={60} style={{ background: '#1e293b', borderRadius: 4 }}>
        <Story />
      </svg>
    ),
  ],
} satisfies Meta<typeof ChartSignature>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    x: 380,
    y: 40,
  },
};
