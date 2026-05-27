---
tier: ephemeral
purpose: build
title: PR-CCJ-B2.1 — Parser profile API — Implementation Plan
status: active
date: 2026-05-27
layer: spec
---

# PR-CCJ-B2.1 — Parser profile API — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Right-size models** per `feedback_subagent_driven_default`: Tasks 1–2 are mechanical (Haiku); Tasks 3–6 are standard TDD (Sonnet); Task 7 integration (Sonnet); final branch reviewer is Opus.

**Spec being implemented:** [`docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md`](../specs/2026-05-26-canvas-connection-journey-design.md) §3.1.1 _Parsing UX_ + §4.1 _First paint_ step 3.

**Parent sequencer:** [`2026-05-27-canvas-connection-journey-b2-master-plan.md`](./2026-05-27-canvas-connection-journey-b2-master-plan.md)

**Goal:** Expose a pure, unit-testable `profileColumns(rows)` API in `@variscout/core/parser` that returns one `ColumnParsingProfile` per detected column — primary interpretation + status + confidence + ranked alternatives + 3 transformed sample values.

**Architecture:** New file `packages/core/src/parser/parsingProfile.ts` (sibling to `detection.ts`). Type additions in `parser/types.ts`. Pure TS, no React, no DOM, no I/O. Detection runs deterministically on raw cell values (CSV strings or pre-typed Excel cells). Status determined by parse rate + format ambiguity per spec rules.

**Tech Stack:** TypeScript 5.x, Vitest, `@variscout/core` strict mode (per `packages/core/CLAUDE.md` — never `Math.random`; never `NaN`/`Infinity`; sub-path exports require `package.json` + `tsconfig.json` updates).

**Branch:** `feat/wedge-v1-ccj-b2-1-parser-profile` off main (HEAD `c96c24f7`).

---

## File structure (locked decisions)

**Create:**

- `packages/core/src/parser/parsingProfile.ts` — `profileColumns()` + internal helpers (`detectNumericFormat`, `detectDateFormat`, `detectIdHeuristic`, `tryStripAffix`, `determineStatus`)
- `packages/core/src/parser/__tests__/parsingProfile.test.ts` — TDD suite

**Modify:**

- `packages/core/src/parser/types.ts` — add `ColumnParsingProfile`, `ParsingStatus`, `ParsingInterpretation`, `ParsingAlternative` types
- `packages/core/src/parser/index.ts` — barrel export the new types + `profileColumns`

**Out of scope (do NOT touch):**

- `parser/detection.ts` (legacy `detectColumns` stays unchanged — `ColumnAnalysis` keeps its current shape)
- `parser/csv.ts` / `parser/excel.ts` (ingestion)
- `parser/validation.ts` (DataQualityReport is a different surface)

---

## Pre-implementation setup

- [ ] **Step 0a: Create worktree + branch**

```bash
git fetch origin
git worktree add .worktrees/feat/wedge-v1-ccj-b2-1-parser-profile -b feat/wedge-v1-ccj-b2-1-parser-profile origin/main
cd .worktrees/feat/wedge-v1-ccj-b2-1-parser-profile
pnpm install --frozen-lockfile
```

Expected: clean worktree on the new branch at the current `main` HEAD (`c96c24f7`).

- [ ] **Step 0b: Confirm baseline tests pass**

```bash
pnpm --filter @variscout/core test
```

Expected: PASS (snapshot of pre-change green baseline).

---

## Task 1: Type definitions

**Files:**

- Modify: `packages/core/src/parser/types.ts` (add types at end of file)
- Test: `packages/core/src/parser/__tests__/parsingProfile.test.ts` (create)

- [ ] **Step 1: Write the failing import-shape test**

Create `packages/core/src/parser/__tests__/parsingProfile.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { profileColumns } from '../parsingProfile';
import type {
  ColumnParsingProfile,
  ParsingStatus,
  ParsingInterpretation,
  ParsingAlternative,
} from '../types';

describe('parsingProfile — type surface', () => {
  it('exports profileColumns as a callable function', () => {
    expect(typeof profileColumns).toBe('function');
  });

  it('ColumnParsingProfile has required fields', () => {
    const profile: ColumnParsingProfile = {
      columnName: 'Speed',
      status: 'ok',
      confidence: 100,
      primary: { kind: 'numeric', label: 'numeric · plain integer', detail: {} },
      alternatives: [],
      transformedSamples: [],
    };
    expect(profile.columnName).toBe('Speed');
  });

  it('ParsingStatus union has ok / warning / error', () => {
    const s1: ParsingStatus = 'ok';
    const s2: ParsingStatus = 'warning';
    const s3: ParsingStatus = 'error';
    expect([s1, s2, s3]).toEqual(['ok', 'warning', 'error']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test -- parsingProfile
```

Expected: FAIL — `Cannot find module '../parsingProfile'` and type imports unresolved.

- [ ] **Step 3: Add types to `parser/types.ts`**

Append at the end of `packages/core/src/parser/types.ts`:

