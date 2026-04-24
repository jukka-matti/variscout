import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Mic, X } from 'lucide-react';

export interface VoiceInputConfig {
  isAvailable: boolean;
  transcribeAudio: (
    file: File,
    options?: { language?: string; signal?: AbortSignal }
  ) => Promise<string>;
}

export interface VoiceDraftButtonProps {
  voiceInput?: VoiceInputConfig;
  mode: 'hold' | 'tap';
  language?: string;
  onTranscript: (text: string) => void;
  testIdPrefix: string;
  className?: string;
  buttonClassName?: string;
  cancelButtonClassName?: string;
  statusClassName?: string;
  iconSize?: number;
}

type VoiceDraftState = 'idle' | 'recording' | 'transcribing';

const MIME_TYPE_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
] as const;

function supportsVoiceCapture(): boolean {
  return Boolean(
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined'
  );
}

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return 'audio/webm';
  }

  return MIME_TYPE_CANDIDATES.find(type => MediaRecorder.isTypeSupported(type)) ?? 'audio/webm';
}

function mimeTypeToExtension(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'm4a';
  if (mimeType.includes('mpeg')) return 'mp3';
  return 'webm';
}

function buildFatalErrorMessage(error: unknown): string | null {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'Microphone permission was denied.';
  }
  if (!supportsVoiceCapture()) {
    return 'Voice input requires HTTPS and a supported browser.';
  }
  return null;
}

export function appendVoiceDraftText(currentDraft: string, transcript: string): string {
  const nextTranscript = transcript.trim();
  if (!nextTranscript) return currentDraft;
  const trimmedDraft = currentDraft.trim();
  if (!trimmedDraft) return nextTranscript;
  const separator = /[\s\n]$/.test(currentDraft) ? '' : ' ';
  return `${currentDraft}${separator}${nextTranscript}`;
}

