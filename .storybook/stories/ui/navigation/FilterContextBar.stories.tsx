import type { Meta, StoryObj } from '@storybook/react';
import {
  FilterContextBar,
  filterContextBarDefaultColorScheme,
} from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Navigation/FilterContextBar',
  component: FilterContextBar,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof FilterContextBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    filters: [
      { factor: 'Machine', values: ['Line A'] },
      { factor: 'Operator', values: ['Alice'] },
    ],
    colorScheme: filterContextBarDefaultColorScheme,
  },
};

export const NoFilters: Story = {
  args: {
    filters: [],
    colorScheme: filterContextBarDefaultColorScheme,
  },
};

export const ManyFilters: Story = {
  args: {
    filters: [
      { factor: 'Machine', values: ['Line A'] },
      { factor: 'Operator', values: ['Alice', 'Bob'] },
      { factor: 'Shift', values: ['Morning'] },
    ],
    colorScheme: filterContextBarDefaultColorScheme,
  },
};
