# CoScout Visual Grounding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add visual grounding to CoScout — when it references a chart element, the UI highlights it with a blue glow, scrollable clickable links, and auto-attention on first mention.

**Architecture:** New `[REF:type:id]text[/REF]` markers in CoScout output, parsed by `parseRefMarkers()` in `@variscout/core`. A `useVisualGrounding` hook manages highlight lifecycle (3s glow then settled then clear). Chart components consume highlight state via existing props (`highlightedCategories`) and new thin props. State lives in `panelsStore`.

**Tech Stack:** TypeScript, React, Zustand, CSS transitions, visx SVG charts

**Spec:** `docs/superpowers/specs/2026-03-25-coscout-visual-grounding-design.md`

---

## File Structure

### New Files

| File                                                      | Responsibility                                                           |
| --------------------------------------------------------- | ------------------------------------------------------------------------ |
| `packages/core/src/ai/refMarkers.ts`                      | `parseRefMarkers()`, `stripRefMarkers()`, `RefMarker` type — pure parser |
| `packages/core/src/ai/__tests__/refMarkers.test.ts`       | Parser unit tests                                                        |
| `packages/hooks/src/useVisualGrounding.ts`                | Highlight lifecycle, timer management, scroll-to dispatch                |
| `packages/hooks/src/__tests__/useVisualGrounding.test.ts` | Hook unit tests                                                          |
| `packages/ui/src/components/CoScoutPanel/RefLink.tsx`     | Clickable reference link component                                       |
| `docs/07-decisions/adr-050-coscout-visual-grounding.md`   | ADR                                                                      |

### Modified Files

| File                                                              | Changes                                                             |
| ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| `packages/core/src/ai/index.ts`                                   | Re-export refMarkers                                                |
| `packages/core/src/ai/prompts/coScout.ts`                         | Add REF marker instruction to system prompt                         |
| `packages/ui/src/components/CoScoutPanel/CoScoutMessages.tsx`     | Parse REF markers, render RefLink components                        |
| `packages/ui/src/styles/components.css`                           | Add `.coscout-highlight` CSS classes                                |
| `apps/azure/src/features/panels/panelsStore.ts`                   | Add `coscoutHighlights`, `highlightedStat`, `highlightedCategories` |
| `packages/ui/src/components/DashboardBase/DashboardChartCard.tsx` | Consume coscout highlight class                                     |

---

### Task 1: REF Marker Parser

**Files:**

- Create: `packages/core/src/ai/refMarkers.ts`
- Create: `packages/core/src/ai/__tests__/refMarkers.test.ts`
- Modify: `packages/core/src/ai/index.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/core/src/ai/__tests__/refMarkers.test.ts` with tests for:

- `parseRefMarkers`: empty text, single ref with type+id, ref without id, multiple refs, malformed markers (graceful fallback), correct start/end indices, finding/hypothesis types
- `stripRefMarkers`: strips all markers leaving display text, passthrough for plain text

Follow the existing pattern in `actionTools.test.ts` — `describe` blocks per function, `it` blocks per case.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/core test -- --run --reporter=verbose packages/core/src/ai/__tests__/refMarkers.test.ts`
Expected: FAIL — module `../refMarkers` not found

- [ ] **Step 3: Write the parser implementation**

Create `packages/core/src/ai/refMarkers.ts`:

- Types: `RefTargetType` (union of 9 chart/element types), `RefMarker` (targetType, targetId?, displayText, startIndex, endIndex), `ParseRefResult` (cleanText, refs[])
- Regex: `\[REF:(\w+)(?::([^\]]*))?\]([\s\S]*?)\[\/REF\]/g`
- `parseRefMarkers(text)`: two-pass — collect matches, then build clean text tracking indices
- `stripRefMarkers(text)`: simple regex replace keeping capture group 3

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/core test -- --run --reporter=verbose packages/core/src/ai/__tests__/refMarkers.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Add re-export from ai barrel**

In `packages/core/src/ai/index.ts`, add exports for `parseRefMarkers`, `stripRefMarkers`, and types `RefMarker`, `RefTargetType`, `ParseRefResult`.

- [ ] **Step 6: Commit**

Stage: `packages/core/src/ai/refMarkers.ts`, `packages/core/src/ai/__tests__/refMarkers.test.ts`, `packages/core/src/ai/index.ts`
Message: `feat(core): add REF marker parser for CoScout visual grounding (ADR-050)`

---

### Task 2: CoScout Prompt Instruction

**Files:**

- Modify: `packages/core/src/ai/prompts/coScout.ts`

- [ ] **Step 1: Add REF marker instruction to system prompt**

In `buildCoScoutSystemPrompt()` (after the main system prompt push around line 668, before the glossaryFragment check), add a new `parts.push()` with visual grounding instructions:

- Valid types: boxplot, ichart, pareto, stats, yamazumi, finding, hypothesis, dashboard, improvement
- Stats keys: cpk, mean, sigma, cp, samples
- Use sparingly — 1-3 refs per message
- Include example: `[REF:boxplot:Machine A]Machine A[/REF]`

- [ ] **Step 2: Run existing prompt tests**

Run: `pnpm --filter @variscout/core test -- --run packages/core/src/ai/__tests__/promptTemplates.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

