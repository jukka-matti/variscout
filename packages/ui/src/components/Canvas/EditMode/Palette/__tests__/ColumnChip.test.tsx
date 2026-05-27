import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
