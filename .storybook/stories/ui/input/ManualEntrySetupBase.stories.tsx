import type { Meta, StoryObj } from '@storybook/react';
import { ManualEntrySetupBase } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Input/ManualEntrySetupBase',
  component: ManualEntrySetupBase,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ManualEntrySetupBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onConfigConfirm: () => {},
    maxFactors: 3,
  },
};

export const AzureMaxFactors: Story = {
  args: {
    onConfigConfirm: () => {},
    maxFactors: 6,
  },
};
