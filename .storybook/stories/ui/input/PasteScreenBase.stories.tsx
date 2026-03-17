import type { Meta, StoryObj } from '@storybook/react';
import PasteScreenBase, {
  pasteScreenDefaultColorScheme,
} from '../../../../packages/ui/src/components/PasteScreen';

const meta = {
  title: 'UI/Input/PasteScreenBase',
  component: PasteScreenBase,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PasteScreenBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onPaste: () => {},
    onFileSelect: () => {},
    colorScheme: pasteScreenDefaultColorScheme,
  },
};
