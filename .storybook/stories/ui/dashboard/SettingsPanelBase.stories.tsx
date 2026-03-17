import type { Meta, StoryObj } from '@storybook/react';
import { SettingsPanelBase } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Dashboard/SettingsPanelBase',
  component: SettingsPanelBase,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SettingsPanelBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    settings: {
      yAxisLocked: false,
      showSpecs: true,
      cpkTarget: 1.33,
      showFilterContext: true,
      textSize: 'medium',
    },
    onSettingsChange: () => {},
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    settings: {
      yAxisLocked: false,
      showSpecs: true,
      cpkTarget: 1.33,
      showFilterContext: true,
      textSize: 'medium',
    },
    onSettingsChange: () => {},
  },
};
