import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  serializeFindings,
  serializeScopes,
  serializeHypotheses,
  serializeInvestigationState,
  deserializeInvestigationState,
  createInvestigationSerializer,
} from '../analyzeSerializer';
import type { Finding, ProblemStatementScope, Hypothesis } from '@variscout/core';

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

function makeScope(overrides: Partial<ProblemStatementScope> = {}): ProblemStatementScope {
  return {
    id: 'scope-1',
    projectId: 'general-unassigned',
    outcome: 'Fill Weight',
    predicates: [],
    hypothesisIds: [],
    createdAt: 1704067200000, // 2024-01-01T00:00:00.000Z
    updatedAt: 1704153600000, // 2024-01-02T00:00:00.000Z
    deletedAt: null,
    ...overrides,
  } as ProblemStatementScope;
}

function makeHypothesis(overrides: Partial<Hypothesis> = {}): Hypothesis {
  return {
    id: 'sc-1',
    name: 'Nozzle wear on night shift',
    synthesis: 'Both nozzle and shift findings confirm the pattern.',
    findingIds: ['f-1'],
    evidence: {
      mode: 'standard',
      contribution: {
        value: 0.62,
        label: 'R²adj',
        description: 'Explains 62% of variation',
      },
    },
    status: 'proposed',
    createdAt: 1704067200000, // 2024-01-01T00:00:00.000Z
    updatedAt: 1704153600000, // 2024-01-02T00:00:00.000Z
    deletedAt: null,
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
        {
          id: 'c-1',
          text: 'First observation',
          createdAt: 1700000001000,
          parentId: 'f-test',
          parentKind: 'finding' as const,
          deletedAt: null,
        },
        {
          id: 'c-2',
          text: 'Second observation',
          createdAt: 1700000002000,
          parentId: 'f-test',
          parentKind: 'finding' as const,
          deletedAt: null,
        },
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
          deletedAt: null,
        },
        {
          id: 'a-2',
          text: 'Update SOP',
          createdAt: 1700000001000,
          deletedAt: null,
        },
      ],
    });
    const parsed = JSON.parse(serializeFindings([finding]));
    expect(parsed.actions).toEqual([
      { text: 'Retrain operators', assignee: 'Jane Smith', completed: true },
      { text: 'Update SOP', assignee: undefined, completed: false },
    ]);
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
// serializeScopes (replaces serializeQuestions — IM-1, ADR-085)
// ---------------------------------------------------------------------------

