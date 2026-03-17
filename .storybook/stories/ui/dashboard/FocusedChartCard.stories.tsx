import type { Meta, StoryObj } from '@storybook/react';
import { FocusedChartCard } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Dashboard/FocusedChartCard',
  component: FocusedChartCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof FocusedChartCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Boxplot - Machine',
    onClose: () => {},
    children: (
      <div
        style={{
          height: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
        }}
      >
        Focused chart content
      </div>
    ),
  },
};
