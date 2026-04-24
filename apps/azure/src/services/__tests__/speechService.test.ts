import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/runtimeConfig', () => ({
  getRuntimeConfig: vi.fn(() => ({
    aiEndpoint: 'https://example.openai.azure.com',
    voiceInputEnabled: true,
    speechToTextDeployment: 'gpt-4o-mini-transcribe',
  })),
}));

vi.mock('../aiService', () => ({
  getResponsesApiConfig: vi.fn(async () => ({
    endpoint: 'https://example.openai.azure.com',
    deployment: 'reasoning',
    apiKey: 'ey.header.signature',
  })),
}));

import { getRuntimeConfig } from '../../lib/runtimeConfig';
import { getResponsesApiConfig } from '../aiService';
import {
  AUDIO_TRANSCRIPTION_API_VERSION,
  MAX_AUDIO_TRANSCRIPTION_BYTES,
  SpeechTranscriptionError,
  getSpeechToTextDeployment,
  isSpeechToTextAvailable,
  transcribeAudio,
} from '../speechService';

const mockGetRuntimeConfig = vi.mocked(getRuntimeConfig);
const mockGetResponsesApiConfig = vi.mocked(getResponsesApiConfig);

describe('speechService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRuntimeConfig.mockReturnValue({
      plan: 'team',
      aiEndpoint: 'https://example.openai.azure.com',
      aiSearchEndpoint: '',
      aiSearchIndex: '',
      appInsightsConnectionString: '',
      voiceInputEnabled: true,
      speechToTextDeployment: 'gpt-4o-mini-transcribe',
    });
    mockGetResponsesApiConfig.mockResolvedValue({
      endpoint: 'https://example.openai.azure.com',
      deployment: 'reasoning',
      apiKey: 'ey.header.signature',
    });
  });

  it('reports speech-to-text availability only when enabled and configured', () => {
    expect(isSpeechToTextAvailable()).toBe(true);

    mockGetRuntimeConfig.mockReturnValue({
      plan: 'team',
      aiEndpoint: 'https://example.openai.azure.com',
      aiSearchEndpoint: '',
      aiSearchIndex: '',
      appInsightsConnectionString: '',
      voiceInputEnabled: false,
      speechToTextDeployment: 'gpt-4o-mini-transcribe',
    });
    expect(isSpeechToTextAvailable()).toBe(false);
  });

  it('returns null when no speech deployment is configured', () => {
    mockGetRuntimeConfig.mockReturnValue({
      plan: 'team',
      aiEndpoint: 'https://example.openai.azure.com',
      aiSearchEndpoint: '',
      aiSearchIndex: '',
      appInsightsConnectionString: '',
      voiceInputEnabled: true,
      speechToTextDeployment: '',
    });

    expect(getSpeechToTextDeployment()).toBeNull();
  });

  it('posts audio to the Azure transcription deployment and returns trimmed text', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ text: '  Spoken draft text  ' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const file = new File([new Uint8Array([1, 2, 3])], 'note.webm', { type: 'audio/webm' });
    const result = await transcribeAudio(file, { language: 'en-US' });

    expect(result).toBe('Spoken draft text');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe(
      `https://example.openai.azure.com/openai/deployments/gpt-4o-mini-transcribe/audio/transcriptions?api-version=${AUDIO_TRANSCRIPTION_API_VERSION}`
    );

    const init = fetchSpy.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ Authorization: 'Bearer ey.header.signature' });
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get('language')).toBe('en-US');
    const postedFile = (init.body as FormData).get('file');
    expect(postedFile).toBeInstanceOf(File);
    expect((postedFile as File).name).toBe('note.webm');
    expect((postedFile as File).type).toBe('audio/webm');
    fetchSpy.mockRestore();
  });

  it('uses api-key auth for non-JWT credentials', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ text: 'API key auth works' }), { status: 200 })
      );
    mockGetResponsesApiConfig.mockResolvedValue({
      endpoint: 'https://example.openai.azure.com',
      deployment: 'reasoning',
      apiKey: 'plain-api-key',
    });

    const file = new File([new Uint8Array([1])], 'note.webm', { type: 'audio/webm' });
    await transcribeAudio(file);

    const init = fetchSpy.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(init.headers).toEqual({ 'api-key': 'plain-api-key' });
    fetchSpy.mockRestore();
  });

  it('rejects files larger than the Azure transcription limit', async () => {
    const oversized = new File([new Uint8Array([0])], 'large.webm', { type: 'audio/webm' });
    Object.defineProperty(oversized, 'size', {
      configurable: true,
      value: MAX_AUDIO_TRANSCRIPTION_BYTES + 1,
    });

    await expect(transcribeAudio(oversized)).rejects.toMatchObject({
      type: 'file-too-large',
    });
  });

  it('throws a typed error when the transcription is empty', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ text: '   ' }), { status: 200 })
    );

    const file = new File([new Uint8Array([1])], 'note.webm', { type: 'audio/webm' });
    await expect(transcribeAudio(file)).rejects.toMatchObject({
      type: 'empty-transcript',
    });
  });

  it('maps auth and rate-limit failures to typed errors', async () => {
    const file = new File([new Uint8Array([1])], 'note.webm', { type: 'audio/webm' });
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    fetchSpy.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));
    await expect(transcribeAudio(file)).rejects.toMatchObject({ type: 'auth', status: 401 });

    fetchSpy.mockResolvedValueOnce(new Response('Too many requests', { status: 429 }));
    await expect(transcribeAudio(file)).rejects.toMatchObject({
      type: 'rate-limit',
      status: 429,
    });

    fetchSpy.mockRestore();
  });

  it('surfaces aborts as a typed cancellation error', async () => {
    const controller = new AbortController();
    controller.abort();

    const file = new File([new Uint8Array([1])], 'note.webm', { type: 'audio/webm' });
    await expect(transcribeAudio(file, { signal: controller.signal })).rejects.toEqual(
      expect.objectContaining({
        type: 'aborted',
      })
    );
  });

  it('extends Error for standard catch handling', () => {
    const err = new SpeechTranscriptionError('unknown', 'Unexpected failure');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('SpeechTranscriptionError');
  });
});
