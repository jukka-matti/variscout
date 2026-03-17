import type { Meta, StoryObj } from '@storybook/react';
import {
  BoxplotDisplayToggle,
  boxplotDisplayToggleDefaultColorScheme,
} from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Analysis/BoxplotDisplayToggle',
  component: BoxplotDisplayToggle,
  tags: ['autodocs'],
} satisfies Meta<typeof BoxplotDisplayToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    showViolin: false,
    showContributions: false,
    onViolinChange: () => {},
    onContributionsChange: () => {},
    colorScheme: boxplotDisplayToggleDefaultColorScheme,
  },
};

export const ViolinEnabled: Story = {
  args: {
    showViolin: true,
    showContributions: false,
    onViolinChange: () => {},
    onContributionsChange: () => {},
    colorScheme: boxplotDisplayToggleDefaultColorScheme,
  },
};

export const AllEnabled: Story = {
  args: {
    showViolin: true,
    showContributions: true,
    onViolinChange: () => {},
    onContributionsChange: () => {},
    sortBy: 'mean',
    sortDirection: 'desc',
    onSortChange: () => {},
    colorScheme: boxplotDisplayToggleDefaultColorScheme,
  },
};
