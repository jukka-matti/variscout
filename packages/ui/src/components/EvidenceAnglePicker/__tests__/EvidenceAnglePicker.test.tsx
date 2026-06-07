import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EvidenceAnglePicker } from '../EvidenceAnglePicker';

describe('EvidenceAnglePicker', () => {
  it('renders three angles, marks the current one, and emits on change', () => {
    const onChange = vi.fn();
    render(<EvidenceAnglePicker value="data" onChange={onChange} />);

    const gemba = screen.getByRole('radio', { name: /gemba/i });
    expect(screen.getByRole('radio', { name: /data/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /expert/i })).not.toBeChecked();

    fireEvent.click(gemba);

    expect(onChange).toHaveBeenCalledWith('gemba');
  });
});
