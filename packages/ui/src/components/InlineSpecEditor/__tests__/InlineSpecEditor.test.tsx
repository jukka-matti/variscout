/**
 * Tests for InlineSpecEditor — FRAME b0 inline spec popover.
 *
 * Critical test rule (per .claude/rules/testing.md): vi.mock() BEFORE component
 * imports — but this file uses no mocks (English i18n is statically bundled in
 * @variscout/core, so getMessage('en', ...) works without locale loader setup).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InlineSpecEditor, type SpecValues, type SpecSuggestion } from '../InlineSpecEditor';

const MEASURE = 'Down_Content_%';

const defaultProps = (
  overrides: Partial<{
    measure: string;
    current: SpecValues;
    suggestion: SpecSuggestion;
    defaultCpkTarget: number;
    onConfirm: (v: SpecValues) => void;
    onCancel: () => void;
  }> = {}
) => ({
  measure: overrides.measure ?? MEASURE,
  current: overrides.current,
  suggestion: overrides.suggestion,
  defaultCpkTarget: overrides.defaultCpkTarget,
  onConfirm: overrides.onConfirm ?? vi.fn(),
  onCancel: overrides.onCancel ?? vi.fn(),
});

describe('InlineSpecEditor', () => {
  it('renders title with measure name interpolated', () => {
    render(<InlineSpecEditor {...defaultProps()} />);
    const title = screen.getByTestId('inline-spec-editor-title');
    // Verify the measure name is interpolated; don't pin the surrounding
    // English text (changes with i18n) per .claude/rules/testing.md.
    expect(title).toBeInTheDocument();
    expect(title.textContent).toContain(MEASURE);
  });

  it('pre-fills inputs from `current` when provided', () => {
    render(
      <InlineSpecEditor
        {...defaultProps({
          current: { usl: 25, lsl: 20, target: 22.5, cpkTarget: 1.5 },
        })}
      />
    );
    expect((screen.getByTestId('inline-spec-editor-usl') as HTMLInputElement).value).toBe('25');
    expect((screen.getByTestId('inline-spec-editor-lsl') as HTMLInputElement).value).toBe('20');
    expect((screen.getByTestId('inline-spec-editor-target') as HTMLInputElement).value).toBe(
      '22.5'
    );
    expect((screen.getByTestId('inline-spec-editor-cpktarget') as HTMLInputElement).value).toBe(
      '1.5'
    );
  });

  it('pre-fills inputs from `suggestion` when `current` not provided', () => {
    render(
      <InlineSpecEditor
        {...defaultProps({
          suggestion: { usl: 24, lsl: 18, target: 21 },
        })}
      />
    );
    expect((screen.getByTestId('inline-spec-editor-usl') as HTMLInputElement).value).toBe('24');
    expect((screen.getByTestId('inline-spec-editor-lsl') as HTMLInputElement).value).toBe('18');
    expect((screen.getByTestId('inline-spec-editor-target') as HTMLInputElement).value).toBe('21');
  });

  it('pre-fills cpkTarget from `defaultCpkTarget` when both `current.cpkTarget` and `suggestion` are absent', () => {
    render(<InlineSpecEditor {...defaultProps({ defaultCpkTarget: 1.33 })} />);
    expect((screen.getByTestId('inline-spec-editor-cpktarget') as HTMLInputElement).value).toBe(
      '1.33'
    );
  });

  it('shows suggested-from-data helper text only when `suggestion` is provided', () => {
    const { rerender } = render(<InlineSpecEditor {...defaultProps()} />);
    expect(screen.queryByTestId('inline-spec-editor-suggestion-hint')).toBeNull();

    rerender(
      <InlineSpecEditor
        {...defaultProps({
          suggestion: { usl: 10, lsl: 0, target: 5 },
        })}
      />
    );
    const hint = screen.getByTestId('inline-spec-editor-suggestion-hint');
    // Presence-only — text changes with i18n.
    expect(hint).toBeInTheDocument();
    expect(hint.textContent).not.toBe('');
  });

  it('Save with all four values calls onConfirm with the correct numbers', () => {
    const onConfirm = vi.fn();
    render(
      <InlineSpecEditor
        {...defaultProps({
          current: { usl: 30, lsl: 10, target: 20, cpkTarget: 1.67 },
          onConfirm,
        })}
      />
    );
    fireEvent.click(screen.getByTestId('inline-spec-editor-save'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith({
      usl: 30,
      lsl: 10,
      target: 20,
      cpkTarget: 1.67,
    });
  });

  it('Save with partial values (only USL set) emits undefined for empty fields', () => {
    const onConfirm = vi.fn();
    render(<InlineSpecEditor {...defaultProps({ onConfirm })} />);

    fireEvent.change(screen.getByTestId('inline-spec-editor-usl'), { target: { value: '42' } });
    fireEvent.click(screen.getByTestId('inline-spec-editor-save'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith({
      usl: 42,
      lsl: undefined,
      target: undefined,
      cpkTarget: undefined,
    });
  });

  it('Cancel button calls onCancel', () => {
    const onCancel = vi.fn();
    render(<InlineSpecEditor {...defaultProps({ onCancel })} />);
    fireEvent.click(screen.getByTestId('inline-spec-editor-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('Escape key calls onCancel', () => {
    const onCancel = vi.fn();
    render(<InlineSpecEditor {...defaultProps({ onCancel })} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('USL <= LSL → inline error visible AND Save button disabled', () => {
    const onConfirm = vi.fn();
    render(
      <InlineSpecEditor
        {...defaultProps({
          current: { usl: 5, lsl: 10 },
          onConfirm,
        })}
      />
    );
    // Error text shown — presence only; copy changes with i18n.
    const error = screen.getByTestId('inline-spec-editor-error');
    expect(error).toBeInTheDocument();
    expect(error.textContent).not.toBe('');

    // Save disabled
    const saveBtn = screen.getByTestId('inline-spec-editor-save') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);

    // Clicking still does nothing (defensive)
    fireEvent.click(saveBtn);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
