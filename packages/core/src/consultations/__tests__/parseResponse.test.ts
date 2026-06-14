/**
 * CL-4: Tests for the deterministic response parser.
 * Written FIRST (TDD) — these drive the implementation in parseResponse.ts.
 *
 * Key invariants verified here:
 * 1. Parser anchors on [id: <uuid>] tokens, NOT bare ### headings.
 * 2. Answered questions produce one insight per question.
 * 3. Unanswered / placeholder answers produce NO insight.
 * 4. Missing respondent line → 'Unknown respondent' (no crash).
 * 5. Unknown question IDs are skipped (no crash).
 * 6. Malformed input (no id anchors, not valid JSON) → readable Error.
 * 7. JSON path: happy path + malformed → readable Error.
 * 8. Parser output fed through store importResponse → only pending insights,
 *    findings untouched (no-mutation-without-accept invariant).
 */

import { describe, expect, it } from 'vitest';
import { parseMarkdownResponse, parseJsonResponse } from '../parseResponse';
import type { Consultation } from '../types';

// ---------------------------------------------------------------------------
// Test fixture helpers
// ---------------------------------------------------------------------------

const Q1_ID = '11111111-1111-1111-1111-111111111111';
const Q2_ID = '22222222-2222-2222-2222-222222222222';
const CONSULTATION_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

function makeConsultation(overrides: Partial<Consultation> = {}): Consultation {
  return {
    id: CONSULTATION_ID,
    title: 'Test consultation',
    status: 'sent',
    createdAt: 1000000,
    updatedAt: 1000000,
    deletedAt: null,
    viewSelection: [],
    questions: [
      {
        id: Q1_ID,
        text: 'Does the Monday startup differ?',
        status: 'open',
        createdAt: 1000000,
        deletedAt: null,
      },
      {
        id: Q2_ID,
        text: 'Is the oven preheated?',
        status: 'open',
        createdAt: 1000000,
        deletedAt: null,
      },
    ],
    responses: [],
    proposedInsights: [],
    ...overrides,
  };
}

/**
 * Builds the exact template format that CL-3's buildResponseTemplateMarkdown produces.
 * Tests must round-trip against this exact format.
 */
