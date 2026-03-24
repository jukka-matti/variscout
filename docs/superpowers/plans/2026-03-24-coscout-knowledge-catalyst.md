# CoScout Knowledge Catalyst Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable CoScout to capture visual evidence and route insights into VariScout's investigation model (findings/hypotheses) — making conversations catalysts for knowledge, not disposable chat logs.

**Architecture:** Extends existing Finding infrastructure with `source: { chart: 'coscout' }` variant. Adds 2 new CoScout tools (`suggest_save_finding`, `get_finding_attachment`), image paste with multimodal Responses API input, session-close save prompt, and a token budget pipeline (`budgetContext()`). No new data types, storage layers, or external dependencies.

**Tech Stack:** TypeScript, React, Vitest, Zustand, OpenAI Responses API (multimodal), existing photoUpload.ts for SharePoint.

**Spec:** `docs/superpowers/specs/2026-03-24-coscout-knowledge-catalyst-design.md`

---

## Phase 1: Foundation (Capabilities 3, 4, 7)

### Task 1: Extend FindingSource with CoScout variant

**Files:**

- Modify: `packages/core/src/findings/types.ts:369-373`
- Test: `packages/core/src/findings/__tests__/types.test.ts` (or nearest test)

- [ ] **Step 1: Add `coscout` variant to FindingSource union**

```typescript
// packages/core/src/findings/types.ts — line 369-373
// Change from:
export type FindingSource =
  | { chart: 'boxplot' | 'pareto'; category: string }
  | { chart: 'ichart'; anchorX: number; anchorY: number }
  | { chart: 'yamazumi'; category: string; activityType?: string };

// To:
export type FindingSource =
  | { chart: 'boxplot' | 'pareto'; category: string }
  | { chart: 'ichart'; anchorX: number; anchorY: number }
  | { chart: 'yamazumi'; category: string; activityType?: string }
  | { chart: 'coscout'; messageId: string };
```

- [ ] **Step 2: Run existing tests to verify no regressions**

Run: `pnpm --filter @variscout/core test`
Expected: All existing tests pass (the union is additive — no breaking change)

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/findings/types.ts
git commit -m "feat: extend FindingSource with coscout variant (ADR-049)"
```

---

### Task 2: Add `suggest_save_finding` tool to ActionToolName

**Files:**

- Modify: `packages/core/src/ai/actionTools.ts:19-31`
- Test: `packages/core/src/ai/__tests__/actionTools.test.ts`

- [ ] **Step 1: Add `suggest_save_finding` to ActionToolName union**

```typescript
// packages/core/src/ai/actionTools.ts — line 19-31
// Add after 'suggest_improvement_idea':
  | 'suggest_save_finding'
```

- [ ] **Step 2: Run tests**

Run: `pnpm --filter @variscout/core test`
Expected: PASS (additive type change)

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/ai/actionTools.ts
git commit -m "feat: add suggest_save_finding to ActionToolName (ADR-049)"
```

---

### Task 3: Add `suggest_save_finding` tool definition to buildCoScoutTools

**Files:**

- Modify: `packages/core/src/ai/prompts/coScout.ts:117-267` (phase-gated tool section)
- Test: `packages/core/src/ai/__tests__/promptTemplates.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// In promptTemplates.test.ts
it('includes suggest_save_finding tool in INVESTIGATE phase', () => {
  const tools = buildCoScoutTools({ phase: 'investigate' });
  const tool = tools.find(t => t.name === 'suggest_save_finding');
  expect(tool).toBeDefined();
  expect(tool!.parameters.properties).toHaveProperty('insight_text');
  expect(tool!.parameters.properties).toHaveProperty('reasoning');
  expect(tool!.parameters.properties).toHaveProperty('suggested_hypothesis_id');
});

it('excludes suggest_save_finding in SCOUT phase', () => {
  const tools = buildCoScoutTools({ phase: 'scout' });
  expect(tools.find(t => t.name === 'suggest_save_finding')).toBeUndefined();
});

it('excludes suggest_save_finding in FRAME phase', () => {
  const tools = buildCoScoutTools({ phase: 'frame' });
  expect(tools.find(t => t.name === 'suggest_save_finding')).toBeUndefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test -- --grep "suggest_save_finding"`
Expected: FAIL — tool not found

- [ ] **Step 3: Add tool definition in the INVESTIGATE+ phase-gated section**

