import type { Meta, StoryObj } from '@storybook/react';
import { UpgradePrompt } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Utilities/UpgradePrompt',
  component: UpgradePrompt,
  tags: ['autodocs'],
} satisfies Meta<typeof UpgradePrompt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    feature: 'Performance Mode',
    description:
      'Analyze up to 1,500 measurement channels simultaneously with the Azure Standard plan.',
  },
};

export const ChannelLimit: Story = {
  args: {
    feature: 'More Channels',
    description:
      'The free tier supports up to 5 channels. Upgrade to Azure for up to 1,500 channels.',
    currentCount: 5,
    maxCount: 5,
  },
};
