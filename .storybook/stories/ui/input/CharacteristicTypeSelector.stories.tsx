import type { Meta, StoryObj } from '@storybook/react';
import CharacteristicTypeSelector from '../../../../packages/ui/src/components/CharacteristicTypeSelector';

const meta = {
  title: 'UI/Input/CharacteristicTypeSelector',
  component: CharacteristicTypeSelector,
  tags: ['autodocs'],
} satisfies Meta<typeof CharacteristicTypeSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: {
    value: 'nominal',
    onChange: () => {},
  },
};

export const SmallerIsBetter: Story = {
  args: {
    value: 'smaller',
    onChange: () => {},
  },
};

export const LargerIsBetter: Story = {
  args: {
    value: 'larger',
    onChange: () => {},
  },
};