In `buildCoScoutTools()`, inside the `if (phase === 'investigate' || phase === 'improve')` block (around line 267), add the tool definition from the spec (lines 310-344 of the design spec).

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @variscout/core test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/ai/prompts/coScout.ts packages/core/src/ai/__tests__/promptTemplates.test.ts
git commit -m "feat: add suggest_save_finding tool definition with phase gating (ADR-049)"
```

---

### Task 4: Add insight capture guidance to CoScout system prompt

**Files:**

- Modify: `packages/core/src/ai/prompts/coScout.ts` (buildCoScoutSystemPrompt function, around line 563+)
- Test: `packages/core/src/ai/__tests__/promptTemplates.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
it('includes insight capture guidance in system prompt for INVESTIGATE phase', () => {
  const prompt = buildCoScoutSystemPrompt({
    phase: 'investigate',
    hasActionTools: true,
  });
  expect(prompt).toContain('suggest_save_finding');
  expect(prompt).toContain('negative learning');
});
```

- [ ] **Step 2: Run test — should fail**

- [ ] **Step 3: Add insight capture guidance text**

Add the prompt guidance block from the design spec (lines 372-384) to the system prompt when phase is 'investigate' or 'improve' and hasActionTools is true.

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @variscout/core test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/ai/prompts/coScout.ts packages/core/src/ai/__tests__/promptTemplates.test.ts
git commit -m "feat: add insight capture guidance to CoScout system prompt (ADR-049)"
```

---

### Task 5: Add `suggest_save_finding` to ActionProposalCard TOOL_CONFIG

**Files:**

- Modify: `packages/ui/src/components/CoScoutPanel/ActionProposalCard.tsx:25-45`
- Modify: `packages/core/src/i18n/messages/en.ts` (add translation key)

- [ ] **Step 1: Add i18n key**

Add `'ai.tool.suggestSaveFinding': 'Save insight'` to the English message catalog.

- [ ] **Step 2: Add TOOL_CONFIG entry**

```typescript
// In ActionProposalCard.tsx TOOL_CONFIG — add after suggest_improvement_idea:
suggest_save_finding: { labelKey: 'ai.tool.suggestSaveFinding', icon: Lightbulb, editable: true },
```

Import `Lightbulb` from lucide-react (may already be imported for suggest_improvement_idea).

- [ ] **Step 3: Run tests**

Run: `pnpm --filter @variscout/ui test && pnpm --filter @variscout/core test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/CoScoutPanel/ActionProposalCard.tsx packages/core/src/i18n/messages/en.ts
git commit -m "feat: add suggest_save_finding to ActionProposalCard config (ADR-049)"
```

---

### Task 6: Create `budgetContext()` token budget function

**Files:**

- Create: `packages/core/src/ai/budgetContext.ts`
- Create: `packages/core/src/ai/__tests__/budgetContext.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// budgetContext.test.ts
import { budgetContext, type ContextComponent } from '../budgetContext';

describe('budgetContext', () => {
  it('assembles components within budget', () => {
    const components: ContextComponent[] = [
      { name: 'system', content: 'System instructions', priority: 0 },
      { name: 'stats', content: 'Stats data here', priority: 6 },
    ];
    const result = budgetContext(components, 12000);
    expect(result.trimmedComponents).toEqual([]);
    expect(result.estimatedTokens).toBeGreaterThan(0);
  });

  it('trims lowest priority components when over budget', () => {
    const longContent = 'word '.repeat(5000); // ~6500 tokens
    const components: ContextComponent[] = [
      { name: 'system', content: 'System prompt', priority: 0 },
      { name: 'stats', content: longContent, priority: 6 },
      { name: 'history', content: longContent, priority: 8 },
    ];
    const result = budgetContext(components, 8000);
    expect(result.trimmedComponents).toContain('history');
  });

  it('never trims priority 0-2 components', () => {
    const longContent = 'word '.repeat(10000);
    const components: ContextComponent[] = [
      { name: 'system', content: longContent, priority: 0 },
      { name: 'user', content: 'question', priority: 2 },
    ];
    const result = budgetContext(components, 100);
    expect(result.trimmedComponents).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests — should fail**

Run: `pnpm --filter @variscout/core test -- --grep "budgetContext"`
Expected: FAIL — module not found

- [ ] **Step 3: Implement budgetContext**

```typescript
// packages/core/src/ai/budgetContext.ts

