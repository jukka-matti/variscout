import type { Meta, StoryObj } from '@storybook/react';
import { DataTableBase } from '../../../../packages/ui/src/index';

const mockRows = Array.from({ length: 20 }, (_, i) => ({
  Date: `2026-03-${String(i + 1).padStart(2, '0')}`,
  Weight: (10 + (Math.random() - 0.5) * 2).toFixed(2),
  Machine: ['A', 'B', 'C'][i % 3],
  Operator: ['Alice', 'Bob'][i % 2],
}));

const meta = {
  title: 'UI/Data/DataTableBase',
  component: DataTableBase,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof DataTableBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: mockRows,
    columns: ['Date', 'Weight', 'Machine', 'Operator'],
    measureColumn: 'Weight',
  },
};

export const EmptyData: Story = {
  args: {
    data: [],
    columns: ['Date', 'Weight', 'Machine'],
    measureColumn: 'Weight',
  },
};
