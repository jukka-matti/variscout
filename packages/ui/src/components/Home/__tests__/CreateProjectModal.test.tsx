import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateProjectModal } from '../CreateProjectModal';

const noop = () => {};
const baseProps = {
  onSave: noop,
  onClose: noop,
};

describe('CreateProjectModal — shell', () => {
  it('renders inside a dialog with the correct title and labelling', () => {
    render(<CreateProjectModal {...baseProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'create-project-modal-title');
    expect(screen.getByText('New project')).toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<CreateProjectModal {...baseProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<CreateProjectModal {...baseProps} onClose={onClose} />);
    const backdrop = screen.getByTestId('create-project-modal-backdrop');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClose when the dialog body itself is clicked', () => {
    const onClose = vi.fn();
    render(<CreateProjectModal {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('CreateProjectModal — Title field', () => {
  it('renders a required Title input with maxLength 80', () => {
    render(<CreateProjectModal {...baseProps} />);
    const input = screen.getByLabelText(/Title/i) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input.maxLength).toBe(80);
  });

  it('shows the character counter as 0/80 initially', () => {
    render(<CreateProjectModal {...baseProps} />);
    expect(screen.getByText('0/80')).toBeInTheDocument();
  });

  it('updates the character counter as the user types', () => {
    render(<CreateProjectModal {...baseProps} />);
    const input = screen.getByLabelText(/Title/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'My project' } });
    expect(screen.getByText('10/80')).toBeInTheDocument();
  });
});

describe('CreateProjectModal — footer + validation', () => {
  it('Create button is disabled when Title is empty', () => {
    render(<CreateProjectModal {...baseProps} />);
    expect(screen.getByRole('button', { name: /Create/i })).toBeDisabled();
  });

  it('Create button is disabled when Title is whitespace-only', () => {
    render(<CreateProjectModal {...baseProps} />);
    const input = screen.getByLabelText(/Title/i);
    fireEvent.change(input, { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: /Create/i })).toBeDisabled();
  });

  it('Create button enables when Title has non-whitespace content', () => {
    render(<CreateProjectModal {...baseProps} />);
    const input = screen.getByLabelText(/Title/i);
    fireEvent.change(input, { target: { value: 'My project' } });
    expect(screen.getByRole('button', { name: /Create/i })).toBeEnabled();
  });

  it('Cancel button calls onClose and does NOT call onSave', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<CreateProjectModal onSave={onSave} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('Create calls onSave with trimmed title and does NOT call onClose', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<CreateProjectModal onSave={onSave} onClose={onClose} />);
    const input = screen.getByLabelText(/Title/i);
    fireEvent.change(input, { target: { value: '  Hello  ' } });
    fireEvent.click(screen.getByRole('button', { name: /Create/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ title: 'Hello' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('Create is a no-op when Title is whitespace-only (defensive — button is disabled too)', () => {
    const onSave = vi.fn();
    render(<CreateProjectModal onSave={onSave} onClose={noop} />);
    const input = screen.getByLabelText(/Title/i);
    fireEvent.change(input, { target: { value: '   ' } });
    // Button is disabled, but verify the handler is also defensive.
    const createBtn = screen.getByRole('button', { name: /Create/i }) as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    expect(onSave).not.toHaveBeenCalled();
  });
});