describe('serializeScopes', () => {
  it('produces valid JSONL — one JSON object per line', () => {
    const scopes = [makeScope({ id: 'scope-1' }), makeScope({ id: 'scope-2' })];
    const jsonl = serializeScopes(scopes);
    const lines = jsonl.split('\n');
    expect(lines).toHaveLength(2);
    lines.forEach(line => {
      expect(() => JSON.parse(line)).not.toThrow();
    });
  });

  it('sets type to "scope"', () => {
    const jsonl = serializeScopes([makeScope()]);
    const parsed = JSON.parse(jsonl);
    expect(parsed.type).toBe('scope');
  });

  it('includes outcome, predicates, and hypothesisIds', () => {
    const scope = makeScope({
      outcome: 'Fill Weight',
      predicates: [{ kind: 'leaf' as const, column: 'Shift', op: 'eq', value: 'Night' }],
      hypothesisIds: ['h-1', 'h-2'],
    });
    const parsed = JSON.parse(serializeScopes([scope]));
    expect(parsed.outcome).toBe('Fill Weight');
    expect(parsed.predicates).toEqual([
      { kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' },
    ]);
    expect(parsed.hypothesisIds).toEqual(['h-1', 'h-2']);
  });

  it('includes whatIfProjection when set', () => {
    const scope = makeScope({ whatIfProjection: 0.38 });
    const parsed = JSON.parse(serializeScopes([scope]));
    expect(parsed.whatIfProjection).toBe(0.38);
  });

  it('returns empty string for empty scopes array', () => {
    expect(serializeScopes([])).toBe('');
  });
});

// ---------------------------------------------------------------------------
// serializeHypotheses
// ---------------------------------------------------------------------------

describe('serializeHypotheses', () => {
  it('produces valid JSONL — one JSON object per line', () => {
    const hubs = [makeHypothesis({ id: 'sc-1' }), makeHypothesis({ id: 'sc-2' })];
    const jsonl = serializeHypotheses(hubs);
    const lines = jsonl.split('\n');
    expect(lines).toHaveLength(2);
    lines.forEach(line => {
      expect(() => JSON.parse(line)).not.toThrow();
    });
  });

  it('sets type to "hypothesis"', () => {
    const jsonl = serializeHypotheses([makeHypothesis()]);
    const parsed = JSON.parse(jsonl);
    expect(parsed.type).toBe('hypothesis');
  });

  it('includes all key hub fields', () => {
    const evidence = {
      mode: 'standard' as const,
      contribution: { value: 0.62, label: 'R²adj', description: 'Explains 62% of variation' },
    };
    const hub = makeHypothesis({
      name: 'Nozzle wear on night shift',
      synthesis: 'Both factors confirm the pattern.',
      findingIds: ['f-1'],
      evidence,
      status: 'evidence-survived-test',
    });
    const parsed = JSON.parse(serializeHypotheses([hub]));
    expect(parsed.name).toBe('Nozzle wear on night shift');
    expect(parsed.synthesis).toBe('Both factors confirm the pattern.');
    expect(parsed.findingIds).toEqual(['f-1']);
    expect(parsed.evidence).toEqual(evidence);
    expect(parsed.status).toBe('evidence-survived-test');
  });

  it('includes selectedForImprovement when set', () => {
    const hub = makeHypothesis({ status: 'evidence-survived-test', selectedForImprovement: true });
    const parsed = JSON.parse(serializeHypotheses([hub]));
    expect(parsed.selectedForImprovement).toBe(true);
  });

  it('omits selectedForImprovement when undefined', () => {
    const hub = makeHypothesis({
      status: 'evidence-survived-test',
      selectedForImprovement: undefined,
    });
    const parsed = JSON.parse(serializeHypotheses([hub]));
    expect(parsed.selectedForImprovement).toBeUndefined();
  });

  it('excludes refuted hubs from Foundry IQ output', () => {
    const hubs = [
      makeHypothesis({ id: 'sc-1', status: 'proposed' }),
      makeHypothesis({ id: 'sc-2', status: 'evidence-survived-test' }),
      makeHypothesis({ id: 'sc-3', status: 'refuted' }),
    ];
    const jsonl = serializeHypotheses(hubs);
    const lines = jsonl.split('\n');
    expect(lines).toHaveLength(2);
    const ids = lines.map(l => JSON.parse(l).id);
    expect(ids).toContain('sc-1');
    expect(ids).toContain('sc-2');
    expect(ids).not.toContain('sc-3');
  });

  it('returns empty string for empty hubs array', () => {
    expect(serializeHypotheses([])).toBe('');
  });

  it('returns empty string when all hubs are refuted', () => {
    const hubs = [
      makeHypothesis({ status: 'refuted' }),
      makeHypothesis({ id: 'sc-2', status: 'refuted' }),
    ];
    expect(serializeHypotheses(hubs)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// serializeInvestigationState / deserializeInvestigationState
// ---------------------------------------------------------------------------

describe('serializeInvestigationState', () => {
  it('includes findings and scopes', () => {
    const findings = [makeFinding()];
    const scopes = [makeScope()];
    const state = serializeInvestigationState(findings, scopes, []);
    expect(state.findings).toHaveLength(1);
    expect(state.scopes).toHaveLength(1);
  });

  it('includes hypotheses when non-empty', () => {
    const hubs = [makeHypothesis()];
    const state = serializeInvestigationState([], [], hubs);
    expect(state.hypotheses).toHaveLength(1);
    expect(state.hypotheses![0].name).toBe('Nozzle wear on night shift');
  });

  it('omits hypotheses field when empty (compact serialization)', () => {
    const state = serializeInvestigationState([makeFinding()], [], []);
    expect('hypotheses' in state).toBe(false);
  });
});

describe('deserializeInvestigationState', () => {
  it('restores findings, scopes, and hubs from serialized state', () => {
    const hub = makeHypothesis();
    const raw = {
      findings: [makeFinding()],
      scopes: [makeScope()],
      hypotheses: [hub],
    };
    const result = deserializeInvestigationState(raw);
    expect(result.findings).toHaveLength(1);
    expect(result.scopes).toHaveLength(1);
    expect(result.hypotheses).toHaveLength(1);
    expect(result.hypotheses[0].name).toBe('Nozzle wear on night shift');
  });

  it('returns empty arrays when fields are missing', () => {
    const raw = { findings: [], scopes: [], hypotheses: [] };
    const result = deserializeInvestigationState(raw);
    expect(result.findings).toEqual([]);
    expect(result.scopes).toEqual([]);
    expect(result.hypotheses).toEqual([]);
  });

  it('returns empty hypotheses when hypotheses field is absent (no back-compat migration)', () => {
    // Per wedge V1 no-back-compat: investigations without explicit hubs get [].
    const raw = {
      findings: [],
      scopes: [makeScope({ id: 'scope-1' }), makeScope({ id: 'scope-2' })],
    };
    const result = deserializeInvestigationState(
      raw as import('../analyzeSerializer').SerializedInvestigationState
    );
    expect(result.hypotheses).toEqual([]);
  });

  it('returns empty hypotheses when data has no hubs', () => {
    const raw = {
      findings: [makeFinding()],
      scopes: [makeScope()],
      // no hypotheses field
    };
    const result = deserializeInvestigationState(
      raw as import('../analyzeSerializer').SerializedInvestigationState
    );
    expect(result.hypotheses).toEqual([]);
  });

  it('returns empty hypotheses when hypotheses field is explicitly empty', () => {
    const raw = {
      findings: [],
      scopes: [makeScope()],
      hypotheses: [],
    };
    const result = deserializeInvestigationState(raw);
    expect(result.hypotheses).toEqual([]);
  });

  it('migrates legacy totalContribution (number) to HypothesisEvidence on load', () => {
    const raw = {
      findings: [],
      scopes: [],
      hypotheses: [
        {
          id: 'sc-legacy',
          name: 'Legacy hub',
          synthesis: 'Old data',
          findingIds: [],
          totalContribution: 0.52,
          status: 'proposed',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    };
    // Cast to bypass TypeScript type-checking — this simulates real stored legacy data
    const result = deserializeInvestigationState(
      raw as unknown as import('../analyzeSerializer').SerializedInvestigationState
    );
    expect(result.hypotheses).toHaveLength(1);
    const hub = result.hypotheses[0];
    expect(hub.evidence).toEqual({
      mode: 'standard',
      contribution: {
        value: 0.52,
        label: 'R²adj',
        description: 'Explains 52% of variation',
      },
    });
  });

  it('throws on unknown hypothesis status values (no silent migration per RPS V1 D15)', () => {
    const raw = {
      findings: [],
      scopes: [],
      hypotheses: [
        {
          ...makeHypothesis({ id: 'legacy-suspected' }),
          status: 'suspected',
        },
      ],
    };

    expect(() =>
      deserializeInvestigationState(
        raw as unknown as import('../analyzeSerializer').SerializedInvestigationState
      )
    ).toThrow(/Invalid HypothesisStatus/);
  });

  it('does not overwrite existing evidence when both totalContribution and evidence are present', () => {
    const existingEvidence = {
      mode: 'capability' as const,
      contribution: { value: 0.75, label: 'Cpk delta', description: 'Explains 75% of variation' },
    };
    const raw = {
      findings: [],
      scopes: [],
      hypotheses: [
        {
          id: 'sc-both',
          name: 'Hub with both fields',
          synthesis: '',
          findingIds: [],
          totalContribution: 0.52,
          evidence: existingEvidence,
          status: 'proposed',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    };
    const result = deserializeInvestigationState(
      raw as unknown as import('../analyzeSerializer').SerializedInvestigationState
    );
    // evidence wins — totalContribution is ignored when evidence already present
    expect(result.hypotheses[0].evidence).toEqual(existingEvidence);
  });

  it('preserves selectedForImprovement through deserialize', () => {
    const raw = {
      findings: [],
      scopes: [],
      hypotheses: [{ ...makeHypothesis(), selectedForImprovement: true }],
    };
    const result = deserializeInvestigationState(raw);
    expect(result.hypotheses[0].selectedForImprovement).toBe(true);
  });

  it('round-trip: serialize → deserialize → serialize → output is identical', () => {
    const findings = [makeFinding()];
    const scopes = [makeScope()];
    const hubs = [makeHypothesis()];

    const firstPass = serializeInvestigationState(findings, scopes, hubs);
    const restored = deserializeInvestigationState(firstPass);
    const secondPass = serializeInvestigationState(
      restored.findings,
      restored.scopes,
      restored.hypotheses
    );

    expect(secondPass).toEqual(firstPass);
  });

  it('round-trip preserves evidence field correctly', () => {
    const hub = makeHypothesis({
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
    expect(restored.hypotheses[0].evidence).toEqual(hub.evidence);
  });

  it('round-trip preserves scope predicates and hypothesisIds', () => {
    const scope = makeScope({
      outcome: 'Cycle Time',
      predicates: [{ kind: 'leaf' as const, column: 'Machine', op: 'eq', value: 'M1' }],
      hypothesisIds: ['h-1', 'h-2'],
    });
    const firstPass = serializeInvestigationState([], [scope], []);
    const restored = deserializeInvestigationState(firstPass);
    const secondPass = serializeInvestigationState(
      restored.findings,
      restored.scopes,
      restored.hypotheses
    );

    expect(restored.scopes[0].outcome).toBe('Cycle Time');
    expect(restored.scopes[0].predicates).toEqual([
      { kind: 'leaf', column: 'Machine', op: 'eq', value: 'M1' },
    ]);
    expect(restored.scopes[0].hypothesisIds).toEqual(['h-1', 'h-2']);
    expect(secondPass).toEqual(firstPass);
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
    expect(uploadBlob).toHaveBeenCalledWith('proj-1/analyze/findings.jsonl', expect.any(String));
    serializer.dispose();
  });

  it('debounces scopes uploads — only uploads once after rapid changes', async () => {
    const uploadBlob = vi.fn().mockResolvedValue(undefined);
    const serializer = createInvestigationSerializer({ projectId: 'proj-2', uploadBlob });

    const scopes = [makeScope()];
    serializer.onScopesChange(scopes);
    serializer.onScopesChange(scopes);

    expect(uploadBlob).not.toHaveBeenCalled();

    await vi.runAllTimersAsync();

    expect(uploadBlob).toHaveBeenCalledTimes(1);
    expect(uploadBlob).toHaveBeenCalledWith('proj-2/analyze/scopes.jsonl', expect.any(String));
    serializer.dispose();
  });

  it('debounces hypotheses uploads — only uploads once after rapid changes', async () => {
    const uploadBlob = vi.fn().mockResolvedValue(undefined);
    const serializer = createInvestigationSerializer({ projectId: 'proj-sc', uploadBlob });

    const hubs = [makeHypothesis()];
    serializer.onHypothesesChange(hubs);
    serializer.onHypothesesChange(hubs);
    serializer.onHypothesesChange(hubs);

    expect(uploadBlob).not.toHaveBeenCalled();

    await vi.runAllTimersAsync();

    expect(uploadBlob).toHaveBeenCalledTimes(1);
    expect(uploadBlob).toHaveBeenCalledWith('proj-sc/analyze/hypotheses.jsonl', expect.any(String));
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

  it('handles scope upload errors silently', async () => {
    const uploadBlob = vi.fn().mockRejectedValue(new Error('Blob error'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const serializer = createInvestigationSerializer({ projectId: 'proj-4', uploadBlob });

    serializer.onScopesChange([makeScope()]);

    await expect(vi.runAllTimersAsync()).resolves.not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith('[KB] Failed to serialize scopes:', expect.any(Error));

    warnSpy.mockRestore();
    serializer.dispose();
  });

  it('handles hypotheses upload errors silently', async () => {
    const uploadBlob = vi.fn().mockRejectedValue(new Error('Blob error'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const serializer = createInvestigationSerializer({ projectId: 'proj-sc-err', uploadBlob });

    serializer.onHypothesesChange([makeHypothesis()]);

    await expect(vi.runAllTimersAsync()).resolves.not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith('[KB] Failed to serialize hypotheses:', expect.any(Error));

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

  it('dispose clears pending scopes timer so upload is never called', async () => {
    const uploadBlob = vi.fn().mockResolvedValue(undefined);
    const serializer = createInvestigationSerializer({ projectId: 'proj-6', uploadBlob });

    serializer.onScopesChange([makeScope()]);
    serializer.dispose();

    await vi.runAllTimersAsync();

    expect(uploadBlob).not.toHaveBeenCalled();
  });

  it('dispose clears pending hypotheses timer so upload is never called', async () => {
    const uploadBlob = vi.fn().mockResolvedValue(undefined);
    const serializer = createInvestigationSerializer({ projectId: 'proj-sc-dispose', uploadBlob });

    serializer.onHypothesesChange([makeHypothesis()]);
    serializer.dispose();

    await vi.runAllTimersAsync();

    expect(uploadBlob).not.toHaveBeenCalled();
  });

  it('uploads findings and scopes independently on separate timers', async () => {
    const uploadBlob = vi.fn().mockResolvedValue(undefined);
    const serializer = createInvestigationSerializer({ projectId: 'proj-7', uploadBlob });

    serializer.onFindingsChange([makeFinding()]);
    serializer.onScopesChange([makeScope()]);

    await vi.runAllTimersAsync();

    expect(uploadBlob).toHaveBeenCalledTimes(2);
    const paths = uploadBlob.mock.calls.map((args: unknown[]) => args[0] as string);
    expect(paths).toContain('proj-7/analyze/findings.jsonl');
    expect(paths).toContain('proj-7/analyze/scopes.jsonl');
    serializer.dispose();
  });

  it('uploads findings, scopes, and hypotheses on independent timers', async () => {
    const uploadBlob = vi.fn().mockResolvedValue(undefined);
    const serializer = createInvestigationSerializer({ projectId: 'proj-8', uploadBlob });

    serializer.onFindingsChange([makeFinding()]);
    serializer.onScopesChange([makeScope()]);
    serializer.onHypothesesChange([makeHypothesis()]);

    await vi.runAllTimersAsync();

    expect(uploadBlob).toHaveBeenCalledTimes(3);
    const paths = uploadBlob.mock.calls.map((args: unknown[]) => args[0] as string);
    expect(paths).toContain('proj-8/analyze/findings.jsonl');
    expect(paths).toContain('proj-8/analyze/scopes.jsonl');
    expect(paths).toContain('proj-8/analyze/hypotheses.jsonl');
    serializer.dispose();
  });
});
