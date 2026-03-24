/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SaveInsightDialog } from '../SaveInsightDialog';

describe('SaveInsightDialog', () => {
  const defaultProps = {
    isOpen: true,
    messageText: 'Nozzle 3 shows 2x variation',
    messageId: 'msg-1',
    onSaveAsNewFinding: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders with pre-filled text', () => {
    render(<SaveInsightDialog {...defaultProps} />);
    expect(screen.getByDisplayValue('Nozzle 3 shows 2x variation')).toBeInTheDocument();
  });

  it('calls onSaveAsNewFinding with text and messageId on save', () => {
    const onSave = vi.fn();
    render(<SaveInsightDialog {...defaultProps} onSaveAsNewFinding={onSave} />);
    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith('Nozzle 3 shows 2x variation', 'msg-1', undefined);
  });

  it('calls onClose on cancel', () => {
    const onClose = vi.fn();
    render(<SaveInsightDialog {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<SaveInsightDialog {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows finding dropdown when findings are provided', () => {
    render(
      <SaveInsightDialog
        {...defaultProps}
        findings={[{ id: 'f1', text: 'Existing finding' }]}
        onAddCommentToFinding={vi.fn()}
      />
    );
    expect(screen.getByText(/comment to finding/i)).toBeInTheDocument();
  });

  it('shows hypothesis dropdown when hypotheses are provided', () => {
    render(
      <SaveInsightDialog
        {...defaultProps}
        hypotheses={[{ id: 'h1', text: 'Some hypothesis' }]}
        onAddCommentToHypothesis={vi.fn()}
      />
    );
    expect(screen.getByText(/comment to hypothesis/i)).toBeInTheDocument();
  });

  it('truncates long message text to 200 chars', () => {
    const longText = 'A'.repeat(300);
    render(<SaveInsightDialog {...defaultProps} messageText={longText} />);
    const textarea = screen.getByTestId('save-insight-text') as HTMLTextAreaElement;
    expect(textarea.value.length).toBeLessThanOrEqual(203); // 200 + '...'
    expect(textarea.value.endsWith('...')).toBe(true);
  });

  it('calls onAddCommentToFinding when finding comment mode selected', () => {
    const onAddComment = vi.fn();
    render(
      <SaveInsightDialog
        {...defaultProps}
        findings={[{ id: 'f1', text: 'Existing finding' }]}
        onAddCommentToFinding={onAddComment}
      />
    );
    // Select comment-to-finding mode
    fireEvent.click(screen.getByText(/comment to finding/i));
    fireEvent.click(screen.getByText('Save'));
    expect(onAddComment).toHaveBeenCalledWith('f1', 'Nozzle 3 shows 2x variation');
  });

  it('closes dialog after save', () => {
    const onClose = vi.fn();
    render(<SaveInsightDialog {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Save'));
    expect(onClose).toHaveBeenCalled();
  });

  it('disables save button when text is empty', () => {
    render(<SaveInsightDialog {...defaultProps} messageText="" />);
    const saveButton = screen.getByText('Save');
    expect(saveButton).toBeDisabled();
  });

  it('closes on escape key', () => {
    const onClose = vi.fn();
    render(<SaveInsightDialog {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on backdrop click', () => {
    const onClose = vi.fn();
    render(<SaveInsightDialog {...defaultProps} onClose={onClose} />);
    // Click on the backdrop (the outer dialog overlay)
    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});