```typescript
/**
 * Per-column parsing analysis for the canvas palette (Spec 2 §3.1.1).
 * Sibling to ColumnAnalysis — focused on parse-ability, not role detection.
 */
export type ParsingStatus = 'ok' | 'warning' | 'error';

export interface ParsingInterpretation {
  /** Coarse kind for icon + grouping in the palette. */
  kind: 'numeric' | 'date' | 'categorical' | 'id' | 'text';
  /** Human-readable label, e.g. "numeric · EU decimal", "DD/MM/YYYY", "categorical · 4 levels". */
  label: string;
  /** Interpretation-specific machine-readable detail (decimal separator, date format string, affix, etc). */
  detail: Record<string, unknown>;
}

export interface ParsingAlternative {
  interpretation: ParsingInterpretation;
  /** How many non-null cells this interpretation successfully parses. */
  parseCount: number;
  /** Total non-null cells considered. */
  totalCount: number;
}

export interface ColumnParsingProfile {
  columnName: string;
  status: ParsingStatus;
  /** Whole-percent confidence in `primary` (0–100). Equals parseRate × 100 for the primary interpretation. */
  confidence: number;
  /** Best-fit interpretation. May be `null` when status is 'error' (no interpretation parses ≥ 1 cell). */
  primary: ParsingInterpretation | null;
  /** Other tried interpretations ranked by parseCount desc, excluding the primary. */
  alternatives: ParsingAlternative[];
  /** Up to 3 raw→transformed sample pairs (e.g. "182,5" → "182.5"). */
  transformedSamples: Array<{ raw: string; transformed: string }>;
}
```

- [ ] **Step 4: Create empty `parsingProfile.ts`**

Create `packages/core/src/parser/parsingProfile.ts`:

```typescript
import type { DataRow } from '../types';
import type { ColumnParsingProfile } from './types';

/**
 * Profile every column in the dataset for parsing confidence + alternatives.
 * Pure function — runs deterministically on raw cell values.
 */
export function profileColumns(rows: DataRow[]): ColumnParsingProfile[] {
  if (rows.length === 0) return [];
  throw new Error('profileColumns not yet implemented');
}
```

- [ ] **Step 5: Add barrel export**

Modify `packages/core/src/parser/index.ts` — add to the existing type-export block and add a new export line for `profileColumns`. Final shape mirrors the existing barrel pattern.

- [ ] **Step 6: Run test to verify it passes**

```bash
pnpm --filter @variscout/core test -- parsingProfile
```

