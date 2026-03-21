// vi.mock() calls MUST be placed before component imports to avoid infinite re-render loops.
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../hooks', () => ({
  useIsMobile: () => false,
  BREAKPOINTS: { phone: 640, mobile: 768, desktop: 1024, large: 1280 },
}));

vi.mock('@variscout/hooks', () => {
  const catalog: Record<string, string> = {
    'specs.editTitle': 'Edit Specifications',
    'action.save': 'Save',
    'charType.nominal': 'Nominal',
    'charType.nominalDesc': 'Target-centered (e.g. fill weight)',
    'charType.smaller': 'Smaller is better',
    'charType.smallerDesc': 'Lower is better (e.g. defects)',
    'charType.larger': 'Larger is better',
    'charType.largerDesc': 'Higher is better (e.g. yield)',
  };
  return {
    useTranslation: () => ({
      t: (key: string) => catalog[key] ?? key,
      locale: 'en',
    }),
  };
});

vi.mock('@variscout/core', () => ({
  inferCharacteristicType: vi.fn(() => 'nominal'),
}));

vi.mock('lucide-react', () => ({
  X: ({ size }: { size?: number }) => <span data-testid="icon-x" data-size={size} />,
  Save: ({ size }: { size?: number }) => <span data-testid="icon-save" data-size={size} />,
  MoveVertical: ({ size }: { size?: number }) => (
    <span data-testid="icon-nominal" data-size={size} />
  ),
  ArrowDown: ({ size }: { size?: number }) => <span data-testid="icon-smaller" data-size={size} />,
  ArrowUp: ({ size }: { size?: number }) => <span data-testid="icon-larger" data-size={size} />,
}));

import { render, screen, fireEvent } from '@testing-library/react';
import { inferCharacteristicType } from '@variscout/core';
import SpecEditor from '../SpecEditor';
import type { SpecLimits } from '@variscout/core';

const mockedInfer = vi.mocked(inferCharacteristicType);

