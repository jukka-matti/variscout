/**
 * CL-6 tests for transcript routing in importConsultationResponseFile.
 *
 * Verifies:
 * - .vtt file with config:undefined → ParsedResponse with [] insights
 *   (dormant: distillTranscriptToInsights IS called but makes no network call —
 *   that no-network guarantee is proven in core/ai/__tests__/distillation.test.ts)
 * - .txt file routes to the deterministic parser (not a transcript extension)
 * - .md file still routes to the deterministic parser (CL-4 path not regressed)
 * - .json file still routes to parseJsonResponse (not regressed)
 * - .vtt file with mock config → distillTranscriptToInsights is called and returns insights
 * - proposals-only invariant: distilled insights enter store as 'pending', findings untouched
 *
 * Extension routing rule (implementation):
 *   .json → parseJsonResponse (deterministic)
 *   .vtt  → distillTranscriptToInsights (AI-gated; dormant when config=undefined)
 *   else  → parseMarkdownResponse (deterministic)
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Mock the distillation module before importing the handler
vi.mock('@variscout/core/ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@variscout/core/ai')>();
  return {
    ...actual,
    distillTranscriptToInsights: vi.fn().mockResolvedValue([]),
  };
});

import { importConsultationResponseFile } from '../importConsultationResponse';
import { distillTranscriptToInsights } from '@variscout/core/ai';
import {
  createConsultation,
  createConsultationQuestion,
} from '@variscout/core/consultations';
import type { ResponsesApiConfig } from '@variscout/core/ai';

const mockDistill = vi.mocked(distillTranscriptToInsights);

const mockConfig: ResponsesApiConfig = {
  endpoint: 'https://test.openai.azure.com',
  deployment: 'gpt-4o',
  apiKey: 'test-key',
};

function makeConsultationWithQuestion() {
  const q = createConsultationQuestion('Why do Mondays drift?');
  return { ...createConsultation('Line 3 drift'), questions: [q] };
}

/** Valid markdown response for the deterministic path tests */
function makeMdResponse(consultation: ReturnType<typeof makeConsultationWithQuestion>) {
  const q = consultation.questions[0];
  return [
    `## Consultation ${consultation.id} — responses`,
    `respondent: Maria Expert`,
    ``,
    `### Q1 [id: ${q.id}]`,
    `> The Monday crew runs a cold startup.`,
    ``,
  ].join('\n');
}

function makeFile(name: string, content: string) {
  return {
    name,
    text: async () => content,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: distill returns [] (dormant)
  mockDistill.mockResolvedValue([]);
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── .vtt transcript routing — dormant (no config) ────────────────────────────

describe('importConsultationResponseFile — .vtt transcript (no config)', () => {
  it('calls distillTranscriptToInsights and returns ParsedResponse with [] insights when config is undefined', async () => {
    const consultation = makeConsultationWithQuestion();
    const file = makeFile(
      'meeting.vtt',
      'WEBVTT\n\n00:00:01.000 --> 00:00:05.000\nMonday startup is cold.'
    );

    // config = undefined (no provider) → distill is called but returns []
    // The no-network guarantee is enforced INSIDE distillTranscriptToInsights
    // (tested in core/ai/__tests__/distillation.test.ts)
    const result = await importConsultationResponseFile(file, consultation, undefined);

    expect(result.insights).toEqual([]);
    expect(result.respondentLabel).toBe('');

    // distillTranscriptToInsights IS called (the import handler delegates to it)
    expect(mockDistill).toHaveBeenCalledOnce();
    // It was called with config: undefined — the dormant guarantee
    const [call] = mockDistill.mock.calls;
    expect(call[0].config).toBeUndefined();
  });

  // M1: dormant path with config undefined → returns { insights: [] }, no network
  it('M1: .vtt with config:undefined returns insights:[] (dormant) without network call', async () => {
    const consultation = makeConsultationWithQuestion();
    const file = makeFile(
      'meeting.vtt',
      'WEBVTT\n\n00:00:01.000 --> 00:00:05.000\nMonday startup is cold.'
    );

    const result = await importConsultationResponseFile(file, consultation, undefined);

    // Returns empty insights (dormant) — no network was made
    expect(result.insights).toEqual([]);
    // mockDistill is called but immediately returns [] (config undefined)
    expect(mockDistill).toHaveBeenCalledOnce();
    // distillTranscriptToInsights received config=undefined — the no-network path
    expect(mockDistill.mock.calls[0][0].config).toBeUndefined();
  });
});

// ── .vtt transcript routing — active (mock config) ───────────────────────────

describe('importConsultationResponseFile — .vtt transcript (with mock config)', () => {
  it('calls distillTranscriptToInsights and maps insights to ParsedResponse', async () => {
    const consultation = makeConsultationWithQuestion();
    const q = consultation.questions[0];

    mockDistill.mockResolvedValueOnce([
      { questionId: q.id, text: 'Cold startup on Mondays.', kind: 'answer' },
      { text: 'Different operator on Mondays.', kind: 'new-hypothesis-proposal' },
    ]);

    const transcriptContent =
      'WEBVTT\n\n00:00:01.000 --> 00:00:05.000\nMonday startup is cold.';
    const file = makeFile('meeting.vtt', transcriptContent);

    const result = await importConsultationResponseFile(file, consultation, mockConfig);

    expect(mockDistill).toHaveBeenCalledOnce();
    const [call] = mockDistill.mock.calls;
    expect(call[0].config).toBe(mockConfig);
    expect(call[0].transcript).toContain('Monday startup');

    expect(result.insights).toHaveLength(2);
    expect(result.insights[0].kind).toBe('answer');
    expect(result.insights[0].questionId).toBe(q.id);
    expect(result.insights[1].kind).toBe('new-hypothesis-proposal');
    expect(result.respondentLabel).toBe('');
  });
});

// ── Deterministic path not regressed ─────────────────────────────────────────

describe('importConsultationResponseFile — .md still uses deterministic parser', () => {
  it('routes .md to parseMarkdownResponse, NOT distillation', async () => {
    const consultation = makeConsultationWithQuestion();
    const file = makeFile('response.md', makeMdResponse(consultation));

    const result = await importConsultationResponseFile(file, consultation, mockConfig);

    // deterministic parser runs → real insight extracted
    expect(result.respondentLabel).toBe('Maria Expert');
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].text).toBe('The Monday crew runs a cold startup.');
    // distillation must NOT have been called
    expect(mockDistill).not.toHaveBeenCalled();
  });

  it('routes .json to parseJsonResponse, NOT distillation', async () => {
    const consultation = makeConsultationWithQuestion();
    const q = consultation.questions[0];
    const jsonContent = JSON.stringify({
      consultationId: consultation.id,
      respondentLabel: 'Maria Expert',
      answers: [{ questionId: q.id, text: 'Cold startup.' }],
    });
    const file = makeFile('response.json', jsonContent);

    const result = await importConsultationResponseFile(file, consultation, mockConfig);

    expect(result.respondentLabel).toBe('Maria Expert');
    expect(result.insights).toHaveLength(1);
    expect(mockDistill).not.toHaveBeenCalled();
  });

  it('routes .txt to parseMarkdownResponse (not a transcript extension), NOT distillation', async () => {
    const consultation = makeConsultationWithQuestion();
    const file = makeFile('response.txt', makeMdResponse(consultation));

    const result = await importConsultationResponseFile(file, consultation, mockConfig);

    expect(result.respondentLabel).toBe('Maria Expert');
    expect(result.insights).toHaveLength(1);
    expect(mockDistill).not.toHaveBeenCalled();
  });
});

