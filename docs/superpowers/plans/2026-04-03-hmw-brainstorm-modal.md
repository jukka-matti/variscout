---
title: HMW Brainstorm Modal Implementation Plan
---

# HMW Brainstorm Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated brainstorm modal with HMW prompts, CoScout creative partner mode, and collaborative real-time sessions to the Improvement workspace.

> **Note (Apr 2026):** The brainstorm modal receives SuspectedCause hub context (evidence strength, validation type, Problem Statement fragments) so HMW prompts are grounded in the specific confirmed cause being addressed. See [Investigation Workspace Reframing](../specs/2026-04-03-investigation-workspace-reframing-design.md).

**Architecture:** New BrainstormModal component in `@variscout/ui` sits upstream of the existing IdeaGroupCard evaluate flow. Solo brainstorming works entirely client-side. Collaborative sessions use SSE via 4 new Express endpoints on `server.js` with Blob Storage for session state (Team plan only). CoScout gets a new `spark_brainstorm_ideas` tool and brainstorm coaching prompt section.

**Tech Stack:** React + TypeScript, Tailwind CSS, Express SSE, Azure Blob Storage, Vitest

**Spec:** `docs/superpowers/specs/2026-04-03-hmw-brainstorm-modal-design.md`

---

### Task 1: ADR-061 — HMW Brainstorm & Collaborative Ideation

**Files:**

- Create: `docs/07-decisions/adr-061-hmw-brainstorm-ideation.md`
- Modify: `docs/07-decisions/index.md:74`

- [ ] **Step 1: Create ADR-061**

```markdown
---
title: 'ADR-061: HMW Brainstorm & Collaborative Ideation'
---

# ADR-061: HMW Brainstorm & Collaborative Ideation

## Status

Accepted — 2026-04-03

## Context

The Improvement workspace mixes divergent (brainstorming) and convergent (evaluating) thinking in one view. The Four Ideation Directions (Prevent/Detect/Simplify/Eliminate) exist as a dropdown value and a static hint line, not as a structured creative tool. The documented Four Feasibility Criteria have no UI implementation.

Design thinking research (IDEO, Stanford d.school) shows that separating divergent and convergent phases produces better ideas — mixing them causes self-censorship and premature convergence.

Additionally, Team plan users lack real-time collaboration features for group brainstorming sessions.

## Decision

### 1. Diverge/Converge Separation

Add a dedicated **BrainstormModal** that opens per cause from the IdeaGroupCard header. The modal provides a 2×2 grid of "How Might We" prompts (one per direction) as the creative ideation surface. Ideas are just text — no timeframe, cost, risk, or other evaluation metadata. A Select step (dot-vote) follows, then selected ideas flow to the existing IdeaGroupCard for evaluation and prioritization.

The static "Think: Prevent · Detect · Simplify · Eliminate" hint line is removed.

### 2. SSE-Based Collaborative Sessions (Team Plan)

Collaborative brainstorming uses Server-Sent Events (SSE) via Express endpoints on the existing `server.js`. Session state is stored in a single Blob (auto-expires 24h). This was chosen over WebSocket/SignalR because:

- The data model is append-only text strings (simplest possible sync)
- SSE requires no new infrastructure (Express + Blob Storage already exist)
- No bidirectional stream needed — ideas are POSTed, updates broadcast via SSE

Team members with the same project open auto-detect active sessions via lightweight polling.

### 3. CoScout Dual-Mode Behavior

CoScout operates in two distinct modes during the improvement flow:

- **Brainstorm mode** (in the modal): Creative partner — data-driven sparks, direction nudges, KB analogies. No evaluation metadata. New `spark_brainstorm_ideas` tool.
- **Advisor mode** (in the workspace): Evaluator — suggests timeframe/cost/risk, scale-aware coaching. Existing `suggest_improvement_idea` tool.

### 4. Feasibility as Coaching, Not UI

The Four Feasibility Criteria are delivered through CoScout's scale-aware coaching, not as a checklist UI. This avoids filtering out bold investment-level ideas with lean-biased criteria. The criteria evolve by scale: "Can we do it ourselves?" → "Who sponsors this?" for larger investments.

### 5. Anonymous Voting

Votes during the Select step show anonymous counts only (`⭐ 4`). No voter names or avatars. The server tracks voter IDs to prevent double-voting but never exposes them. This prevents social pressure and ownership bias.

## Consequences

**Positive:**

- Structured creative thinking across all 4 directions per cause
- Clear cognitive mode separation improves idea quality
- First real-time collaboration feature in VariScout
- CoScout becomes more useful as a creative partner, not just a form-filler

**Negative:**

- New server endpoints increase server.js surface area
- SSE connections require connection management and cleanup
- Breaking: removes the static "Four Directions hint" (replaced by the modal)

**Neutral:**

- Existing evaluate → prioritize → track pipeline unchanged
- Solo brainstorm works without server (client-side only)
- Azure Standard gets solo brainstorm; Team gets collaboration

## Definition of Done

- [ ] BrainstormModal renders 2×2 HMW grid on desktop, swipeable tabs on mobile
- [ ] HMW prompts auto-generated from cause name + problem statement
- [ ] Ideas can be added, edited inline, and removed in the modal
- [ ] Select step with ⭐ dot-vote, anonymous counts in collaborative mode
- [ ] Selected ideas flow to IdeaGroupCard with direction pre-set; unselected are "parked"
- [ ] Re-entry: reopening modal shows existing ideas in correct quadrants
- [ ] CoScout `spark_brainstorm_ideas` tool generates ideas with text + direction only
- [ ] CoScout brainstorm coaching section with silence rules
- [ ] Collaborative session: create, join (auto-detect + link), live SSE, vote, close
- [ ] 4 server endpoints: create, idea, stream, active
- [ ] Auto-detect toast for Team plan users with project open
- [ ] Unit tests for `generateHMWPrompts()`, tool definition, hooks
- [ ] Component tests for BrainstormModal, BrainstormQuadrant, VoteButton
- [ ] ADR-061 written with Definition of Done
- [ ] Documentation updated: improvement-workspace.md, investigation-to-action.md, feature-parity.md, CLAUDE.md
```

- [ ] **Step 2: Add entry to ADR index**

In `docs/07-decisions/index.md`, add after line 74 (the ADR-060 row):

