import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CharacteristicTypeSelector from '../index';

describe('CharacteristicTypeSelector', () => {
  it('renders three type buttons', () => {
    render(<CharacteristicTypeSelector value={null} onChange={vi.fn()} autoInferred="nominal" />);
    const buttons = screen.getAllByRole('radio');
    expect(buttons).toHaveLength(3);
  });

  it('marks the selected type as checked', () => {
    render(
      <CharacteristicTypeSelector value="smaller" onChange={vi.fn()} autoInferred="nominal" />
    );
    const smaller = screen.getByRole('radio', { name: /Smaller is better/i });
    expect(smaller.getAttribute('aria-checked')).toBe('true');

    const nominal = screen.getByRole('radio', { name: /Nominal/i });
    expect(nominal.getAttribute('aria-checked')).toBe('false');
  });

  it('calls onChange with the type when clicking an unselected button', () => {
    const onChange = vi.fn();
    render(<CharacteristicTypeSelector value={null} onChange={onChange} autoInferred="nominal" />);
    fireEvent.click(screen.getByRole('radio', { name: /Larger is better/i }));
    expect(onChange).toHaveBeenCalledWith('larger');
  });

  it('calls onChange with null when clicking the currently selected button (deselect)', () => {
    const onChange = vi.fn();
    render(
      <CharacteristicTypeSelector value="nominal" onChange={onChange} autoInferred="nominal" />
    );
    fireEvent.click(screen.getByRole('radio', { name: /Nominal/i }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('shows dotted border on auto-inferred type when no explicit selection', () => {
    render(<CharacteristicTypeSelector value={null} onChange={vi.fn()} autoInferred="smaller" />);
    const smaller = screen.getByRole('radio', { name: /Smaller is better/i });
    expect(smaller.className).toContain('border-dashed');

    // Other non-inferred buttons should NOT have dotted border
    const nominal = screen.getByRole('radio', { name: /Nominal/i });
    expect(nominal.className).not.toContain('border-dashed');
  });

  it('does not show dotted border when an explicit value is selected', () => {
    render(<CharacteristicTypeSelector value="larger" onChange={vi.fn()} autoInferred="smaller" />);
    // The auto-inferred "smaller" should not have dotted border since explicit is set
    const smaller = screen.getByRole('radio', { name: /Smaller is better/i });
    expect(smaller.className).not.toContain('border-dashed');
  });

  it('applies custom className to the container', () => {
    render(
      <CharacteristicTypeSelector
        value={null}
        onChange={vi.fn()}
        autoInferred="nominal"
        className="flex justify-center gap-2"
      />
    );
    const radiogroup = screen.getByRole('radiogroup');
    expect(radiogroup.className).toContain('flex justify-center gap-2');
  });
});
