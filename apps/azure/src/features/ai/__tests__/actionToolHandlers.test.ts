import { describe, it, expect } from 'vitest';
import { buildActionToolHandlers } from '../actionToolHandlers';
import type { ActionToolDeps } from '../actionToolHandlers';
import type { Finding, Hypothesis } from '@variscout/core';

function makeHypothesis(overrides: Partial<Hypothesis> = {}): Hypothesis {
  return {
    id: 'h-1',
    name: 'Nozzle wear on night shift',
    synthesis: 'Evidence confirms nozzle degradation.',
    status: 'proposed',
    findingIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deletedAt: null,
    investigationId: 'general-unassigned',
    ...overrides,
  } as Hypothesis;
}

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'f-1',
    text: 'Machine A Cpk = 0.85',
    status: 'analyzed',
    createdAt: Date.now(),
    ...overrides,
  } as Finding;
}

function buildDeps(overrides: Partial<ActionToolDeps> = {}): ActionToolDeps {
  return {
    filteredData: [],
    findings: [],
    filters: {},
    filterStack: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// suggest_hypothesis handler (IM-1: keyed by findingIds, no questionIds)
// ---------------------------------------------------------------------------

describe('suggest_hypothesis handler', () => {
  it('returns a proposal for valid inputs', async () => {
    const finding = makeFinding({ id: 'f-1' });
    const handlers = buildActionToolHandlers(buildDeps({ findings: [finding] }));

    const result = await handlers.suggest_hypothesis!({
      name: 'Nozzle wear',
      synthesis: 'Confirmed by finding F-1.',
      findingIds: ['f-1'],
    });

    const parsed = JSON.parse(result);
    expect(parsed.proposal).toBe(true);
    expect(parsed.tool).toBe('suggest_hypothesis');
    expect(parsed.preview.name).toBe('Nozzle wear');
    expect(parsed.preview.findingCount).toBe(1);
    expect(parsed.status).toBe('pending');
  });

  it('returns error when name is missing', async () => {
    const finding = makeFinding({ id: 'f-1' });
    const handlers = buildActionToolHandlers(buildDeps({ findings: [finding] }));

    const result = await handlers.suggest_hypothesis!({
      name: '',
      synthesis: '',
      findingIds: ['f-1'],
    });

    const parsed = JSON.parse(result);
    expect(parsed.error).toBeDefined();
  });

  it('returns error when findingIds is empty', async () => {
    const handlers = buildActionToolHandlers(buildDeps({ findings: [] }));

    const result = await handlers.suggest_hypothesis!({
      name: 'Nozzle wear',
      synthesis: 'No findings linked.',
      findingIds: [],
    });

    const parsed = JSON.parse(result);
    expect(parsed.error).toContain('findingId');
  });

  it('returns error when referenced finding does not exist', async () => {
    const handlers = buildActionToolHandlers(buildDeps({ findings: [] }));

    const result = await handlers.suggest_hypothesis!({
      name: 'Nozzle wear',
      synthesis: 'Based on finding.',
      findingIds: ['f-nonexistent'],
    });

    const parsed = JSON.parse(result);
    expect(parsed.error).toContain('not found');
  });

  it('generates a unique proposal id per call', async () => {
    const finding = makeFinding({ id: 'f-1' });
    const handlers = buildActionToolHandlers(buildDeps({ findings: [finding] }));

    const r1 = JSON.parse(
      await handlers.suggest_hypothesis!({ name: 'H1', synthesis: '', findingIds: ['f-1'] })
    );
    const r2 = JSON.parse(
      await handlers.suggest_hypothesis!({ name: 'H2', synthesis: '', findingIds: ['f-1'] })
    );

    expect(r1.id).toBeDefined();
    expect(r2.id).toBeDefined();
    expect(r1.id).not.toBe(r2.id);
  });
});

// ---------------------------------------------------------------------------
// suggest_improvement_idea handler (IM-1: keyed by hypothesis_id)
// ---------------------------------------------------------------------------

describe('suggest_improvement_idea handler', () => {
  it('returns a proposal for a valid hypothesis_id', async () => {
    const hub = makeHypothesis({ id: 'h-1', status: 'proposed' });
    const handlers = buildActionToolHandlers(buildDeps({ hypotheses: [hub] }));

    const result = await handlers.suggest_improvement_idea!({
      hypothesis_id: 'h-1',
      text: 'Replace nozzle tip weekly',
      direction: 'prevent',
      timeframe: 'weeks',
    });

    const parsed = JSON.parse(result);
    expect(parsed.proposal).toBe(true);
    expect(parsed.tool).toBe('suggest_improvement_idea');
    expect(parsed.preview.hypothesisText).toBe('Nozzle wear on night shift');
    expect(parsed.preview.direction).toBe('prevent');
    expect(parsed.status).toBe('pending');
  });

  it('returns error for unknown hypothesis_id', async () => {
    const handlers = buildActionToolHandlers(buildDeps({ hypotheses: [] }));

    const result = await handlers.suggest_improvement_idea!({
      hypothesis_id: 'h-nonexistent',
      text: 'Fix it',
      direction: 'prevent',
      timeframe: 'weeks',
    });

    const parsed = JSON.parse(result);
    expect(parsed.error).toContain('not found');
  });

  it('returns error for refuted hypothesis', async () => {
    const hub = makeHypothesis({ id: 'h-refuted', status: 'refuted' });
    const handlers = buildActionToolHandlers(buildDeps({ hypotheses: [hub] }));

    const result = await handlers.suggest_improvement_idea!({
      hypothesis_id: 'h-refuted',
      text: 'Should not apply',
      direction: 'prevent',
      timeframe: 'weeks',
    });

    const parsed = JSON.parse(result);
    expect(parsed.error).toContain('refuted');
  });

  it('returns error when hypothesis_id is missing', async () => {
    const handlers = buildActionToolHandlers(buildDeps({ hypotheses: [] }));

    const result = await handlers.suggest_improvement_idea!({
      hypothesis_id: '',
      text: 'Fix it',
      direction: 'prevent',
      timeframe: 'weeks',
    });

    const parsed = JSON.parse(result);
    expect(parsed.error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// connect_hub_evidence handler (IM-1: keyed by hypothesisId)
// ---------------------------------------------------------------------------

describe('connect_hub_evidence handler', () => {
  it('returns a proposal for a valid hub and findings', async () => {
    const hub = makeHypothesis({ id: 'h-1' });
    const finding = makeFinding({ id: 'f-1' });
    const handlers = buildActionToolHandlers(buildDeps({ hypotheses: [hub], findings: [finding] }));

    const result = await handlers.connect_hub_evidence!({
      hubId: 'h-1',
      findingIds: ['f-1'],
      reason: 'Statistical association (ANOVA p<0.01)',
    });

    const parsed = JSON.parse(result);
    expect(parsed.proposal).toBe(true);
    expect(parsed.tool).toBe('connect_hub_evidence');
    expect(parsed.preview.hubName).toBe('Nozzle wear on night shift');
    expect(parsed.preview.findingCount).toBe(1);
  });

  it('returns error when hub is not found', async () => {
    const handlers = buildActionToolHandlers(buildDeps({ hypotheses: [] }));

    const result = await handlers.connect_hub_evidence!({
      hubId: 'h-nonexistent',
      findingIds: ['f-1'],
    });

    const parsed = JSON.parse(result);
    expect(parsed.error).toContain('not found');
  });

  it('returns error when findingIds is empty', async () => {
    const hub = makeHypothesis({ id: 'h-1' });
    const handlers = buildActionToolHandlers(buildDeps({ hypotheses: [hub] }));

    const result = await handlers.connect_hub_evidence!({
      hubId: 'h-1',
      findingIds: [],
    });

    const parsed = JSON.parse(result);
    expect(parsed.error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// suggest_action handler (unchanged in IM-1)
// ---------------------------------------------------------------------------

describe('suggest_action handler', () => {
  it('returns a proposal for a valid finding in analyzed status', async () => {
    const finding = makeFinding({ id: 'f-1', status: 'analyzed' });
    const handlers = buildActionToolHandlers(buildDeps({ findings: [finding] }));

    const result = await handlers.suggest_action!({
      finding_id: 'f-1',
      text: 'Retrain operators',
      source: 'analyst',
    });

    const parsed = JSON.parse(result);
    expect(parsed.proposal).toBe(true);
    expect(parsed.tool).toBe('suggest_action');
    expect(parsed.preview.findingText).toBe('Machine A Cpk = 0.85');
    expect(parsed.status).toBe('pending');
  });

  it('returns error for unknown finding_id', async () => {
    const handlers = buildActionToolHandlers(buildDeps({ findings: [] }));

    const result = await handlers.suggest_action!({
      finding_id: 'f-nonexistent',
      text: 'Fix it',
    });

    const parsed = JSON.parse(result);
    expect(parsed.error).toContain('not found');
  });

  it('returns error when finding is not at analyzed/improving status', async () => {
    const finding = makeFinding({ id: 'f-1', status: 'observed' });
    const handlers = buildActionToolHandlers(buildDeps({ findings: [finding] }));

    const result = await handlers.suggest_action!({
      finding_id: 'f-1',
      text: 'Should fail',
    });

    const parsed = JSON.parse(result);
    expect(parsed.error).toContain('analyzed');
  });
});
