import type { Meta, StoryObj } from '@storybook/react';
import { WhatIfPageBase, whatIfPageDefaultColorScheme } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Simulation/WhatIfPageBase',
  component: WhatIfPageBase,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof WhatIfPageBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    factors: [{ name: 'Machine', currentValue: 'Line A', levels: ['Line A', 'Line B', 'Line C'] }],
    baselineStats: { mean: 10.0, stdDev: 0.3, cpk: 1.28 },
    onSimulate: () => {},
    onClose: () => {},
    colorScheme: whatIfPageDefaultColorScheme,
  },
};
