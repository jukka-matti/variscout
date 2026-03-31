---
title: 'ADR-050: Wide-Form Data Support — Stack Columns'
---

# ADR-050: Wide-Form Data Support — Stack Columns

**Status:** Accepted
**Date:** 2026-03-29
**Deciders:** JM

## Context

VariScout assumes long-form (tidy) data: one numeric outcome column, categorical factor columns, rows as observations. Many real-world datasets arrive in wide form — multiple numeric columns representing the same measurement across different entities (e.g., 83 country columns each containing arrival counts).

Previously, users had to reshape data externally (in Excel, Python, or Minitab) before pasting into VariScout. This created friction for quality professionals working with wide-form datasets from tourism, surveys, multi-sensor manufacturing, and similar domains.

Minitab handles this with an explicit "Stack Columns" command (Data > Stack > Columns) and dual-input dialogs that accept both wide and long form. We adopted a similar approach: reshape early, then use the existing analysis pipeline unchanged.

## Decision

Add an in-app stack/pivot transform integrated into the existing ColumnMapping component:

1. **`stackColumns()` pure function** in `@variscout/core/parser` — transforms wide-form DataRow[] into long-form by unpivoting selected columns into a label + measure pair.

2. **Detection heuristic** in `detectColumns()` — when 5+ numeric columns with similar value ranges are detected, returns a `StackSuggestion` with recommended columns to stack and columns to keep.

3. **StackSection UI** in ColumnMapping — collapsible section that appears when wide-form data is detected. Users select columns to stack, name the measure and label columns, and see a live preview. Toggle on by default for high/medium confidence detection.

4. **Data flow integration** — both PWA and Azure data flow hooks apply `stackColumns()` between ColumnMapping confirmation and `setRawData()`. The entire downstream pipeline (stats, charts, ANOVA, findings, persistence) remains unchanged.

5. **`StackConfig` in `AnalysisState`** — persisted for Azure project save/reload.

### Design Principle

Transform wide-form data into the long-form shape VariScout already excels at, rather than teaching VariScout new analysis paradigms.

### Column Role Classification

When stacking, columns fall into three roles:

| Role                                             | Example              | What happens                                |
| ------------------------------------------------ | -------------------- | ------------------------------------------- |
| **Stack**                                        | Germany, Sweden, ... | Pivoted into label + measure columns        |
| **Keep**                                         | Year, Month          | Preserved as-is, become factor candidates   |
| **Exclude** (via keep + not selecting as factor) | Total                | Preserved but user doesn't assign as factor |

### Detection Heuristic (without AI)

- Trigger: 5+ numeric columns
- Exclude from stack: date/time columns, year-like values (1900-2100), "total"/"sum"/"average" columns, strong keyword matches
- Group by value-range similarity (within 2 orders of magnitude)
- Largest cluster becomes the suggestion
- AI (CoScout) can enhance with semantic understanding when available

## Consequences

### Positive

- Quality professionals can analyze wide-form data without external preprocessing
- No changes to the downstream analysis pipeline (stats, charts, ANOVA)
- Smart detection reduces manual column selection effort
- AI enhancement path is clear and optional

### Negative

- Row multiplication: 357 rows x 83 columns = 28,917 rows (within limits but notable)
- ColumnMapping component gains complexity (mitigated by separate StackSection component)
- Only one stack operation per analysis session (multiple stacks require re-entering ColumnMapping)

### Neutral

- Existing Performance mode (multi-channel) remains unchanged — it serves a different use case (comparing channels of the same process, not reshaping data)
- Mixed-unit datasets can use the existing outcome dropdown for column switching, or stack subsets separately

## Implementation

- `packages/core/src/parser/stack.ts` — `stackColumns()`, `previewStack()`, `StackConfig`, `StackResult`
- `packages/core/src/parser/detection.ts` — `detectStackSuggestion()`, `StackSuggestion` type
- `packages/ui/src/components/ColumnMapping/StackSection.tsx` — Stack UI component
- `packages/ui/src/components/ColumnMapping/index.tsx` — Integration
- `apps/pwa/src/hooks/usePasteImportFlow.ts` — PWA data flow wiring
- `apps/azure/src/features/data-flow/useEditorDataFlow.ts` — Azure data flow wiring
- `packages/hooks/src/types.ts` — `StackConfig` in `AnalysisState`
- Design spec: `docs/superpowers/specs/2026-03-29-wide-form-stack-columns-design.md`
