import type { Meta, StoryObj } from '@storybook/react';
import { DashboardGrid } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Dashboard/DashboardGrid',
  component: DashboardGrid,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DashboardGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <div style={{ background: '#1e293b', borderRadius: 8, padding: 16, minHeight: 200 }}>
          <span style={{ color: '#94a3b8' }}>I-Chart slot</span>
        </div>
        <div style={{ background: '#1e293b', borderRadius: 8, padding: 16, minHeight: 200 }}>
          <span style={{ color: '#94a3b8' }}>Boxplot slot</span>
        </div>
        <div style={{ background: '#1e293b', borderRadius: 8, padding: 16, minHeight: 200 }}>
          <span style={{ color: '#94a3b8' }}>Pareto slot</span>
        </div>
        <div style={{ background: '#1e293b', borderRadius: 8, padding: 16, minHeight: 200 }}>
          <span style={{ color: '#94a3b8' }}>Stats slot</span>
        </div>
      </>
    ),
  },
};