export interface ContextComponent {
  name: string;
  content: string;
  /** 0 = highest priority (never trim), 8 = lowest */
  priority: number;
}

export interface BudgetResult {
  components: ContextComponent[];
  trimmedComponents: string[];
  estimatedTokens: number;
}

/** Estimate tokens from text using word-count heuristic (1.3 tokens/word) */
function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

/**
 * Assemble context components within a token budget.
 * Trims lowest-priority components first. Never trims priority 0-2.
 */
export function budgetContext(
  components: ContextComponent[],
  maxTokens: number = 12000
): BudgetResult {
  const sorted = [...components].sort((a, b) => a.priority - b.priority);
  const trimmed: string[] = [];
  let totalTokens = sorted.reduce((sum, c) => sum + estimateTokens(c.content), 0);

  // Trim from lowest priority up, but never priority 0-2
  const trimmable = [...sorted].reverse().filter(c => c.priority > 2);

  for (const comp of trimmable) {
    if (totalTokens <= maxTokens) break;
    totalTokens -= estimateTokens(comp.content);
    trimmed.push(comp.name);
  }

  const kept = sorted.filter(c => !trimmed.includes(c.name));
  return {
    components: kept,
    trimmedComponents: trimmed,
    estimatedTokens: kept.reduce((sum, c) => sum + estimateTokens(c.content), 0),
  };
}
```

- [ ] **Step 4: Export from core barrel**

Add export to `packages/core/src/ai/index.ts` (or wherever the ai barrel is).

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @variscout/core test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/ai/budgetContext.ts packages/core/src/ai/__tests__/budgetContext.test.ts
git commit -m "feat: add budgetContext() token budget pipeline (ADR-049)"
```

---

### Task 7: Add CoScout-sourced finding nudge to context pipeline

**Files:**

- Modify: `packages/core/src/ai/prompts/coScout.ts` (buildCoScoutInput or buildCoScoutSystemPrompt)
- Test: `packages/core/src/ai/__tests__/promptTemplates.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
it('includes CoScout-sourced finding nudge when findings have coscout source', () => {
  const ctx: AIContext = {
    ...baseCtx,
    findings: {
      total: 2,
      byStatus: { investigating: 1, analyzed: 1 },
      keyDrivers: ['Machine'],
      coscoutInsights: [{ text: 'Nozzle 3 shows 2x variation', status: 'investigating' }],
    },
  };
  const { instructions } = buildCoScoutInput(ctx, [], 'Question');
  expect(instructions).toContain('Previous CoScout insights');
  expect(instructions).toContain('Nozzle 3');
});
```

- [ ] **Step 2: Run test — should fail**

- [ ] **Step 3: Implement the nudge**

In `buildCoScoutSystemPrompt()`, when `investigation?.coscoutInsights` (or equivalent field) contains entries, append a nudge block. The AIContext `findings` object needs a `coscoutInsights` field added — or detect from the findings summary.

Note: The exact integration point depends on how `buildAIContext()` in `packages/hooks/src/useAIContext.ts` assembles the findings summary. Check if CoScout-sourced findings can be identified there (by `source.chart === 'coscout'`).

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @variscout/core test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/ai/prompts/coScout.ts packages/core/src/ai/__tests__/promptTemplates.test.ts packages/hooks/src/useAIContext.ts
git commit -m "feat: add CoScout-sourced finding nudge to context pipeline (ADR-049)"
```

---

### Task 8: Add bookmark icon and SaveInsightDialog to CoScoutMessages

**Files:**

- Modify: `packages/ui/src/components/CoScoutPanel/CoScoutMessages.tsx`
- Create: `packages/ui/src/components/CoScoutPanel/SaveInsightDialog.tsx`
- Test: `packages/ui/src/components/CoScoutPanel/__tests__/SaveInsightDialog.test.tsx`

- [ ] **Step 1: Create SaveInsightDialog component**

Props:

```typescript
interface SaveInsightDialogProps {
  isOpen: boolean;
  messageText: string;
  messageId: string;
  findings: Array<{ id: string; text: string }>;
  hypotheses: Array<{ id: string; text: string }>;
  onSaveAsNewFinding: (text: string, sourceMessageId: string) => void;
  onAddCommentToFinding: (findingId: string, text: string) => void;
  onAddCommentToHypothesis: (hypothesisId: string, text: string) => void;
  onClose: () => void;
}
```

Renders the dialog from the spec (lines 277-289): radio buttons for "Save as new finding" / "Add as comment to finding" / "Add as comment to hypothesis", with an editable text field and dropdowns.

- [ ] **Step 2: Write tests for SaveInsightDialog**

Test: renders, pre-fills text, calls correct callback on Save, closes on Cancel.

- [ ] **Step 3: Add bookmark icon to CoScoutMessages**

Add a `Bookmark` icon (from lucide-react) to each message in the message list. On click, open `SaveInsightDialog` with the message text pre-filled.

- [ ] **Step 4: Export from barrel**

Add `SaveInsightDialog` to the CoScoutPanel barrel export.

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @variscout/ui test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/CoScoutPanel/
git commit -m "feat: add bookmark icon and SaveInsightDialog for insight capture (ADR-049)"
```