describe('SpecEditor', () => {
  const defaultSpecs: SpecLimits = { lsl: 10, target: 15, usl: 20 };
  const emptySpecs: SpecLimits = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let onSave: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let onClose: any;

  beforeEach(() => {
    onSave = vi.fn();
    onClose = vi.fn();
    mockedInfer.mockReturnValue('nominal');
  });

  // --- Test 1: Renders all three limit inputs with initial values ---
  it('renders LSL, Target, and USL inputs with initial values', () => {
    render(<SpecEditor specs={defaultSpecs} onSave={onSave} onClose={onClose} />);

    const lslInput = screen.getByLabelText('Lower specification limit') as HTMLInputElement;
    const targetInput = screen.getByLabelText('Target specification') as HTMLInputElement;
    const uslInput = screen.getByLabelText('Upper specification limit') as HTMLInputElement;

    expect(lslInput.value).toBe('10');
    expect(targetInput.value).toBe('15');
    expect(uslInput.value).toBe('20');
  });

  // --- Test 2: Renders 3 characteristic type icon buttons ---
  it('renders 3 characteristic type icon buttons', () => {
    render(<SpecEditor specs={emptySpecs} onSave={onSave} onClose={onClose} />);

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);

    expect(screen.getByLabelText(/^Nominal/)).toBeTruthy();
    expect(screen.getByLabelText(/^Smaller is better/)).toBeTruthy();
    expect(screen.getByLabelText(/^Larger is better/)).toBeTruthy();
  });

  // --- Test 3: No icon selected by default when characteristicType is undefined (auto mode) ---
  it('has no icon explicitly selected by default when specs.characteristicType is undefined', () => {
    render(<SpecEditor specs={emptySpecs} onSave={onSave} onClose={onClose} />);

    const radios = screen.getAllByRole('radio');
    // None should be aria-checked=true (all auto)
    radios.forEach(radio => {
      expect(radio.getAttribute('aria-checked')).toBe('false');
    });
  });

  // --- Test 4: Selected type is pre-selected when characteristicType is provided ---
  it('pre-selects the provided characteristicType', () => {
    render(
      <SpecEditor
        specs={{ ...defaultSpecs, characteristicType: 'smaller' }}
        onSave={onSave}
        onClose={onClose}
      />
    );

    const smallerButton = screen.getByLabelText(/^Smaller is better/);
    expect(smallerButton.getAttribute('aria-checked')).toBe('true');

    const nominalButton = screen.getByLabelText(/^Nominal/);
    expect(nominalButton.getAttribute('aria-checked')).toBe('false');
  });

  // --- Test 5: Clicking an icon button selects it ---
  it('selects an icon button when clicked', () => {
    render(<SpecEditor specs={emptySpecs} onSave={onSave} onClose={onClose} />);

    const largerButton = screen.getByLabelText(/^Larger is better/);
    expect(largerButton.getAttribute('aria-checked')).toBe('false');

    fireEvent.click(largerButton);

    expect(largerButton.getAttribute('aria-checked')).toBe('true');
  });

  // --- Test 6: Clicking an active icon toggles back to auto ---
  it('resets to auto when the active icon is clicked again', () => {
    render(<SpecEditor specs={emptySpecs} onSave={onSave} onClose={onClose} />);

    const nominalButton = screen.getByLabelText(/^Nominal/);

    // Click to select
    fireEvent.click(nominalButton);
    expect(nominalButton.getAttribute('aria-checked')).toBe('true');

    // Click again to deselect (reset to auto)
    fireEvent.click(nominalButton);
    expect(nominalButton.getAttribute('aria-checked')).toBe('false');
  });

  // --- Test 7: Save passes characteristicType when a type is explicitly selected ---
  it('passes characteristicType through onSave when explicitly selected', () => {
    render(<SpecEditor specs={emptySpecs} onSave={onSave} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText(/^Nominal/));
    fireEvent.click(screen.getByText('Save'));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ characteristicType: 'nominal' }));
  });

  // --- Test 8: Save omits characteristicType when no icon is selected (auto) ---
  it('omits characteristicType (undefined) when no icon is selected', () => {
    render(<SpecEditor specs={emptySpecs} onSave={onSave} onClose={onClose} />);

    // No icon selected by default
    fireEvent.click(screen.getByText('Save'));

    expect(onSave).toHaveBeenCalledTimes(1);
    const savedSpecs = onSave.mock.calls[0][0];
    expect(savedSpecs.characteristicType).toBeUndefined();
  });

  // --- Test 9: Save passes parsed numeric values ---
  it('passes parsed numeric values through onSave', () => {
    render(<SpecEditor specs={defaultSpecs} onSave={onSave} onClose={onClose} />);

    // Change the USL value
    const uslInput = screen.getByLabelText('Upper specification limit');
    fireEvent.change(uslInput, { target: { value: '25.5' } });

    fireEvent.click(screen.getByText('Save'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        lsl: 10,
        target: 15,
        usl: 25.5,
      })
    );
  });

  // --- Test 10: Close button calls onClose ---
  it('calls onClose when the close button is clicked', () => {
    render(<SpecEditor specs={emptySpecs} onSave={onSave} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('Close specification editor'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // --- Test 11: Shows auto-detected type hint when no icon selected and limits are set ---
  it('shows detected type hint when no icon is selected and limits are set', () => {
    mockedInfer.mockReturnValue('smaller');

    render(<SpecEditor specs={{ usl: 20 }} onSave={onSave} onClose={onClose} />);

    expect(screen.getByText('detected:')).toBeTruthy();
    expect(screen.getByText('smaller')).toBeTruthy();
  });

  it('does not show detected hint when no limits are set', () => {
    render(<SpecEditor specs={emptySpecs} onSave={onSave} onClose={onClose} />);

    expect(screen.queryByText('detected:')).toBeNull();
  });

  it('does not show detected hint when an icon is explicitly selected', () => {
    render(<SpecEditor specs={{ usl: 20 }} onSave={onSave} onClose={onClose} />);

    // Click Nominal icon to explicitly select
    fireEvent.click(screen.getByLabelText(/^Nominal/));

    expect(screen.queryByText('detected:')).toBeNull();
  });

  it('passes undefined for empty numeric inputs', () => {
    render(<SpecEditor specs={defaultSpecs} onSave={onSave} onClose={onClose} />);

    // Clear the LSL input
    const lslInput = screen.getByLabelText('Lower specification limit');
    fireEvent.change(lslInput, { target: { value: '' } });

    fireEvent.click(screen.getByText('Save'));

    const savedSpecs = onSave.mock.calls[0][0];
    expect(savedSpecs.lsl).toBeUndefined();
    expect(savedSpecs.target).toBe(15);
    expect(savedSpecs.usl).toBe(20);
  });

  it('calls onClose after onSave when saving', () => {
    render(<SpecEditor specs={defaultSpecs} onSave={onSave} onClose={onClose} />);

    fireEvent.click(screen.getByText('Save'));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
