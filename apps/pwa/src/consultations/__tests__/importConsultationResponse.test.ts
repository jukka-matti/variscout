/**
 * CL-5a tests for importConsultationResponseFile
 *
 * Verifies:
 * - A .md file routes to parseMarkdownResponse
 * - A .json file routes to parseJsonResponse
 * - Parse errors from either parser propagate to the caller
 *
 * The file argument uses a duck-typed { name, text() } interface that matches
 * the real browser File API — importConsultationResponseFile accepts anything
 * with those two members, so we can test without constructing a real File blob.
 */
import { describe, expect, it } from 'vitest';
import { importConsultationResponseFile } from '../importConsultationResponse';
import {
  createConsultation,
  createConsultationQuestion,
} from '@variscout/core/consultations';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeConsultationWithQuestion() {
  const q = createConsultationQuestion('Why do Mondays drift?');
  return { ...createConsultation('Line 3 drift'), questions: [q] };
}

/** Build a valid markdown response string for the given consultation. */
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

/** Build a valid JSON response string for the given consultation. */
function makeJsonResponse(consultation: ReturnType<typeof makeConsultationWithQuestion>) {
  const q = consultation.questions[0];
  return JSON.stringify({
    consultationId: consultation.id,
    respondentLabel: 'Maria Expert',
    answers: [{ questionId: q.id, text: 'The Monday crew runs a cold startup.' }],
  });
}

/** Minimal duck-typed file object matching the interface. */
function makeFile(name: string, content: string) {
  return {
    name,
    text: async () => content,
  };
}

// ── Markdown routing ──────────────────────────────────────────────────────────

describe('importConsultationResponseFile — markdown routing', () => {
  it('routes a .md file to parseMarkdownResponse and returns the parsed insights', async () => {
    const consultation = makeConsultationWithQuestion();
    const file = makeFile('response.md', makeMdResponse(consultation));

    const result = await importConsultationResponseFile(file, consultation);

    expect(result.respondentLabel).toBe('Maria Expert');
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].text).toBe('The Monday crew runs a cold startup.');
    expect(result.insights[0].questionId).toBe(consultation.questions[0].id);
  });

  it('routes a .txt file (non-.json) to parseMarkdownResponse', async () => {
    const consultation = makeConsultationWithQuestion();
    const file = makeFile('response.txt', makeMdResponse(consultation));

    const result = await importConsultationResponseFile(file, consultation);

    expect(result.respondentLabel).toBe('Maria Expert');
    expect(result.insights).toHaveLength(1);
  });
});

// ── JSON routing ──────────────────────────────────────────────────────────────

describe('importConsultationResponseFile — JSON routing', () => {
  it('routes a .json file to parseJsonResponse and returns the parsed insights', async () => {
    const consultation = makeConsultationWithQuestion();
    const file = makeFile('response.json', makeJsonResponse(consultation));

    const result = await importConsultationResponseFile(file, consultation);

    expect(result.respondentLabel).toBe('Maria Expert');
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].text).toBe('The Monday crew runs a cold startup.');
    expect(result.insights[0].questionId).toBe(consultation.questions[0].id);
  });

  // M2: case-insensitive .json routing — Response.JSON uses uppercase extension
  it('M2: routes a .JSON file (uppercase) to parseJsonResponse (case-insensitive)', async () => {
    const consultation = makeConsultationWithQuestion();
    const file = makeFile('response.JSON', makeJsonResponse(consultation));

    const result = await importConsultationResponseFile(file, consultation);

    expect(result.respondentLabel).toBe('Maria Expert');
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].text).toBe('The Monday crew runs a cold startup.');
  });
});

// ── Error propagation ─────────────────────────────────────────────────────────

describe('importConsultationResponseFile — error propagation', () => {
  it('propagates a parse error when the .md file has no id anchors', async () => {
    const consultation = makeConsultationWithQuestion();
    const file = makeFile('response.md', 'respondent: Maria\n\nNo id anchors here.');

    await expect(importConsultationResponseFile(file, consultation)).rejects.toThrow(
      /no question anchors/i
    );
  });

  it('propagates a parse error when the .json file contains invalid JSON', async () => {
    const consultation = makeConsultationWithQuestion();
    const file = makeFile('response.json', '{ this is not valid json }');

    await expect(importConsultationResponseFile(file, consultation)).rejects.toThrow(
      /invalid JSON/i
    );
  });

  it('propagates a parse error when the .json file does not match the expected schema', async () => {
    const consultation = makeConsultationWithQuestion();
    const file = makeFile('response.json', JSON.stringify({ unexpected: true }));

    await expect(importConsultationResponseFile(file, consultation)).rejects.toThrow(
      /schema/i
    );
  });
});
