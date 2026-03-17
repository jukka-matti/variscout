import type { Meta, StoryObj } from '@storybook/react';
import {
  FilterBreadcrumb,
  filterBreadcrumbDefaultColorScheme,
} from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Navigation/FilterBreadcrumb',
  component: FilterBreadcrumb,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof FilterBreadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    filters: [
      { factor: 'Machine', values: ['Line A'], contribution: 35 },
      { factor: 'Operator', values: ['Alice'], contribution: 12 },
    ],
    onRemoveFilter: () => {},
    onFilterClick: () => {},
    colorScheme: filterBreadcrumbDefaultColorScheme,
  },
};

export const SingleFilter: Story = {
  args: {
    filters: [{ factor: 'Machine', values: ['Line B'], contribution: 45 }],
    onRemoveFilter: () => {},
    onFilterClick: () => {},
    colorScheme: filterBreadcrumbDefaultColorScheme,
  },
};

export const NoFilters: Story = {
  args: {
    filters: [],
    onRemoveFilter: () => {},
    onFilterClick: () => {},
    colorScheme: filterBreadcrumbDefaultColorScheme,
  },
};
