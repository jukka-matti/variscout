import type { Meta, StoryObj } from '@storybook/react';
import { MeasureColumnSelector } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Input/MeasureColumnSelector',
  component: MeasureColumnSelector,
  tags: ['autodocs'],
} satisfies Meta<typeof MeasureColumnSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    columns: ['Weight', 'Height', 'Diameter', 'Temperature'],
    selectedColumn: 'Weight',
    onColumnSelect: () => {},
  },
};

export const NoSelection: Story = {
  args: {
    columns: ['Weight', 'Height', 'Diameter'],
    selectedColumn: '',
    onColumnSelect: () => {},
  },
};