function buildTemplate(
  consultationId: string,
  questions: Array<{ id: string }>,
  answers: Record<string, string | null> = {}
): string {
  const lines: string[] = [
    `## Consultation ${consultationId} — responses`,
    `respondent: <your name>`,
    ``,
  ];
  questions.forEach((q, i) => {
    const num = i + 1;
    lines.push(`### Q${num} [id: ${q.id}]`);
    const answer = answers[q.id];
    if (answer === null) {
      // Unanswered placeholder
      lines.push(`> (type your answer here)`);
    } else if (answer !== undefined) {
      lines.push(`> ${answer}`);
    } else {
      lines.push(`> (type your answer here)`);
    }
    lines.push(``);
  });
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Markdown parser — happy path
// ---------------------------------------------------------------------------

describe('parseMarkdownResponse — happy path', () => {
  it('round-trips the CL-3 template: maps answers to correct questionIds', () => {
    const consultation = makeConsultation();
    const raw = buildTemplate(
      CONSULTATION_ID,
      [{ id: Q1_ID }, { id: Q2_ID }],
      {
        [Q1_ID]: 'Cold oven on Mondays.',
        [Q2_ID]: 'Never preheated over the weekend.',
      }
    );

    const result = parseMarkdownResponse(raw, consultation);

    expect(result.respondentLabel).toBe('<your name>');
    expect(result.insights).toHaveLength(2);

    const q1Insight = result.insights.find(i => i.questionId === Q1_ID);
    const q2Insight = result.insights.find(i => i.questionId === Q2_ID);

    expect(q1Insight).toBeDefined();
    expect(q1Insight!.text).toBe('Cold oven on Mondays.');
    expect(q1Insight!.kind).toBe('answer');

    expect(q2Insight).toBeDefined();
    expect(q2Insight!.text).toBe('Never preheated over the weekend.');
    expect(q2Insight!.kind).toBe('answer');
  });

  it('strips the leading "> " quote marker from answer lines', () => {
    const consultation = makeConsultation();
    const raw = [
      `## Consultation ${CONSULTATION_ID} — responses`,
      `respondent: J. Operator`,
      ``,
      `### Q1 [id: ${Q1_ID}]`,
      `> The oven was cold.`,
      ``,
    ].join('\n');

    const result = parseMarkdownResponse(raw, consultation);
    expect(result.insights[0].text).toBe('The oven was cold.');
  });

  it('reads respondent label correctly', () => {
    const consultation = makeConsultation();
    const raw = [
      `## Consultation ${CONSULTATION_ID} — responses`,
      `respondent: Jane Smith`,
      ``,
      `### Q1 [id: ${Q1_ID}]`,
      `> Something interesting.`,
      ``,
    ].join('\n');

    const result = parseMarkdownResponse(raw, consultation);
    expect(result.respondentLabel).toBe('Jane Smith');
  });

  it('handles multi-line answers by joining non-empty lines', () => {
    const consultation = makeConsultation();
    const raw = [
      `## Consultation ${CONSULTATION_ID} — responses`,
      `respondent: J. Operator`,
      ``,
      `### Q1 [id: ${Q1_ID}]`,
      `> First line of the answer.`,
      `> Second line of the answer.`,
      ``,
    ].join('\n');

    const result = parseMarkdownResponse(raw, consultation);
    // The parser should collect both lines
    expect(result.insights[0].text).toContain('First line');
    expect(result.insights[0].text).toContain('Second line');
  });
});

// ---------------------------------------------------------------------------
// Critical: id-anchored delimiting — the adversarial case
// ---------------------------------------------------------------------------

describe('parseMarkdownResponse — id-anchor delimiting (adversarial)', () => {
  it('does NOT desync when the respondent types a "###" heading inside their answer body', () => {
    const consultation = makeConsultation();
    // The expert typed a markdown heading inside their answer for Q1.
    // This must NOT be treated as a new question section — only [id: ...] headings delimit.
    const raw = [
      `## Consultation ${CONSULTATION_ID} — responses`,
      `respondent: Adversarial Expert`,
      ``,
      `### Q1 [id: ${Q1_ID}]`,
      `> Here is my answer.`,
      `### My Own Section Heading`,
      `Some prose that continues my answer.`,
      ``,
      `### Q2 [id: ${Q2_ID}]`,
      `> Completely separate answer for Q2.`,
      ``,
    ].join('\n');

    const result = parseMarkdownResponse(raw, consultation);

    // Both questions must be parsed — Q2 must not be swallowed by Q1's body
    expect(result.insights).toHaveLength(2);

    const q1Insight = result.insights.find(i => i.questionId === Q1_ID);
    const q2Insight = result.insights.find(i => i.questionId === Q2_ID);

    // Q1 body includes text before the bare ### heading AND after it
    expect(q1Insight).toBeDefined();
    expect(q1Insight!.text).toContain('Here is my answer');

    // Q2 is NOT absorbed into Q1 despite the bare ### in between
    expect(q2Insight).toBeDefined();
    expect(q2Insight!.text).toBe('Completely separate answer for Q2.');
  });

  it('does NOT desync when the respondent types "## Consultation..." inside their answer', () => {
    const consultation = makeConsultation();
    const raw = [
      `## Consultation ${CONSULTATION_ID} — responses`,
      `respondent: Tricky Respondent`,
      ``,
      `### Q1 [id: ${Q1_ID}]`,
      `> My answer starts here.`,
      `## Consultation fake-id — responses`,
      `This is just prose I typed, not a real template header.`,
      ``,
      `### Q2 [id: ${Q2_ID}]`,
      `> Answer for Q2.`,
      ``,
    ].join('\n');

    const result = parseMarkdownResponse(raw, consultation);

    // Q2 must still be correctly parsed
    const q2Insight = result.insights.find(i => i.questionId === Q2_ID);
    expect(q2Insight).toBeDefined();
    expect(q2Insight!.text).toBe('Answer for Q2.');
  });
});

// ---------------------------------------------------------------------------
// Unanswered / placeholder answers
// ---------------------------------------------------------------------------

describe('parseMarkdownResponse — unanswered / placeholder handling', () => {
  it('emits NO insight for a question left at the placeholder "(type your answer here)"', () => {
    const consultation = makeConsultation();
    const raw = buildTemplate(
      CONSULTATION_ID,
      [{ id: Q1_ID }, { id: Q2_ID }],
      {
        [Q1_ID]: null, // placeholder
        [Q2_ID]: 'Real answer here.',
      }
    );

    const result = parseMarkdownResponse(raw, consultation);
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].questionId).toBe(Q2_ID);
  });

  it('emits NO insight for an empty answer (whitespace only)', () => {
    const consultation = makeConsultation();
    const raw = [
      `## Consultation ${CONSULTATION_ID} — responses`,
      `respondent: J. Operator`,
      ``,
      `### Q1 [id: ${Q1_ID}]`,
      `>    `,
      ``,
      `### Q2 [id: ${Q2_ID}]`,
      `> Real answer.`,
      ``,
    ].join('\n');

    const result = parseMarkdownResponse(raw, consultation);
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].questionId).toBe(Q2_ID);
  });
});

// ---------------------------------------------------------------------------
// Missing / absent respondent line
// ---------------------------------------------------------------------------