Stage: `packages/core/src/ai/prompts/coScout.ts`
Message: `feat(core): add visual grounding instruction to CoScout system prompt`

---

### Task 3: CSS Highlight Classes

**Files:**

- Modify: `packages/ui/src/styles/components.css`

- [ ] **Step 1: Add CoScout visual grounding CSS**

Append to `packages/ui/src/styles/components.css`:

- `.coscout-highlight` — 2px solid blue border, 12px blue box-shadow glow, subtle blue background, 500ms ease-out transition
- `.coscout-highlight--settled` — no box-shadow, 1px subtle blue border, transparent background
- `[data-theme="light"]` variants — lighter glow, subtler background

- [ ] **Step 2: Commit**

Stage: `packages/ui/src/styles/components.css`
Message: `feat(ui): add CoScout visual grounding highlight CSS classes`

---

### Task 4: panelsStore Extensions

**Files:**

- Modify: `apps/azure/src/features/panels/panelsStore.ts`
- Modify: `apps/azure/src/features/panels/__tests__/panelsStore.test.ts`

- [ ] **Step 1: Write failing tests for new store fields**

Add `describe('visual grounding')` block to panelsStore tests with cases for:

- `setCoscoutHighlight` / `clearCoscoutHighlights` — set a map entry, verify, clear, verify empty
- `setHighlightedStat` — set cpk, verify, set null, verify
- `setHighlightedCategories` — set array, verify, clear, verify

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/azure-app test -- --run panelsStore`
Expected: FAIL — functions not found

- [ ] **Step 3: Add new state and actions to panelsStore**

Extend `PanelsState` with: `coscoutHighlights` (Map), `highlightedStat` (string|null), `highlightedCategories` (string[])
Extend `PanelsActions` with: `setCoscoutHighlight`, `clearCoscoutHighlights`, `setHighlightedStat`, `setHighlightedCategories`
Add initial values and action implementations.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/azure-app test -- --run panelsStore`
Expected: All PASS

- [ ] **Step 5: Commit**

Stage: `apps/azure/src/features/panels/panelsStore.ts`, `apps/azure/src/features/panels/__tests__/panelsStore.test.ts`
Message: `feat(azure): add visual grounding state to panelsStore`

---

### Task 5: useVisualGrounding Hook

**Files:**

- Create: `packages/hooks/src/useVisualGrounding.ts`
- Create: `packages/hooks/src/__tests__/useVisualGrounding.test.ts`

- [ ] **Step 1: Write failing tests**

Test `resolveHighlightTarget()` pure function — 7 cases:

- boxplot+category -> highlightCategories action
- pareto+category -> highlightCategories action
- stats+key -> highlightStat action
- chart without id -> focusChart action
- finding+id -> highlightFinding action
- hypothesis+id -> expandHypothesis action
- Exported constants: `GLOW_DURATION_MS` = 3000, `SETTLED_DURATION_MS` = 10000

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/hooks test -- --run useVisualGrounding`
Expected: FAIL — module not found

- [ ] **Step 3: Implement useVisualGrounding hook**

Create `packages/hooks/src/useVisualGrounding.ts`:

- Export `resolveHighlightTarget()` — pure function mapping (targetType, targetId) to a discriminated union of highlight actions
- Export `useVisualGrounding(stores)` — React hook taking store action callbacks, managing timers (3s glow -> settled, 10s settled -> clear)
- Export `VisualGroundingStoreActions` interface — the contract for store callbacks
- Export timing constants
- Include IntersectionObserver-based scroll-away clearing: when the CoScout message containing the ref scrolls out of the chat viewport, call `clearAll()`. The hook should expose a `messageRef` callback ref that CoScoutMessages can attach to message elements.

- [ ] **Step 4: Export from hooks barrel**

Add exports to `packages/hooks/src/index.ts`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @variscout/hooks test -- --run useVisualGrounding`
Expected: All PASS

- [ ] **Step 6: Commit**

Stage: `packages/hooks/src/useVisualGrounding.ts`, `packages/hooks/src/__tests__/useVisualGrounding.test.ts`, `packages/hooks/src/index.ts`
Message: `feat(hooks): add useVisualGrounding hook for highlight lifecycle`

---

### Task 6: RefLink Component

**Files:**

