import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FindingComment } from '@variscout/core';
import type { VoiceInputConfig } from '../../VoiceInput';

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
  Mic: (props: Record<string, unknown>) => <span data-testid="mic-icon" {...props} />,
}));

import FindingComments from '../FindingComments';

const originalMediaRecorder = globalThis.MediaRecorder;
const originalMediaDevices = navigator.mediaDevices;
const originalSecureContext = window.isSecureContext;

const getUserMedia = vi.fn(async () => ({
  getTracks: () => [{ stop: vi.fn() }],
}));

class MockMediaRecorder {
  static isTypeSupported = vi.fn(() => true);

  public state = 'inactive';
  public mimeType: string;
  public ondataavailable: ((event: { data: Blob }) => void) | null = null;
  public onstop: (() => void) | null = null;

  constructor(_stream: unknown, options?: { mimeType?: string }) {
    this.mimeType = options?.mimeType ?? 'audio/webm';
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['audio'], { type: this.mimeType }) });
    this.onstop?.();
  }
}

const voiceInput: VoiceInputConfig = {
  isAvailable: true,
  transcribeAudio: vi.fn(async () => 'Observed a scratch right after machine M3'),
};

const comments: FindingComment[] = [];

describe('FindingComments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    globalThis.MediaRecorder = MockMediaRecorder as unknown as typeof MediaRecorder;
  });

  afterEach(() => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: originalSecureContext,
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
    globalThis.MediaRecorder = originalMediaRecorder;
  });

  it('inserts the transcript into the draft comment before save', async () => {
    const onAdd = vi.fn();

    render(
      <FindingComments
        comments={comments}
        findingId="finding-1"
        onAdd={onAdd}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        voiceInput={voiceInput}
      />
    );

    fireEvent.click(screen.getByText('Add comment'));
    fireEvent.click(screen.getByText('+ Add comment'));
    fireEvent.click(screen.getByTestId('finding-editor-voice-button'));
    await screen.findByTestId('finding-editor-voice-cancel');
    fireEvent.click(screen.getByTestId('finding-editor-voice-button'));

    const textarea = await screen.findByLabelText('finding.note');
    await waitFor(() => expect(textarea).toHaveValue('Observed a scratch right after machine M3'));

    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(onAdd).toHaveBeenCalledWith(
      'finding-1',
      'Observed a scratch right after machine M3',
      undefined
    );
  });

  it('keeps a pending attachment while voice fills the draft text', async () => {
    const onAdd = vi.fn();

    render(
      <FindingComments
        comments={comments}
        findingId="finding-1"
        onAdd={onAdd}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        voiceInput={voiceInput}
      />
    );

    fireEvent.click(screen.getByText('Add comment'));
    const attachmentInput = screen.getByLabelText('Attach file to comment');
    const photo = new File([new Uint8Array([1, 2, 3])], 'shopfloor-photo.png', {
      type: 'image/png',
    });

    fireEvent.change(attachmentInput, { target: { files: [photo] } });
    await screen.findByTestId('pending-attachment-preview');

    fireEvent.click(screen.getByTestId('finding-editor-voice-button'));
    await screen.findByTestId('finding-editor-voice-cancel');
    fireEvent.click(screen.getByTestId('finding-editor-voice-button'));

    const textarea = await screen.findByLabelText('finding.note');
    await waitFor(() => expect(textarea).toHaveValue('Observed a scratch right after machine M3'));

    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(onAdd).toHaveBeenCalledWith(
      'finding-1',
      'Observed a scratch right after machine M3',
      photo
    );
  });
});
