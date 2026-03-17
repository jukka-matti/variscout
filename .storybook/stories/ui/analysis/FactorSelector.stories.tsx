import type { Meta, StoryObj } from '@storybook/react';
import {
  FactorSelector,
  factorSelectorDefaultColorScheme,
} from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Analysis/FactorSelector',
  component: FactorSelector,
  tags: ['autodocs'],
} satisfies Meta<typeof FactorSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    factors: ['Machine', 'Operator', 'Shift'],
    selectedFactor: 'Machine',
    onFactorChange: () => {},
    colorScheme: factorSelectorDefaultColorScheme,
  },
};

export const SingleFactor: Story = {
  args: {
    factors: ['Machine'],
    selectedFactor: 'Machine',
    onFactorChange: () => {},
    colorScheme: factorSelectorDefaultColorScheme,
  },
};

export const NoSelection: Story = {
  args: {
    factors: ['Machine', 'Operator'],
    selectedFactor: '',
    onFactorChange: () => {},
    colorScheme: factorSelectorDefaultColorScheme,
  },
};
