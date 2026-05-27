import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { Palette } from '../index';
import type { SystemHint } from '../index';
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

describe('Palette — derived group', () => {
  it('renders DERIVED FROM TIMINGS group header when derived profiles exist', () => {
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Lead_time',
          derived: true,
          derivationSource: 'timings',
          primary: { kind: 'numeric', label: 'numeric · duration', detail: {} },
        }),
      ],
    });
    const derivedGroup = screen.getByTestId('palette-group-derived-timings');
    expect(derivedGroup).toBeInTheDocument();
    expect(derivedGroup).toHaveTextContent('DERIVED FROM TIMINGS');
  });

  it('does NOT render derived group header when no derived profiles exist', () => {
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Speed',
          primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
        }),
      ],
    });
    expect(screen.queryByTestId('palette-group-derived-timings')).toBeNull();
    expect(screen.queryByTestId('palette-group-derived-formula')).toBeNull();
  });

  it('renders derived chips with derived=true in derived group', () => {
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Lead_time',
          derived: true,
          derivationSource: 'timings',
          primary: { kind: 'numeric', label: 'numeric · duration', detail: {} },
        }),
      ],
    });
    expect(screen.getByText('✨')).toBeInTheDocument();
  });

  it('renders derived group between time-id and other in canonical order', () => {
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Speed',
          primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
        }),
        createTestColumnParsingProfile({
          columnName: 'Lead_time',
          derived: true,
          derivationSource: 'timings',
          primary: { kind: 'numeric', label: 'numeric · duration', detail: {} },
        }),
        createTestColumnParsingProfile({
          columnName: 'Notes',
          primary: { kind: 'text', label: 'text', detail: {} },
        }),
      ],
    });
    const groups = screen.getAllByTestId(/^palette-group-/);
    const testIds = groups.map(g => g.getAttribute('data-testid'));
    const derivedIdx = testIds.indexOf('palette-group-derived-timings');
    const otherIdx = testIds.indexOf('palette-group-other');
    const numericIdx = testIds.indexOf('palette-group-numeric');
    expect(numericIdx).toBeLessThan(derivedIdx);
    expect(derivedIdx).toBeLessThan(otherIdx);
  });

  it('derived profile with undefined derivationSource routes to fallback group labeled DERIVED', () => {
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Lead_time',
          derived: true,
          // no derivationSource — defensive fallback group with neutral label
          primary: { kind: 'numeric', label: 'numeric · duration', detail: {} },
        }),
      ],
    });
    const derivedGroup = screen.getByTestId('palette-group-derived-fallback');
    expect(derivedGroup).toBeInTheDocument();
    expect(derivedGroup).toHaveTextContent('DERIVED');
  });

  it('renders TIMINGS and FORMULA derived groups as separate sections when both kinds present', () => {
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Lead_time',
          derived: true,
          derivationSource: 'timings',
          primary: { kind: 'numeric', label: 'numeric · duration', detail: {} },
        }),
        createTestColumnParsingProfile({
          columnName: 'Yield_pct',
          derived: true,
          derivationSource: 'formula',
          primary: { kind: 'numeric', label: 'numeric · derived', detail: {} },
        }),
      ],
    });
    const timingsGroup = screen.getByTestId('palette-group-derived-timings');
    const formulaGroup = screen.getByTestId('palette-group-derived-formula');
    expect(timingsGroup).toHaveTextContent('DERIVED FROM TIMINGS');
    expect(timingsGroup).toHaveTextContent('Lead_time');
    expect(timingsGroup).not.toHaveTextContent('Yield_pct');
    expect(formulaGroup).toHaveTextContent('DERIVED FROM FORMULA');
    expect(formulaGroup).toHaveTextContent('Yield_pct');
    expect(formulaGroup).not.toHaveTextContent('Lead_time');
  });

  it('raw (non-derived) profiles still route to their kind-based group', () => {
    renderPalette({
      profiles: [
        createTestColumnParsingProfile({
          columnName: 'Speed',
          primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
        }),
        createTestColumnParsingProfile({
          columnName: 'Lead_time',
          derived: true,
          derivationSource: 'timings',
          primary: { kind: 'numeric', label: 'numeric · duration', detail: {} },
        }),
      ],
    });
    const numericGroup = screen.getByTestId('palette-group-numeric');
    expect(numericGroup).toHaveTextContent('Speed');
    expect(numericGroup).not.toHaveTextContent('Lead_time');
    const derivedGroup = screen.getByTestId('palette-group-derived-timings');
    expect(derivedGroup).toHaveTextContent('Lead_time');
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

describe('Palette — systemHints', () => {
  const numericProfile = createTestColumnParsingProfile({
    columnName: 'Speed',
    primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
  });

  it('no hints by default — palette-system-hints wrapper not rendered', () => {
    renderPalette({ profiles: [numericProfile] });
    expect(screen.queryByTestId('palette-system-hints')).toBeNull();
  });

  it('empty array — palette-system-hints wrapper not rendered', () => {
    renderPalette({ profiles: [numericProfile], systemHints: [] });
    expect(screen.queryByTestId('palette-system-hints')).toBeNull();
  });

  it('single batch hint renders banner above chip groups', () => {
    const onCta = vi.fn();
    const hints: SystemHint[] = [
      {
        id: 'batch-1',
        kind: 'batch',
        message: '💡 Batch data detected',
        ctaLabel: 'Calculate yield ratios →',
        onCta,
      },
    ];
    renderPalette({ profiles: [numericProfile], systemHints: hints });

    const wrapper = screen.getByTestId('palette-system-hints');
    expect(wrapper).toBeInTheDocument();

    const banner = screen.getByTestId('system-hint-banner-batch');
    expect(banner).toBeInTheDocument();

    // Banner wrapper appears before chip groups in DOM order
    const palette = screen.getByTestId('palette');
    const chipGroup = screen.getByTestId('palette-group-numeric');
    const wrapperPos = wrapper.compareDocumentPosition(chipGroup);
    // DOCUMENT_POSITION_FOLLOWING (4) means chipGroup comes after wrapper
    expect(wrapperPos & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // Also verify palette is the parent that contains both
    expect(palette.contains(wrapper)).toBe(true);
    expect(palette.contains(chipGroup)).toBe(true);
  });

  it('multiple hints render in array order', () => {
    const hints: SystemHint[] = [
      { id: 'batch-1', kind: 'batch', message: '💡 Batch data detected' },
      { id: 'time-1', kind: 'time', message: '💡 6 time columns detected' },
    ];
    renderPalette({ profiles: [numericProfile], systemHints: hints });

    const banners = screen.getAllByRole('region', { name: 'System hint' });
    expect(banners).toHaveLength(2);
    expect(banners[0].getAttribute('data-testid')).toBe('system-hint-banner-batch');
    expect(banners[1].getAttribute('data-testid')).toBe('system-hint-banner-time');
  });

  it('CTA click wires through to hint onCta callback', () => {
    const onCta = vi.fn();
    const hints: SystemHint[] = [
      {
        id: 'batch-1',
        kind: 'batch',
        message: '💡 Batch data detected',
        ctaLabel: 'Calculate yield ratios →',
        onCta,
      },
    ];
    renderPalette({ profiles: [numericProfile], systemHints: hints });

    fireEvent.click(screen.getByTestId('system-hint-banner-batch-cta'));
    expect(onCta).toHaveBeenCalledTimes(1);
  });
});
