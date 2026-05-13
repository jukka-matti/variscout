import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { ProcessMap } from '@variscout/core/frame';
import { encodeStepDropId } from '@variscout/hooks';
import { AuthorL3View } from '../AuthorL3View';
import type { ChipRailEntry } from '../../../ChipRail';

const useDroppableMock = vi.hoisted(() => vi.fn());

vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
  useDroppable: useDroppableMock,
}));

const map: ProcessMap = {
  version: 1,
  nodes: [
    { id: 'mix', name: 'Mix', order: 0, ctqColumn: 'Temperature' },
    { id: 'pack', name: 'Pack', order: 1, ctqColumn: 'Pack Weight' },
  ],
  tributaries: [
    { id: 't-machine', stepId: 'mix', column: 'Machine' },
    { id: 't-shift', stepId: 'mix', column: 'Shift' },
    { id: 't-pack', stepId: 'pack', column: 'Carton' },
  ],
  assignments: {
    Machine: 'mix',
    Operator: 'mix',
    Temperature: 'mix',
    Carton: 'pack',
  },
  createdAt: '2026-05-13T00:00:00.000Z',
  updatedAt: '2026-05-13T00:00:00.000Z',
};

const chips: ChipRailEntry[] = [
  { chipId: 'Shift', label: 'Shift', role: 'factor' },
  { chipId: 'Batch', label: 'Batch', role: 'metadata' },
];

function renderView(overrides: Partial<ComponentProps<typeof AuthorL3View>> = {}) {
  useDroppableMock.mockReturnValue({
    setNodeRef: vi.fn(),
    isOver: false,
  });

  return render(
    <AuthorL3View hubId="hub-main" focalStepId="mix" map={map} chips={chips} {...overrides} />
  );
}

describe('AuthorL3View', () => {
  it('renders unassigned and assigned sections with focal step context without duplicate assigned labels', () => {
    renderView();

    expect(screen.getByTestId('author-l3-view')).toBeInTheDocument();
    expect(screen.getByTestId('unassigned-columns')).toBeInTheDocument();
    expect(screen.getByTestId('assigned-columns')).toBeInTheDocument();

    const unassigned = screen.getByTestId('unassigned-columns');
    expect(within(unassigned).getByTestId('chip-rail')).toBeInTheDocument();
    expect(within(unassigned).getByTestId('chip-rail-item-Shift')).toBeInTheDocument();

    const assigned = screen.getByTestId('assigned-columns');
    expect(within(assigned).getByText('Machine')).toBeInTheDocument();
    expect(within(assigned).getByText('Operator')).toBeInTheDocument();
    expect(within(assigned).getByText('Temperature')).toBeInTheDocument();
    expect(within(assigned).queryByText('Carton')).not.toBeInTheDocument();

    expect(screen.getByText('CTQ')).toBeInTheDocument();
    expect(screen.getByText('Tributary columns')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('author-l3-tributary-context')).getByText('Shift')
    ).toBeInTheDocument();
    expect(screen.getAllByText('Machine')).toHaveLength(1);
    expect(screen.getAllByText('Temperature')).toHaveLength(1);
  });

  it('exposes the encoded focal step droppable id and registers useDroppable', () => {
    renderView();

    const expectedId = encodeStepDropId('mix');
    expect(screen.getByTestId('author-l3-step-drop-target')).toHaveAttribute(
      'data-droppable-id',
      expectedId
    );
    expect(useDroppableMock).toHaveBeenCalledWith({
      id: expectedId,
      disabled: false,
    });
  });

  it('calls keyboard assignment with the focal step after picking up a chip', () => {
    const onKeyboardChipDrop = vi.fn();
    renderView({ onKeyboardChipDrop });

    fireEvent.keyDown(screen.getByTestId('chip-rail-item-Shift'), { key: 'Enter' });
    fireEvent.keyDown(screen.getByTestId('author-l3-step-drop-target'), { key: 'Enter' });

    expect(onKeyboardChipDrop).toHaveBeenCalledTimes(1);
    expect(onKeyboardChipDrop).toHaveBeenCalledWith('mix');
  });

  it('does not call keyboard assignment when disabled', () => {
    const onKeyboardChipDrop = vi.fn();
    renderView({ disabled: true, onKeyboardChipDrop });

    fireEvent.keyDown(screen.getByTestId('chip-rail-item-Shift'), { key: 'Enter' });
    fireEvent.keyDown(screen.getByTestId('author-l3-step-drop-target'), { key: 'Enter' });

    expect(screen.getByTestId('chip-rail-item-Shift')).toBeDisabled();
    expect(onKeyboardChipDrop).not.toHaveBeenCalled();
  });
});