---

### Task 9: Wire suggest_save_finding execution in Azure app

**Files:**

- Modify: `apps/azure/src/features/ai/wiring.ts` (or wherever tool handlers are wired)
- Check: `apps/azure/src/pages/Editor.tsx` (actionProposalsState)

- [ ] **Step 1: Find the tool handler wiring**

Look for where `toolHandlers` is constructed (passed to `useAICoScout`). This maps tool names to handler functions.

- [ ] **Step 2: Add handler for suggest_save_finding**

```typescript
suggest_save_finding: async (args) => {
  // The tool execution returns a preview — the actual finding creation
  // happens when the user clicks "Apply" on the ActionProposalCard.
  // Return a confirmation message for the model.
  return JSON.stringify({
    status: 'proposed',
    message: `Insight proposed: "${(args as { insight_text: string }).insight_text}". Waiting for analyst confirmation.`,
  });
},
```

- [ ] **Step 3: Wire the ActionProposalCard "Apply" callback**

In the action proposal handling (likely in `useActionProposals` or `Editor.tsx`), add a case for `suggest_save_finding` that creates a Finding with `source: { chart: 'coscout', messageId }`.

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @variscout/azure-app test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/
git commit -m "feat: wire suggest_save_finding tool handler in Azure app (ADR-049)"
```

---

## Phase 2: Multimodal (Capabilities 1, 2)

### Task 10: Add image attachment types to CoScoutMessage

**Files:**

- Modify: `packages/core/src/ai/types.ts`
- Test: existing type tests

- [ ] **Step 1: Add ImageAttachment interface and extend CoScoutMessage**

```typescript
// packages/core/src/ai/types.ts

/** Image attachment on a CoScout message (session-scoped) */
export interface ImageAttachment {
  /** Unique ID for this image */
  id: string;
  /** Base64 data URL (session-scoped, not persisted) */
  dataUrl: string;
  /** MIME type (image/jpeg or image/png) */
  mimeType: 'image/jpeg' | 'image/png';
  /** Original filename if available */
  filename?: string;
  /** File size in bytes */
  sizeBytes: number;
}

// Extend CoScoutMessage:
export interface CoScoutMessage {
  // ... existing fields
  /** Image attachments (session-scoped) */
  images?: ImageAttachment[];
}
```

- [ ] **Step 2: Run tests**

Run: `pnpm --filter @variscout/core test`
Expected: PASS (additive type change)

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/ai/types.ts
git commit -m "feat: add ImageAttachment type to CoScoutMessage (ADR-049)"
```

---

### Task 11: Add image validation utility

**Files:**

- Create: `packages/core/src/ai/imageValidation.ts`
- Create: `packages/core/src/ai/__tests__/imageValidation.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { validateImageFile, MAGIC_BYTES } from '../imageValidation';

describe('validateImageFile', () => {
  it('accepts valid JPEG', async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...Array(100).fill(0)]);
    const file = new File([bytes], 'photo.jpg', { type: 'image/jpeg' });
    expect(await validateImageFile(file)).toBe(true);
  });

  it('accepts valid PNG', async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, ...Array(100).fill(0)]);
    const file = new File([bytes], 'photo.png', { type: 'image/png' });
    expect(await validateImageFile(file)).toBe(true);
  });

  it('rejects file with wrong magic bytes', async () => {
    const bytes = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
    const file = new File([bytes], 'fake.jpg', { type: 'image/jpeg' });
    expect(await validateImageFile(file)).toBe(false);
  });

  it('rejects file over 2MB', async () => {
    const bytes = new Uint8Array(2.1 * 1024 * 1024);
    bytes[0] = 0xff;
    bytes[1] = 0xd8;
    bytes[2] = 0xff;
    const file = new File([bytes], 'huge.jpg', { type: 'image/jpeg' });
    expect(await validateImageFile(file)).toBe(false);
  });
});
```

