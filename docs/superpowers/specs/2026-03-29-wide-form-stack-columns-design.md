---
title: Wide-Form Data Support — Stack Columns
audience: [developer, analyst]
category: architecture
status: draft
related: [column-mapping, parser, data-ingestion, performance-mode]
---

# Wide-Form Data Support — Stack Columns

## Context

VariScout assumes long-form (tidy) data: rows are observations, one numeric outcome column, categorical factor columns. Many real-world datasets arrive in wide form — multiple numeric columns representing the same kind of measurement across different entities:

- **Tourism**: 83 country columns, each containing arrival counts per month
- **Surveys**: 25 question columns, each containing Likert scale scores per respondent
- **Manufacturing**: 12 sensor columns (though mixed-unit sensors may be better analyzed individually via the existing outcome dropdown)

Currently, users must reshape data externally before pasting into VariScout. This feature adds an in-app stack/pivot transform integrated into ColumnMapping.

**Design principle**: Transform wide-form data into the long-form shape VariScout already excels at, rather than teaching VariScout new analysis paradigms. The entire downstream pipeline (stats, charts, ANOVA, findings, persistence) remains unchanged.

## Minitab Reference

Minitab's approach (Data > Stack > Columns):

- User selects columns to stack, names the output measure and subscript (label) columns
- Remaining columns are preserved as-is
- Many analysis dialogs accept both wide-form ("responses in separate columns") and long-form ("responses in one column") directly

VariScout adopts the reshape-then-analyze approach: stack once in ColumnMapping, then use the standard analysis pipeline.

## Design

### Data Transform

**Before (wide, 357 rows x 85 cols):**

| Year | Month | Total  | Germany | Sweden | ... (83 countries) |
| ---- | ----- | ------ | ------- | ------ | ------------------ |
| 1995 | Jan   | 165815 | 21376   | 19925  | ...                |

**After stack (28,917 rows x 4 cols):**

| Year | Month | Country | Arrivals |
| ---- | ----- | ------- | -------- |
| 1995 | Jan   | Germany | 21376    |
| 1995 | Jan   | Sweden  | 19925    |
| ...  | ...   | ...     | ...      |

Column roles after stacking:

| Original column                | After stack                          | Role                               |
| ------------------------------ | ------------------------------------ | ---------------------------------- |
| Germany, Sweden, ... (stacked) | Country (label) + Arrivals (measure) | New factor + outcome               |
| Month                          | Preserved                            | Factor                             |
| Year                           | Preserved                            | Factor or outcome (user decides)   |
| Total                          | Preserved                            | Excluded or outcome (user decides) |

### Core Function: `stackColumns()`

Location: `packages/core/src/parser/stack.ts`

```typescript
interface StackConfig {
  columnsToStack: string[]; // Column names to pivot (e.g., 83 country names)
  measureName: string; // Name for the new value column (e.g., "Arrivals")
  labelName: string; // Name for the new label column (e.g., "Country")
}

interface StackResult {
  data: DataRow[]; // Stacked rows
  columns: string[]; // New column list
  rowCount: number; // For preview display
  labelValues: string[]; // Unique values in the label column (original column names)
}

function stackColumns(data: DataRow[], config: StackConfig): StackResult;
```

**Behavior:**

- For each input row, produces N output rows (one per stacked column)
- Non-stacked columns are duplicated across all N output rows
- Null/undefined values in stacked columns produce rows with null measure values (not skipped — let downstream stats handle missing data consistently)
- Column order: preserved non-stacked columns first, then labelName, then measureName
- Pure function, no side effects

**Row multiplication:** `outputRows = inputRows × columnsToStack.length`. For Finland data: 357 × 81 = 28,917 rows (well within PWA 50K limit and Azure 250K limit).

### Detection Heuristic

Location: `packages/core/src/parser/detection.ts` (extend `detectColumns()`)

Add `suggestedStack?: StackSuggestion` to `DetectedColumns`:

```typescript
interface StackSuggestion {
  columnsToStack: string[]; // Suggested columns to stack
  keepColumns: string[]; // Suggested columns to keep as factors
  confidence: 'high' | 'medium' | 'low';
  measureName?: string; // AI-suggested name (only when AI available)
  labelName?: string; // AI-suggested name (only when AI available)
}
```

**Heuristic rules (no AI):**

1. **Trigger**: 5+ numeric columns detected in the dataset
2. **Exclude from stack candidates**:
   - Columns detected as date/time type
   - Columns with very low cardinality that look like IDs or years (e.g., sequential integers 1995-2024 with exactly N unique = N rows → likely a time/ID column)
   - Columns where name matches existing `OUTCOME_KEYWORDS` or `FACTOR_KEYWORDS` with high confidence
3. **Group by range similarity**: Compute coefficient of variation (CV) across column means. Columns within 2 orders of magnitude of each other cluster together. The largest cluster becomes the stack suggestion.
4. **Confidence**:
   - `high`: 10+ columns in cluster, all same order of magnitude, no obvious metadata columns mixed in
   - `medium`: 5-9 columns, or some range variation
   - `low`: columns detected but ranges vary significantly

**AI enhancement (when CoScout available):**

- Send column names + sample values to CoScout
- CoScout can suggest: which columns to stack, measure/label names, which columns to exclude and why
- AI suggestion overrides heuristic when available, but user always has final say

### ColumnMapping UI Changes

Location: `packages/ui/src/components/ColumnMapping/`

**When `suggestedStack` is present in `DetectedColumns`:**

1. A collapsible "Stack Columns" section appears at the top of ColumnMapping, styled with purple accent (consistent with the "new from stacking" visual identity)
2. **Toggle**: On by default when suggestion confidence is `high` or `medium`. Off by default for `low`.
3. **Column selection**: Compact chip display of selected columns. "Edit selection..." opens a scrollable checklist modal with:
   - Select all / Deselect all
   - Search/filter by column name
   - Column info: sample values, range (from `ColumnAnalysis`)
