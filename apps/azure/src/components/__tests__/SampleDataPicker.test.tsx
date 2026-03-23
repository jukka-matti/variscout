import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SampleDataPicker from '../SampleDataPicker';
import { SAMPLES } from '@variscout/data';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SampleDataPicker', () => {
  const defaultProps = {
    isOpen: true,
    onSelectSample: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders nothing when isOpen is false', () => {
    render(<SampleDataPicker {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId('sample-picker-backdrop')).not.toBeInTheDocument();
  });

  it('renders dialog when isOpen is true', () => {
    render(<SampleDataPicker {...defaultProps} />);
    expect(screen.getByTestId('sample-picker-backdrop')).toBeInTheDocument();
    expect(screen.getByTestId('sample-picker-dialog')).toBeInTheDocument();
  });

  it('renders all samples from SAMPLES array', () => {
    render(<SampleDataPicker {...defaultProps} />);
    const list = screen.getByTestId('sample-picker-list');
    const items = list.querySelectorAll('[data-testid^="sample-picker-item-"]');
    expect(items).toHaveLength(SAMPLES.length);
  });

  it('renders sample name and description', () => {
    render(<SampleDataPicker {...defaultProps} />);
    const firstSample = SAMPLES[0];
    expect(screen.getByText(firstSample.name)).toBeInTheDocument();
    expect(screen.getByText(firstSample.description)).toBeInTheDocument();
  });

  it('calls onSelectSample and onClose when a sample is clicked', () => {
    const onSelectSample = vi.fn();
    const onClose = vi.fn();
    render(<SampleDataPicker isOpen={true} onSelectSample={onSelectSample} onClose={onClose} />);
    const firstSample = SAMPLES[0];
    fireEvent.click(screen.getByTestId(`sample-picker-item-${firstSample.urlKey}`));
    expect(onSelectSample).toHaveBeenCalledWith(firstSample);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<SampleDataPicker {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('sample-picker-close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<SampleDataPicker {...defaultProps} onClose={onClose} />);
    // Click the backdrop itself (not the dialog)
    fireEvent.click(screen.getByTestId('sample-picker-backdrop'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose when clicking inside the dialog', () => {
    const onClose = vi.fn();
    render(<SampleDataPicker {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('sample-picker-dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<SampleDataPicker {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not attach Escape listener when closed', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <SampleDataPicker isOpen={false} onSelectSample={vi.fn()} onClose={onClose} />
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();

    // Open it and verify Escape now works
    rerender(<SampleDataPicker isOpen={true} onSelectSample={vi.fn()} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders with correct aria attributes for accessibility', () => {
    render(<SampleDataPicker {...defaultProps} />);
    const dialog = screen.getByTestId('sample-picker-backdrop');
    expect(dialog).toHaveAttribute('role', 'dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('renders the dialog header', () => {
    render(<SampleDataPicker {...defaultProps} />);
    expect(screen.getByText('Select a sample dataset')).toBeInTheDocument();
  });
});