- [ ] **Step 2: Implement**

```typescript
// packages/core/src/ai/imageValidation.ts

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

export const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
};

export async function validateImageFile(file: File): Promise<boolean> {
  if (file.size > MAX_IMAGE_SIZE) return false;

  const buffer = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  for (const [, magic] of Object.entries(MAGIC_BYTES)) {
    if (magic.every((b, i) => bytes[i] === b)) return true;
  }
  return false;
}
```

- [ ] **Step 3: Run tests, commit**

Run: `pnpm --filter @variscout/core test`

```bash
git add packages/core/src/ai/imageValidation.ts packages/core/src/ai/__tests__/imageValidation.test.ts
git commit -m "feat: add image validation with magic byte checks (ADR-049)"
```

---

### Task 12: Support multimodal input in Responses API client

**Files:**

- Modify: `packages/core/src/ai/responsesApi.ts:34-62` (ResponsesApiRequest)
- Modify: `packages/hooks/src/useAICoScout.ts:103-205` (send function)

- [ ] **Step 1: Update input type to support multimodal content**

The Responses API `input` field already accepts `string | Array<...>`. The content within a user message needs to support `input_image` parts. Update the `send` function in `useAICoScout.ts` to:

1. Accept an optional `images` parameter
2. Build multimodal content parts when images are present
3. Set `store: false` when images are present

- [ ] **Step 2: Update `buildCoScoutInput` to handle images**

In `coScout.ts`, modify `buildCoScoutInput()` to accept optional images and format them as multimodal content parts in the user message.

- [ ] **Step 3: Set `store: false` for image messages**

In `useAICoScout.ts` `send()`, check if images are present. If so, set `store: false` in the request.

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @variscout/core test && pnpm --filter @variscout/hooks test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/ai/responsesApi.ts packages/core/src/ai/prompts/coScout.ts packages/hooks/src/useAICoScout.ts
git commit -m "feat: support multimodal image input with store:false (ADR-049)"
```

---

### Task 13: Build ImagePreview component and paste handler

**Files:**

- Create: `packages/ui/src/components/CoScoutPanel/ImagePreview.tsx`
- Modify: `packages/ui/src/components/CoScoutPanel/CoScoutPanelBase.tsx`

- [ ] **Step 1: Create ImagePreview component**

Shows thumbnails of pending images below the input field. Max 120px height. Remove button (X) on each. Props:

```typescript
interface ImagePreviewProps {
  images: Array<{ id: string; dataUrl: string; filename?: string }>;
  onRemove: (id: string) => void;
}
```

- [ ] **Step 2: Add paste handler to CoScoutPanelBase**

Handle `onPaste` and `onDrop` events on the input area. Extract image files, validate with `validateImageFile()`, convert to base64, add to pending images state. Max 2 images per message.

- [ ] **Step 3: Wire images through to send()**

Pass pending images to the `send()` function. Clear images after send.

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @variscout/ui test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/CoScoutPanel/
git commit -m "feat: add image paste/drop handling with preview (ADR-049)"
```

---

### Task 14: Add `get_finding_attachment` tool

**Files:**

- Modify: `packages/core/src/ai/prompts/coScout.ts` (add tool to read tools section)
- Modify: `packages/core/src/ai/actionTools.ts` (add to ReadToolName)
- Test: `packages/core/src/ai/__tests__/promptTemplates.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
it('includes get_finding_attachment in all phases', () => {
  const tools = buildCoScoutTools();
  expect(tools.find(t => t.name === 'get_finding_attachment')).toBeDefined();
});
```

- [ ] **Step 2: Add tool definition to read tools section (always available)**

Add the tool definition from the spec (lines 196-216) to the always-available read tools section in `buildCoScoutTools()`.

- [ ] **Step 3: Add to ReadToolName**

```typescript
// In actionTools.ts ReadToolName:
  | 'get_finding_attachment'
```

- [ ] **Step 4: Wire tool handler in Azure app**

In the tool handler wiring, add a handler that looks up finding comments and returns attachment metadata.