Expected: PASS (3 type-surface tests).

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/parser/types.ts packages/core/src/parser/parsingProfile.ts packages/core/src/parser/index.ts packages/core/src/parser/__tests__/parsingProfile.test.ts
git commit -m "feat(parser): add ColumnParsingProfile type surface for B2 palette"
```

---

## Task 2: `profileColumns()` skeleton — empty-data + column-enumeration contract

**Files:**

- Modify: `packages/core/src/parser/parsingProfile.ts`
- Modify: `packages/core/src/parser/__tests__/parsingProfile.test.ts`

- [ ] **Step 1: Write the failing skeleton tests**

Add to `parsingProfile.test.ts`:

```typescript
describe('profileColumns — skeleton contract', () => {
  it('returns empty array for empty data', () => {
    expect(profileColumns([])).toEqual([]);
  });

  it('returns one profile per column from the union of all row keys', () => {
    const rows = [
      { Speed: '100', Operator: 'A' },
      { Speed: '102', Operator: 'B' },
    ];
    const profiles = profileColumns(rows);
    expect(profiles.map(p => p.columnName).sort()).toEqual(['Operator', 'Speed']);
  });

  it('all profiles have the required fields populated', () => {
    const rows = [{ Speed: '100' }];
    const [profile] = profileColumns(rows);
    expect(profile.columnName).toBe('Speed');
    expect(['ok', 'warning', 'error']).toContain(profile.status);
    expect(typeof profile.confidence).toBe('number');
    expect(profile.confidence).toBeGreaterThanOrEqual(0);
    expect(profile.confidence).toBeLessThanOrEqual(100);
    expect(Array.isArray(profile.alternatives)).toBe(true);
    expect(Array.isArray(profile.transformedSamples)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test -- parsingProfile
```

Expected: FAIL — `profileColumns not yet implemented`.

- [ ] **Step 3: Implement the skeleton**

Replace the body of `profileColumns` in `parsingProfile.ts`:

```typescript
import type { DataRow } from '../types';
import type { ColumnParsingProfile, ParsingInterpretation } from './types';

export function profileColumns(rows: DataRow[]): ColumnParsingProfile[] {
  if (rows.length === 0) return [];
  const columnNames = collectColumnNames(rows);
  return columnNames.map(columnName => profileOneColumn(columnName, rows));
}

function collectColumnNames(rows: DataRow[]): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      seen.add(key);
    }
  }
  return Array.from(seen);
}

function profileOneColumn(columnName: string, rows: DataRow[]): ColumnParsingProfile {
  const values = rows
    .map(r => r[columnName])
    .filter(v => v !== null && v !== undefined && v !== '');
  if (values.length === 0) {
    return {
      columnName,
      status: 'error',
      confidence: 0,
      primary: null,
      alternatives: [],
      transformedSamples: [],
    };
  }
  const primary: ParsingInterpretation = { kind: 'text', label: 'text', detail: {} };
  return {
    columnName,
    status: 'ok',
    confidence: 100,
    primary,
    alternatives: [],
    transformedSamples: [],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/core test -- parsingProfile
```

Expected: PASS (all 6 tests — 3 surface + 3 skeleton).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/parser/parsingProfile.ts packages/core/src/parser/__tests__/parsingProfile.test.ts
git commit -m "feat(parser): profileColumns skeleton — column enumeration + null-only error path"
```

---

## Task 3: Numeric format detection (EU vs US decimal + plain integer)

**Files:**

- Modify: `packages/core/src/parser/parsingProfile.ts`
- Modify: `packages/core/src/parser/__tests__/parsingProfile.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `parsingProfile.test.ts`:

```typescript
describe('profileColumns — numeric format detection', () => {
  it('detects plain integers', () => {
    const rows = [{ N: '100' }, { N: '203' }, { N: '198' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('numeric');
    expect(profile.primary?.label).toContain('integer');
    expect(profile.status).toBe('ok');
    expect(profile.confidence).toBe(100);
  });

  it('detects EU decimal (consistent comma, 1–2 trailing digits)', () => {
    const rows = [{ Speed: '182,5' }, { Speed: '203,1' }, { Speed: '198,7' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('numeric');
    expect(profile.primary?.label).toContain('EU decimal');
    expect(profile.primary?.detail).toMatchObject({ decimalSeparator: ',' });
    expect(profile.transformedSamples).toEqual([
      { raw: '182,5', transformed: '182.5' },
      { raw: '203,1', transformed: '203.1' },
      { raw: '198,7', transformed: '198.7' },
    ]);
  });

  it('detects US format (thousands "," + decimal ".")', () => {
    const rows = [{ Sales: '1,234.5' }, { Sales: '2,001.0' }, { Sales: '987.6' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('numeric');
    expect(profile.primary?.label).toContain('US');
    expect(profile.transformedSamples[0]).toEqual({ raw: '1,234.5', transformed: '1234.5' });
  });

  it('handles already-numeric Excel cells as plain numeric', () => {
    const rows = [{ Pre: 182.5 }, { Pre: 203.1 }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('numeric');
    expect(profile.confidence).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test -- parsingProfile
```

Expected: FAIL — current skeleton labels everything 'text'.

- [ ] **Step 3: Implement numeric detection helpers**

Add to `parsingProfile.ts` (above `profileOneColumn`):

```typescript
interface NumericInterpretationDetail extends Record<string, unknown> {
  decimalSeparator: '.' | ',';
  thousandsSeparator?: ',' | '.' | ' ';
  hasDecimals: boolean;
}

interface NumericMatch {
  label: string;
  detail: NumericInterpretationDetail;
  parsed: number;
}

function tryParseNumeric(value: unknown, format: 'eu' | 'us' | 'plain'): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;

  if (format === 'plain') {
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  if (format === 'eu') {
    if (!/^-?\d{1,3}(\.\d{3})*(,\d+)?$/.test(trimmed) && !/^-?\d+(,\d+)?$/.test(trimmed))
      return null;
    const normalised = trimmed.replace(/\./g, '').replace(',', '.');
    const n = Number(normalised);
    return Number.isFinite(n) ? n : null;
  }
  if (!/^-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(trimmed) && !/^-?\d+(\.\d+)?$/.test(trimmed))
    return null;
  const normalised = trimmed.replace(/,/g, '');
  const n = Number(normalised);
  return Number.isFinite(n) ? n : null;
}

function detectNumericFormat(values: unknown[]): NumericMatch[] {
  const formats: Array<'plain' | 'eu' | 'us'> = ['plain', 'eu', 'us'];
  const matches: NumericMatch[] = [];
  for (const format of formats) {
    let parseCount = 0;
    let anyDecimal = false;
    for (const v of values) {
      const n = tryParseNumeric(v, format);
      if (n !== null) {
        parseCount++;
        if (typeof v === 'string' && /[.,]\d+$/.test(v.trim())) anyDecimal = true;
      }
    }
    if (parseCount === 0) continue;
    const label =
      format === 'plain'
        ? anyDecimal
          ? 'numeric · plain'
          : 'numeric · plain integer'
        : format === 'eu'
          ? 'numeric · EU decimal'
          : 'numeric · US format';
    matches.push({
      label,
      detail: {
        decimalSeparator: format === 'eu' ? ',' : '.',
        thousandsSeparator: format === 'eu' ? '.' : format === 'us' ? ',' : undefined,
        hasDecimals: anyDecimal,
      },
      parsed: parseCount,
    });
  }
  matches.sort((a, b) => b.parsed - a.parsed);
  return matches;
}
```

Then update `profileOneColumn` to call numeric detection and emit transformed samples:

```typescript
function profileOneColumn(columnName: string, rows: DataRow[]): ColumnParsingProfile {
  const allValues = rows.map(r => r[columnName]);
  const nonNull = allValues.filter(v => v !== null && v !== undefined && v !== '');

  if (nonNull.length === 0) {
    return {
      columnName,
      status: 'error',
      confidence: 0,
      primary: null,
      alternatives: [],
      transformedSamples: [],
    };
  }

  const numericMatches = detectNumericFormat(nonNull);
  if (numericMatches.length > 0 && numericMatches[0].parsed === nonNull.length) {
    const top = numericMatches[0];
    const primary: ParsingInterpretation = {
      kind: 'numeric',
      label: top.label,
      detail: top.detail,
    };
    const sampleStrings = nonNull.filter((v): v is string => typeof v === 'string').slice(0, 3);
    const transformedSamples = sampleStrings.map(raw => {
      const format =
        top.detail.decimalSeparator === ','
          ? 'eu'
          : top.detail.thousandsSeparator === ','
            ? 'us'
            : 'plain';
      const parsed = tryParseNumeric(raw, format);
      return { raw, transformed: parsed === null ? raw : String(parsed) };
    });
    return {
      columnName,
      status: 'ok',
      confidence: 100,
      primary,
      alternatives: [],
      transformedSamples,
    };
  }

  return {
    columnName,
    status: 'ok',
    confidence: 100,
    primary: { kind: 'text', label: 'text', detail: {} },
    alternatives: [],
    transformedSamples: [],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/core test -- parsingProfile
```

Expected: PASS (all numeric tests + prior tests still green).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/parser/parsingProfile.ts packages/core/src/parser/__tests__/parsingProfile.test.ts
git commit -m "feat(parser): numeric format detection — plain / EU / US decimal"
```

---

## Task 4: Date format detection (ISO + DD/MM vs MM/DD + ambiguous)

**Files:**

- Modify: `packages/core/src/parser/parsingProfile.ts`
- Modify: `packages/core/src/parser/__tests__/parsingProfile.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `parsingProfile.test.ts`:

```typescript
describe('profileColumns — date format detection', () => {
  it('detects ISO dates (YYYY-MM-DD)', () => {
    const rows = [{ D: '2024-01-15' }, { D: '2024-02-20' }, { D: '2024-03-10' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('date');
    expect(profile.primary?.label).toContain('ISO');
    expect(profile.status).toBe('ok');
  });

  it('detects DD/MM/YYYY when at least one value has day > 12', () => {
    const rows = [{ D: '25/01/2024' }, { D: '15/02/2024' }, { D: '03/03/2024' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('date');
    expect(profile.primary?.label).toContain('DD/MM/YYYY');
    expect(profile.status).toBe('ok');
  });

  it('detects MM/DD/YYYY when at least one value has month-position > 12', () => {
    const rows = [{ D: '01/25/2024' }, { D: '02/15/2024' }, { D: '03/03/2024' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('date');
    expect(profile.primary?.label).toContain('MM/DD/YYYY');
    expect(profile.status).toBe('ok');
  });

  it('flags ambiguous dates as warning when neither position disambiguates', () => {
    const rows = [{ D: '01/02/2024' }, { D: '03/04/2024' }, { D: '05/06/2024' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('date');
    expect(profile.status).toBe('warning');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test -- parsingProfile
```

Expected: FAIL — no date detection yet.

- [ ] **Step 3: Implement date detection helper**

Add to `parsingProfile.ts` (above `profileOneColumn`):

```typescript
type DateFormat = 'iso' | 'ddmmyyyy' | 'mmddyyyy';

interface DateMatch {
  format: DateFormat;
  label: string;
  parseCount: number;
  ambiguous: boolean;
}

function tryParseDate(value: unknown, format: DateFormat): Date | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (format === 'iso') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!m) return null;
    const [, y, mo, d] = m;
    const date = new Date(Number(y), Number(mo) - 1, Number(d));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (!slash) return null;
  const [, a, b, y] = slash;
  const day = format === 'ddmmyyyy' ? Number(a) : Number(b);
  const month = format === 'ddmmyyyy' ? Number(b) : Number(a);
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  const date = new Date(Number(y), month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function detectDateFormat(values: unknown[]): DateMatch[] {
  const matches: DateMatch[] = [];
  const formats: Array<{ key: DateFormat; label: string }> = [
    { key: 'iso', label: 'ISO date (YYYY-MM-DD)' },
    { key: 'ddmmyyyy', label: 'DD/MM/YYYY' },
    { key: 'mmddyyyy', label: 'MM/DD/YYYY' },
  ];
  for (const { key, label } of formats) {
    let parseCount = 0;
    let firstPositionMax = 0;
    let secondPositionMax = 0;
    for (const v of values) {
      const d = tryParseDate(v, key);
      if (d !== null) parseCount++;
      if (typeof v === 'string') {
        const slash = /^(\d{1,2})\/(\d{1,2})\/\d{4}$/.exec(v.trim());
        if (slash) {
          firstPositionMax = Math.max(firstPositionMax, Number(slash[1]));
          secondPositionMax = Math.max(secondPositionMax, Number(slash[2]));
        }
      }
    }
    if (parseCount === 0) continue;
    const ambiguous = key !== 'iso' && firstPositionMax <= 12 && secondPositionMax <= 12;
    matches.push({ format: key, label, parseCount, ambiguous });
  }
  matches.sort((a, b) => b.parseCount - a.parseCount);
  return matches;
}
```

In `profileOneColumn`, before the text fallback, try dates. Insert this block right after the numeric-success branch:

```typescript
const dateMatches = detectDateFormat(nonNull);
if (dateMatches.length > 0 && dateMatches[0].parseCount === nonNull.length) {
  const iso = dateMatches.find(m => m.format === 'iso');
  const unambiguousSlash = dateMatches.find(m => m.format !== 'iso' && !m.ambiguous);
  const top = iso ?? unambiguousSlash ?? dateMatches[0];
  const primary: ParsingInterpretation = {
    kind: 'date',
    label: top.label,
    detail: { format: top.format, ambiguous: top.ambiguous },
  };
  const sampleStrings = nonNull.filter((v): v is string => typeof v === 'string').slice(0, 3);
  const transformedSamples = sampleStrings.map(raw => {
    const parsed = tryParseDate(raw, top.format);
    return {
      raw,
      transformed: parsed ? parsed.toISOString().slice(0, 10) : raw,
    };
  });
  return {
    columnName,
    status: top.ambiguous ? 'warning' : 'ok',
    confidence: 100,
    primary,
    alternatives: [],
    transformedSamples,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/core test -- parsingProfile
```

Expected: PASS (all date tests + prior tests still green).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/parser/parsingProfile.ts packages/core/src/parser/__tests__/parsingProfile.test.ts
git commit -m "feat(parser): date format detection — ISO + DD/MM + MM/DD + ambiguous"
```

---

## Task 5: Affix stripping + ID heuristic

**Files:**

- Modify: `packages/core/src/parser/parsingProfile.ts`
- Modify: `packages/core/src/parser/__tests__/parsingProfile.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `parsingProfile.test.ts`:

```typescript
describe('profileColumns — affix stripping', () => {
  it('strips currency prefix ($)', () => {
    const rows = [{ Price: '$45.20' }, { Price: '$67.10' }, { Price: '$1,234.50' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('numeric');
    expect(profile.primary?.detail).toMatchObject({ stripPrefix: '$' });
    expect(profile.transformedSamples[0]).toEqual({ raw: '$45.20', transformed: '45.2' });
  });

  it('strips percent suffix (%)', () => {
    const rows = [{ Rate: '12%' }, { Rate: '34%' }, { Rate: '56%' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('numeric');
    expect(profile.primary?.detail).toMatchObject({ stripSuffix: '%' });
  });

  it('strips accounting parens for negatives', () => {
    const rows = [{ Net: '(45)' }, { Net: '(67)' }, { Net: '100' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('numeric');
    expect(profile.primary?.detail).toMatchObject({ parensNegative: true });
    expect(profile.transformedSamples[0]).toEqual({ raw: '(45)', transformed: '-45' });
  });
});

describe('profileColumns — ID heuristic', () => {
  it('detects ID columns with leading zeros + fixed width', () => {
    const rows = [{ Code: '001' }, { Code: '002' }, { Code: '003' }, { Code: '004' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('id');
    expect(profile.primary?.label).toContain('id');
  });

  it('detects alphanumeric IDs (fixed-width prefix + numeric suffix)', () => {
    const rows = [{ Code: 'A123' }, { Code: 'A124' }, { Code: 'A125' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('id');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test -- parsingProfile
```

Expected: FAIL — affix + ID detection not yet implemented.

- [ ] **Step 3: Implement affix + ID helpers**

Add to `parsingProfile.ts` (above `profileOneColumn`):

```typescript
interface AffixMatch {
  label: string;
  detail: Record<string, unknown>;
  parseCount: number;
  transform: (raw: string) => string;
}

function detectAffix(values: unknown[]): AffixMatch | null {
  const strings = values.filter((v): v is string => typeof v === 'string').map(v => v.trim());
  if (strings.length === 0) return null;

  const currencyMatch = strings.every(s => /^[$€£][\s]?-?[\d.,]+$/.test(s));
  if (currencyMatch) {
    const prefix = strings[0][0];
    return {
      label: `numeric · ${prefix} prefix`,
      detail: { stripPrefix: prefix, decimalSeparator: '.' },
      parseCount: strings.length,
      transform: raw => {
        const cleaned = raw.replace(/^[$€£]\s?/, '').replace(/,/g, '');
        const n = Number(cleaned);
        return Number.isFinite(n) ? String(n) : raw;
      },
    };
  }

  if (strings.every(s => /^-?[\d.,]+%$/.test(s))) {
    return {
      label: 'numeric · % suffix',
      detail: { stripSuffix: '%' },
      parseCount: strings.length,
      transform: raw => {
        const cleaned = raw.replace(/%$/, '').replace(/,/g, '');
        const n = Number(cleaned);
        return Number.isFinite(n) ? String(n) : raw;
      },
    };
  }

  const parensOrPlain = strings.every(s => /^(\(\d+(?:\.\d+)?\)|-?\d+(?:\.\d+)?)$/.test(s));
  const anyParens = strings.some(s => /^\(\d/.test(s));
  if (parensOrPlain && anyParens) {
    return {
      label: 'numeric · parens negative',
      detail: { parensNegative: true },
      parseCount: strings.length,
      transform: raw => {
        const m = /^\((\d+(?:\.\d+)?)\)$/.exec(raw);
        if (m) return `-${Number(m[1])}`;
        const n = Number(raw);
        return Number.isFinite(n) ? String(n) : raw;
      },
    };
  }

  return null;
}

function detectIdHeuristic(
  values: unknown[]
): { label: string; detail: Record<string, unknown> } | null {
  const strings = values.filter((v): v is string => typeof v === 'string').map(v => v.trim());
  if (strings.length < 3 || strings.length !== values.length) return null;

  const allFixedWidthNumeric =
    strings.every(s => /^\d+$/.test(s)) &&
    strings.every(s => s.length === strings[0].length) &&
    strings.some(s => s.startsWith('0'));

  const alphaPrefixMatch = strings[0].match(/^([A-Za-z]+)(\d+)$/);
  const allAlphanumeric =
    alphaPrefixMatch !== null &&
    strings.every(s => {
      const m = s.match(/^([A-Za-z]+)(\d+)$/);
      return (
        m !== null && m[1] === alphaPrefixMatch[1] && m[2].length === alphaPrefixMatch[2].length
      );
    });

  if (!allFixedWidthNumeric && !allAlphanumeric) return null;

  const uniqueCount = new Set(strings).size;
  return {
    label: `id · ${uniqueCount} unique`,
    detail: {
      pattern: allAlphanumeric ? 'alphanumeric-fixed-width' : 'numeric-leading-zero',
      width: strings[0].length,
    },
  };
}
```

In `profileOneColumn`, between the numeric block and the date block, insert affix; and at the end (before the text fallback) insert the ID check. Order: numeric → affix → date → ID → text.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/core test -- parsingProfile
```

Expected: PASS (all affix + ID tests + prior tests still green).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/parser/parsingProfile.ts packages/core/src/parser/__tests__/parsingProfile.test.ts
git commit -m "feat(parser): affix stripping (\$, %, parens) + ID column heuristic"
```

---

## Task 6: Categorical detection + status determination (parse rate + mixed format)

**Files:**

- Modify: `packages/core/src/parser/parsingProfile.ts`
- Modify: `packages/core/src/parser/__tests__/parsingProfile.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `parsingProfile.test.ts`:

```typescript
describe('profileColumns — categorical detection', () => {
  it('detects categorical columns with limited distinct values', () => {
    const rows = [{ Op: 'A' }, { Op: 'B' }, { Op: 'A' }, { Op: 'C' }, { Op: 'B' }, { Op: 'A' }];
    const [profile] = profileColumns(rows);
    expect(profile.primary?.kind).toBe('categorical');
    expect(profile.primary?.label).toContain('3 levels');
  });
});

describe('profileColumns — status determination', () => {
  it('marks status warning when parse rate < 70%', () => {
    const rows = [{ N: '100' }, { N: '200' }, { N: 'abc' }, { N: 'def' }, { N: 'ghi' }];
    const [profile] = profileColumns(rows);
    expect(profile.status).toBe('warning');
    expect(profile.confidence).toBeLessThan(70);
  });

  it('marks status warning when alternatives parse comparably (mixed format)', () => {
    const rows = [
      { Mix: '182,5' },
      { Mix: '1,234.5' },
      { Mix: '203,1' },
      { Mix: '987.6' },
      { Mix: '100' },
    ];
    const [profile] = profileColumns(rows);
    expect(profile.status).toBe('warning');
    expect(profile.alternatives.length).toBeGreaterThan(0);
  });

  it('preserves status ok when parse rate ≥ 90% and no rival interpretation', () => {
    const rows = [
      { N: '100' },
      { N: '200' },
      { N: '300' },
      { N: '400' },
      { N: '500' },
      { N: '600' },
      { N: '700' },
      { N: '800' },
      { N: '900' },
      { N: '1000' },
    ];
    const [profile] = profileColumns(rows);
    expect(profile.status).toBe('ok');
    expect(profile.confidence).toBe(100);
  });

  it('returns alternatives ranked by parseCount desc', () => {
    const rows = [{ Mix: '182,5' }, { Mix: '203,1' }, { Mix: '1,234.5' }];
    const [profile] = profileColumns(rows);
    if (profile.alternatives.length > 0) {
      const counts = profile.alternatives.map(a => a.parseCount);
      const sorted = [...counts].sort((a, b) => b - a);
      expect(counts).toEqual(sorted);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @variscout/core test -- parsingProfile
```

Expected: FAIL — categorical detection missing; status logic missing.

- [ ] **Step 3: Implement categorical detection + status logic**

Add a categorical helper to `parsingProfile.ts` (above `profileOneColumn`):

```typescript
function detectCategorical(
  values: unknown[]
): { label: string; detail: Record<string, unknown> } | null {
  const strings = values
    .filter((v): v is string | number | boolean => v !== null && v !== undefined)
    .map(v => String(v));
  if (strings.length === 0) return null;
  const unique = new Set(strings);
  const uniqueCount = unique.size;
  if (uniqueCount > 30) return null;
  if (uniqueCount > strings.length * 0.5) return null;
  return {
    label: `categorical · ${uniqueCount} levels`,
    detail: { levels: Array.from(unique) },
  };
}
```

Rewrite `profileOneColumn` to compute the status from parse-rate + rival interpretations instead of hard-coding `'ok'`. Replace the function with:

```typescript
function profileOneColumn(columnName: string, rows: DataRow[]): ColumnParsingProfile {
  const allValues = rows.map(r => r[columnName]);
  const nonNull = allValues.filter(v => v !== null && v !== undefined && v !== '');

  if (nonNull.length === 0) {
    return {
      columnName,
      status: 'error',
      confidence: 0,
      primary: null,
      alternatives: [],
      transformedSamples: [],
    };
  }

  const candidates: Array<{
    interpretation: ParsingInterpretation;
    parseCount: number;
    transform?: (raw: string) => string;
  }> = [];

  const numericMatches = detectNumericFormat(nonNull);
  for (const m of numericMatches) {
    const format =
      m.detail.decimalSeparator === ','
        ? 'eu'
        : m.detail.thousandsSeparator === ','
          ? 'us'
          : 'plain';
    candidates.push({
      interpretation: { kind: 'numeric', label: m.label, detail: m.detail },
      parseCount: m.parsed,
      transform: raw => {
        const parsed = tryParseNumeric(raw, format);
        return parsed === null ? raw : String(parsed);
      },
    });
  }

  const affix = detectAffix(nonNull);
  if (affix) {
    candidates.push({
      interpretation: { kind: 'numeric', label: affix.label, detail: affix.detail },
      parseCount: affix.parseCount,
      transform: affix.transform,
    });
  }

  const dateMatches = detectDateFormat(nonNull);
  for (const d of dateMatches) {
    candidates.push({
      interpretation: {
        kind: 'date',
        label: d.label,
        detail: { format: d.format, ambiguous: d.ambiguous },
      },
      parseCount: d.parseCount,
      transform: raw => {
        const parsed = tryParseDate(raw, d.format);
        return parsed ? parsed.toISOString().slice(0, 10) : raw;
      },
    });
  }

  const idMatch = detectIdHeuristic(nonNull);
  if (idMatch) {
    candidates.push({
      interpretation: { kind: 'id', label: idMatch.label, detail: idMatch.detail },
      parseCount: nonNull.length,
    });
  }

  if (candidates.length === 0) {
    const cat = detectCategorical(nonNull);
    if (cat) {
      return {
        columnName,
        status: 'ok',
        confidence: 100,
        primary: { kind: 'categorical', label: cat.label, detail: cat.detail },
        alternatives: [],
        transformedSamples: [],
      };
    }
    return {
      columnName,
      status: 'ok',
      confidence: 100,
      primary: { kind: 'text', label: 'text', detail: {} },
      alternatives: [],
      transformedSamples: [],
    };
  }

  candidates.sort((a, b) => b.parseCount - a.parseCount);
  const top = candidates[0];
  const others = candidates.slice(1);

  const parseRate = top.parseCount / nonNull.length;
  const confidence = Math.round(parseRate * 100);

  const hasRival = others.some(
    o => Math.abs(o.parseCount - top.parseCount) <= 1 && o.parseCount > 0
  );

  let status: ParsingStatus;
  if (parseRate < 0.7) {
    status = 'warning';
  } else if (hasRival) {
    status = 'warning';
  } else if (top.interpretation.kind === 'date' && top.interpretation.detail.ambiguous === true) {
    status = 'warning';
  } else {
    status = 'ok';
  }

  const sampleStrings = nonNull.filter((v): v is string => typeof v === 'string').slice(0, 3);
  const transformedSamples = top.transform
    ? sampleStrings.map(raw => ({ raw, transformed: top.transform!(raw) }))
    : [];

  const alternatives: ParsingAlternative[] = others.map(o => ({
    interpretation: o.interpretation,
    parseCount: o.parseCount,
    totalCount: nonNull.length,
  }));

  return {
    columnName,
    status,
    confidence,
    primary: top.interpretation,
    alternatives,
    transformedSamples,
  };
}
```

Note: add `import type { ParsingStatus, ParsingAlternative }` to the top of `parsingProfile.ts` as needed.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @variscout/core test -- parsingProfile
```

Expected: PASS (all categorical + status tests + prior tests still green). If the rival heuristic flags clean datasets as warning, tighten the threshold (`Math.abs(...) <= 0`) — the rival check should only trip on truly mixed formats.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/parser/parsingProfile.ts packages/core/src/parser/__tests__/parsingProfile.test.ts
git commit -m "feat(parser): categorical detection + status (parse-rate + rival)"
```

---

## Task 7: Integration test + barrel verification + PR open

**Files:**

- Modify: `packages/core/src/parser/__tests__/parsingProfile.test.ts`
- Verify: `packages/core/src/parser/index.ts` (already updated in Task 1; spot-check)

- [ ] **Step 1: Write integration test**

Add at the end of `parsingProfile.test.ts`:

```typescript
describe('profileColumns — representative dataset', () => {
  it('profiles a mixed real-world dataset correctly', () => {
    const rows = [
      { Date: '2024-01-15', Reactor: 'A', Cycle_min: '42,5', Yield_pct: '95%', Order_id: '00001' },
      { Date: '2024-01-16', Reactor: 'B', Cycle_min: '41,8', Yield_pct: '94%', Order_id: '00002' },
      { Date: '2024-01-17', Reactor: 'A', Cycle_min: '43,2', Yield_pct: '96%', Order_id: '00003' },
      { Date: '2024-01-18', Reactor: 'C', Cycle_min: '40,9', Yield_pct: '93%', Order_id: '00004' },
    ];
    const profiles = profileColumns(rows);
    const byName = Object.fromEntries(profiles.map(p => [p.columnName, p]));

    expect(byName.Date.primary?.kind).toBe('date');
    expect(byName.Date.primary?.label).toContain('ISO');
    expect(byName.Reactor.primary?.kind).toBe('categorical');
    expect(byName.Cycle_min.primary?.kind).toBe('numeric');
    expect(byName.Cycle_min.primary?.label).toContain('EU decimal');
    expect(byName.Yield_pct.primary?.kind).toBe('numeric');
    expect(byName.Yield_pct.primary?.detail).toMatchObject({ stripSuffix: '%' });
    expect(byName.Order_id.primary?.kind).toBe('id');

    for (const profile of profiles) {
      expect(profile.status).toBe('ok');
    }
  });

  it('handles all-null columns as error status', () => {
    const rows = [
      { Empty: null, Real: '100' },
      { Empty: null, Real: '200' },
    ];
    const profiles = profileColumns(rows);
    const empty = profiles.find(p => p.columnName === 'Empty');
    expect(empty?.status).toBe('error');
    expect(empty?.primary).toBeNull();
  });

  it('barrel export surface matches public API contract', async () => {
    const mod = await import('../index');
    expect(typeof mod.profileColumns).toBe('function');
  });
});
```

- [ ] **Step 2: Run full parser test suite**

```bash
pnpm --filter @variscout/core test -- parser
```

Expected: PASS (all `parsingProfile` tests + all pre-existing `detection.test.ts` + `yLikelihood.test.ts`).

- [ ] **Step 3: Run package-wide build to catch type-export gaps**

```bash
pnpm --filter @variscout/core build
```

Expected: clean compile, no `TS2305` (missing export) or `TS2304` (cannot find name) errors.

- [ ] **Step 4: Run pr-ready-check from worktree**

```bash
bash scripts/pr-ready-check.sh
```

Expected: PASS — typecheck + lint + tests + arch checks. If pr-ready-check hangs, fall back to `pnpm --filter @variscout/core test && pnpm --filter @variscout/core build && pnpm --filter @variscout/core lint` per `feedback_implementer_long_bash_pitfall`.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/parser/__tests__/parsingProfile.test.ts
git commit -m "test(parser): representative dataset integration + barrel surface check"
```

- [ ] **Step 6: Push branch + open PR**

Push the branch:

```bash
git push -u origin feat/wedge-v1-ccj-b2-1-parser-profile
```

Then open the PR. Title: `feat(parser): ColumnParsingProfile API for B2 palette (PR-CCJ-B2.1)`. Body should summarise: pure `profileColumns(rows)` API in `@variscout/core/parser`; detects EU/US decimal + ISO/locale dates + currency-percent affix + ID + categorical + mixed formats; returns ranked alternatives + 3 transformed samples; PR-CCJ-B2.1 of the B2 master sequencer; no UI yet (B2.2 consumes); test plan = `pnpm --filter @variscout/core test -- parsingProfile`, `pnpm --filter @variscout/core build`, `bash scripts/pr-ready-check.sh`.

- [ ] **Step 7: Final-branch Opus review + merge**

After the PR is open, dispatch the final-branch reviewer subagent (Opus) per `superpowers:subagent-driven-development` with STEP-0 git-checkout of the PR branch (per `feedback_code_review_subagent_must_checkout_pr_branch`). Address any blocking findings. Then merge: `gh pr merge <#> --merge --delete-branch` per `feedback_preserve_commit_history`.

- [ ] **Step 8: Clean up worktree + branch**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite
git worktree remove .worktrees/feat/wedge-v1-ccj-b2-1-parser-profile
git pull --ff-only origin main
```

Expected: main HEAD advances to the merged PR.

---

## Out of scope (deferred to later sub-PRs)

- **UI rendering of profiles** — PR-CCJ-B2.2 (ColumnChip + Palette).
- **Override popover that consumes alternatives** — PR-CCJ-B2.3.
- **Hub-memoization of user override choices** ("future pastes with this column name bias higher" per spec §3.1.1) — deferred to Phase C when persistence is rewired.
- **Sparkline data** — `ColumnParsingProfile` does not carry distribution data; the chip computes its own mini-histogram from the column values when rendering.
- **`detectColumns()` integration** — legacy detection stays separate. If future work decides to merge them, that's a separate refactor PR.

---

## Verification (B2.1 done)

- New types exported from `@variscout/core/parser`: `ColumnParsingProfile`, `ParsingStatus`, `ParsingInterpretation`, `ParsingAlternative`.
- `profileColumns(rows)` callable from `@variscout/core/parser`.
- `parsingProfile.test.ts` covers: empty data, type surface, plain/EU/US numeric, ISO/DD-MM/MM-DD/ambiguous dates, currency/percent/parens affix, ID heuristic, categorical, parse-rate status, rival-interpretation warning, representative dataset.
- `pnpm --filter @variscout/core test` green.
- `pnpm --filter @variscout/core build` green.

---

## Related

- [[wedge-v1]] (canonical product anatomy)
- [[canvas-connection-journey]] (Spec 2 memory)
- [[feedback_subagent_driven_default]] (model selection per task)
- [[feedback_one_worktree_per_agent]] (worktree discipline)
- [[feedback_preserve_commit_history]] (`--merge` not `--squash`)
- [[feedback_implementer_long_bash_pitfall]] (pr-ready-check scoping)
