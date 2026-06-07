import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ProcessHub } from '@variscout/core/processHub';
import { VrsExportButton } from '../VrsExportButton';

function hub(): ProcessHub {
  return {
    id: 'hub-1',
    name: 'Line hub',
    createdAt: 1,
    deletedAt: null,
    processGoal: 'Reduce cycle time',
  };
}

describe('VrsExportButton', () => {
  it('notifies the caller after exporting the .vrs file', () => {
    const onExported = vi.fn();
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<VrsExportButton currentHub={hub()} onExported={onExported} />);
    fireEvent.click(screen.getByRole('button', { name: /export \.vrs/i }));

    expect(onExported).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();

    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
    click.mockRestore();
  });
});
