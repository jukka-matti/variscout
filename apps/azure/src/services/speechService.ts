import { getRuntimeConfig } from '../lib/runtimeConfig';
import { getResponsesApiConfig } from './aiService';

export const AUDIO_TRANSCRIPTION_API_VERSION = '2024-10-21';
export const MAX_AUDIO_TRANSCRIPTION_BYTES = 25 * 1024 * 1024;

export type SpeechTranscriptionErrorType =
  | 'aborted'
  | 'auth'
  | 'empty-transcript'
  | 'file-too-large'
  | 'network'
  | 'rate-limit'
  | 'server'
  | 'unavailable'
  | 'unknown';

export interface TranscribeAudioOptions {
  language?: string;
  signal?: AbortSignal;
}

export class SpeechTranscriptionError extends Error {
  constructor(
    public readonly type: SpeechTranscriptionErrorType,
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'SpeechTranscriptionError';
  }
}

function isJwtToken(value: string): boolean {
  return value.split('.').length === 3 && value.startsWith('ey');
}

function buildSpeechHeaders(apiKey: string): Record<string, string> {
  if (isJwtToken(apiKey)) {
    return { Authorization: `Bearer ${apiKey}` };
  }
  return { 'api-key': apiKey };
}

function classifySpeechError(status: number): SpeechTranscriptionErrorType {
  if (status === 401 || status === 403) return 'auth';
  if (status === 429) return 'rate-limit';
  if (status >= 500) return 'server';
  return 'unknown';
}

export function getSpeechToTextDeployment(): string | null {
  const runtimeDeployment = getRuntimeConfig()?.speechToTextDeployment;
  return runtimeDeployment || import.meta.env.VITE_AI_SPEECH_TO_TEXT_DEPLOYMENT || null;
}

export function isSpeechToTextAvailable(): boolean {
  const runtimeConfig = getRuntimeConfig();
  const aiEndpoint = runtimeConfig?.aiEndpoint || import.meta.env.VITE_AI_ENDPOINT || '';
  const voiceInputEnabled =
    runtimeConfig?.voiceInputEnabled ?? import.meta.env.VITE_VOICE_INPUT_ENABLED === 'true';

  return Boolean(voiceInputEnabled && aiEndpoint && getSpeechToTextDeployment());
}

export async function transcribeAudio(
  file: File,
  options: TranscribeAudioOptions = {}
): Promise<string> {
  if (options.signal?.aborted) {
    throw new SpeechTranscriptionError('aborted', 'Transcription was cancelled');
  }

  if (!isSpeechToTextAvailable()) {
    throw new SpeechTranscriptionError(
      'unavailable',
      'Voice input is not configured for this deployment'
    );
  }

  if (file.size > MAX_AUDIO_TRANSCRIPTION_BYTES) {
    throw new SpeechTranscriptionError(
      'file-too-large',
      'Audio file exceeds the 25 MB transcription limit'
    );
  }

  const deployment = getSpeechToTextDeployment();
  const config = await getResponsesApiConfig('fast');

  if (!deployment || !config?.endpoint || !config.apiKey) {
    throw new SpeechTranscriptionError(
      'unavailable',
      'Voice input is not configured for this deployment'
    );
  }

  const body = new FormData();
  body.append('file', file, file.name);
  if (options.language) {
    body.append('language', options.language);
  }

  const url = `${config.endpoint}/openai/deployments/${deployment}/audio/transcriptions?api-version=${AUDIO_TRANSCRIPTION_API_VERSION}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: buildSpeechHeaders(config.apiKey),
      body,
      signal: options.signal,
    });

    if (!response.ok) {
      const bodyText = await response.text();
      throw new SpeechTranscriptionError(
        classifySpeechError(response.status),
        bodyText || `Transcription failed with ${response.status}`,
        response.status
      );
    }

    const data = (await response.json()) as { text?: string };
    const text = data.text?.trim();
    if (!text) {
      throw new SpeechTranscriptionError(
        'empty-transcript',
        'No spoken transcript was returned from Azure OpenAI'
      );
    }

    return text;
  } catch (error) {
    if (error instanceof SpeechTranscriptionError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new SpeechTranscriptionError('aborted', 'Transcription was cancelled');
    }
    throw new SpeechTranscriptionError(
      'network',
      error instanceof Error ? error.message : 'Network error while transcribing audio'
    );
  }
}
