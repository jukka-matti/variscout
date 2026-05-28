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

describe('CreateProjectModal — Issue Statement field', () => {
  it('renders an Issue Statement textarea with helper copy and 0/500 char counter', () => {
    render(<CreateProjectModal {...baseProps} />);
    const textarea = screen.getByLabelText(/Issue Statement/i) as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(
      screen.getByText(
        /What's happening\? Brief description of the situation you're investigating\./i
      )
    ).toBeInTheDocument();
    expect(screen.getByText('0/500')).toBeInTheDocument();
  });

  it('applies maxLength={500} to the textarea', () => {
    render(<CreateProjectModal {...baseProps} />);
    const textarea = screen.getByLabelText(/Issue Statement/i) as HTMLTextAreaElement;
    expect(textarea.maxLength).toBe(500);
  });

  it('updates the Issue Statement char counter as the user types', () => {
    render(<CreateProjectModal {...baseProps} />);
    const textarea = screen.getByLabelText(/Issue Statement/i);
    fireEvent.change(textarea, { target: { value: '1234567890' } }); // 10 chars
    expect(screen.getByText('10/500')).toBeInTheDocument();
  });

  it('Create is still enabled when Issue Statement is empty (Title is the only required field)', () => {
    render(<CreateProjectModal {...baseProps} />);
    const input = screen.getByLabelText(/Title/i);
    fireEvent.change(input, { target: { value: 'My project' } });
    expect(screen.getByRole('button', { name: /Create/i })).toBeEnabled();
  });

  it('Create OMITS issueStatement from the onSave payload when Issue Statement is empty', () => {
    const onSave = vi.fn();
    render(<CreateProjectModal onSave={onSave} onClose={noop} />);
    const input = screen.getByLabelText(/Title/i);
    fireEvent.change(input, { target: { value: 'My project' } });
    fireEvent.click(screen.getByRole('button', { name: /Create/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ title: 'My project' });
    expect(onSave).toHaveBeenCalledWith(
      expect.not.objectContaining({ issueStatement: expect.anything() })
    );
  });

  it('Create OMITS issueStatement from the onSave payload when Issue Statement is whitespace-only', () => {
    const onSave = vi.fn();
    render(<CreateProjectModal onSave={onSave} onClose={noop} />);
    const input = screen.getByLabelText(/Title/i);
    fireEvent.change(input, { target: { value: 'My project' } });
    const textarea = screen.getByLabelText(/Issue Statement/i);
    fireEvent.change(textarea, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /Create/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ title: 'My project' });
    expect(onSave).toHaveBeenCalledWith(
      expect.not.objectContaining({ issueStatement: expect.anything() })
    );
  });

  it('Create INCLUDES issueStatement when textarea has non-whitespace content', () => {
    const onSave = vi.fn();
    render(<CreateProjectModal onSave={onSave} onClose={noop} />);
    const input = screen.getByLabelText(/Title/i);
    fireEvent.change(input, { target: { value: 'Yield drop' } });
    const textarea = screen.getByLabelText(/Issue Statement/i);
    fireEvent.change(textarea, { target: { value: 'yields are dropping' } });
    fireEvent.click(screen.getByRole('button', { name: /Create/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      title: 'Yield drop',
      issueStatement: 'yields are dropping',
    });
  });

  it('Create trims leading/trailing whitespace on Issue Statement', () => {
    const onSave = vi.fn();
    render(<CreateProjectModal onSave={onSave} onClose={noop} />);
    const input = screen.getByLabelText(/Title/i);
    fireEvent.change(input, { target: { value: 'My project' } });
    const textarea = screen.getByLabelText(/Issue Statement/i);
    fireEvent.change(textarea, { target: { value: '  hello  ' } });
    fireEvent.click(screen.getByRole('button', { name: /Create/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      title: 'My project',
      issueStatement: 'hello',
    });
  });
});