- [ ] **Step 5: Run tests, commit**

Run: `pnpm --filter @variscout/core test`

```bash
git add packages/core/src/ai/prompts/coScout.ts packages/core/src/ai/actionTools.ts packages/core/src/ai/__tests__/promptTemplates.test.ts
git commit -m "feat: add get_finding_attachment tool for bidirectional image flow (ADR-049)"
```

---

### Task 15: Add "Save to finding" button on image messages

**Files:**

- Modify: `packages/ui/src/components/CoScoutPanel/CoScoutMessages.tsx`

- [ ] **Step 1: Render images inline in messages**

When a `CoScoutMessage` has `images`, render them as small thumbnails (max 120px) inline in the message bubble.

- [ ] **Step 2: Add "Save to finding" button**

On messages containing images, show a camera icon button. Clicking opens SaveInsightDialog (from Task 8) with the image and pre-fills text from the assistant's analysis.

- [ ] **Step 3: Run tests, commit**

Run: `pnpm --filter @variscout/ui test`

```bash
git add packages/ui/src/components/CoScoutPanel/CoScoutMessages.tsx
git commit -m "feat: render inline images and save-to-finding button in CoScout (ADR-049)"
```

---

## Phase 3: Session Intelligence (Capability 5)

### Task 16: Add AISessionState tracking to aiStore

**Files:**

- Modify: `apps/azure/src/features/ai/aiStore.ts`
- Test: `apps/azure/src/features/ai/__tests__/aiStore.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
it('tracks pendingSaveProposals count', () => {
  useAIStore.getState().incrementPendingSaveProposals();
  expect(useAIStore.getState().pendingSaveProposals).toBe(1);
});

it('tracks unsaved bookmarks', () => {
  useAIStore.getState().addUnsavedBookmark('msg-1');
  expect(useAIStore.getState().unsavedBookmarks).toContain('msg-1');
});

it('tracks turn count', () => {
  useAIStore.getState().incrementTurnCount();
  expect(useAIStore.getState().turnCount).toBe(1);
});

it('resets session state', () => {
  useAIStore.getState().incrementTurnCount();
  useAIStore.getState().resetSessionState();
  expect(useAIStore.getState().turnCount).toBe(0);
});
```

- [ ] **Step 2: Add session state fields and actions**

Add `pendingSaveProposals`, `unsavedBookmarks`, `turnCount`, `findingsCreatedThisSession` fields to aiStore state. Add increment/add/reset actions.

- [ ] **Step 3: Run tests, commit**

Run: `pnpm --filter @variscout/azure-app test`

```bash
git add apps/azure/src/features/ai/
git commit -m "feat: add AISessionState tracking to aiStore (ADR-049)"
```

---

### Task 17: Build SessionClosePrompt component

**Files:**

- Create: `packages/ui/src/components/CoScoutPanel/SessionClosePrompt.tsx`
- Test: `packages/ui/src/components/CoScoutPanel/__tests__/SessionClosePrompt.test.tsx`

- [ ] **Step 1: Write tests**

Test: renders checklist items, pre-checks pending proposals, calls onSave with checked items, calls onDismiss on close.

- [ ] **Step 2: Implement component**

Props:

```typescript
interface SessionClosePromptProps {
  isOpen: boolean;
  items: Array<{ id: string; text: string; preChecked: boolean }>;
  onSave: (selectedIds: string[]) => void;
  onDismiss: () => void;
}
```

Renders the modal from the spec (lines 426-435). Checkbox list, "Close without saving" and "Save selected" buttons.

- [ ] **Step 3: Run tests, commit**

Run: `pnpm --filter @variscout/ui test`

```bash
git add packages/ui/src/components/CoScoutPanel/SessionClosePrompt.tsx packages/ui/src/components/CoScoutPanel/__tests__/
git commit -m "feat: add SessionClosePrompt component (ADR-049)"
```

---

### Task 18: Wire session-close prompt to panel close events

**Files:**

- Modify: `apps/azure/src/pages/Editor.tsx` (or CoScout panel wiring)
- Modify: `apps/azure/src/features/ai/aiStore.ts`

- [ ] **Step 1: Add trigger logic**

When `setCoScoutOpen(false)` is called, check aiStore session state:

