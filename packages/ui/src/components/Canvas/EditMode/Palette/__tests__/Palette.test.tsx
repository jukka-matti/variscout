import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { Palette } from '../index';
import { createTestColumnParsingProfile } from '../../../../../test-utils/columnParsingProfile';

const renderPalette = (props: Partial<React.ComponentProps<typeof Palette>>) =>
  render(
    <DndContext>
      <Palette profiles={[]} numericValuesByColumn={{}} {...props} />
    </DndContext>
  );

describe('Palette', () => {
  it('renders groups in canonical order: numeric → categorical → time-id → other', () => {
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Notes',
          primary: { kind: 'text', label: 'text', detail: {} },
        }),
        createTestColumnParsingProfile({
          columnName: 'Date',
          primary: { kind: 'date', label: 'ISO date (YYYY-MM-DD)', detail: {} },
        }),
        createTestColumnParsingProfile({
          columnName: 'Speed',
          primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
        }),
        createTestColumnParsingProfile({
          columnName: 'Line',
          primary: { kind: 'categorical', label: 'categorical · 2 levels', detail: {} },
        }),
      ],
    });
    const groups = screen.getAllByTestId(/^palette-group-/);
    expect(groups.map(g => g.getAttribute('data-testid'))).toEqual([
      'palette-group-numeric',
      'palette-group-categorical',
      'palette-group-time-id',
      'palette-group-other',
    ]);
  });

  it('groups date + id kinds together under Time / ID', () => {
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'BatchId',
          primary: { kind: 'id', label: 'id · 5 unique', detail: {} },
        }),
        createTestColumnParsingProfile({
          columnName: 'ShipDate',
          primary: { kind: 'date', label: 'DD/MM/YYYY', detail: {} },
        }),
      ],
    });
    const timeIdGroup = screen.getByTestId('palette-group-time-id');
    expect(timeIdGroup).toHaveTextContent('Time / ID · 2');
  });

  it('omits empty groups', () => {
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Speed',
          primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
        }),
      ],
    });
    expect(screen.queryByTestId('palette-group-categorical')).toBeNull();
    expect(screen.queryByTestId('palette-group-time-id')).toBeNull();
    expect(screen.queryByTestId('palette-group-other')).toBeNull();
  });

  it('renders an empty-state hint when profiles is empty', () => {
    renderPalette({ profiles: [] });
    expect(screen.getByText(/no columns yet/i)).toBeInTheDocument();
  });

  it('passes numericValuesByColumn through to chips', () => {
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Speed',
          primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
        }),
      ],
      numericValuesByColumn: { Speed: [1, 2, 3, 4, 5] },
    });
    expect(screen.getByTestId('column-chip-sparkline')).toBeInTheDocument();
  });
});
