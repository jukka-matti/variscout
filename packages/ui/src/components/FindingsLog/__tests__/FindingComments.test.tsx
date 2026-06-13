import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { FindingComment } from '@variscout/core';

vi.mock('@variscout/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    locale: 'en-US',
  }),
}));

vi.mock('lucide-react', () => ({
  MessageSquare: (props: Record<string, unknown>) => (
    <span data-testid="messagesquare-icon" {...props} />
  ),
  Pencil: (props: Record<string, unknown>) => <span data-testid="pencil-icon" {...props} />,
  Trash2: (props: Record<string, unknown>) => <span data-testid="trash-icon" {...props} />,
  Camera: (props: Record<string, unknown>) => <span data-testid="camera-icon" {...props} />,
  Loader2: (props: Record<string, unknown>) => <span data-testid="loader-icon" {...props} />,
  ImageIcon: (props: Record<string, unknown>) => <span data-testid="image-icon" {...props} />,
  Paperclip: (props: Record<string, unknown>) => <span data-testid="paperclip-icon" {...props} />,
  FileText: (props: Record<string, unknown>) => <span data-testid="filetext-icon" {...props} />,
  X: (props: Record<string, unknown>) => <span data-testid="x-icon" {...props} />,
}));

import FindingComments from '../FindingComments';

const comments: FindingComment[] = [];

describe('FindingComments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves a typed draft comment', () => {
    const onAdd = vi.fn();

    render(
      <FindingComments
        comments={comments}
        findingId="finding-1"
        onAdd={onAdd}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Add comment'));
    fireEvent.click(screen.getByText('+ Add comment'));
    const textarea = screen.getByLabelText('finding.note');
    fireEvent.change(textarea, { target: { value: 'Observed a scratch right after machine M3' } });

    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(onAdd).toHaveBeenCalledWith(
      'finding-1',
      'Observed a scratch right after machine M3',
      undefined
    );
  });

  it('keeps a pending attachment while the typed draft text is completed', async () => {
    const onAdd = vi.fn();

    render(
      <FindingComments
        comments={comments}
        findingId="finding-1"
        onAdd={onAdd}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Add comment'));
    const attachmentInput = screen.getByLabelText('Attach file to comment');
    const photo = new File([new Uint8Array([1, 2, 3])], 'shopfloor-photo.png', {
      type: 'image/png',
    });

    fireEvent.change(attachmentInput, { target: { files: [photo] } });
    await screen.findByTestId('pending-attachment-preview');

    const textarea = screen.getByLabelText('finding.note');
    fireEvent.change(textarea, { target: { value: 'Observed a scratch right after machine M3' } });

    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(onAdd).toHaveBeenCalledWith(
      'finding-1',
      'Observed a scratch right after machine M3',
      photo
    );
  });
});