```markdown
| [061](adr-061-hmw-brainstorm-ideation.md) | HMW Brainstorm & Collaborative Ideation | Accepted | 2026-04-03 |
```

- [ ] **Step 3: Commit**

```bash
git add docs/07-decisions/adr-061-hmw-brainstorm-ideation.md docs/07-decisions/index.md
git commit -m "$(cat <<'EOF'
docs: ADR-061 — HMW Brainstorm & Collaborative Ideation

Diverge/converge separation, SSE collaboration, CoScout dual-mode,
anonymous voting, feasibility as coaching.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

### Task 2: Core Types — ImprovementIdea + BrainstormIdea + generateHMWPrompts

**Files:**

- Modify: `packages/core/src/findings/types.ts:269` (add fields to ImprovementIdea)
- Create: `packages/core/src/findings/hmwPrompts.ts`
- Modify: `packages/core/src/findings/index.ts:17` (add export)
- Create: `packages/core/src/findings/__tests__/hmwPrompts.test.ts`

- [ ] **Step 1: Write failing test for generateHMWPrompts**

Create `packages/core/src/findings/__tests__/hmwPrompts.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generateHMWPrompts } from '../hmwPrompts';

describe('generateHMWPrompts', () => {
  it('generates 4 HMW prompts from cause name and problem statement', () => {
    const prompts = generateHMWPrompts('Shift (Night)', 'fill weight variation');
    expect(Object.keys(prompts)).toEqual(['prevent', 'detect', 'simplify', 'eliminate']);
    expect(prompts.prevent).toContain('prevent');
    expect(prompts.prevent).toContain('Shift (Night)');
    expect(prompts.prevent).toContain('fill weight variation');
  });

  it('generates generic prompts when no problem statement', () => {
    const prompts = generateHMWPrompts('Machine B');
    expect(prompts.prevent).toContain('prevent');
    expect(prompts.prevent).toContain('Machine B');
    expect(prompts.prevent).not.toContain('undefined');
  });

  it('returns all four IdeaDirection keys', () => {
    const prompts = generateHMWPrompts('Operator');
    expect(prompts).toHaveProperty('prevent');
    expect(prompts).toHaveProperty('detect');
    expect(prompts).toHaveProperty('simplify');
    expect(prompts).toHaveProperty('eliminate');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/core test -- --run hmwPrompts`
Expected: FAIL — module `../hmwPrompts` not found

- [ ] **Step 3: Implement generateHMWPrompts**

Create `packages/core/src/findings/hmwPrompts.ts`:

```typescript
import type { IdeaDirection } from './types';

/**
 * Generate 4 "How Might We" prompts for a suspected cause.
 * Used in the Brainstorm Modal to frame ideation across all 4 directions.
 */
export function generateHMWPrompts(
  causeName: string,
  problemStatement?: string
): Record<IdeaDirection, string> {
  const effect = problemStatement || 'this';
  return {
    prevent: `How might we prevent ${causeName} from causing ${effect}?`,
    detect: `How might we detect ${causeName} problems before they cause defects?`,
    simplify: `How might we simplify the ${causeName} process to reduce variation?`,
    eliminate: `How might we eliminate the ${causeName} dependency entirely?`,
  };
}

/** Client-side brainstorm idea — minimal, no evaluation metadata */
export interface BrainstormIdea {
  id: string;
  text: string;
  direction: IdeaDirection;
  aiGenerated: boolean;
  voteCount: number;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/core test -- --run hmwPrompts`
Expected: PASS — 3 tests

- [ ] **Step 5: Add fields to ImprovementIdea**

In `packages/core/src/findings/types.ts`, add after line 267 (`direction?: IdeaDirection;`):

```typescript
  /** Whether idea was generated by CoScout AI */
  aiGenerated?: boolean;
  /** Anonymous vote count from brainstorm session */
  voteCount?: number;
```

- [ ] **Step 6: Add export to findings barrel**

In `packages/core/src/findings/index.ts`, add after line 17:

```typescript
export { generateHMWPrompts } from './hmwPrompts';
export type { BrainstormIdea } from './hmwPrompts';
```

- [ ] **Step 7: Run all core tests to verify no breakage**

Run: `pnpm --filter @variscout/core test -- --run`
Expected: All existing tests pass

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/findings/types.ts packages/core/src/findings/hmwPrompts.ts packages/core/src/findings/index.ts packages/core/src/findings/__tests__/hmwPrompts.test.ts
git commit -m "$(cat <<'EOF'
feat(core): add generateHMWPrompts + BrainstormIdea type

Adds HMW prompt generation from cause name + problem statement,
BrainstormIdea client type, and aiGenerated/voteCount fields on
ImprovementIdea.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

### Task 3: CoScout — spark_brainstorm_ideas Tool + Coaching Prompts

**Files:**

- Modify: `packages/core/src/ai/prompts/coScout.ts` (add tool + coaching section)
- Modify: `packages/core/src/ai/actionTools.ts:28` (add tool name)
- Modify: `packages/core/src/ai/__tests__/promptTemplates.test.ts` (add tests)

- [ ] **Step 1: Write failing tests for the new tool**

Add to `packages/core/src/ai/__tests__/promptTemplates.test.ts`, after the existing `suggest_improvement_idea` tests (around line 1663):

```typescript
it('includes spark_brainstorm_ideas in IMPROVE phase tools', () => {
  const tools = buildCoScoutTools({ phase: 'improve' });
  const tool = tools.find(t => t.name === 'spark_brainstorm_ideas');
  expect(tool).toBeDefined();
  expect(tool!.parameters.properties).toHaveProperty('question_id');
  expect(tool!.parameters.properties).toHaveProperty('cause_name');
  expect(tool!.parameters.properties.ideas.type).toBe('array');
});

it('does not include spark_brainstorm_ideas in SCOUT phase', () => {
  const tools = buildCoScoutTools({ phase: 'scout' });
  expect(tools.find(t => t.name === 'spark_brainstorm_ideas')).toBeUndefined();
});

it('includes brainstorm coaching when brainstormSessionActive', () => {
  const prompt = buildCoScoutSystemPrompt({ brainstormSessionActive: true });
  expect(prompt).toContain('Brainstorm coaching');
  expect(prompt).toContain('creative partner');
  expect(prompt).not.toContain('suggest timeframe');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/core test -- --run promptTemplates`
Expected: FAIL — spark_brainstorm_ideas not found

- [ ] **Step 3: Add tool name to ActionToolName union**

In `packages/core/src/ai/actionTools.ts`, add `'spark_brainstorm_ideas'` to the `ActionToolName` type after `'suggest_improvement_idea'` (line 28):

```typescript
  | 'suggest_improvement_idea'
  | 'spark_brainstorm_ideas'
```

- [ ] **Step 4: Add spark_brainstorm_ideas tool definition**

In `packages/core/src/ai/prompts/coScout.ts`, in the `buildCoScoutTools` function, add the new tool right after the `suggest_improvement_idea` tool definition (after the closing `}` around line 420):

```typescript
      {
        type: 'function',
        name: 'spark_brainstorm_ideas',
        description:
          'Generate creative improvement ideas for a brainstorm session. Used in the Brainstorm Modal — ideas are text + direction only, no timeframe/cost/risk. Generate 1-2 ideas per empty direction, plus one bold idea. Reference Knowledge Base results when available.',
        parameters: {
          type: 'object',
          properties: {
            question_id: {
              type: 'string',
              description: 'ID of the question (suspected cause) being brainstormed',
            },
            cause_name: {
              type: 'string',
              description: 'Name of the suspected cause for context',
            },
            ideas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: {
                    type: 'string',
                    description: 'Improvement idea description — concise, actionable',
                  },
                  direction: {
                    type: 'string',
                    enum: ['prevent', 'detect', 'simplify', 'eliminate'],
                    description: 'Which HMW direction this idea addresses',
                  },
                },
                required: ['text', 'direction'],
                additionalProperties: false,
              },
              description: 'Array of brainstorm ideas with direction classification',
            },
          },
          required: ['question_id', 'cause_name', 'ideas'],
          additionalProperties: false,
          strict: true,
        },
      },
```

Gate this tool with the same phase check as `suggest_improvement_idea` (investigate + improve phases only).

- [ ] **Step 5: Add brainstorm coaching prompt section**

In `packages/core/src/ai/prompts/coScout.ts`, in the `buildCoScoutSystemPrompt` function, add a conditional section when `options.brainstormSessionActive` is true. Add to the `CoScoutSystemPromptOptions` interface:

```typescript
brainstormSessionActive?: boolean;
```

Add the coaching section in the prompt builder (after the existing improvement idea guidance section):

```typescript
if (options.brainstormSessionActive) {
  sections.push(`
Brainstorm coaching (active brainstorm session):
- You are a creative partner, not a form-filler. Spark thinking, don't generate structured records.
- Use data insights to reframe the cause: compare factor levels, highlight time patterns, surface non-obvious statistical relationships.
- When directions are empty, nudge the team: "You have nothing in Eliminate — what would a permanent fix look like?"
- Draw analogies from Knowledge Base results and domain expertise: "In a similar case, they solved this by..."
- Do NOT suggest timeframe, cost, or risk — that's evaluation, not brainstorming.
- Do NOT evaluate feasibility — that belongs in the workspace.
- Be silent while the team is actively contributing. Speak on pauses, on "Spark more" requests, and when directions need nudging.
- Use spark_brainstorm_ideas tool to propose ideas. Ideas are text + direction only.
`);
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter @variscout/core test -- --run promptTemplates`
Expected: PASS — new tests pass, existing tests still pass

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/ai/prompts/coScout.ts packages/core/src/ai/actionTools.ts packages/core/src/ai/__tests__/promptTemplates.test.ts
git commit -m "$(cat <<'EOF'
feat(core): add spark_brainstorm_ideas tool + brainstorm coaching

New CoScout tool for brainstorm modal — text + direction only, no
evaluation metadata. Brainstorm coaching section activates when
brainstormSessionActive, switching CoScout to creative partner mode.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

### Task 4: useHMWPrompts Hook

**Files:**

- Create: `packages/hooks/src/useHMWPrompts.ts`
- Modify: `packages/hooks/src/index.ts` (add export)
- Create: `packages/hooks/src/__tests__/useHMWPrompts.test.ts`

- [ ] **Step 1: Write failing test**

Create `packages/hooks/src/__tests__/useHMWPrompts.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHMWPrompts } from '../useHMWPrompts';

describe('useHMWPrompts', () => {
  it('returns 4 HMW prompts for a cause with problem statement', () => {
    const { result } = renderHook(() => useHMWPrompts('Shift (Night)', 'fill weight variation'));
    expect(result.current.prevent).toContain('prevent');
    expect(result.current.prevent).toContain('Shift (Night)');
    expect(result.current.detect).toContain('detect');
    expect(result.current.simplify).toContain('simplify');
    expect(result.current.eliminate).toContain('eliminate');
  });

  it('returns stable reference when inputs unchanged', () => {
    const { result, rerender } = renderHook(({ cause, problem }) => useHMWPrompts(cause, problem), {
      initialProps: { cause: 'Shift', problem: 'variation' },
    });
    const first = result.current;
    rerender({ cause: 'Shift', problem: 'variation' });
    expect(result.current).toBe(first);
  });

  it('updates when cause changes', () => {
    const { result, rerender } = renderHook(({ cause }) => useHMWPrompts(cause), {
      initialProps: { cause: 'Machine A' },
    });
    expect(result.current.prevent).toContain('Machine A');
    rerender({ cause: 'Machine B' });
    expect(result.current.prevent).toContain('Machine B');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/hooks test -- --run useHMWPrompts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement useHMWPrompts**

Create `packages/hooks/src/useHMWPrompts.ts`:

```typescript
import { useMemo } from 'react';
import { generateHMWPrompts } from '@variscout/core/findings';
import type { IdeaDirection } from '@variscout/core';

/**
 * Generate 4 HMW prompts for a suspected cause.
 * Memoized — stable reference when inputs unchanged.
 */
export function useHMWPrompts(
  causeName: string,
  problemStatement?: string
): Record<IdeaDirection, string> {
  return useMemo(
    () => generateHMWPrompts(causeName, problemStatement),
    [causeName, problemStatement]
  );
}
```

- [ ] **Step 4: Add export to hooks barrel**

In `packages/hooks/src/index.ts`, add:

```typescript
export { useHMWPrompts } from './useHMWPrompts';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @variscout/hooks test -- --run useHMWPrompts`
Expected: PASS — 3 tests

- [ ] **Step 6: Commit**

```bash
git add packages/hooks/src/useHMWPrompts.ts packages/hooks/src/index.ts packages/hooks/src/__tests__/useHMWPrompts.test.ts
git commit -m "$(cat <<'EOF'
feat(hooks): add useHMWPrompts hook

Memoized wrapper around generateHMWPrompts — stable reference
when cause name and problem statement unchanged.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

### Task 5: BrainstormQuadrant Component

**Files:**

- Create: `packages/ui/src/components/ImprovementPlan/BrainstormQuadrant.tsx`
- Create: `packages/ui/src/components/ImprovementPlan/__tests__/BrainstormQuadrant.test.tsx`

- [ ] **Step 1: Write failing test**

Create `packages/ui/src/components/ImprovementPlan/__tests__/BrainstormQuadrant.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrainstormQuadrant } from '../BrainstormQuadrant';

describe('BrainstormQuadrant', () => {
  const defaultProps = {
    direction: 'prevent' as const,
    hmwPrompt: 'How might we prevent night shift from causing variation?',
    ideas: [
      { id: '1', text: 'Standardize checklist', direction: 'prevent' as const, aiGenerated: true, voteCount: 0 },
    ],
    onAddIdea: vi.fn(),
    onEditIdea: vi.fn(),
    onRemoveIdea: vi.fn(),
  };

  it('renders direction badge and HMW prompt', () => {
    render(<BrainstormQuadrant {...defaultProps} />);
    expect(screen.getByText('Prevent')).toBeInTheDocument();
    expect(screen.getByText(defaultProps.hmwPrompt)).toBeInTheDocument();
  });

  it('renders existing ideas with AI badge', () => {
    render(<BrainstormQuadrant {...defaultProps} />);
    expect(screen.getByText('Standardize checklist')).toBeInTheDocument();
    expect(screen.getByText('✨')).toBeInTheDocument();
  });

  it('calls onAddIdea when typing and pressing Enter', () => {
    render(<BrainstormQuadrant {...defaultProps} />);
    const input = screen.getByPlaceholderText(/type an idea/i);
    fireEvent.change(input, { target: { value: 'New idea' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(defaultProps.onAddIdea).toHaveBeenCalledWith('prevent', 'New idea');
  });

  it('calls onRemoveIdea when ✕ clicked', () => {
    render(<BrainstormQuadrant {...defaultProps} />);
    const removeBtn = screen.getByLabelText(/remove/i);
    fireEvent.click(removeBtn);
    expect(defaultProps.onRemoveIdea).toHaveBeenCalledWith('1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test -- --run BrainstormQuadrant`
Expected: FAIL — module not found

- [ ] **Step 3: Implement BrainstormQuadrant**

Create `packages/ui/src/components/ImprovementPlan/BrainstormQuadrant.tsx`:

```typescript
import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import type { IdeaDirection } from '@variscout/core';
import type { BrainstormIdea } from '@variscout/core/findings';

export interface BrainstormQuadrantProps {
  direction: IdeaDirection;
  hmwPrompt: string;
  ideas: BrainstormIdea[];
  onAddIdea: (direction: IdeaDirection, text: string) => void;
  onEditIdea: (ideaId: string, text: string) => void;
  onRemoveIdea: (ideaId: string) => void;
}

const DIRECTION_STYLES: Record<IdeaDirection, { badge: string; border: string; bg: string }> = {
  prevent: {
    badge: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
    border: 'border-l-purple-500/30',
    bg: 'bg-purple-500/5',
  },
  detect: {
    badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    border: 'border-l-blue-500/30',
    bg: 'bg-blue-500/5',
  },
  simplify: {
    badge: 'bg-green-500/15 text-green-600 dark:text-green-400',
    border: 'border-l-green-500/30',
    bg: 'bg-green-500/5',
  },
  eliminate: {
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    border: 'border-l-amber-500/30',
    bg: 'bg-amber-500/5',
  },
};

const DIRECTION_LABELS: Record<IdeaDirection, string> = {
  prevent: 'Prevent',
  detect: 'Detect',
  simplify: 'Simplify',
  eliminate: 'Eliminate',
};

export const BrainstormQuadrant: React.FC<BrainstormQuadrantProps> = ({
  direction,
  hmwPrompt,
  ideas,
  onAddIdea,
  onEditIdea,
  onRemoveIdea,
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const styles = DIRECTION_STYLES[direction];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onAddIdea(direction, inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 min-h-[120px]">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${styles.badge}`}>
          {DIRECTION_LABELS[direction]}
        </span>
      </div>
      <p className="text-xs text-content/50 italic">{hmwPrompt}</p>

      <div className="flex flex-col gap-1">
        {ideas.map((idea) => (
          <div
            key={idea.id}
            className={`group flex items-start gap-2 text-sm px-2 py-1.5 rounded border-l-2 ${styles.border} ${styles.bg}`}
          >
            <span
              className="flex-1 outline-none"
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const newText = e.currentTarget.textContent?.trim();
                if (newText && newText !== idea.text) {
                  onEditIdea(idea.id, newText);
                }
              }}
            >
              {idea.text}
            </span>
            {idea.aiGenerated && (
              <span className="text-[10px] text-content/30 flex-shrink-0">✨</span>
            )}
            <button
              aria-label="remove"
              onClick={() => onRemoveIdea(idea.id)}
              className="opacity-0 group-hover:opacity-100 text-content/30 hover:text-content/60 flex-shrink-0 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="+ type an idea..."
          className="text-xs text-content/40 italic bg-transparent outline-none px-2 py-1 placeholder:text-content/30"
        />
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @variscout/ui test -- --run BrainstormQuadrant`
Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/ImprovementPlan/BrainstormQuadrant.tsx packages/ui/src/components/ImprovementPlan/__tests__/BrainstormQuadrant.test.tsx
git commit -m "$(cat <<'EOF'
feat(ui): add BrainstormQuadrant component

Single direction section for the brainstorm modal — direction badge,
HMW prompt, idea list with inline edit, add input, remove button.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

### Task 6: VoteButton Component

**Files:**

- Create: `packages/ui/src/components/ImprovementPlan/VoteButton.tsx`
- Create: `packages/ui/src/components/ImprovementPlan/__tests__/VoteButton.test.tsx`

- [ ] **Step 1: Write failing test**

Create `packages/ui/src/components/ImprovementPlan/__tests__/VoteButton.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VoteButton } from '../VoteButton';

describe('VoteButton', () => {
  it('renders vote count', () => {
    render(<VoteButton voteCount={3} votedByMe={false} onToggle={vi.fn()} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows filled star when votedByMe', () => {
    render(<VoteButton voteCount={1} votedByMe={true} onToggle={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<VoteButton voteCount={0} votedByMe={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Implement VoteButton**

Create `packages/ui/src/components/ImprovementPlan/VoteButton.tsx`:

```typescript
import React from 'react';
import { Star } from 'lucide-react';

export interface VoteButtonProps {
  voteCount: number;
  votedByMe: boolean;
  onToggle: () => void;
}

export const VoteButton: React.FC<VoteButtonProps> = ({ voteCount, votedByMe, onToggle }) => (
  <button
    role="button"
    aria-pressed={votedByMe}
    onClick={onToggle}
    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-colors ${
      votedByMe
        ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
        : 'bg-surface-secondary text-content/40 border border-edge hover:border-amber-400/20 hover:text-amber-400/60'
    }`}
  >
    <Star size={12} fill={votedByMe ? 'currentColor' : 'none'} />
    <span className="font-semibold">{voteCount}</span>
  </button>
);
```

- [ ] **Step 3: Run tests and commit**

Run: `pnpm --filter @variscout/ui test -- --run VoteButton`
Expected: PASS — 3 tests

```bash
git add packages/ui/src/components/ImprovementPlan/VoteButton.tsx packages/ui/src/components/ImprovementPlan/__tests__/VoteButton.test.tsx
git commit -m "$(cat <<'EOF'
feat(ui): add VoteButton component

Anonymous star toggle with vote count for brainstorm dot-voting.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

### Task 7: BrainstormModal Component

**Files:**

- Create: `packages/ui/src/components/ImprovementPlan/BrainstormModal.tsx`
- Modify: `packages/ui/src/components/ImprovementPlan/index.ts` (add exports)
- Create: `packages/ui/src/components/ImprovementPlan/__tests__/BrainstormModal.test.tsx`

This is the largest component — contains the 2×2 grid layout, step navigation (brainstorm → select), CoScout insight bar, and session header. Due to plan size constraints, the implementation code is described at component level.

- [ ] **Step 1: Write failing test for BrainstormModal**

Create `packages/ui/src/components/ImprovementPlan/__tests__/BrainstormModal.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrainstormModal } from '../BrainstormModal';
import type { BrainstormIdea } from '@variscout/core/findings';

describe('BrainstormModal', () => {
  const defaultProps = {
    isOpen: true,
    causeName: 'Shift (Night)',
    evidence: { rSquaredAdj: 0.34 },
    hmwPrompts: {
      prevent: 'How might we prevent Shift (Night) from causing variation?',
      detect: 'How might we detect Shift (Night) problems before defects?',
      simplify: 'How might we simplify the Shift (Night) process?',
      eliminate: 'How might we eliminate the Shift (Night) dependency?',
    },
    ideas: [] as BrainstormIdea[],
    onAddIdea: vi.fn(),
    onEditIdea: vi.fn(),
    onRemoveIdea: vi.fn(),
    onSelectIdea: vi.fn(),
    onClose: vi.fn(),
    onDone: vi.fn(),
  };

  it('renders all 4 HMW quadrants when open', () => {
    render(<BrainstormModal {...defaultProps} />);
    expect(screen.getByText('Prevent')).toBeInTheDocument();
    expect(screen.getByText('Detect')).toBeInTheDocument();
    expect(screen.getByText('Simplify')).toBeInTheDocument();
    expect(screen.getByText('Eliminate')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<BrainstormModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Prevent')).not.toBeInTheDocument();
  });

  it('shows cause name and evidence in header', () => {
    render(<BrainstormModal {...defaultProps} />);
    expect(screen.getByText(/Shift \(Night\)/)).toBeInTheDocument();
    expect(screen.getByText(/34%/)).toBeInTheDocument();
  });

  it('transitions to select step when Done clicked', () => {
    const ideas: BrainstormIdea[] = [
      { id: '1', text: 'Test idea', direction: 'prevent', aiGenerated: false, voteCount: 0 },
    ];
    render(<BrainstormModal {...defaultProps} ideas={ideas} />);
    fireEvent.click(screen.getByText(/Done/));
    expect(screen.getByText(/Tap ideas to select/i)).toBeInTheDocument();
  });

  it('calls onDone with selected ideas when Add to plan clicked', () => {
    const ideas: BrainstormIdea[] = [
      { id: '1', text: 'Test idea', direction: 'prevent', aiGenerated: false, voteCount: 0 },
    ];
    render(<BrainstormModal {...defaultProps} ideas={ideas} />);
    // Move to select step
    fireEvent.click(screen.getByText(/Done/));
    // Select the idea
    fireEvent.click(screen.getByText('Test idea'));
    // Add to plan
    fireEvent.click(screen.getByText(/Add.*to plan/));
    expect(defaultProps.onDone).toHaveBeenCalledWith(['1']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @variscout/ui test -- --run BrainstormModal`
Expected: FAIL

- [ ] **Step 3: Implement BrainstormModal**

Create `packages/ui/src/components/ImprovementPlan/BrainstormModal.tsx`. Key structure:

```typescript
import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import type { IdeaDirection } from '@variscout/core';
import type { BrainstormIdea } from '@variscout/core/findings';
import { BrainstormQuadrant } from './BrainstormQuadrant';
import { VoteButton } from './VoteButton';

export interface BrainstormModalProps {
  isOpen: boolean;
  causeName: string;
  evidence?: { rSquaredAdj?: number; etaSquared?: number };
  hmwPrompts: Record<IdeaDirection, string>;
  ideas: BrainstormIdea[];
  onAddIdea: (direction: IdeaDirection, text: string) => void;
  onEditIdea: (ideaId: string, text: string) => void;
  onRemoveIdea: (ideaId: string) => void;
  onSelectIdea?: (ideaId: string) => void;
  onClose: () => void;
  onDone: (selectedIds: string[]) => void;
  onSparkMore?: () => void;
  /** CoScout insight text to display */
  coScoutInsight?: string;
  /** Collaborative session props */
  session?: {
    participantCount: number;
    onInvite?: () => void;
    onCopyLink?: () => void;
  };
  /** Voting props (collaborative mode) */
  voting?: {
    votedByMe: Set<string>;
    onVote: (ideaId: string) => void;
  };
}

type ModalStep = 'brainstorm' | 'select';

export const BrainstormModal: React.FC<BrainstormModalProps> = ({
  isOpen,
  causeName,
  evidence,
  hmwPrompts,
  ideas,
  onAddIdea,
  onEditIdea,
  onRemoveIdea,
  onSelectIdea,
  onClose,
  onDone,
  onSparkMore,
  coScoutInsight,
  session,
  voting,
}) => {
  const [step, setStep] = useState<ModalStep>('brainstorm');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const evidenceText = evidence?.rSquaredAdj != null
    ? `R²adj ${Math.round(evidence.rSquaredAdj * 100)}%`
    : evidence?.etaSquared != null
      ? `η² ${Math.round(evidence.etaSquared * 100)}%`
      : undefined;

  const directions: IdeaDirection[] = ['prevent', 'detect', 'simplify', 'eliminate'];
  const ideasByDirection = (d: IdeaDirection) => ideas.filter(i => i.direction === d);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    onSelectIdea?.(id);
  };

  const handleDone = () => {
    onDone(Array.from(selectedIds));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-surface border border-edge rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
          <div>
            <h2 className="text-sm font-semibold">
              {step === 'brainstorm' ? '💡' : '⭐'} {causeName}
            </h2>
            <p className="text-xs text-content/40">
              {evidenceText && <span>{evidenceText} · </span>}
              {step === 'brainstorm'
                ? 'No judging yet — just ideas'
                : `${ideas.length} ideas — tap the ones worth pursuing`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {session && (
              <button
                onClick={session.onInvite}
                className="text-xs px-3 py-1.5 rounded bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors"
              >
                Invite team
              </button>
            )}
            <button onClick={onClose} className="text-content/30 hover:text-content/60">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 'brainstorm' ? (
            <>
              {/* 2×2 grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-y divide-edge/50">
                {directions.map(d => (
                  <BrainstormQuadrant
                    key={d}
                    direction={d}
                    hmwPrompt={hmwPrompts[d]}
                    ideas={ideasByDirection(d)}
                    onAddIdea={onAddIdea}
                    onEditIdea={onEditIdea}
                    onRemoveIdea={onRemoveIdea}
                  />
                ))}
              </div>

              {/* CoScout insight */}
              {coScoutInsight && (
                <div className="px-4 py-2.5 border-t border-edge bg-blue-500/3">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 flex-shrink-0">
                      <Sparkles size={10} className="inline" /> CoScout
                    </span>
                    <p className="text-xs text-content/70 leading-relaxed">{coScoutInsight}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Select step */
            <div className="p-4 flex flex-col gap-2">
              <p className="text-xs text-content/50 mb-2">Tap ideas to select</p>
              {directions.map(d => {
                const dirIdeas = ideasByDirection(d);
                if (dirIdeas.length === 0) return null;
                return (
                  <div key={d}>
                    <span className={`text-[10px] font-semibold uppercase tracking-wide text-content/40`}>
                      {d}
                    </span>
                    {dirIdeas.map(idea => {
                      const isSelected = selectedIds.has(idea.id);
                      return (
                        <button
                          key={idea.id}
                          onClick={() => toggleSelect(idea.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 text-left transition-colors ${
                            isSelected
                              ? 'bg-amber-400/10 border border-amber-400/20'
                              : 'bg-surface-secondary border border-edge opacity-60 hover:opacity-80'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                            isSelected
                              ? 'bg-amber-400/20 text-amber-400'
                              : 'bg-surface border border-edge text-content/20'
                          }`}>
                            {isSelected ? '⭐' : '○'}
                          </span>
                          <span className="text-sm flex-1">{idea.text}</span>
                          {voting && (
                            <VoteButton
                              voteCount={idea.voteCount}
                              votedByMe={voting.votedByMe.has(idea.id)}
                              onToggle={() => voting.onVote(idea.id)}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-edge">
          <span className="text-xs text-content/50">
            {step === 'brainstorm'
              ? `${ideas.length} ideas · ${directions.filter(d => ideasByDirection(d).length > 0).length} directions`
              : <><span className="text-amber-400 font-semibold">{selectedIds.size}</span> of {ideas.length} selected</>}
          </span>
          <div className="flex gap-2">
            {step === 'brainstorm' ? (
              <>
                {onSparkMore && (
                  <button
                    onClick={onSparkMore}
                    className="text-xs px-3 py-1.5 rounded bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors"
                  >
                    <Sparkles size={12} className="inline mr-1" />
                    Spark more
                  </button>
                )}
                <button
                  onClick={() => setStep('select')}
                  disabled={ideas.length === 0}
                  className="text-xs px-3 py-1.5 rounded bg-blue-500/80 text-white hover:bg-blue-500 disabled:opacity-40 transition-colors font-medium"
                >
                  Done brainstorming →
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setStep('brainstorm')}
                  className="text-xs px-3 py-1.5 rounded bg-surface-secondary text-content/60 hover:text-content transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleDone}
                  disabled={selectedIds.size === 0}
                  className="text-xs px-3 py-1.5 rounded bg-amber-400/80 text-slate-900 hover:bg-amber-400 disabled:opacity-40 transition-colors font-medium"
                >
                  Add {selectedIds.size} to plan →
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Add exports to barrel**

In `packages/ui/src/components/ImprovementPlan/index.ts`, add:

```typescript
export { BrainstormModal } from './BrainstormModal';
export type { BrainstormModalProps } from './BrainstormModal';
export { BrainstormQuadrant } from './BrainstormQuadrant';
export type { BrainstormQuadrantProps } from './BrainstormQuadrant';
export { VoteButton } from './VoteButton';
export type { VoteButtonProps } from './VoteButton';
```

- [ ] **Step 5: Run tests and verify**

Run: `pnpm --filter @variscout/ui test -- --run BrainstormModal`
Expected: PASS — 5 tests

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/ImprovementPlan/BrainstormModal.tsx packages/ui/src/components/ImprovementPlan/__tests__/BrainstormModal.test.tsx packages/ui/src/components/ImprovementPlan/index.ts
git commit -m "$(cat <<'EOF'
feat(ui): add BrainstormModal with 2×2 HMW grid + select step

Full brainstorm modal: 2×2 grid on desktop (1-col on mobile),
brainstorm → select two-step flow, CoScout insight bar, session
header for collaborative mode, anonymous voting support.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

### Task 8: Modify IdeaGroupCard + ImprovementWorkspaceBase

**Files:**

- Modify: `packages/ui/src/components/ImprovementPlan/IdeaGroupCard.tsx`
- Modify: `packages/ui/src/components/ImprovementPlan/ImprovementWorkspaceBase.tsx:179-182`

- [ ] **Step 1: Add "💡 Brainstorm" button to IdeaGroupCard header**

In `packages/ui/src/components/ImprovementPlan/IdeaGroupCard.tsx`, add to the `IdeaGroupCardProps` interface:

```typescript
  /** Open brainstorm modal for this cause */
  onOpenBrainstorm?: (questionId: string) => void;
```

In the card header rendering (find the `<div>` with the cause name), add a button after the evidence badge:

```typescript
{onOpenBrainstorm && (
  <button
    data-testid="brainstorm-trigger"
    onClick={() => onOpenBrainstorm(question.id)}
    className="ml-auto text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors flex-shrink-0"
  >
    💡 Brainstorm
  </button>
)}
```

- [ ] **Step 2: Add ✨ badge for aiGenerated ideas**

In the idea row rendering inside IdeaGroupCard, after the idea text span, add:

```typescript
{idea.aiGenerated && (
  <span className="text-[10px] text-content/30 flex-shrink-0">✨</span>
)}
```

- [ ] **Step 3: Remove Four Directions hint from ImprovementWorkspaceBase**

In `packages/ui/src/components/ImprovementPlan/ImprovementWorkspaceBase.tsx`, replace lines 179-182:

```typescript
      {/* Four Directions hint */}
      <p data-testid="four-directions-hint" className="text-sm italic text-content/50 text-center">
        {t('improve.fourDirections')}
      </p>
```

With nothing (remove the block entirely).

- [ ] **Step 4: Add onOpenBrainstorm prop to ImprovementWorkspaceBase**

Add to `ImprovementWorkspaceBaseProps`:

```typescript
  /** Open brainstorm modal for a cause question */
  onOpenBrainstorm?: (questionId: string) => void;
```

Pass it through to each `IdeaGroupCard`:

```typescript
onOpenBrainstorm = { onOpenBrainstorm };
```

- [ ] **Step 5: Run existing tests to verify no breakage**

Run: `pnpm --filter @variscout/ui test -- --run`
Expected: All existing tests pass (the `four-directions-hint` testid may be used in a test — update if needed)

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/ImprovementPlan/IdeaGroupCard.tsx packages/ui/src/components/ImprovementPlan/ImprovementWorkspaceBase.tsx
git commit -m "$(cat <<'EOF'
feat(ui): add Brainstorm button to IdeaGroupCard, remove hint line

IdeaGroupCard gets a 💡 Brainstorm trigger button and ✨ badge for
AI-generated ideas. Static Four Directions hint removed from
ImprovementWorkspaceBase — replaced by the brainstorm modal.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

### Task 9: Server Endpoints for Collaborative Sessions

**Files:**

- Modify: `apps/azure/server.js` (add 4 endpoints)

- [ ] **Step 1: Add brainstorm session endpoints**

In `apps/azure/server.js`, add after the existing KB endpoints (before the static file serving section). The endpoints use in-memory session storage with Blob Storage backup for persistence:

```javascript
// ─── Brainstorm Sessions (Team plan, SSE-based collaboration) ────────────────

const brainstormSessions = new Map(); // sessionId → session object
const brainstormClients = new Map(); // sessionId → Set<res>

// Create a new brainstorm session
app.post('/api/brainstorm/create', express.json(), (req, res) => {
  const principal = req.headers['x-ms-client-principal'];
  if (!principal && !LOCAL_DEV) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { projectId, questionId, causeName } = req.body;
  if (!projectId || !questionId) {
    return res.status(400).json({ error: 'projectId and questionId required' });
  }
  const sessionId = randomUUID();
  const userId = principal
    ? JSON.parse(Buffer.from(principal, 'base64').toString()).userId || 'local'
    : 'local-dev';
  const session = {
    sessionId,
    projectId,
    questionId,
    causeName: causeName || '',
    createdBy: userId,
    ideas: [],
    phase: 'brainstorm',
    participants: [userId],
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
  brainstormSessions.set(sessionId, session);
  brainstormClients.set(sessionId, new Set());
  res.json({ sessionId, projectId });
});

// Add or update an idea in a session
app.post('/api/brainstorm/idea', express.json(), (req, res) => {
  const { sessionId, id, text, direction, aiGenerated } = req.body;
  const session = brainstormSessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const existing = session.ideas.find(i => i.id === id);
  if (existing) {
    existing.text = text;
  } else {
    session.ideas.push({
      id: id || randomUUID(),
      text,
      direction,
      aiGenerated: aiGenerated || false,
      votes: [],
      voteCount: 0,
    });
  }

  // Broadcast to all SSE clients
  const clients = brainstormClients.get(sessionId);
  if (clients) {
    const event = JSON.stringify({ type: 'idea', idea: session.ideas.at(-1) || existing });
    for (const client of clients) {
      client.write(`data: ${event}\n\n`);
    }
  }
  res.json({ ok: true });
});

// SSE stream for live updates
app.get('/api/brainstorm/stream', (req, res) => {
  const sessionId = req.query.sessionId;
  const session = brainstormSessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send current state
  res.write(`data: ${JSON.stringify({ type: 'init', session })}\n\n`);

  // Add to client set
  const clients = brainstormClients.get(sessionId);
  if (clients) clients.add(res);

  // Add participant
  const principal = req.headers['x-ms-client-principal'];
  if (principal) {
    const userId = JSON.parse(Buffer.from(principal, 'base64').toString()).userId;
    if (userId && !session.participants.includes(userId)) {
      session.participants.push(userId);
    }
  }

  req.on('close', () => {
    if (clients) clients.delete(res);
  });
});

// Check for active session on a project
app.get('/api/brainstorm/active', (req, res) => {
  const projectId = req.query.projectId;
  const now = Date.now();
  for (const [, session] of brainstormSessions) {
    if (session.projectId === projectId && session.expiresAt > now) {
      return res.json({
        sessionId: session.sessionId,
        causeName: session.causeName,
        participantCount: session.participants.length,
        phase: session.phase,
      });
    }
  }
  res.json(null);
});

// Cleanup expired sessions periodically
setInterval(
  () => {
    const now = Date.now();
    for (const [id, session] of brainstormSessions) {
      if (session.expiresAt < now) {
        brainstormSessions.delete(id);
        brainstormClients.delete(id);
      }
    }
  },
  60 * 60 * 1000
); // Every hour
```

- [ ] **Step 2: Run the server to verify endpoints respond**

Run: `cd apps/azure && LOCAL_DEV=1 node server.js &`
Then test: `curl -X POST http://localhost:8080/api/brainstorm/create -H 'Content-Type: application/json' -d '{"projectId":"test","questionId":"q1"}' && kill %1`
Expected: JSON response with `sessionId`

- [ ] **Step 3: Commit**

```bash
git add apps/azure/server.js
git commit -m "$(cat <<'EOF'
feat(azure): add brainstorm session endpoints (create/idea/stream/active)

4 new Express endpoints for collaborative brainstorm sessions:
- POST /api/brainstorm/create — create session
- POST /api/brainstorm/idea — add/update idea + SSE broadcast
- GET /api/brainstorm/stream — SSE event stream
- GET /api/brainstorm/active — check for active session

In-memory session storage with 24h TTL auto-cleanup.
Team plan only (EasyAuth required).

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

### Task 10: Documentation Updates

**Files:**

- Modify: `docs/03-features/workflows/improvement-workspace.md`
- Modify: `docs/03-features/workflows/investigation-to-action.md`
- Modify: `docs/08-products/feature-parity.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update improvement-workspace.md**

Add a new section after "## Context Panel" (before "## Plan View"):

```markdown
## Brainstorm Modal

The brainstorm modal opens per cause from the "💡 Brainstorm" button in the IdeaGroupCard header. It also auto-opens on first workspace entry if a cause has no ideas.

### Three-Beat Flow

1. **Brainstorm** — 2×2 grid of HMW prompts (desktop) or swipeable tabs (mobile). Ideas are text only — no evaluation metadata. CoScout acts as a creative partner with data-driven sparks, direction nudges, and KB analogies.
2. **Select** — Dot-vote on which ideas to pursue. Anonymous vote counts in collaborative mode. No voter names.
3. **Evaluate** — Selected ideas flow to IdeaGroupCard with direction pre-set. Unselected ideas are "parked" (dimmed, promotable later).

See [HMW Brainstorm Modal Design](../../superpowers/specs/2026-04-03-hmw-brainstorm-modal-design.md) for the full spec.

### Collaborative Sessions (Team Plan)

Team plan users can invite colleagues to brainstorm together in real-time. Ideas appear on all screens via SSE. Team members with the same project open auto-detect active sessions via toast notification.

See [ADR-061](../../07-decisions/adr-061-hmw-brainstorm-ideation.md) for architectural decisions.
```

- [ ] **Step 2: Update investigation-to-action.md**

In the "Improvement Ideation Methodology" section (around line 268), add a note after the Four Directions table:

```markdown
> **UI implementation:** The Four Ideation Directions are presented as structured HMW ("How Might We") prompts in the Brainstorm Modal, not as a dropdown. Each cause gets 4 auto-generated HMW questions. See [Improvement Workspace](improvement-workspace.md#brainstorm-modal).
```

- [ ] **Step 3: Update feature-parity.md**

Add a row to the feature comparison table:

```markdown
| Brainstorm modal (HMW) | — | Solo brainstorm + CoScout | Solo + collaborative sessions |
```

- [ ] **Step 4: Update CLAUDE.md task-to-doc mapping**

Add to the Improvement Hub row in the Task → Documentation table:

```markdown
| Brainstorm / HMW Ideation | adr-061, docs/superpowers/specs/2026-04-03-hmw-brainstorm-modal-design.md, packages/ui/src/components/ImprovementPlan/BrainstormModal.tsx |
```

- [ ] **Step 5: Commit**

```bash
git add docs/03-features/workflows/improvement-workspace.md docs/03-features/workflows/investigation-to-action.md docs/08-products/feature-parity.md CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: update improvement workspace, feature-parity for HMW brainstorm

Add brainstorm modal section to improvement-workspace.md, HMW note
to investigation-to-action.md, feature-parity row, and CLAUDE.md
task-to-doc mapping.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

### Task 11: i18n Keys

**Files:**

- Modify: `packages/core/src/i18n/messages/en.ts` (add keys)

- [ ] **Step 1: Add brainstorm i18n keys to English catalog**

In `packages/core/src/i18n/messages/en.ts`, add after the existing `improve.*` keys (around line 632):

```typescript
  // Brainstorm modal
  'brainstorm.title': 'Brainstorm',
  'brainstorm.subtitle': 'No judging yet — just ideas',
  'brainstorm.selectSubtitle': 'Tap ideas to select',
  'brainstorm.inputPlaceholder': '+ type an idea...',
  'brainstorm.doneBrainstorming': 'Done brainstorming →',
  'brainstorm.addToPlan': 'Add {count} to plan →',
  'brainstorm.back': '← Back',
  'brainstorm.sparkMore': 'Spark more',
  'brainstorm.inviteTeam': 'Invite team',
  'brainstorm.copyLink': 'Copy link',
  'brainstorm.ideaCount': '{count} ideas · {directions} directions',
  'brainstorm.selectedCount': '{selected} of {total} selected',
  'brainstorm.parkedLabel': 'Parked ideas',
  'brainstorm.triggerButton': 'Brainstorm',
  'brainstorm.joinToast.title': 'Brainstorm session started',
  'brainstorm.joinToast.body': '{name} started brainstorming ideas for {cause}',
  'brainstorm.joinToast.join': 'Join session',
  'brainstorm.joinToast.later': 'Later',
```

- [ ] **Step 2: Run core tests**

Run: `pnpm --filter @variscout/core test -- --run`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/i18n/messages/en.ts
git commit -m "$(cat <<'EOF'
feat(i18n): add brainstorm modal translation keys

English catalog keys for brainstorm modal, select step, session
management, and join toast notifications.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Post-Implementation

After all tasks are complete:

1. Run full test suite: `pnpm test`
2. Run type check: `pnpm -r build` (catches type errors across packages)
3. Visual verification with `claude --chrome` — open Improvement workspace, test brainstorm flow
4. Run `bash scripts/check-doc-health.sh` for documentation consistency
