import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CollapsibleSection } from '../CollapsibleSection';

describe('CollapsibleSection', () => {
  it('renders closed by default and hides children', () => {
    render(
      <CollapsibleSection title="Goal">
        <p>Goal content</p>
      </CollapsibleSection>
    );

    const button = screen.getByRole('button', { name: 'Goal' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Goal content')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Goal' })).not.toBeInTheDocument();
  });

  it('renders open by default when defaultOpen is true', () => {
    render(
      <CollapsibleSection title="Project metadata" defaultOpen>
        <p>Metadata content</p>
      </CollapsibleSection>
    );

    const button = screen.getByRole('button', { name: 'Project metadata' });
    const panel = screen.getByRole('region', { name: 'Project metadata' });

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', button.id);
    expect(screen.getByText('Metadata content')).toBeInTheDocument();
  });

  it('toggles uncontrolled sections and reports changes', () => {
    const onOpenChange = vi.fn();

    render(
      <CollapsibleSection title="Approach / Countermeasures" onOpenChange={onOpenChange}>
        <p>Approach content</p>
      </CollapsibleSection>
    );

    const button = screen.getByRole('button', { name: 'Approach / Countermeasures' });
    fireEvent.click(button);

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Approach content')).toBeInTheDocument();
  });

  it('supports controlled open state without mutating itself', () => {
    const onOpenChange = vi.fn();

    render(
      <CollapsibleSection title="Outcome reference" open={false} onOpenChange={onOpenChange}>
        <p>Outcome content</p>
      </CollapsibleSection>
    );

    const button = screen.getByRole('button', { name: 'Outcome reference' });
    fireEvent.click(button);

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Outcome content')).not.toBeInTheDocument();
  });
});
