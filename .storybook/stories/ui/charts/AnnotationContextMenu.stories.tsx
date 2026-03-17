import type { Meta, StoryObj } from '@storybook/react';
import { AnnotationContextMenu } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Charts/AnnotationContextMenu',
  component: AnnotationContextMenu,
  tags: ['autodocs'],
} satisfies Meta<typeof AnnotationContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    x: 200,
    y: 150,
    category: 'Line B',
    onHighlight: () => {},
    onAddObservation: () => {},
    onClose: () => {},
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    x: 0,
    y: 0,
    category: '',
    onHighlight: () => {},
    onAddObservation: () => {},
    onClose: () => {},
  },
};
