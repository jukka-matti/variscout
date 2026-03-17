import type { Meta, StoryObj } from '@storybook/react';
import { SpecEditor, specEditorDefaultColorScheme } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Input/SpecEditor',
  component: SpecEditor,
  tags: ['autodocs'],
} satisfies Meta<typeof SpecEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    specs: { usl: 11.0, lsl: 9.0, target: 10.0 },
    onSpecsChange: () => {},
    colorScheme: specEditorDefaultColorScheme,
  },
};

export const Empty: Story = {
  args: {
    specs: {},
    onSpecsChange: () => {},
    colorScheme: specEditorDefaultColorScheme,
  },
};

export const OneSided: Story = {
  args: {
    specs: { usl: 5.0 },
    onSpecsChange: () => {},
    colorScheme: specEditorDefaultColorScheme,
  },
};
