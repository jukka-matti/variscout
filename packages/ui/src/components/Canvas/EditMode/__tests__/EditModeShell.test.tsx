import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { EditModeShell } from '../EditModeShell';
import type { ColumnParsingProfile } from '@variscout/core/parser';
import { createTestColumnParsingProfile } from '../../../../test-utils/columnParsingProfile';

describe('EditModeShell', () => {
  it('renders the three zone placeholders by name', () => {
    render(
      <EditModeShell onDone={() => undefined}>
        <div data-testid="canvas-slot">canvas</div>
      </EditModeShell>
    );
    expect(screen.getByTestId('edit-mode-shell')).toBeInTheDocument();
    expect(screen.getByTestId('edit-mode-zone-palette')).toBeInTheDocument();
    expect(screen.getByTestId('edit-mode-zone-outcomes-factors')).toBeInTheDocument();
    expect(screen.getByTestId('edit-mode-zone-process')).toBeInTheDocument();
  });

  it('renders provided children inside the process zone', () => {
    render(
      <EditModeShell onDone={() => undefined}>
        <div data-testid="canvas-slot">canvas</div>
      </EditModeShell>
    );
    const processZone = screen.getByTestId('edit-mode-zone-process');
    expect(processZone).toContainElement(screen.getByTestId('canvas-slot'));
  });

  it('exposes a Done button that calls onDone when clicked', () => {
    const onDone = vi.fn();
    render(
      <EditModeShell onDone={onDone}>
        <div>canvas</div>
      </EditModeShell>
    );
    const doneButton = screen.getByRole('button', { name: 'Done' });
    fireEvent.click(doneButton);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('renders the Edit map header title', () => {
    render(
      <EditModeShell onDone={() => undefined}>
        <div>canvas</div>
      </EditModeShell>
    );
    expect(screen.getByText('Edit map')).toBeInTheDocument();
  });

  it('labels palette and outcomes-factors zones as B2/C-phase placeholders', () => {
    render(
      <EditModeShell onDone={() => undefined}>
        <div>canvas</div>
      </EditModeShell>
    );
    expect(screen.getByTestId('edit-mode-zone-palette')).toHaveTextContent(/Palette/);
    expect(screen.getByTestId('edit-mode-zone-outcomes-factors')).toHaveTextContent(
      /Outcomes.*Factors/
    );
  });
});

describe('EditModeShell — Palette wiring', () => {
  it('renders the Palette with the given profiles inside the palette zone', () => {
    const profiles: ColumnParsingProfile[] = [
      createTestColumnParsingProfile({ columnName: 'Speed' }),
    ];
    render(
      <DndContext>
        <EditModeShell onDone={() => {}} profiles={profiles} numericValuesByColumn={{}}>
          <div />
        </EditModeShell>
      </DndContext>
    );
    const zone = screen.getByTestId('edit-mode-zone-palette');
    expect(zone).toContainElement(screen.getByTestId('palette'));
    expect(zone).toContainElement(screen.getByText('Speed'));
  });

  it('falls back to the empty-state hint when no profiles are passed', () => {
    render(
      <DndContext>
        <EditModeShell onDone={() => {}}>
          <div />
        </EditModeShell>
      </DndContext>
    );
    expect(screen.getByTestId('palette-empty')).toBeInTheDocument();
  });
});
