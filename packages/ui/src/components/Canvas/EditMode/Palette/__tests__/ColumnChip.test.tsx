import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { ColumnChip } from '../ColumnChip';
import { createTestColumnParsingProfile } from '../../../../../test-utils/columnParsingProfile';

const renderChip = (props: Partial<React.ComponentProps<typeof ColumnChip>> = {}) =>
  render(
    <DndContext>
      <ColumnChip profile={createTestColumnParsingProfile()} {...props} />
    </DndContext>
  );

describe('ColumnChip — base render', () => {
  it('renders the columnName', () => {
    renderChip({ profile: createTestColumnParsingProfile({ columnName: 'Speed' }) });
    expect(screen.getByText('Speed')).toBeInTheDocument();
  });

  it('renders the primary.label interpretation line', () => {
    renderChip({
      profile: createTestColumnParsingProfile({
        primary: { kind: 'numeric', label: 'numeric · EU decimal', detail: {} },
      }),
    });
    expect(screen.getByText('numeric · EU decimal')).toBeInTheDocument();
  });

  it('renders ✓ badge for status=ok', () => {
    renderChip({ profile: createTestColumnParsingProfile({ status: 'ok' }) });
    expect(screen.getByTestId('column-chip-badge')).toHaveTextContent('✓');
  });

  it('renders ⚠ badge for status=warning', () => {
    renderChip({ profile: createTestColumnParsingProfile({ status: 'warning' }) });
    expect(screen.getByTestId('column-chip-badge')).toHaveTextContent('⚠');
  });

  it('renders ✗ badge for status=error', () => {
    renderChip({
      profile: createTestColumnParsingProfile({ status: 'error', primary: null }),
    });
    expect(screen.getByTestId('column-chip-badge')).toHaveTextContent('✗');
  });

  it('renders a fallback interpretation line when primary is null', () => {
    renderChip({
      profile: createTestColumnParsingProfile({ status: 'error', primary: null }),
    });
    expect(screen.getByText(/parse failed/i)).toBeInTheDocument();
  });
});

import { encodeColumnDragId } from '../encodeColumnDragId';

describe('ColumnChip — drag handle', () => {
  it('renders a drag handle with cursor-grab', () => {
    renderChip();
    const handle = screen.getByTestId('column-chip-drag-handle');
    expect(handle.className).toMatch(/cursor-grab/);
    expect(handle).toHaveTextContent('⋮⋮');
  });

  it('exposes a draggable element with the encoded column id', () => {
    renderChip({ profile: createTestColumnParsingProfile({ columnName: 'Speed' }) });
    const draggable = screen.getByTestId('column-chip');
    expect(draggable.getAttribute('data-draggable-id')).toBe(encodeColumnDragId('Speed'));
  });
});

describe('ColumnChip — affordances', () => {
  it('renders the ▾ override button and fires onOverrideOpen with columnName', () => {
    const onOverrideOpen = vi.fn();
    renderChip({
      profile: createTestColumnParsingProfile({ columnName: 'Speed' }),
      onOverrideOpen,
    });
    fireEvent.click(screen.getByTestId('column-chip-override-button'));
    expect(onOverrideOpen).toHaveBeenCalledWith('Speed');
  });

  it('renders the ⋮ context button and fires onContextMenuOpen with columnName', () => {
    const onContextMenuOpen = vi.fn();
    renderChip({
      profile: createTestColumnParsingProfile({ columnName: 'Speed' }),
      onContextMenuOpen,
    });
    fireEvent.click(screen.getByTestId('column-chip-context-button'));
    expect(onContextMenuOpen).toHaveBeenCalledWith('Speed');
  });
});

describe('ColumnChip — visual states', () => {
  it('applies dropped styling when dropped=true', () => {
    renderChip({ dropped: true });
    const chip = screen.getByTestId('column-chip');
    expect(chip.className).toMatch(/opacity-50/);
    expect(chip.className).toMatch(/bg-surface-secondary/);
  });

  it('applies ghost-suggested styling and hint pill', () => {
    renderChip({ ghostSuggested: 'factor' });
    const chip = screen.getByTestId('column-chip');
    expect(chip.className).toMatch(/border-dashed/);
    expect(chip.className).toMatch(/border-cyan-400/);
    expect(screen.getByTestId('column-chip-hint-pill')).toHaveTextContent(/factor\?/i);
  });

  it('renders different hint pill copy per ghost role', () => {
    const { rerender } = renderChip({ ghostSuggested: 'outcome' });
    expect(screen.getByTestId('column-chip-hint-pill')).toHaveTextContent(/outcome\?/i);
    rerender(
      <DndContext>
        <ColumnChip profile={createTestColumnParsingProfile()} ghostSuggested="process" />
      </DndContext>
    );
    expect(screen.getByTestId('column-chip-hint-pill')).toHaveTextContent(/process\?/i);
  });
});