4. **Not-stacked columns**: Shown separately — these will appear in the outcome/factor section below
5. **Naming inputs**: Two text fields — "Measure name" and "Label name". Pre-filled by AI suggestion when available, empty otherwise. Both fields are required — "Start Analysis" button is disabled until both are filled. Inline validation message: "Name the stacked columns to continue."
6. **Live preview**: Small table showing first 3 rows of the stacked result with row count summary (e.g., "357 rows x 81 countries = 28,917 rows x 4 columns")
7. **Below the stack section**: Standard outcome/factor assignment, but operating on the stacked column list. The new measure column appears as a numeric column candidate for outcome. The new label column appears as a categorical column candidate for factor.

**When no `suggestedStack` (few numeric columns):**

- Stack section is completely hidden. ColumnMapping behaves exactly as today.

**Edit mode (`mode='edit'`):**

- Stack section shows current stack config if data was stacked
- User can toggle stack off to return to wide-form and re-configure
- Toggling stack off resets to original `rawData`; toggling on re-applies the stack

### Data Flow Integration

```
paste/upload
    |
    v
parseText() -> DataRow[]                    (unchanged)
    |
    v
detectColumns() -> DetectedColumns          (+ suggestedStack)
    |
    v
ColumnMapping                               (+ stack UI section)
    |
    v  (user confirms stack config)
    |
stackColumns(rawData, config) -> StackResult (NEW — pure transform)
    |
    v
setRawData(stackResult.data)                (existing — receives stacked data)
    |
    v
existing pipeline                           (stats, charts, ANOVA — unchanged)
```

**Key integration points:**

- `useDataIngestion` calls `stackColumns()` between ColumnMapping confirmation and `setRawData()`. The original wide-form data is preserved in memory for potential un-stack in edit mode.
- `StackConfig` is persisted as part of `AnalysisState` for project save/reload (Azure). On reload, the stack transform is re-applied from the original data.
- The `ColumnMapping.onConfirm` callback signature extends to include optional `stackConfig`:

```typescript
onConfirm: (
  outcome: string,
  factors: string[],
  specs: SpecLimits,
  categories: Record<string, string>,
  brief: string,
  stackConfig?: StackConfig  // NEW
) => void;
```

### System Limits

Row multiplication is the main concern:

| Scenario                                | Input rows | Stacked columns | Output rows | Within limits?                    |
| --------------------------------------- | ---------- | --------------- | ----------- | --------------------------------- |
| Finland tourism                         | 357        | 81              | 28,917      | PWA: yes (50K), Azure: yes (250K) |
| Survey (500 respondents)                | 500        | 25              | 12,500      | Yes                               |
| Large survey (5000)                     | 5,000      | 25              | 125,000     | PWA: no, Azure: yes               |
| Manufacturing (10K samples, 12 sensors) | 10,000     | 12              | 120,000     | PWA: no, Azure: yes               |

**Safeguard**: Show a warning in the stack preview when projected output rows exceed the platform's row limit. Don't block — just warn (the user may want to proceed and accept truncation, or deselect some columns).

### Interaction with Performance Mode

When stack is enabled, `detectWideFormat()` should NOT also trigger Performance mode detection — the user has already chosen to stack. The stack config takes precedence. If the user toggles stack off, wide-format detection can re-evaluate.

### Persistence (Azure)

`StackConfig` added to `AnalysisState`:

```typescript
interface AnalysisState {
  // ... existing fields
  stackConfig?: StackConfig; // NEW — if present, data was stacked
}
```

On project reload:

1. Load original wide-form data from storage (both original wide-form `rawData` and `stackConfig` are persisted)
2. Re-apply `stackColumns()` with saved `stackConfig`
3. Proceed with normal analysis restoration

On project save: persist both the original wide-form `rawData` and the `stackConfig`. Do NOT persist the stacked data — it's a derived artifact that can be re-computed.

### Testing

- **Unit tests for `stackColumns()`**: Correct row multiplication, null handling, column ordering, edge cases (0 columns to stack, 1 column, all columns)
- **Unit tests for detection heuristic**: Finland-style data → high confidence suggestion, mixed-unit data → lower confidence, standard data → no suggestion
- **Component tests for ColumnMapping**: Stack section visibility, toggle behavior, naming validation, preview accuracy
- **Integration test**: Paste wide-form data → stack → verify I-Chart/Boxplot/Pareto render correctly with stacked data

### Verification

1. Paste the Finland arrivals dataset (85 columns, 357 rows)
2. Verify ColumnMapping shows stack suggestion with ~81 country columns pre-selected
3. Verify Year, Month, Total are NOT in the stack selection
4. Name measure "Arrivals", label "Country"
5. Verify preview shows ~28,917 rows x 4 columns
6. Start analysis → I-Chart shows arrivals over time, Boxplot shows per-country distribution
7. Drill into Country factor → see per-country comparisons
8. ANOVA should show significant country effect

### Scope Boundaries

**In scope:**

- `stackColumns()` pure function in `@variscout/core/parser`
- Detection heuristic in `detectColumns()`
- ColumnMapping UI: stack section, column selection, naming, preview
- Data flow integration in `useDataIngestion`
- Persistence of `StackConfig` in `AnalysisState`
- System limit warnings
- AI-assisted suggestion when CoScout is available

**Out of scope (future work):**

- Multiple simultaneous stacks (stack Temp and Pressure separately in one session)
- Unstack / wide-pivot (long-to-wide)
- Auto-standardization for mixed-unit stacking
- Column grouping by prefix pattern in the selection UI (can be added later)
