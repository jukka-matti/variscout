import type { Meta, StoryObj } from '@storybook/react';
import { ManualEntryBase } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Input/ManualEntryBase',
  component: ManualEntryBase,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ManualEntryBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    config: {
      measureLabel: 'Weight (g)',
      factors: [{ name: 'Machine', values: ['A', 'B', 'C'] }],
    },
    onDataSubmit: () => {},
  },
};

export const MultipleFactor: Story = {
  args: {
    config: {
      measureLabel: 'Temperature (C)',
      factors: [
        { name: 'Oven', values: ['Oven 1', 'Oven 2'] },
        { name: 'Zone', values: ['Top', 'Middle', 'Bottom'] },
      ],
    },
    onDataSubmit: () => {},
  },
};
