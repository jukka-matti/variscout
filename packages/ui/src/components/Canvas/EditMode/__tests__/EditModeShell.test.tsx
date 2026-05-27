import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { EditModeShell } from '../EditModeShell';
import type { ColumnParsingProfile } from '@variscout/core/parser';
import { createTestColumnParsingProfile } from '../../../../test-utils/columnParsingProfile';
import { createTestOutcomeSpec } from '../../../../test-utils/outcomeSpec';
import { createTestFactorControl } from '../../../../test-utils/factorControl';

describe('EditModeShell', () => {
  it('renders the three zone placeholders by name', () => {
    render(
      <DndContext>
        <EditModeShell onDone={() => undefined}>
          <div data-testid="canvas-slot">canvas</div>
        </EditModeShell>
      </DndContext>
    );
    expect(screen.getByTestId('edit-mode-shell')).toBeInTheDocument();
    expect(screen.getByTestId('edit-mode-zone-palette')).toBeInTheDocument();
    expect(screen.getByTestId('edit-mode-zone-outcomes-factors')).toBeInTheDocument();
    expect(screen.getByTestId('edit-mode-zone-process')).toBeInTheDocument();
  });

  it('renders provided children inside the process zone', () => {
    render(
      <DndContext>
        <EditModeShell onDone={() => undefined}>
          <div data-testid="canvas-slot">canvas</div>
        </EditModeShell>
      </DndContext>
    );
    const processZone = screen.getByTestId('edit-mode-zone-process');
    expect(processZone).toContainElement(screen.getByTestId('canvas-slot'));
  });

  it('exposes a Done button that calls onDone when clicked', () => {
    const onDone = vi.fn();
    render(
      <DndContext>
        <EditModeShell onDone={onDone}>
          <div>canvas</div>
        </EditModeShell>
      </DndContext>
    );
    const doneButton = screen.getByRole('button', { name: 'Done' });
    fireEvent.click(doneButton);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('renders the Edit map header title', () => {
    render(
      <DndContext>
        <EditModeShell onDone={() => undefined}>
          <div>canvas</div>
        </EditModeShell>
      </DndContext>
    );
    expect(screen.getByText('Edit map')).toBeInTheDocument();
  });

  it('labels palette and outcomes-factors zones as B2/C-phase placeholders', () => {
    render(
      <DndContext>
        <EditModeShell onDone={() => undefined}>
          <div>canvas</div>
        </EditModeShell>
      </DndContext>
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

describe('EditModeShell — Palette callback forwarding', () => {
  it('forwards onMenuItemSelect from chip context menu through to the host', () => {
    const onMenuItemSelect = vi.fn();
    render(
      <DndContext>
        <EditModeShell
          onDone={() => {}}
          profiles={[
            createTestColumnParsingProfile({
              columnName: 'Speed',
              primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
            }),
          ]}
          numericValuesByColumn={{}}
          onMenuItemSelect={onMenuItemSelect}
        >
          <div />
        </EditModeShell>
      </DndContext>
    );
    fireEvent.click(screen.getByTestId('column-chip-context-button'));
    fireEvent.click(screen.getByText('Bin into categorical…'));
    expect(onMenuItemSelect).toHaveBeenCalledWith('Speed', 'bin-into-categorical');
  });
});

describe('EditModeShell — OutcomeZone wiring (C1)', () => {
  it('renders OutcomeZone in the outcomes-factors zone (replaces top-half placeholder)', () => {
    render(
      <DndContext>
        <EditModeShell onDone={vi.fn()} outcomeSpecs={[]}>
          <div>process content</div>
        </EditModeShell>
      </DndContext>
    );
    expect(screen.getByTestId('outcome-zone')).toBeInTheDocument();
    expect(
      screen.queryByText(/outcome and factor zones arrive in phase c/i)
    ).not.toBeInTheDocument();
  });

  it('forwards onOutcomeSpecUpdate to OutcomeZone via the OutcomeSpecsPopover Apply', () => {
    const onOutcomeSpecUpdate = vi.fn();
    const spec = createTestOutcomeSpec({ id: 'o-1', columnName: 'A' });
    render(
      <DndContext>
        <EditModeShell
          onDone={vi.fn()}
          outcomeSpecs={[spec]}
          onOutcomeSpecUpdate={onOutcomeSpecUpdate}
        >
          <div>process content</div>
        </EditModeShell>
      </DndContext>
    );
    fireEvent.click(screen.getByRole('button', { name: /edit specs/i }));
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(onOutcomeSpecUpdate).toHaveBeenCalledWith('o-1', expect.objectContaining({ id: 'o-1' }));
  });
});

describe('EditModeShell — FactorZone wiring (C2)', () => {
  it('renders FactorZone in outcomes-factors zone (replaces Factor zone arrives in C2 placeholder)', () => {
    render(
      <DndContext>
        <EditModeShell onDone={vi.fn()} factorControls={[]}>
          <div>process content</div>
        </EditModeShell>
      </DndContext>
    );
    expect(screen.getByTestId('factor-zone-global')).toBeInTheDocument();
    expect(screen.queryByText(/factor zone arrives in c2/i)).not.toBeInTheDocument();
  });

  it('renders FactorChips for provided controls', () => {
    render(
      <DndContext>
        <EditModeShell
          onDone={vi.fn()}
          factorControls={[createTestFactorControl({ factor: 'Temp', targetCondition: 'low' })]}
        >
          <div>process content</div>
        </EditModeShell>
      </DndContext>
    );
    expect(screen.getByText('Temp')).toBeInTheDocument();
  });

  it('forwards onFactorControlUpdate via the FactorSpecsPopover Apply', () => {
    const onFactorControlUpdate = vi.fn();
    render(
      <DndContext>
        <EditModeShell
          onDone={vi.fn()}
          factorControls={[createTestFactorControl({ factor: 'Temp' })]}
          onFactorControlUpdate={onFactorControlUpdate}
        >
          <div>process content</div>
        </EditModeShell>
      </DndContext>
    );
    fireEvent.click(screen.getByRole('button', { name: /edit factor/i }));
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(onFactorControlUpdate).toHaveBeenCalledWith(
      'Temp',
      expect.objectContaining({ factor: 'Temp' })
    );
  });

  it('passes steps to FactorSpecsPopover for step-binding selection', () => {
    render(
      <DndContext>
        <EditModeShell
          onDone={vi.fn()}
          factorControls={[createTestFactorControl()]}
          steps={[{ id: 's-mix', name: 'Mix' }]}
        >
          <div>process content</div>
        </EditModeShell>
      </DndContext>
    );
    fireEvent.click(screen.getByRole('button', { name: /edit factor/i }));
    expect(screen.getByRole('option', { name: /^mix/i })).toBeInTheDocument();
  });
});
