/**
 * Tests for AddActionDialog component
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddActionDialog } from '../AddActionDialog';

const defaultFindings = [
  { id: 'f1', text: 'Temperature variance in Zone 3' },
  { id: 'f2', text: 'Operator method inconsistency' },
];

function renderDialog(overrides: Partial<React.ComponentProps<typeof AddActionDialog>> = {}) {
  const onSubmit = vi.fn();
  const onClose = vi.fn();

  const utils = render(
    <AddActionDialog
      findings={defaultFindings}
      onSubmit={onSubmit}
      onClose={onClose}
      {...overrides}
    />
  );

  return { ...utils, onSubmit, onClose };
}

describe('AddActionDialog', () => {
  it('renders dialog with title', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Add Action' })).toBeInTheDocument();
  });

  it('shows finding options in select', () => {
    renderDialog();
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Temperature variance in Zone 3' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Operator method inconsistency' })
    ).toBeInTheDocument();
  });

  it('pre-selects first finding', () => {
    renderDialog();
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('f1');
  });

  it('disables submit button when text is empty', () => {
    renderDialog();
    const submitButton = screen.getByRole('button', { name: 'Add Action' });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when text is entered', () => {
    renderDialog();
    const textInput = screen.getByPlaceholderText('What needs to be done?');
    fireEvent.change(textInput, { target: { value: 'Schedule calibration' } });
    const submitButton = screen.getByRole('button', { name: 'Add Action' });
    expect(submitButton).not.toBeDisabled();
  });

  it('calls onSubmit with findingId and trimmed text when submitted', () => {
    const { onSubmit } = renderDialog();
    const textInput = screen.getByPlaceholderText('What needs to be done?');
    fireEvent.change(textInput, { target: { value: '  Schedule calibration  ' } });
    const submitButton = screen.getByRole('button', { name: 'Add Action' });
    fireEvent.click(submitButton);
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith('f1', 'Schedule calibration', undefined);
  });

  it('calls onSubmit with selected findingId when finding is changed', () => {
    const { onSubmit } = renderDialog();
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'f2' } });
    const textInput = screen.getByPlaceholderText('What needs to be done?');
    fireEvent.change(textInput, { target: { value: 'Review SOP' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Action' }));
    expect(onSubmit).toHaveBeenCalledWith('f2', 'Review SOP', undefined);
  });

  it('calls onSubmit with dueDate when provided', () => {
    const { onSubmit } = renderDialog();
    const textInput = screen.getByPlaceholderText('What needs to be done?');
    fireEvent.change(textInput, { target: { value: 'Fix sensor' } });
    const dateInput = screen.getByLabelText(/due date/i);
    fireEvent.change(dateInput, { target: { value: '2026-05-15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Action' }));
    expect(onSubmit).toHaveBeenCalledWith('f1', 'Fix sensor', '2026-05-15');
  });

  it('calls onClose when Cancel button is clicked', () => {
    const { onClose } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', () => {
    const { onClose } = renderDialog();
    const backdrop = screen.getByTestId('add-action-backdrop');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('submits on Enter key in text input', () => {
    const { onSubmit } = renderDialog();
    const textInput = screen.getByPlaceholderText('What needs to be done?');
    fireEvent.change(textInput, { target: { value: 'Check gauge' } });
    fireEvent.keyDown(textInput, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith('f1', 'Check gauge', undefined);
  });

  it('does not call onSubmit when text is only whitespace', () => {
    const { onSubmit } = renderDialog();
    const textInput = screen.getByPlaceholderText('What needs to be done?');
    fireEvent.change(textInput, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Action' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not render finding selector when findings array is empty', () => {
    renderDialog({ findings: [] });
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