// ── I3: source label propagation ─────────────────────────────────────────────

describe('importConsultationResponseFile — source label (I3)', () => {
  it('returns source: "transcript" for a .vtt file', async () => {
    const consultation = makeConsultationWithQuestion();
    const file = makeFile(
      'meeting.vtt',
      'WEBVTT\n\n00:00:01.000 --> 00:00:05.000\nMonday startup is cold.'
    );

    const result = await importConsultationResponseFile(file, consultation, undefined);

    expect(result.source).toBe('transcript');
  });

  it('returns source: "typed" for a .md file', async () => {
    const consultation = makeConsultationWithQuestion();
    const file = makeFile('response.md', makeMdResponse(consultation));

    const result = await importConsultationResponseFile(file, consultation);

    expect(result.source).toBe('typed');
  });

  it('returns source: "typed" for a .json file', async () => {
    const consultation = makeConsultationWithQuestion();
    const q = consultation.questions[0];
    const jsonContent = JSON.stringify({
      consultationId: consultation.id,
      respondentLabel: 'Maria Expert',
      answers: [{ questionId: q.id, text: 'Cold startup.' }],
    });
    const file = makeFile('response.json', jsonContent);

    const result = await importConsultationResponseFile(file, consultation);

    expect(result.source).toBe('typed');
  });

  it('returns source: "typed" for a .txt file', async () => {
    const consultation = makeConsultationWithQuestion();
    const file = makeFile('response.txt', makeMdResponse(consultation));

    const result = await importConsultationResponseFile(file, consultation);

    expect(result.source).toBe('typed');
  });
});

// ── Proposals-only invariant via store ───────────────────────────────────────

describe('proposals-only invariant: distilled insights enter store as pending only', () => {
  it('importResponse with distilled insights → all pending, findings untouched', async () => {
    const { useAnalyzeStore } = await import('@variscout/stores');
    useAnalyzeStore.setState(useAnalyzeStore.getInitialState());

    const consultation = makeConsultationWithQuestion();
    const q = consultation.questions[0];

    // Simulate what distillTranscriptToInsights returns (proposals, no store fields)
    const distilledProposals = [
      { questionId: q.id, text: 'Cold startup on Mondays.', kind: 'answer' as const },
      { text: 'Operator change as suspected cause.', kind: 'new-hypothesis-proposal' as const },
    ];

    // Create a consultation in the store
    const storeConsultation = useAnalyzeStore.getState().createConsultation('Line 3 drift');

    // importResponse is the ONLY path that ingests insights into canonical state
    useAnalyzeStore.getState().importResponse(storeConsultation.id, {
      source: 'transcript',
      respondentLabel: '',
      insights: distilledProposals,
    });

    const updated = useAnalyzeStore
      .getState()
      .consultations.find(c => c.id === storeConsultation.id)!;

    // All insights land as 'pending' — never auto-accepted
    expect(updated.proposedInsights).toHaveLength(2);
    expect(updated.proposedInsights.every(i => i.status === 'pending')).toBe(true);
    expect(updated.proposedInsights.every(i => i.acceptedAs === undefined)).toBe(true);

    // No canonical mutation: findings must remain empty without explicit acceptInsight
    expect(useAnalyzeStore.getState().findings).toHaveLength(0);
  });
});