const VoiceDraftButton: React.FC<VoiceDraftButtonProps> = ({
  voiceInput,
  mode,
  language,
  onTranscript,
  testIdPrefix,
  className,
  buttonClassName,
  cancelButtonClassName,
  statusClassName,
  iconSize = 14,
}) => {
  const [state, setState] = useState<VoiceDraftState>('idle');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [fatalUnavailable, setFatalUnavailable] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const shouldTranscribeRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const uiAvailable = useMemo(() => {
    return Boolean(voiceInput?.isAvailable && !fatalUnavailable && supportsVoiceCapture());
  }, [fatalUnavailable, voiceInput?.isAvailable]);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (voiceInput?.isAvailable && !supportsVoiceCapture()) {
      setErrorText('Voice input requires HTTPS and a supported browser.');
    } else if (!voiceInput?.isAvailable) {
      setErrorText(null);
      setFatalUnavailable(false);
    }
  }, [voiceInput?.isAvailable]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }
      cleanupStream();
    };
  }, [cleanupStream]);

  const handleTranscriptionError = useCallback((error: unknown) => {
    const fatalMessage = buildFatalErrorMessage(error);
    if (fatalMessage) {
      setFatalUnavailable(true);
      setErrorText(fatalMessage);
      return;
    }

    setErrorText(error instanceof Error ? error.message : 'Voice transcription failed.');
  }, []);

  const transcribeChunks = useCallback(async () => {
    if (!voiceInput) {
      setState('idle');
      return;
    }

    const mimeType = recorderRef.current?.mimeType || pickMimeType();
    const blob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];

    if (blob.size === 0) {
      setState('idle');
      setErrorText('No audio was captured.');
      return;
    }

    const extension = mimeTypeToExtension(mimeType);
    const audioFile = new File([blob], `voice-input-${Date.now()}.${extension}`, {
      type: mimeType,
    });

    abortControllerRef.current = new AbortController();
    setState('transcribing');
    setErrorText(null);

    try {
      const transcript = await voiceInput.transcribeAudio(audioFile, {
        language,
        signal: abortControllerRef.current.signal,
      });
      onTranscript(transcript);
      setState('idle');
      setErrorText(null);
    } catch (error) {
      if (error instanceof Error && /cancel|abort/i.test(error.message)) {
        setState('idle');
        return;
      }
      setState('idle');
      handleTranscriptionError(error);
    } finally {
      abortControllerRef.current = null;
    }
  }, [handleTranscriptionError, language, onTranscript, voiceInput]);

  const stopRecording = useCallback(
    (shouldTranscribe: boolean) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state !== 'recording') return;
      shouldTranscribeRef.current = shouldTranscribe;
      recorder.stop();
      cleanupStream();
    },
    [cleanupStream]
  );

  const startRecording = useCallback(async () => {
    if (!voiceInput || !uiAvailable || state !== 'idle') return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: pickMimeType() });
      recorderRef.current = recorder;
      recorder.ondataavailable = event => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const shouldTranscribe = shouldTranscribeRef.current;
        shouldTranscribeRef.current = false;
        recorderRef.current = null;
        cleanupStream();

        if (shouldTranscribe) {
          void transcribeChunks();
        } else {
          chunksRef.current = [];
          setState('idle');
        }
      };
      recorder.start();
      setErrorText(null);
      setState('recording');
    } catch (error) {
      setState('idle');
      handleTranscriptionError(error);
    }
  }, [cleanupStream, handleTranscriptionError, state, transcribeChunks, uiAvailable, voiceInput]);

  const cancel = useCallback(() => {
    if (state === 'recording') {
      stopRecording(false);
      return;
    }

    if (state === 'transcribing') {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      setState('idle');
    }
  }, [state, stopRecording]);

  const handleTapClick = useCallback(() => {
    if (mode !== 'tap') return;
    if (state === 'idle') {
      void startRecording();
    } else if (state === 'recording') {
      stopRecording(true);
    }
  }, [mode, startRecording, state, stopRecording]);

  const handlePointerDown = useCallback(() => {
    if (mode !== 'hold') return;
    void startRecording();
  }, [mode, startRecording]);

  const handlePointerUp = useCallback(() => {
    if (mode !== 'hold') return;
    stopRecording(true);
  }, [mode, stopRecording]);

  const statusText =
    state === 'recording'
      ? mode === 'hold'
        ? 'Release to transcribe.'
        : 'Recording. Tap again to transcribe.'
      : state === 'transcribing'
        ? 'Transcribing...'
        : errorText;

  if (!voiceInput?.isAvailable && !errorText) {
    return null;
  }

  if (!uiAvailable && !errorText && state === 'idle') {
    return null;
  }

  return (
    <div className={className}>
      {uiAvailable && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleTapClick}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={cancel}
            onPointerLeave={mode === 'hold' ? handlePointerUp : undefined}
            className={buttonClassName}
            aria-label={state === 'recording' ? 'Stop voice input' : 'Start voice input'}
            title={mode === 'hold' ? 'Hold to speak' : 'Tap to record'}
            data-testid={`${testIdPrefix}-button`}
          >
            {state === 'transcribing' ? (
              <Loader2 size={iconSize} className="animate-spin" />
            ) : (
              <Mic size={iconSize} />
            )}
          </button>
          {state !== 'idle' && (
            <button
              type="button"
              onClick={cancel}
              className={cancelButtonClassName}
              aria-label="Cancel voice input"
              title="Cancel voice input"
              data-testid={`${testIdPrefix}-cancel`}
            >
              <X size={iconSize} />
            </button>
          )}
        </div>
      )}
      {statusText && (
        <p
          className={statusClassName}
          role={errorText ? 'alert' : undefined}
          data-testid={errorText ? `${testIdPrefix}-error` : `${testIdPrefix}-status`}
        >
          {statusText}
        </p>
      )}
    </div>
  );
};

export { VoiceDraftButton };
