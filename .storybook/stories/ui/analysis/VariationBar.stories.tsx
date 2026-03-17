import type { Meta, StoryObj } from '@storybook/react';
import { VariationBar, variationBarDefaultColorScheme } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Analysis/VariationBar',
  component: VariationBar,
  tags: ['autodocs'],
} satisfies Meta<typeof VariationBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    scopeFraction: 0.65,
    colorScheme: variationBarDefaultColorScheme,
  },
};

export const FullScope: Story = {
  args: {
    scopeFraction: 1.0,
    colorScheme: variationBarDefaultColorScheme,
  },
};

export const MinimalScope: Story = {
  args: {
    scopeFraction: 0.08,
    colorScheme: variationBarDefaultColorScheme,
  },
};

export const NoScope: Story = {
  args: {
    scopeFraction: 0,
    colorScheme: variationBarDefaultColorScheme,
  },
};
