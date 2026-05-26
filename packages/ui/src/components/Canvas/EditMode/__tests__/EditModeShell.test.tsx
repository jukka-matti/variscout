import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditModeShell } from '../EditModeShell';

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
