import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MultiLinkPicker, type ContextLinkItem } from '../MultiLinkPicker';

interface TestLinkItem extends ContextLinkItem {
  href: string;
}

const items: TestLinkItem[] = [
  { id: 'a', label: 'Containment thread', description: 'Owner review', href: '/wall/a' },
  { id: 'b', label: 'Root cause thread', description: '5 why analysis', href: '/wall/b' },
];

describe('MultiLinkPicker', () => {
  it('renders an accessible dialog with a labeled list of links', () => {
    render(
      <MultiLinkPicker label="Wall threads" items={items} onNavigate={vi.fn()} onClose={vi.fn()} />
    );

    expect(screen.getByRole('dialog', { name: 'Wall threads' })).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Wall threads links' })).toBeTruthy();
    expect(screen.getByText('Owner review')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Close Wall threads picker' })).toBeTruthy();
  });

  it('navigates to the selected item and asks the parent to close', () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    render(
      <MultiLinkPicker
        label="Wall threads"
        items={items}
        onNavigate={onNavigate}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Root cause thread' }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith(items[1]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose from the close button without navigating', () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    render(
      <MultiLinkPicker
        label="Wall threads"
        items={items}
        onNavigate={onNavigate}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close Wall threads picker' }));

    expect(onNavigate).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes from Escape and backdrop click', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <MultiLinkPicker label="Wall threads" items={items} onNavigate={vi.fn()} onClose={onClose} />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(
      <MultiLinkPicker label="Wall threads" items={items} onNavigate={vi.fn()} onClose={onClose} />
    );
    fireEvent.click(screen.getByTestId('multi-link-picker-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
