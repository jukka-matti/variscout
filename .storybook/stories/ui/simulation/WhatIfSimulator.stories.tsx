import type { Meta, StoryObj } from '@storybook/react';
import {
  WhatIfSimulator,
  whatIfSimulatorDefaultColorScheme,
} from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Simulation/WhatIfSimulator',
  component: WhatIfSimulator,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof WhatIfSimulator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    factors: [
      { name: 'Machine', currentValue: 'Line B', levels: ['Line A', 'Line B', 'Line C'] },
      { name: 'Temperature', currentValue: 185, min: 170, max: 200 },
    ],
    baselineStats: { mean: 10.3, stdDev: 0.4, cpk: 0.92 },
    onSimulate: () => {},
    colorScheme: whatIfSimulatorDefaultColorScheme,
  },
};
