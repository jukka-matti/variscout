import type { Meta, StoryObj } from '@storybook/react';
import { CreateFactorModal } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Input/CreateFactorModal',
  component: CreateFactorModal,
  tags: ['autodocs'],
} satisfies Meta<typeof CreateFactorModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    columns: ['Date', 'Weight', 'Machine', 'Operator'],
    measureColumn: 'Weight',
    existingFactors: ['Machine'],
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const MaxFactorsReached: Story = {
  args: {
    isOpen: true,
    columns: ['Date', 'Weight', 'Machine', 'Operator', 'Shift'],
    measureColumn: 'Weight',
    existingFactors: ['Machine', 'Operator', 'Shift'],
    onConfirm: () => {},
    onCancel: () => {},
  },
};