- Create: `packages/ui/src/components/CoScoutPanel/RefLink.tsx`

- [ ] **Step 1: Create RefLink component**

Functional component with props: `targetType`, `targetId?`, `displayText`, `onActivate` callback.

- Renders as `<button>` with inline-flex layout
- Icon from lucide-react mapped by targetType (BarChart3 for boxplot/pareto, TrendingUp for ichart, Hash for stats, etc.)
- Blue text, dotted underline, subtle background, hover brightens
- Title tooltip: "Click to highlight in [chart name]"
- Accessible: aria-label

- [ ] **Step 2: Commit**

Stage: `packages/ui/src/components/CoScoutPanel/RefLink.tsx`
Message: `feat(ui): add RefLink component for CoScout visual grounding`

---

### Task 7: Integrate RefLinks into CoScoutMessages

**Files:**

- Modify: `packages/ui/src/components/CoScoutPanel/CoScoutMessages.tsx`

- [ ] **Step 1: Add imports and prop**

Import `parseRefMarkers` from `@variscout/core` and `RefLink` from `./RefLink`.
Add `onRefActivate?` callback prop to `CoScoutMessagesProps`.

- [ ] **Step 2: Create renderWithRefs helper**

New function that:

1. Strips ACTION markers (they're rendered separately by ActionProposalCard)
2. Parses REF markers from the remaining text
3. Splits text into segments, replacing ref ranges with `<RefLink>` components
4. Applies `renderWithSourceBadges` to non-ref text segments

- [ ] **Step 3: Update assistant message rendering**

In the assistant message block (~line 244), replace `renderWithSourceBadges(cleanText)` with `renderWithRefs(msg.content, onRefActivate)`.

- [ ] **Step 4: Add auto-highlight on first ref**

Add `useEffect` that watches `messages` array. When a new assistant message arrives, parse its refs and call `onRefActivate` for the first ref (with 100ms delay). Track last auto-highlighted message ID via `useRef` to avoid re-triggering.

- [ ] **Step 5: Run existing tests**

Run: `pnpm --filter @variscout/ui test -- --run`
Expected: PASS (onRefActivate is optional, no breaking changes)

- [ ] **Step 6: Commit**

Stage: `packages/ui/src/components/CoScoutPanel/CoScoutMessages.tsx`
Message: `feat(ui): integrate RefLink rendering into CoScoutMessages`

---

### Task 8: SVG Chart Element Highlights (Boxplot + Pareto)

**Files:**

- Modify: `packages/charts/src/Boxplot.tsx` (or `BoxplotBase`)
- Modify: `packages/charts/src/Pareto.tsx` (or `ParetoBase`)

- [ ] **Step 1: Read BoxplotBase to find where categories are rendered**

Read: `packages/charts/src/Boxplot.tsx` — find the SVG `<rect>` or `<Group>` elements that render each category box.

- [ ] **Step 2: Add highlight styling to boxplot categories**

The `highlightedCategories` prop already exists on BoxplotBase. Where categories are rendered, conditionally apply SVG attributes when a category is in `highlightedCategories`:

- `stroke="#3b82f6"`, `strokeWidth={2}`, SVG filter for glow: `filter="drop-shadow(0 0 8px rgba(59,130,246,0.4))"`
- Or use an SVG `<defs><filter>` for the glow and reference it by ID

- [ ] **Step 3: Add highlight styling to pareto bars**

Same pattern for ParetoBase — the `highlightedCategories` prop already exists. Apply blue stroke + glow to highlighted bars.

- [ ] **Step 4: Verify visually**

Run: `pnpm dev`, load data, manually set `highlightedCategories` via React DevTools to confirm glow renders correctly.

- [ ] **Step 5: Commit**

Stage: chart files
Message: `feat(charts): add CoScout highlight glow to boxplot and pareto SVG elements`

---

### Task 9: StatsPanelBase Highlight Integration

**Files:**

- Modify: `packages/ui/src/components/StatsPanelBase/index.tsx`

- [ ] **Step 1: Read StatsPanelBase to understand stat card structure**

- [ ] **Step 2: Add optional `highlightedStat` prop**

Type: `string | null`. When a stat key matches (e.g., 'cpk', 'mean', 'sigma'), apply `.coscout-highlight` class to that stat card.

- [ ] **Step 3: Commit**

Stage: `packages/ui/src/components/StatsPanelBase/index.tsx`
Message: `feat(ui): add CoScout highlight support to StatsPanelBase`

---

### Task 10: DashboardChartCard Highlight

**Files:**

- Modify: `packages/ui/src/components/DashboardBase/DashboardChartCard.tsx`

- [ ] **Step 1: Read DashboardChartCard to understand its props and structure**

- [ ] **Step 2: Add optional `coscoutHighlight` prop**

Type: `'glow' | 'settled' | null`. Default: `null`.

- [ ] **Step 3: Apply conditional CSS class**

On the chart card wrapper element, conditionally add `coscout-highlight` or `coscout-highlight--settled` class based on prop value.

- [ ] **Step 4: Commit**

Stage: `packages/ui/src/components/DashboardBase/DashboardChartCard.tsx`
Message: `feat(ui): add CoScout highlight support to DashboardChartCard`

---

### Task 11: Wire Visual Grounding in Azure App

**Files:**

- Modify: Azure app's CoScout panel parent component (where CoScoutMessages is rendered)
- Modify: Azure app's dashboard/editor where chart cards are rendered

- [ ] **Step 1: Instantiate useVisualGrounding in AI feature wiring**

Where the Azure app renders `CoScoutMessages`, create the `useVisualGrounding` hook with store actions from `usePanelsStore.getState()`.

- [ ] **Step 2: Pass onRefActivate to CoScoutMessages**

Add `onRefActivate={visualGrounding.highlight}` prop.

- [ ] **Step 3: Connect DashboardChartCard to highlight state**

Read `coscoutHighlights` from panelsStore, pass the relevant highlight phase to each chart card.

- [ ] **Step 4: Connect highlightedCategories to chart wrappers**

Read `highlightedCategories` from panelsStore, pass to BoxplotWrapperBase and ParetoChartWrapperBase.

- [ ] **Step 5: Run all tests**

Run: `pnpm test`
Expected: All ~3,795 tests PASS

- [ ] **Step 6: Commit**

Stage: modified Azure app files
Message: `feat(azure): wire CoScout visual grounding to panels and charts`

---

### Task 12: Action Tool Visual Feedback

**Files:**

- Modify: `apps/azure/src/features/ai/actionToolHandlers.ts`
- Modify: `packages/ui/src/components/CoScoutPanel/ActionProposalCard.tsx`

- [ ] **Step 1: Implement switch_factor handler**

In `actionToolHandlers.ts`, add the missing `switch_factor` handler:

- Read available factors from data context
- Return `ActionProposal` with preview (factor name, category count)
- On execute: update `viewState.boxplotFactor` via data context callback

- [ ] **Step 2: Add highlight dispatch to ActionProposalCard**

In `ActionProposalCard.tsx`, when a proposal first renders (status === 'pending'), dispatch a visual grounding highlight for the proposal's target:

- `apply_filter` -> highlight target category in boxplot/pareto
- `switch_factor` -> highlight boxplot chart card
- `create_finding` / `suggest_save_finding` -> glow on findings panel header area
- `create_hypothesis` -> glow on parent hypothesis
- `navigate_to` -> highlight target chart/finding/workspace
- `suggest_improvement_idea` -> glow on improvement workspace tab

Accept an optional `onHighlight?: (targetType: string, targetId?: string) => void` prop. Call it in a `useEffect` on mount when status is 'pending'.

- [ ] **Step 3: Add highlight dispatch on proposal apply**

After successful execution (status changes to 'applied'), dispatch highlight for the result element (e.g., new finding card, filtered chart).

- [ ] **Step 4: Run tests**

Run: `pnpm test`
Expected: All PASS

- [ ] **Step 5: Commit**

Stage: modified files
Message: `feat(ai): add visual feedback to action tool proposals and switch_factor handler`

---

### Task 13: ADR-050

**Files:**

- Create: `docs/07-decisions/adr-050-coscout-visual-grounding.md`
- Modify: `docs/07-decisions/index.md`

- [ ] **Step 1: Write ADR**

Sections: Status (Accepted), Date (2026-03-25), Context (text-only AI output, industry patterns), Decision (REF markers + highlight lifecycle + clickable links), Implementation (parser, hook, store, UI, CSS), Consequences (prompt growth, malformed fallback, color reservation, auto-highlight-first rule).

- [ ] **Step 2: Add to index**

Add row 050 to `docs/07-decisions/index.md`.

- [ ] **Step 3: Commit**

Stage: `docs/07-decisions/adr-050-coscout-visual-grounding.md`, `docs/07-decisions/index.md`
Message: `docs: add ADR-050 CoScout Visual Grounding`

---

### Task 14: Integration Verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: All tests PASS

- [ ] **Step 2: Run build**

Run: `pnpm build`
Expected: Clean build

- [ ] **Step 3: Manual E2E verification**

Run: `pnpm --filter @variscout/azure-app dev`

1. Load coffee sample data
2. Open CoScout, ask "What's causing the variation?"
3. Verify: styled blue RefLink components in message
4. Click RefLink -> chart card highlights with blue glow
5. Wait 3s -> glow fades to subtle border
6. Wait 10s -> highlight clears
7. Test light theme -> verify visibility
