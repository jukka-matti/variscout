import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DurabilityNudge } from '../DurabilityNudge';

describe('DurabilityNudge', () => {
  it('renders a calm one-line Save nudge and supports dismiss', () => {
    const onDismiss = vi.fn();
    render(<DurabilityNudge verb="Save" onDismiss={onDismiss} />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Finding saved. Save this investigation so you can come back to it.'
    );
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('uses Export copy for PWA durability', () => {
    render(<DurabilityNudge verb="Export" onDismiss={() => {}} />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Finding saved. Export this investigation so you can come back to it.'
    );
  });
});
