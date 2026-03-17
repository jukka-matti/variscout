import type { Meta, StoryObj } from '@storybook/react';
import { DashboardChartCard } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Dashboard/DashboardChartCard',
  component: DashboardChartCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof DashboardChartCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'I-Chart',
    chartId: 'ichart',
    onFocus: () => {},
    children: (
      <div
        style={{
          height: 250,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
        }}
      >
        Chart content
      </div>
    ),
  },
};