- If `pendingSaveProposals > 0` or `unsavedBookmarks.length > 0` or (`turnCount >= 5` && `!findingsCreatedThisSession`): show SessionClosePrompt instead of closing immediately.

- [ ] **Step 2: Wire "Save selected" to finding creation**

"Save selected" creates findings in bulk using the existing `useFindings.addFinding()` pattern with `source: { chart: 'coscout', messageId }`.

- [ ] **Step 3: Test manually**

Open CoScout, have a 5+ turn conversation, close the panel — prompt should appear.

- [ ] **Step 4: Commit**

```bash
git add apps/azure/src/
git commit -m "feat: wire session-close save prompt to panel close events (ADR-049)"
```

---

## Phase 4: File Attachments (Capability 6, Team only)

### Task 19: Generalize photoUpload for non-image files

**Files:**

- Modify: `apps/azure/src/services/photoUpload.ts`
- Create: `packages/core/src/ai/fileValidation.ts`
- Test: `packages/core/src/ai/__tests__/fileValidation.test.ts`

- [ ] **Step 1: Create file validation utility**

Extend the magic byte pattern from Task 11 to support PDF (`%PDF` = `25504446`), XLSX (`PK` = `504B0304`), and plain text/CSV (no magic bytes, text validation).

- [ ] **Step 2: Generalize upload path**

Change the OneDrive upload path from `/VariScout/Photos/...` to `/VariScout/Attachments/{analysisId}/{findingId}/{filename}` for non-photo files.

- [ ] **Step 3: Add filename sanitization**

Strip path separators, leading dots. Allow alphanumeric + hyphen + underscore + single dot for extension.

- [ ] **Step 4: Run tests, commit**

```bash
git add apps/azure/src/services/photoUpload.ts packages/core/src/ai/fileValidation.ts packages/core/src/ai/__tests__/fileValidation.test.ts
git commit -m "feat: generalize photoUpload for file attachments on findings (ADR-049)"
```

---

### Task 20: Add file attachment UI to finding comments

**Files:**

- Modify: `packages/ui/src/components/FindingsWindow/FindingComments.tsx` (or equivalent)

- [ ] **Step 1: Add attachment button to comment input**

Add a paperclip icon button next to the comment input field. On click, open a file picker. Validate the selected file. Show thumbnail/icon preview.

- [ ] **Step 2: Wire upload on comment submit**

When a comment is submitted with an attachment, upload the file via the generalized photoUpload pattern, then add the comment with the attachment reference.

- [ ] **Step 3: Display attachments on existing comments**

Show file icon + filename for attached files. Images show thumbnails. Click opens in new tab (OneDrive URL for Team, object URL for Standard).

- [ ] **Step 4: Update `get_finding_attachment` handler**

Update the tool handler from Task 14 to also return non-image attachment metadata.

- [ ] **Step 5: Run tests, commit**

```bash
git add packages/ui/src/components/FindingsWindow/ apps/azure/src/
git commit -m "feat: add file attachment support on finding comments (ADR-049)"
```

---

## Final: Documentation & Cleanup

### Task 21: Run full test suite and commit documentation

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: All ~3,800 tests pass

- [ ] **Step 2: Commit all documentation changes**

The spec, ADR, architecture docs, and evaluation report were written earlier but may not be committed yet.

```bash
git add docs/ CLAUDE.md
git commit -m "docs: ADR-049 Knowledge Catalyst — spec, ADR rewrite, architecture updates"
```

- [ ] **Step 3: Delete old spec from non-archive location**

```bash
git rm docs/superpowers/specs/2026-03-24-coscout-context-and-memory-design.md
git commit -m "chore: remove superseded CoScout context & memory spec (replaced by Knowledge Catalyst)"
```

---

## Verification

After all tasks are complete:

1. **Unit tests**: `pnpm test` — all pass
2. **Type check**: `pnpm build` — no TypeScript errors
3. **Manual verification** (using `claude --chrome` or dev server):
   - Open CoScout, paste an image, verify it appears as thumbnail
   - Send message with image, verify CoScout analyzes it
   - Bookmark a CoScout message, verify SaveInsightDialog opens
   - Save insight as finding, verify it appears in findings list with `coscout` source
   - In INVESTIGATE phase, verify `suggest_save_finding` proposals render as ActionProposalCard
   - Close CoScout after 5+ turns without saving, verify SessionClosePrompt appears
   - (Team) Add file attachment to finding comment, verify upload to SharePoint
