import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('Palette — overlay state + banner', () => {
  const warningProfiles = (n: number) =>
    Array.from({ length: n }, (_, i) =>
      createTestColumnParsingProfile({
        columnName: `Col${i}`,
        status: 'warning',
        confidence: 60,
        primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
      })
    );

  it('renders ParsingBanner when warning count >= 3', () => {
    renderPalette({ profiles: warningProfiles(3) });
    expect(screen.getByTestId('parsing-banner')).toBeInTheDocument();
    expect(screen.getByText(/3 columns need attention/i)).toBeInTheDocument();
  });

  it('does not render ParsingBanner when warning count < 3', () => {
    renderPalette({ profiles: warningProfiles(2) });
    expect(screen.queryByTestId('parsing-banner')).toBeNull();
  });

  it('opens the context menu when a chip ⋮ button is clicked', () => {
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Speed',
          primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
        }),
      ],
    });
    fireEvent.click(screen.getByTestId('column-chip-context-button'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Use as continuous factor')).toBeInTheDocument();
  });

  it('opens the override popover when a chip ▾ button is clicked', () => {
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Speed',
          primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
        }),
      ],
    });
    fireEvent.click(screen.getByTestId('column-chip-override-button'));
    expect(screen.getByTestId('parsing-override-popover')).toBeInTheDocument();
  });

  it('opening the menu closes the popover (mutual exclusion)', () => {
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Speed',
          primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
        }),
      ],
    });
    fireEvent.click(screen.getByTestId('column-chip-override-button'));
    expect(screen.getByTestId('parsing-override-popover')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('column-chip-context-button'));
    expect(screen.queryByTestId('parsing-override-popover')).toBeNull();
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('forwards menu item selections via onMenuItemSelect', () => {
    const onMenuItemSelect = vi.fn();
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Speed',
          primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
        }),
      ],
      onMenuItemSelect,
    });
    fireEvent.click(screen.getByTestId('column-chip-context-button'));
    fireEvent.click(screen.getByText('Bin into categorical…'));
    expect(onMenuItemSelect).toHaveBeenCalledWith('Speed', 'bin-into-categorical');
  });

  it('forwards override choice via onOverrideAccept', () => {
    const onOverrideAccept = vi.fn();
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Speed',
          confidence: 92,
          primary: { kind: 'numeric', label: 'numeric · EU decimal', detail: {} },
          alternatives: [
            {
              interpretation: { kind: 'numeric', label: 'numeric · US format', detail: {} },
              parseCount: 5,
              totalCount: 10,
            },
          ],
        }),
      ],
      onOverrideAccept,
    });
    fireEvent.click(screen.getByTestId('column-chip-override-button'));
    fireEvent.click(screen.getByTestId('override-alternative-numeric · US format'));
    expect(onOverrideAccept).toHaveBeenCalledWith('Speed', {
      kind: 'numeric',
      label: 'numeric · US format',
      detail: {},
    });
  });

  it('clicking review on the banner fires onReviewAllWarnings', () => {
    const onReviewAllWarnings = vi.fn();
    renderPalette({ profiles: warningProfiles(3), onReviewAllWarnings });
    fireEvent.click(screen.getByRole('button', { name: /review/i }));
    expect(onReviewAllWarnings).toHaveBeenCalled();
  });
});
