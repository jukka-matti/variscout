import type { Meta, StoryObj } from '@storybook/react';
import { Slider, sliderDefaultColorScheme } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Input/Slider',
  component: Slider,
  tags: ['autodocs'],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 50,
    min: 0,
    max: 100,
    onChange: () => {},
    colorScheme: sliderDefaultColorScheme,
  },
};

export const WithStep: Story = {
  args: {
    value: 25,
    min: 0,
    max: 100,
    step: 5,
    onChange: () => {},
    colorScheme: sliderDefaultColorScheme,
  },
};

export const SmallRange: Story = {
  args: {
    value: 1.33,
    min: 0,
    max: 3,
    step: 0.01,
    onChange: () => {},
    colorScheme: sliderDefaultColorScheme,
  },
};
