import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VerificationPrompt } from '../VerificationPrompt';

describe('VerificationPrompt', () => {
  const defaultProps = {
    improvingActionCount: 3,
    onConfirmVerification: vi.fn(),
    onDismiss: vi.fn(),
  };

  it('renders with action count', () => {
    render(<VerificationPrompt {...defaultProps} />);
    expect(screen.getByTestId('verification-prompt')).toBeInTheDocument();
  });

  it('shows "Yes" and "No" buttons', () => {
    render(<VerificationPrompt {...defaultProps} />);
    expect(screen.getByTestId('verification-prompt-dismiss')).toBeInTheDocument();
    expect(screen.getByTestId('verification-prompt-confirm')).toBeInTheDocument();
    expect(screen.getByTestId('verification-prompt-dismiss')).toHaveTextContent('No, regular data');
    expect(screen.getByTestId('verification-prompt-confirm')).toHaveTextContent(
      'Yes, verify effect'
    );
  });

  it('calls onConfirmVerification when "Yes" button clicked', () => {
    const onConfirmVerification = vi.fn();
    render(<VerificationPrompt {...defaultProps} onConfirmVerification={onConfirmVerification} />);
    fireEvent.click(screen.getByTestId('verification-prompt-confirm'));
    expect(onConfirmVerification).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when "No" button clicked', () => {
    const onDismiss = vi.fn();
    render(<VerificationPrompt {...defaultProps} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByTestId('verification-prompt-dismiss'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows correct action count in message', () => {
    render(<VerificationPrompt {...defaultProps} improvingActionCount={5} />);
    expect(screen.getByTestId('verification-prompt-count')).toHaveTextContent('5');
  });

  it('shows singular "action" when count is 1', () => {
    render(<VerificationPrompt {...defaultProps} improvingActionCount={1} />);
    const body = screen.getByTestId('verification-prompt-body');
    expect(body.textContent).toContain('1');
    expect(body.textContent).toContain('action in progress');
  });

  it('shows plural "actions" when count is more than 1', () => {
    render(<VerificationPrompt {...defaultProps} improvingActionCount={3} />);
    const body = screen.getByTestId('verification-prompt-body');
    expect(body.textContent).toContain('actions in progress');
  });

  it('calls onDismiss when backdrop is clicked', () => {
    const onDismiss = vi.fn();
    render(<VerificationPrompt {...defaultProps} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByTestId('verification-prompt-backdrop'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders with accessible dialog role', () => {
    render(<VerificationPrompt {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
