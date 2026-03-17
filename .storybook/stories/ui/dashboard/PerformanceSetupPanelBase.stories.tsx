import type { Meta, StoryObj } from '@storybook/react';
import {
  PerformanceSetupPanelBase,
  performanceSetupPanelDefaultColorScheme,
} from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Dashboard/PerformanceSetupPanelBase',
  component: PerformanceSetupPanelBase,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PerformanceSetupPanelBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    channels: [
      {
        id: 'Valve 1',
        label: 'Valve 1',
        n: 30,
        preview: { min: 9.2, max: 10.8, mean: 10.0 },
        matchedPattern: true,
      },
      {
        id: 'Valve 2',
        label: 'Valve 2',
        n: 30,
        preview: { min: 9.5, max: 10.5, mean: 10.0 },
        matchedPattern: true,
      },
      {
        id: 'Valve 3',
        label: 'Valve 3',
        n: 30,
        preview: { min: 9.0, max: 11.0, mean: 10.1 },
        matchedPattern: true,
      },
    ],
    selectedChannels: ['Valve 1', 'Valve 2', 'Valve 3'],
    specs: { usl: 11.0, lsl: 9.0, target: 10.0 },
    onChannelToggle: () => {},
    onSpecsChange: () => {},
    onConfirm: () => {},
    colorScheme: performanceSetupPanelDefaultColorScheme,
    tier: { maxChannels: 5, isPaidTier: false },
  },
};
