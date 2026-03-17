import type { Meta, StoryObj } from '@storybook/react';
import {
  FilterChipDropdown,
  filterChipDropdownDefaultColorScheme,
} from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Navigation/FilterChipDropdown',
  component: FilterChipDropdown,
  tags: ['autodocs'],
} satisfies Meta<typeof FilterChipDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    factorName: 'Machine',
    values: ['Line A', 'Line B', 'Line C', 'Line D'],
    selectedValues: ['Line A'],
    onSelectionChange: () => {},
    colorScheme: filterChipDropdownDefaultColorScheme,
  },
};

export const MultipleSelected: Story = {
  args: {
    factorName: 'Operator',
    values: ['Alice', 'Bob', 'Carol'],
    selectedValues: ['Alice', 'Bob'],
    onSelectionChange: () => {},
    colorScheme: filterChipDropdownDefaultColorScheme,
  },
};

export const NoneSelected: Story = {
  args: {
    factorName: 'Shift',
    values: ['Morning', 'Afternoon', 'Night'],
    selectedValues: [],
    onSelectionChange: () => {},
    colorScheme: filterChipDropdownDefaultColorScheme,
  },
};
