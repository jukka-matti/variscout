import { describe, it, expect } from 'vitest';
import { buildActionToolHandlers } from '../actionToolHandlers';
import type { ActionToolDeps } from '../actionToolHandlers';
import type { Question, Finding } from '@variscout/core';

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q-1',
    text: 'Is Machine A the main contributor?',
    status: 'open',
    level: 1,
    validationType: 'data',
    createdAt: Date.now(),
    ...overrides,
  } as Question;
}

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'f-1',
    text: 'Machine A Cpk = 0.85',
    status: 'observed',
    createdAt: Date.now(),
    ...overrides,
  } as Finding;
}

function buildDeps(overrides: Partial<ActionToolDeps> = {}): ActionToolDeps {
  return {
    filteredData: [],
    findings: [],
    questions: [],
    filters: {},
    filterStack: [],
    ...overrides,
  };
}

describe('answer_question handler', () => {
  it('returns a proposal with question data for a valid question', async () => {
    const question = makeQuestion({ id: 'q-1', text: 'Is Machine A the main contributor?' });
    const handlers = buildActionToolHandlers(buildDeps({ questions: [question] }));

    const result = await handlers.answer_question!({
      question_id: 'q-1',
      status: 'answered',
      note: 'ANOVA eta-squared 0.42 confirms Machine A as primary contributor.',
    });

    const parsed = JSON.parse(result);
    expect(parsed.proposal).toBe(true);
    expect(parsed.tool).toBe('answer_question');
    expect(parsed.preview.questionText).toBe('Is Machine A the main contributor?');
    expect(parsed.preview.proposedStatus).toBe('answered');
    expect(parsed.preview.note).toBe(
      'ANOVA eta-squared 0.42 confirms Machine A as primary contributor.'
    );
    expect(parsed.preview.currentStatus).toBe('open');
    expect(parsed.status).toBe('pending');
  });

  it('returns error for unknown question_id', async () => {
    const handlers = buildActionToolHandlers(buildDeps({ questions: [] }));

    const result = await handlers.answer_question!({
      question_id: 'nonexistent',
      status: 'ruled-out',
      note: 'No evidence found.',
    });

    const parsed = JSON.parse(result);
    expect(parsed.error).toContain('Question not found');
  });

  it('returns error for missing required fields', async () => {
    const handlers = buildActionToolHandlers(buildDeps({ questions: [] }));

    const result = await handlers.answer_question!({
      question_id: '',
      status: 'answered',
      note: '',
    });

    const parsed = JSON.parse(result);
    expect(parsed.error).toBeDefined();
  });

  it('includes finding_id in preview when supporting finding is provided', async () => {
    const question = makeQuestion({ id: 'q-1' });
    const finding = makeFinding({ id: 'f-1' });
    const handlers = buildActionToolHandlers(
      buildDeps({ questions: [question], findings: [finding] })
    );

    const result = await handlers.answer_question!({
      question_id: 'q-1',
      status: 'answered',
      note: 'Confirmed by Finding F-1.',
      finding_id: 'f-1',
    });

    const parsed = JSON.parse(result);
    expect(parsed.proposal).toBe(true);
    expect(parsed.preview.findingId).toBe('f-1');
    expect(parsed.params.finding_id).toBe('f-1');
  });

  it('returns error when finding_id references a non-existent finding', async () => {
    const question = makeQuestion({ id: 'q-1' });
    const handlers = buildActionToolHandlers(buildDeps({ questions: [question], findings: [] }));

    const result = await handlers.answer_question!({
      question_id: 'q-1',
      status: 'answered',
      note: 'Based on finding.',
      finding_id: 'f-nonexistent',
    });

    const parsed = JSON.parse(result);
    expect(parsed.error).toContain('Finding not found');
  });

  it('supports ruled-out status', async () => {
    const question = makeQuestion({ id: 'q-2', text: 'Does humidity affect output?' });
    const handlers = buildActionToolHandlers(buildDeps({ questions: [question] }));

    const result = await handlers.answer_question!({
      question_id: 'q-2',
      status: 'ruled-out',
      note: 'eta-squared 0.01 — no meaningful contribution from humidity.',
    });

    const parsed = JSON.parse(result);
    expect(parsed.preview.proposedStatus).toBe('ruled-out');
    expect(parsed.editableText).toBe(
      'eta-squared 0.01 — no meaningful contribution from humidity.'
    );
  });

  it('generates a unique proposal id', async () => {
    const question = makeQuestion({ id: 'q-1' });
    const handlers = buildActionToolHandlers(buildDeps({ questions: [question] }));

    const r1 = JSON.parse(
      await handlers.answer_question!({ question_id: 'q-1', status: 'answered', note: 'Note A' })
    );
    const r2 = JSON.parse(
      await handlers.answer_question!({ question_id: 'q-1', status: 'answered', note: 'Note B' })
    );

    expect(r1.id).toBeDefined();
    expect(r2.id).toBeDefined();
    expect(r1.id).not.toBe(r2.id);
  });
});
