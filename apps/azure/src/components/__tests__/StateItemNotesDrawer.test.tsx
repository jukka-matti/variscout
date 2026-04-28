import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StateItemNotesDrawer, { type StateItemNotesDrawerProps } from '../StateItemNotesDrawer';

const baseProps: StateItemNotesDrawerProps = {
  open: true,
  initialKind: 'question',
  initialText: '',
  onSave: vi.fn(),
  onCancel: vi.fn(),
};

describe('StateItemNotesDrawer', () => {
  it('renders nothing when open is false', () => {
    render(<StateItemNotesDrawer {...baseProps} open={false} />);
    expect(screen.queryByTestId('state-item-notes-drawer')).not.toBeInTheDocument();
  });

  it('renders 4 kind buttons matching PROCESS_STATE_NOTE_KINDS', () => {
    render(<StateItemNotesDrawer {...baseProps} />);
    expect(screen.getByRole('button', { name: /question/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gemba/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /data.gap/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /decision/i })).toBeInTheDocument();
  });

  it('disables Save when text is empty', () => {
    render(<StateItemNotesDrawer {...baseProps} initialText="" />);
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('disables Save when text is only whitespace', () => {
    render(<StateItemNotesDrawer {...baseProps} initialText="   " />);
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('enables Save when text has non-whitespace content', () => {
    render(<StateItemNotesDrawer {...baseProps} initialText="hello" />);
    expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
  });

  it('fires onSave with current kind + trimmed text', () => {
    const onSave = vi.fn();
    render(<StateItemNotesDrawer {...baseProps} initialText="  hello  " onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith('question', 'hello');
  });

  it('fires onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<StateItemNotesDrawer {...baseProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('switches active kind when a different kind button is clicked', () => {
    const onSave = vi.fn();
    render(<StateItemNotesDrawer {...baseProps} initialText="hi" onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: /gemba/i }));
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith('gemba', 'hi');
  });
});
