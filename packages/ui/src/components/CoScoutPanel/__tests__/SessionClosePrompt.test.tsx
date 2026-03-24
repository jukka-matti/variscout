/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionClosePrompt } from '../SessionClosePrompt';

const items = [
  { id: '1', text: 'Nozzle 3 shows 2x variation of other nozzles', preChecked: true },
  { id: '2', text: 'Temperature adjustment had no measurable effect', preChecked: true },
];

describe('SessionClosePrompt', () => {
  it('renders items as checkboxes', () => {
    render(<SessionClosePrompt isOpen={true} items={items} onSave={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('pre-checks items with preChecked=true', () => {
    render(<SessionClosePrompt isOpen={true} items={items} onSave={vi.fn()} onDismiss={vi.fn()} />);
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkboxes[0].checked).toBe(true);
    expect(checkboxes[1].checked).toBe(true);
  });

  it('calls onSave with checked item IDs', () => {
    const onSave = vi.fn();
    render(<SessionClosePrompt isOpen={true} items={items} onSave={onSave} onDismiss={vi.fn()} />);
    // Uncheck first item
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getByText(/save selected/i));
    expect(onSave).toHaveBeenCalledWith(['2']);
  });

  it('calls onDismiss when close without saving clicked', () => {
    const onDismiss = vi.fn();
    render(
      <SessionClosePrompt isOpen={true} items={items} onSave={vi.fn()} onDismiss={onDismiss} />
    );
    fireEvent.click(screen.getByText(/close without saving/i));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('calls onDismiss on escape key', () => {
    const onDismiss = vi.fn();
    render(
      <SessionClosePrompt isOpen={true} items={items} onSave={vi.fn()} onDismiss={onDismiss} />
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalled();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <SessionClosePrompt isOpen={false} items={items} onSave={vi.fn()} onDismiss={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('disables save button when nothing is checked', () => {
    const uncheckedItems = items.map(i => ({ ...i, preChecked: false }));
    render(
      <SessionClosePrompt
        isOpen={true}
        items={uncheckedItems}
        onSave={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText(/save selected/i)).toBeDisabled();
  });
});