describe('parseMarkdownResponse — missing respondent line', () => {
  it("defaults respondentLabel to 'Unknown respondent' when the respondent line is absent", () => {
    const consultation = makeConsultation();
    const raw = [
      `## Consultation ${CONSULTATION_ID} — responses`,
      ``,
      `### Q1 [id: ${Q1_ID}]`,
      `> My answer.`,
      ``,
    ].join('\n');

    const result = parseMarkdownResponse(raw, consultation);
    expect(result.respondentLabel).toBe('Unknown respondent');
    expect(result.insights).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Unknown question IDs
// ---------------------------------------------------------------------------

describe('parseMarkdownResponse — unknown question IDs', () => {
  it('skips id-bearing headings whose IDs are not in consultation.questions', () => {
    const consultation = makeConsultation();
    const UNKNOWN_ID = '99999999-9999-9999-9999-999999999999';
    const raw = [
      `## Consultation ${CONSULTATION_ID} — responses`,
      `respondent: J. Operator`,
      ``,
      `### Q0 [id: ${UNKNOWN_ID}]`,
      `> This should be ignored.`,
      ``,
      `### Q1 [id: ${Q1_ID}]`,
      `> Known question answer.`,
      ``,
    ].join('\n');

    const result = parseMarkdownResponse(raw, consultation);
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].questionId).toBe(Q1_ID);
  });
});

// ---------------------------------------------------------------------------
// Malformed input
// ---------------------------------------------------------------------------

describe('parseMarkdownResponse — malformed input', () => {
  it('throws a readable Error when no id-anchors are found and input is not JSON', () => {
    const consultation = makeConsultation();
    const malformed = 'This is just some random text with no structure at all.';

    expect(() => parseMarkdownResponse(malformed, consultation)).toThrow(
      /Could not parse consultation response/
    );
  });

  it('throws a readable Error on completely empty input', () => {
    const consultation = makeConsultation();
    expect(() => parseMarkdownResponse('', consultation)).toThrow(
      /Could not parse consultation response/
    );
  });
});

// ---------------------------------------------------------------------------
// JSON path — happy path
// ---------------------------------------------------------------------------

describe('parseJsonResponse — happy path', () => {
  it('parses a valid JSON response payload', () => {
    const consultation = makeConsultation();
    const payload = JSON.stringify({
      consultationId: CONSULTATION_ID,
      respondentLabel: 'J. Operator',
      answers: [
        { questionId: Q1_ID, text: 'Cold oven on Mondays.' },
        { questionId: Q2_ID, text: 'No preheat on weekends.' },
      ],
    });

    const result = parseJsonResponse(payload, consultation);
    expect(result.respondentLabel).toBe('J. Operator');
    expect(result.insights).toHaveLength(2);
    expect(result.insights[0].questionId).toBe(Q1_ID);
    expect(result.insights[0].kind).toBe('answer');
    expect(result.insights[1].questionId).toBe(Q2_ID);
  });

  it('skips JSON answers whose questionId is not in consultation.questions', () => {
    const consultation = makeConsultation();
    const UNKNOWN_ID = '99999999-9999-9999-9999-999999999999';
    const payload = JSON.stringify({
      consultationId: CONSULTATION_ID,
      respondentLabel: 'J. Operator',
      answers: [
        { questionId: UNKNOWN_ID, text: 'This should be ignored.' },
        { questionId: Q1_ID, text: 'Known answer.' },
      ],
    });

    const result = parseJsonResponse(payload, consultation);
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].questionId).toBe(Q1_ID);
  });

  it('skips JSON answers with empty text', () => {
    const consultation = makeConsultation();
    const payload = JSON.stringify({
      consultationId: CONSULTATION_ID,
      respondentLabel: 'J. Operator',
      answers: [
        { questionId: Q1_ID, text: '' },
        { questionId: Q2_ID, text: 'Valid answer.' },
      ],
    });

    const result = parseJsonResponse(payload, consultation);
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].questionId).toBe(Q2_ID);
  });
});

// ---------------------------------------------------------------------------
// JSON path — malformed
// ---------------------------------------------------------------------------

describe('parseJsonResponse — malformed input', () => {
  it('throws a readable Error on invalid JSON', () => {
    const consultation = makeConsultation();
    expect(() => parseJsonResponse('{not valid json', consultation)).toThrow(
      /Could not parse consultation response/
    );
  });

  it('throws a readable Error when required fields are missing', () => {
    const consultation = makeConsultation();
    const payload = JSON.stringify({ foo: 'bar' }); // missing required shape
    expect(() => parseJsonResponse(payload, consultation)).toThrow(
      /Could not parse consultation response/
    );
  });

  it('throws a readable Error when answers is not an array', () => {
    const consultation = makeConsultation();
    const payload = JSON.stringify({
      consultationId: CONSULTATION_ID,
      respondentLabel: 'J. Operator',
      answers: 'not an array',
    });
    expect(() => parseJsonResponse(payload, consultation)).toThrow(
      /Could not parse consultation response/
    );
  });
});

// Note: The store integration test (parser → importResponse → no-mutation-without-accept)
// lives in packages/stores/src/__tests__/parseResponseIntegration.test.ts
// (core cannot import @variscout/stores — dependency direction rule).
