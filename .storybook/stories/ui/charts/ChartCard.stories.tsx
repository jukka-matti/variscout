import type { Meta, StoryObj } from '@storybook/react';
import { ChartCard } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Charts/ChartCard',
  component: ChartCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ChartCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'ichart',
    title: 'I-Chart',
    children: (
      <div
        style={{
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
        }}
      >
        Chart content area
      </div>
    ),
  },
};

export const WithActions: Story = {
  args: {
    id: 'boxplot',
    title: 'Boxplot',
    onFocus: () => {},
    children: (
      <div
        style={{
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
        }}
      >
        Chart content area
      </div>
    ),
  },
};
