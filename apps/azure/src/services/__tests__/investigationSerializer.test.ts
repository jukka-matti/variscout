import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  serializeFindings,
  serializeQuestions,
  serializeSuspectedCauses,
  serializeInvestigationState,
  deserializeInvestigationState,
  createInvestigationSerializer,
} from '../investigationSerializer';
import type { Finding, Question, SuspectedCause } from '@variscout/core';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'f-1',
    text: 'Weight drops on night shift',
    createdAt: 1700000000000,
    status: 'analyzing' as Finding['status'],
    comments: [],
    context: { activeFilters: {}, cumulativeScope: null },
    statusChangedAt: 1700000000000,
    ...overrides,
  } as unknown as Finding;
}

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q-1',
    text: 'Does shift affect fill weight?',
    status: 'answered',
    factor: 'Shift',
    linkedFindingIds: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    ...overrides,
  };
}

function makeSuspectedCause(overrides: Partial<SuspectedCause> = {}): SuspectedCause {
  return {
    id: 'sc-1',
    name: 'Nozzle wear on night shift',
    synthesis: 'Both nozzle and shift questions confirm the pattern.',
    questionIds: ['q-1', 'q-2'],
    findingIds: ['f-1'],
    evidence: {
      mode: 'standard',
      contribution: {
        value: 0.62,
        label: 'R²adj',
        description: 'Explains 62% of variation',
      },
    },
    status: 'suspected',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// serializeFindings
// ---------------------------------------------------------------------------

describe('serializeFindings', () => {
  it('produces valid JSONL — one JSON object per line', () => {
    const findings = [makeFinding({ id: 'f-1' }), makeFinding({ id: 'f-2' })];
    const jsonl = serializeFindings(findings);
    const lines = jsonl.split('\n');
    expect(lines).toHaveLength(2);
    lines.forEach(line => {
      expect(() => JSON.parse(line)).not.toThrow();
    });
  });

  it('includes type field set to "finding"', () => {
    const jsonl = serializeFindings([makeFinding()]);
    const parsed = JSON.parse(jsonl);
    expect(parsed.type).toBe('finding');
  });

  it('includes comment texts, flattened from FindingComment objects', () => {
    const finding = makeFinding({
      comments: [
        { id: 'c-1', text: 'First observation', createdAt: 1700000001000 },
        { id: 'c-2', text: 'Second observation', createdAt: 1700000002000 },
      ],
    });
    const parsed = JSON.parse(serializeFindings([finding]));
    expect(parsed.comments).toEqual(['First observation', 'Second observation']);
  });

  it('includes outcome fields when present', () => {
    const finding = makeFinding({
      outcome: {
        effective: 'yes',
        cpkBefore: 0.8,
        cpkAfter: 1.4,
        notes: 'Significant improvement',
        verifiedAt: 1700000010000,
      },
    });
    const parsed = JSON.parse(serializeFindings([finding]));
    expect(parsed.outcome).toEqual({
      effective: 'yes',
      cpkBefore: 0.8,
      cpkAfter: 1.4,
      notes: 'Significant improvement',
    });
    // verifiedAt should NOT be included (not in spec)
    expect(parsed.outcome.verifiedAt).toBeUndefined();
  });

  it('includes actions with assignee displayName and completed flag', () => {
    const finding = makeFinding({
      actions: [
        {
          id: 'a-1',
          text: 'Retrain operators',
          assignee: { upn: 'jane@contoso.com', displayName: 'Jane Smith' },
          completedAt: 1700000020000,
          createdAt: 1700000000000,
        },
        {
          id: 'a-2',
          text: 'Update SOP',
          createdAt: 1700000001000,
        },
      ],
    });
    const parsed = JSON.parse(serializeFindings([finding]));
    expect(parsed.actions).toEqual([
      { text: 'Retrain operators', assignee: 'Jane Smith', completed: true },
      { text: 'Update SOP', assignee: undefined, completed: false },
    ]);
  });

  it('includes questionId when present', () => {
    const finding = makeFinding({ questionId: 'q-99' });
    const parsed = JSON.parse(serializeFindings([finding]));
    expect(parsed.questionId).toBe('q-99');
  });

  it('includes createdAt timestamp', () => {
    const finding = makeFinding({ createdAt: 1700000000000 });
    const parsed = JSON.parse(serializeFindings([finding]));
    expect(parsed.createdAt).toBe(1700000000000);
  });

  it('returns empty string for empty findings array', () => {
    expect(serializeFindings([])).toBe('');
  });
});

// ---------------------------------------------------------------------------
// serializeQuestions
// ---------------------------------------------------------------------------

describe('serializeQuestions', () => {
  it('filters to answered and ruled-out questions only', () => {
    const questions = [
      makeQuestion({ id: 'q-1', status: 'open' }),
      makeQuestion({ id: 'q-2', status: 'investigating' }),
      makeQuestion({ id: 'q-3', status: 'answered' }),
      makeQuestion({ id: 'q-4', status: 'ruled-out' }),
    ];
    const jsonl = serializeQuestions(questions);
    const lines = jsonl.split('\n');
    expect(lines).toHaveLength(2);
    const ids = lines.map(l => JSON.parse(l).id);
    expect(ids).toEqual(['q-3', 'q-4']);
  });

  it('sets type to "answer" for answered questions', () => {
    const jsonl = serializeQuestions([makeQuestion({ status: 'answered' })]);
    const parsed = JSON.parse(jsonl);
    expect(parsed.type).toBe('answer');
  });

  it('sets type to "ruled-out" for ruled-out questions', () => {
    const jsonl = serializeQuestions([makeQuestion({ status: 'ruled-out' })]);
    const parsed = JSON.parse(jsonl);
    expect(parsed.type).toBe('ruled-out');
  });

  it('includes manualNote, causeRole, evidence, and factor', () => {
    const question = makeQuestion({
      status: 'answered',
      factor: 'Machine',
      manualNote: 'Confirmed via gemba walk',
      causeRole: 'suspected-cause',
      evidence: { etaSquared: 0.45, rSquaredAdj: 0.43 },
    });
    const parsed = JSON.parse(serializeQuestions([question]));
    expect(parsed.factor).toBe('Machine');
    expect(parsed.manualNote).toBe('Confirmed via gemba walk');
    expect(parsed.causeRole).toBe('suspected-cause');
    expect(parsed.evidence).toEqual({ etaSquared: 0.45, rSquaredAdj: 0.43 });
  });

  it('includes only selected ideas with text, direction, timeframe', () => {
    const question = makeQuestion({
      status: 'answered',
      ideas: [
        {
          id: 'i-1',
          text: 'Retrain operators',
          selected: true,
          direction: 'prevent',
          timeframe: 'weeks',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'i-2',
          text: 'Buy new machine',
          selected: false,
          direction: 'eliminate',
          timeframe: 'months',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    });
    const parsed = JSON.parse(serializeQuestions([question]));
    expect(parsed.ideas).toHaveLength(1);
    expect(parsed.ideas[0]).toEqual({
      text: 'Retrain operators',
      direction: 'prevent',
      timeframe: 'weeks',
    });
  });

  it('includes linkedFindingIds', () => {
    const question = makeQuestion({
      status: 'answered',
      linkedFindingIds: ['f-1', 'f-2'],
    });
    const parsed = JSON.parse(serializeQuestions([question]));
    expect(parsed.linkedFindingIds).toEqual(['f-1', 'f-2']);
  });

  it('returns empty string when no answered/ruled-out questions', () => {
    const questions = [makeQuestion({ status: 'open' }), makeQuestion({ status: 'investigating' })];
    expect(serializeQuestions(questions)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// serializeSuspectedCauses
// ---------------------------------------------------------------------------

describe('serializeSuspectedCauses', () => {
  it('produces valid JSONL — one JSON object per line', () => {
    const hubs = [makeSuspectedCause({ id: 'sc-1' }), makeSuspectedCause({ id: 'sc-2' })];
    const jsonl = serializeSuspectedCauses(hubs);
    const lines = jsonl.split('\n');
    expect(lines).toHaveLength(2);
    lines.forEach(line => {
      expect(() => JSON.parse(line)).not.toThrow();
    });
  });

  it('sets type to "suspected-cause"', () => {
    const jsonl = serializeSuspectedCauses([makeSuspectedCause()]);
    const parsed = JSON.parse(jsonl);
    expect(parsed.type).toBe('suspected-cause');
  });

  it('includes all key hub fields', () => {
    const evidence = {
      mode: 'standard' as const,
      contribution: { value: 0.62, label: 'R²adj', description: 'Explains 62% of variation' },
    };
    const hub = makeSuspectedCause({
      name: 'Nozzle wear on night shift',
      synthesis: 'Both factors confirm the pattern.',
      questionIds: ['q-1', 'q-2'],
      findingIds: ['f-1'],
      evidence,
      status: 'confirmed',
    });
    const parsed = JSON.parse(serializeSuspectedCauses([hub]));
    expect(parsed.name).toBe('Nozzle wear on night shift');
    expect(parsed.synthesis).toBe('Both factors confirm the pattern.');
    expect(parsed.questionIds).toEqual(['q-1', 'q-2']);
    expect(parsed.findingIds).toEqual(['f-1']);
    expect(parsed.evidence).toEqual(evidence);
    expect(parsed.status).toBe('confirmed');
  });

  it('includes selectedForImprovement when set', () => {
    const hub = makeSuspectedCause({ status: 'confirmed', selectedForImprovement: true });
    const parsed = JSON.parse(serializeSuspectedCauses([hub]));
    expect(parsed.selectedForImprovement).toBe(true);
  });

  it('omits selectedForImprovement when undefined', () => {
    const hub = makeSuspectedCause({ status: 'confirmed', selectedForImprovement: undefined });
    const parsed = JSON.parse(serializeSuspectedCauses([hub]));
    expect(parsed.selectedForImprovement).toBeUndefined();
  });

  it('excludes not-confirmed hubs from Foundry IQ output', () => {
    const hubs = [
      makeSuspectedCause({ id: 'sc-1', status: 'suspected' }),
      makeSuspectedCause({ id: 'sc-2', status: 'confirmed' }),
      makeSuspectedCause({ id: 'sc-3', status: 'not-confirmed' }),
    ];
    const jsonl = serializeSuspectedCauses(hubs);
    const lines = jsonl.split('\n');
    expect(lines).toHaveLength(2);
    const ids = lines.map(l => JSON.parse(l).id);
    expect(ids).toContain('sc-1');
    expect(ids).toContain('sc-2');
    expect(ids).not.toContain('sc-3');
  });

  it('returns empty string for empty hubs array', () => {
    expect(serializeSuspectedCauses([])).toBe('');
  });

  it('returns empty string when all hubs are not-confirmed', () => {
    const hubs = [
      makeSuspectedCause({ status: 'not-confirmed' }),
      makeSuspectedCause({ id: 'sc-2', status: 'not-confirmed' }),
    ];
    expect(serializeSuspectedCauses(hubs)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// serializeInvestigationState / deserializeInvestigationState
// ---------------------------------------------------------------------------

describe('serializeInvestigationState', () => {
  it('includes findings and questions', () => {
    const findings = [makeFinding()];
    const questions = [makeQuestion()];
    const state = serializeInvestigationState(findings, questions, []);
    expect(state.findings).toHaveLength(1);
    expect(state.questions).toHaveLength(1);
  });

  it('includes suspectedCauses when non-empty', () => {
    const hubs = [makeSuspectedCause()];
    const state = serializeInvestigationState([], [], hubs);
    expect(state.suspectedCauses).toHaveLength(1);
    expect(state.suspectedCauses![0].name).toBe('Nozzle wear on night shift');
  });

  it('omits suspectedCauses field when empty (compact serialization)', () => {
    const state = serializeInvestigationState([makeFinding()], [], []);
    expect('suspectedCauses' in state).toBe(false);
  });
});

describe('deserializeInvestigationState', () => {
  it('restores findings, questions, and hubs from serialized state', () => {
    const hub = makeSuspectedCause();
    const raw = {
      findings: [makeFinding()],
      questions: [makeQuestion()],
      suspectedCauses: [hub],
    };
    const result = deserializeInvestigationState(raw);
    expect(result.findings).toHaveLength(1);
    expect(result.questions).toHaveLength(1);
    expect(result.suspectedCauses).toHaveLength(1);
    expect(result.suspectedCauses[0].name).toBe('Nozzle wear on night shift');
  });

  it('returns empty arrays when fields are missing', () => {
    const raw = { findings: [], questions: [], suspectedCauses: [] };
    const result = deserializeInvestigationState(raw);
    expect(result.findings).toEqual([]);
    expect(result.questions).toEqual([]);
    expect(result.suspectedCauses).toEqual([]);
  });

  it('migrates legacy causeRole questions to hubs when suspectedCauses field absent', () => {
    const raw = {
      findings: [],
      questions: [
        makeQuestion({ id: 'q-1', factor: 'Machine', causeRole: 'suspected-cause' }),
        makeQuestion({ id: 'q-2', factor: 'Shift', causeRole: 'suspected-cause' }),
        makeQuestion({ id: 'q-3', factor: 'Nozzle', causeRole: 'ruling-out' }),
      ],
    };
    const result = deserializeInvestigationState(raw);
    // Only 'suspected-cause' questions are migrated
    expect(result.suspectedCauses).toHaveLength(2);
    const names = result.suspectedCauses.map(h => h.name);
    expect(names).toContain('Machine');
    expect(names).toContain('Shift');
  });

  it('returns empty suspectedCauses when old data has no causeRole questions', () => {
    const raw = {
      findings: [makeFinding()],
      questions: [makeQuestion({ causeRole: undefined })],
      // no suspectedCauses field
    };
    const result = deserializeInvestigationState(raw);
    expect(result.suspectedCauses).toEqual([]);
  });

  it('does not migrate when suspectedCauses field is present (even empty)', () => {
    // Even if questions have causeRole, explicit [] means migration already done
    const raw = {
      findings: [],
      questions: [makeQuestion({ causeRole: 'suspected-cause', factor: 'Shift' })],
      suspectedCauses: [],
    };
    const result = deserializeInvestigationState(raw);
    expect(result.suspectedCauses).toEqual([]);
  });

  it('migrates legacy totalContribution (number) to SuspectedCauseEvidence on load', () => {
    const raw = {
      findings: [],
      questions: [],
      suspectedCauses: [
        {
          id: 'sc-legacy',
          name: 'Legacy hub',
          synthesis: 'Old data',
          questionIds: [],
          findingIds: [],
          totalContribution: 0.52,
          status: 'suspected',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    };
    // Cast to bypass TypeScript type-checking — this simulates real stored legacy data
    const result = deserializeInvestigationState(
      raw as unknown as import('../investigationSerializer').SerializedInvestigationState
    );
    expect(result.suspectedCauses).toHaveLength(1);
    const hub = result.suspectedCauses[0];
    expect(hub.evidence).toEqual({
      mode: 'standard',
      contribution: {
        value: 0.52,
        label: 'R²adj',
        description: 'Explains 52% of variation',
      },
    });
  });

  it('does not overwrite existing evidence when both totalContribution and evidence are present', () => {
    const existingEvidence = {
      mode: 'capability' as const,
      contribution: { value: 0.75, label: 'Cpk delta', description: 'Explains 75% of variation' },
    };
    const raw = {
      findings: [],
      questions: [],
      suspectedCauses: [
        {
          id: 'sc-both',
          name: 'Hub with both fields',
          synthesis: '',
          questionIds: [],
          findingIds: [],
          totalContribution: 0.52,
          evidence: existingEvidence,
          status: 'suspected',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    };
    const result = deserializeInvestigationState(
      raw as unknown as import('../investigationSerializer').SerializedInvestigationState
    );
    // evidence wins — totalContribution is ignored when evidence already present
    expect(result.suspectedCauses[0].evidence).toEqual(existingEvidence);
  });

  it('preserves selectedForImprovement through deserialize', () => {
    const raw = {
      findings: [],
      questions: [],
      suspectedCauses: [{ ...makeSuspectedCause(), selectedForImprovement: true }],
    };
    const result = deserializeInvestigationState(raw);
    expect(result.suspectedCauses[0].selectedForImprovement).toBe(true);
  });

  it('round-trip: serialize → deserialize → serialize → output is identical', () => {
    const findings = [makeFinding()];
    const questions = [makeQuestion()];
    const hubs = [makeSuspectedCause()];

    const firstPass = serializeInvestigationState(findings, questions, hubs);
    const restored = deserializeInvestigationState(firstPass);
    const secondPass = serializeInvestigationState(
      restored.findings,
      restored.questions,
      restored.suspectedCauses
    );

    expect(secondPass).toEqual(firstPass);
  });

  it('round-trip preserves evidence field correctly', () => {
    const hub = makeSuspectedCause({
      evidence: {
        mode: 'capability',
        contribution: {
          value: 0.88,
          label: 'Cpk delta',
          description: 'Explains 88% of variation',
        },
      },
    });
    const firstPass = serializeInvestigationState([], [], [hub]);
    const restored = deserializeInvestigationState(firstPass);
    expect(restored.suspectedCauses[0].evidence).toEqual(hub.evidence);
  });
});

// ---------------------------------------------------------------------------
// createInvestigationSerializer
// ---------------------------------------------------------------------------

describe('createInvestigationSerializer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces findings uploads — only uploads once after rapid changes', async () => {
    const uploadBlob = vi.fn().mockResolvedValue(undefined);
    const serializer = createInvestigationSerializer({ projectId: 'proj-1', uploadBlob });

    const findings = [makeFinding()];
    serializer.onFindingsChange(findings);
    serializer.onFindingsChange(findings);
    serializer.onFindingsChange(findings);

    // Not yet called — timer hasn't fired
    expect(uploadBlob).not.toHaveBeenCalled();

    await vi.runAllTimersAsync();

    expect(uploadBlob).toHaveBeenCalledTimes(1);
    expect(uploadBlob).toHaveBeenCalledWith(
      'proj-1/investigation/findings.jsonl',
      expect.any(String)
    );
    serializer.dispose();
  });

  it('debounces questions uploads — only uploads once after rapid changes', async () => {
    const uploadBlob = vi.fn().mockResolvedValue(undefined);
    const serializer = createInvestigationSerializer({ projectId: 'proj-2', uploadBlob });

    const questions = [makeQuestion()];
    serializer.onQuestionsChange(questions);
    serializer.onQuestionsChange(questions);

    expect(uploadBlob).not.toHaveBeenCalled();

    await vi.runAllTimersAsync();

    expect(uploadBlob).toHaveBeenCalledTimes(1);
    expect(uploadBlob).toHaveBeenCalledWith(
      'proj-2/investigation/questions.jsonl',
      expect.any(String)
    );
    serializer.dispose();
  });

  it('debounces suspected causes uploads — only uploads once after rapid changes', async () => {
    const uploadBlob = vi.fn().mockResolvedValue(undefined);
    const serializer = createInvestigationSerializer({ projectId: 'proj-sc', uploadBlob });

    const hubs = [makeSuspectedCause()];
    serializer.onSuspectedCausesChange(hubs);
    serializer.onSuspectedCausesChange(hubs);
    serializer.onSuspectedCausesChange(hubs);

    expect(uploadBlob).not.toHaveBeenCalled();

    await vi.runAllTimersAsync();

    expect(uploadBlob).toHaveBeenCalledTimes(1);
    expect(uploadBlob).toHaveBeenCalledWith(
      'proj-sc/investigation/suspected-causes.jsonl',
      expect.any(String)
    );
    serializer.dispose();
  });

  it('handles upload errors silently (console.warn, no throw)', async () => {
    const uploadBlob = vi.fn().mockRejectedValue(new Error('Network failure'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const serializer = createInvestigationSerializer({ projectId: 'proj-3', uploadBlob });

    serializer.onFindingsChange([makeFinding()]);

    await expect(vi.runAllTimersAsync()).resolves.not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith('[KB] Failed to serialize findings:', expect.any(Error));

    warnSpy.mockRestore();
    serializer.dispose();
  });

  it('handles question upload errors silently', async () => {
    const uploadBlob = vi.fn().mockRejectedValue(new Error('Blob error'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const serializer = createInvestigationSerializer({ projectId: 'proj-4', uploadBlob });

    serializer.onQuestionsChange([makeQuestion()]);

    await expect(vi.runAllTimersAsync()).resolves.not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith('[KB] Failed to serialize questions:', expect.any(Error));

    warnSpy.mockRestore();
    serializer.dispose();
  });

  it('handles suspected causes upload errors silently', async () => {
    const uploadBlob = vi.fn().mockRejectedValue(new Error('Blob error'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const serializer = createInvestigationSerializer({ projectId: 'proj-sc-err', uploadBlob });

    serializer.onSuspectedCausesChange([makeSuspectedCause()]);

    await expect(vi.runAllTimersAsync()).resolves.not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(
      '[KB] Failed to serialize suspected causes:',
      expect.any(Error)
    );

    warnSpy.mockRestore();
    serializer.dispose();
  });

  it('dispose clears pending findings timer so upload is never called', async () => {
    const uploadBlob = vi.fn().mockResolvedValue(undefined);
    const serializer = createInvestigationSerializer({ projectId: 'proj-5', uploadBlob });

    serializer.onFindingsChange([makeFinding()]);
    serializer.dispose();

    await vi.runAllTimersAsync();

    expect(uploadBlob).not.toHaveBeenCalled();
  });

  it('dispose clears pending questions timer so upload is never called', async () => {
    const uploadBlob = vi.fn().mockResolvedValue(undefined);
    const serializer = createInvestigationSerializer({ projectId: 'proj-6', uploadBlob });

    serializer.onQuestionsChange([makeQuestion()]);
    serializer.dispose();

    await vi.runAllTimersAsync();

    expect(uploadBlob).not.toHaveBeenCalled();
  });

  it('dispose clears pending suspected causes timer so upload is never called', async () => {
    const uploadBlob = vi.fn().mockResolvedValue(undefined);
    const serializer = createInvestigationSerializer({ projectId: 'proj-sc-dispose', uploadBlob });

    serializer.onSuspectedCausesChange([makeSuspectedCause()]);
    serializer.dispose();

    await vi.runAllTimersAsync();

    expect(uploadBlob).not.toHaveBeenCalled();
  });

  it('uploads findings and questions independently on separate timers', async () => {
    const uploadBlob = vi.fn().mockResolvedValue(undefined);
    const serializer = createInvestigationSerializer({ projectId: 'proj-7', uploadBlob });

    serializer.onFindingsChange([makeFinding()]);
    serializer.onQuestionsChange([makeQuestion()]);

    await vi.runAllTimersAsync();

    expect(uploadBlob).toHaveBeenCalledTimes(2);
    const paths = uploadBlob.mock.calls.map(([p]) => p);
    expect(paths).toContain('proj-7/investigation/findings.jsonl');
    expect(paths).toContain('proj-7/investigation/questions.jsonl');
    serializer.dispose();
  });

  it('uploads findings, questions, and suspected causes on independent timers', async () => {
    const uploadBlob = vi.fn().mockResolvedValue(undefined);
    const serializer = createInvestigationSerializer({ projectId: 'proj-8', uploadBlob });

    serializer.onFindingsChange([makeFinding()]);
    serializer.onQuestionsChange([makeQuestion()]);
    serializer.onSuspectedCausesChange([makeSuspectedCause()]);

    await vi.runAllTimersAsync();

    expect(uploadBlob).toHaveBeenCalledTimes(3);
    const paths = uploadBlob.mock.calls.map(([p]) => p);
    expect(paths).toContain('proj-8/investigation/findings.jsonl');
    expect(paths).toContain('proj-8/investigation/questions.jsonl');
    expect(paths).toContain('proj-8/investigation/suspected-causes.jsonl');
    serializer.dispose();
  });
});
