/**
 * TDD tests for distillTranscriptToInsights (CL-6).
 *
 * Covers:
 * - config:undefined → returns [], no network call (dormant path)
 * - blank transcript → returns [], no call
 * - mock config + mock sendResponsesTurn → returns insights mapped to question ids
 * - malformed item in model payload → dropped defensively, not thrown
 * - proposals-only invariant: distilled insights are pending, findings untouched
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// We mock the module BEFORE importing distillTranscriptToInsights so the mock
// is in place when the module-under-test imports it.
vi.mock('../responsesApi', () => ({
  sendResponsesTurn: vi.fn(),
  extractResponseText: vi.fn((response: { output: Array<{ type: string; content?: Array<{ type: string; text?: string }> }> }) => {
    // Mirror the real implementation for our mock responses
    for (const item of response.output) {
      if (item.type === 'message' && item.content) {
        for (const c of item.content) {
          if (c.type === 'text' && c.text) return c.text;
        }
      }
    }
    return '';
  }),
}));

import { distillTranscriptToInsights } from '../distillation';
import { sendResponsesTurn } from '../responsesApi';
import type { ResponsesApiConfig } from '../responsesApi';

const mockSendResponsesTurn = vi.mocked(sendResponsesTurn);

const mockConfig: ResponsesApiConfig = {
  endpoint: 'https://test.openai.azure.com',
  deployment: 'gpt-4o',
  apiKey: 'test-key',
};

const mockQuestions = [
  { id: 'q-1', text: 'Does Monday startup differ from other days?' },
  { id: 'q-2', text: 'Is there a temperature pattern on cold mornings?' },
];

const VALID_PAYLOAD = JSON.stringify([
  { questionId: 'q-1', text: 'Monday crew runs a cold startup — oven not pre-heated.', kind: 'answer' },
  { questionId: 'q-2', text: 'Temperature drops 15°C below spec on cold mornings.', kind: 'context' },
  { text: 'Different operator on Mondays may be a suspected cause.', kind: 'new-hypothesis-proposal' },
]);

function mockApiResponse(payload: string) {
  mockSendResponsesTurn.mockResolvedValueOnce({
    id: 'resp-123',
    output: [{ type: 'message', content: [{ type: 'text', text: payload }] }],
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── Dormant path ─────────────────────────────────────────────────────────────

describe('distillTranscriptToInsights — dormant path (no provider)', () => {
  it('returns [] when config is undefined, makes NO network call', async () => {
    const result = await distillTranscriptToInsights({
      config: undefined,
      transcript: 'Some transcript content here.',
      questions: mockQuestions,
    });

    expect(result).toEqual([]);
    expect(mockSendResponsesTurn).not.toHaveBeenCalled();
  });

  it('returns [] when transcript is blank, makes NO network call even with config', async () => {
    const result = await distillTranscriptToInsights({
      config: mockConfig,
      transcript: '   ',
      questions: mockQuestions,
    });

    expect(result).toEqual([]);
    expect(mockSendResponsesTurn).not.toHaveBeenCalled();
  });

  it('returns [] when transcript is empty string', async () => {
    const result = await distillTranscriptToInsights({
      config: mockConfig,
      transcript: '',
      questions: mockQuestions,
    });

    expect(result).toEqual([]);
    expect(mockSendResponsesTurn).not.toHaveBeenCalled();
  });
});

// ── Active path (mock provider) ───────────────────────────────────────────────

describe('distillTranscriptToInsights — active path (mock config)', () => {
  it('calls sendResponsesTurn once with no tools (one-shot)', async () => {
    mockApiResponse(VALID_PAYLOAD);

    await distillTranscriptToInsights({
      config: mockConfig,
      transcript: 'The Monday crew runs a cold startup.',
      questions: mockQuestions,
    });

    expect(mockSendResponsesTurn).toHaveBeenCalledOnce();
    const [_config, request] = mockSendResponsesTurn.mock.calls[0];
    expect(_config).toBe(mockConfig);
    expect(request.tools).toEqual([]);
  });

  it('uses json_schema text format for structured output', async () => {
    mockApiResponse(VALID_PAYLOAD);

    await distillTranscriptToInsights({
      config: mockConfig,
      transcript: 'Transcript text here.',
      questions: mockQuestions,
    });

    const [, request] = mockSendResponsesTurn.mock.calls[0];
    expect(request.text?.format?.type).toBe('json_schema');
    expect(request.text?.format?.name).toBeTruthy();
    expect(request.text?.format?.schema).toBeTruthy();
  });

  it('returns insights mapped to question ids with correct kinds', async () => {
    mockApiResponse(VALID_PAYLOAD);

    const result = await distillTranscriptToInsights({
      config: mockConfig,
      transcript: 'Monday crew runs cold startup.',
      questions: mockQuestions,
    });

    expect(result).toHaveLength(3);

    const q1insight = result.find(i => i.questionId === 'q-1');
    expect(q1insight).toBeDefined();
    expect(q1insight!.kind).toBe('answer');
    expect(q1insight!.text).toContain('cold startup');

    const q2insight = result.find(i => i.questionId === 'q-2');
    expect(q2insight).toBeDefined();
    expect(q2insight!.kind).toBe('context');

    const unanchored = result.find(i => !i.questionId);
    expect(unanchored).toBeDefined();
    expect(unanchored!.kind).toBe('new-hypothesis-proposal');
  });

  it('drops malformed items without throwing', async () => {
    const mixedPayload = JSON.stringify([
      { questionId: 'q-1', text: 'Valid insight.', kind: 'answer' },
      { questionId: 'q-2', text: 'Missing kind field — should be dropped.' }, // no kind
      { text: 123, kind: 'context' }, // text not a string
      { text: '', kind: 'context' }, // empty text — dropped
      { text: 'Another valid one.', kind: 'contradiction' },
    ]);

    mockApiResponse(mixedPayload);

    const result = await distillTranscriptToInsights({
      config: mockConfig,
      transcript: 'Some content.',
      questions: mockQuestions,
    });

    // Only the 2 valid items survive
    expect(result).toHaveLength(2);
    expect(result.every(i => typeof i.text === 'string' && i.text.length > 0)).toBe(true);
    expect(result.every(i => ['answer', 'context', 'new-hypothesis-proposal', 'contradiction'].includes(i.kind))).toBe(true);
  });

  it('does not throw when model returns unparseable JSON — returns []', async () => {
    mockSendResponsesTurn.mockResolvedValueOnce({
      id: 'resp-bad',
      output: [{ type: 'message', content: [{ type: 'text', text: 'Not JSON at all.' }] }],
    });

    const result = await distillTranscriptToInsights({
      config: mockConfig,
      transcript: 'Some content.',
      questions: mockQuestions,
    });

    expect(result).toEqual([]);
  });

  it('does not throw when model returns null — returns []', async () => {
    mockSendResponsesTurn.mockResolvedValueOnce({
      id: 'resp-null',
      output: [{ type: 'message', content: [{ type: 'text', text: 'null' }] }],
    });

    const result = await distillTranscriptToInsights({
      config: mockConfig,
      transcript: 'Some content.',
      questions: mockQuestions,
    });

    expect(result).toEqual([]);
  });

  it('includes the question list in the request input', async () => {
    mockApiResponse(VALID_PAYLOAD);

    await distillTranscriptToInsights({
      config: mockConfig,
      transcript: 'Monday startup is cold.',
      questions: mockQuestions,
    });

    const [, request] = mockSendResponsesTurn.mock.calls[0];
    // The question texts should appear somewhere in the input or instructions
    const requestStr = JSON.stringify(request);
    expect(requestStr).toContain('Monday startup differ');
    expect(requestStr).toContain('temperature pattern');
  });
});

// ── Proposals-only invariant ──────────────────────────────────────────────────

describe('distillTranscriptToInsights — proposals-only invariant', () => {
  it('returns items with only questionId?, text, kind — no status or acceptedAs fields', async () => {
    mockApiResponse(VALID_PAYLOAD);

    const result = await distillTranscriptToInsights({
      config: mockConfig,
      transcript: 'Transcript here.',
      questions: mockQuestions,
    });

    for (const item of result) {
      // distillTranscriptToInsights returns the raw proposal shape — no status
      // Status ('pending') is assigned by importResponse when the store ingests them
      expect('status' in item).toBe(false);
      expect('acceptedAs' in item).toBe(false);
      expect('id' in item).toBe(false);
    }
  });

  it('valid kind values are the 4 ProposedInsightKind literals', async () => {
    mockApiResponse(VALID_PAYLOAD);

    const result = await distillTranscriptToInsights({
      config: mockConfig,
      transcript: 'Transcript here.',
      questions: mockQuestions,
    });

    const validKinds = new Set(['answer', 'context', 'new-hypothesis-proposal', 'contradiction']);
    for (const item of result) {
      expect(validKinds.has(item.kind)).toBe(true);
    }
  });
});
