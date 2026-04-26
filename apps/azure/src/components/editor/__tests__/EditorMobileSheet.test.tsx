import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EditorMobileSheet } from '../EditorMobileSheet';

vi.mock('@variscout/hooks', () => ({
  useTranslation: () => ({ t: (_key: string) => '' }),
}));

describe('EditorMobileSheet', () => {
  it('exposes Survey from the mobile More sheet', () => {
    const onAction = vi.fn();

    render(<EditorMobileSheet onAction={onAction} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /survey/i }));

    expect(onAction).toHaveBeenCalledWith('survey');
  });
});
