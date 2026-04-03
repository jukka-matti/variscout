---
title: HMW Brainstorm Modal + Collaborative Sessions
audience: [analyst, engineer]
category: workflow
status: draft
related: [improvement, brainstorm, hmw, coscout, collaboration, ideation]
---

# HMW Brainstorm Modal + Collaborative Sessions

A dedicated creative brainstorming space for the Improvement workspace that structures ideation around four "How Might We" directions, with CoScout as a creative partner and optional real-time collaborative sessions for Team plan users.

## Problem

The current Improvement workspace shows a static hint line ("Think: Prevent · Detect · Simplify · Eliminate") and a generic "Add idea" input. This mixes divergent thinking (brainstorming) with convergent thinking (evaluating timeframe, cost, risk) in the same view, which suppresses creativity. The Four Ideation Directions documented in the methodology are underutilized — they're a dropdown value, not a thinking tool.

Additionally, the documented Four Feasibility Criteria (Removes root cause? Can we do it ourselves? Can we try small? Can we measure it?) are not implemented in the UI at all.

## Design Principles

1. **Separate diverge from converge** — brainstorming (creative, generative) and evaluation (analytical, judgmental) happen in distinct spaces with a clear transition between them.
2. **HMW questions are the thinking tool** — not a label, but a structured creative prompt that frames ideation from four angles per cause.
3. **CoScout is a creative partner, not a form-filler** — it sparks thinking with data insights and analogies, not structured idea records.
4. **Ideas belong to the group** — no authorship attribution, anonymous voting. Only CoScout-generated ideas are marked (✨).
5. **Feasibility is coaching, not a gate** — scale-aware guidance from CoScout in the workspace, not a checklist that filters out bold ideas.
6. **The existing evaluate → prioritize → track pipeline is preserved** — this design adds a creative layer upstream, not a redesign.

## Three-Beat Flow

```
BRAINSTORM (modal)  →  SELECT (modal)  →  EVALUATE (workspace)
──────────────────     ───────────────     ───────────────────
2×2 HMW grid            Dot-vote            IdeaGroupCard
Just ideas + text       "I'll focus on      Timeframe, cost, risk
CoScout sparks          these"              Prioritization matrix
"Yes, and..."           Anonymous votes     What-If projection
No judgment             Team counts         Convert → Actions
```

## Brainstorm Modal — Layout

### Trigger

- "💡 Brainstorm" button in IdeaGroupCard header (one per cause)
- Auto-opens on first Improvement workspace entry if a cause has no ideas

### Desktop (≥640px): 2×2 Grid

```
┌─── Modal Header ─────────────────────────────────────────┐
│ 💡 Brainstorm: Shift (Night)  R²adj 34%    [Invite team] │
├──────────────────────────┬────────────────────────────────┤
│ Prevent                  │ Detect                         │
│ HMW prevent night shift  │ HMW detect night shift         │
│ from causing variation?  │ problems before defects?        │
│                          │                                │
│ • Standardize checklist  │ • Weight check first 10 units  │
│ • Warm-up calibration ✨ │ + type an idea...              │
│ + type an idea...        │                                │
├──────────────────────────┼────────────────────────────────┤
│ Simplify                 │ Eliminate                      │
│ HMW simplify night shift │ HMW eliminate the night shift  │
│ to reduce variation?     │ dependency entirely?            │
│                          │                                │
│ + type an idea...        │ • Automate filling ✨          │
│                          │ + type an idea...              │
├──────────────────────────┴────────────────────────────────┤
│ ✨ CoScout: "σ drops 0.45→0.18 after 30min — setup issue" │
├───────────────────────────────────────────────────────────┤
│ 5 ideas · 4 directions      [✨ Spark more] [Done →]     │
└───────────────────────────────────────────────────────────┘
```

### Mobile (<640px): Swipeable Tabs

The modal opens as a full-screen bottom sheet (consistent with What-If mobile pattern). The 2×2 grid becomes horizontal tabs — one direction visible at a time, swipeable. Each tab shows its idea count as a badge. CoScout insight collapses to a one-liner with tap-to-expand.

### HMW Question Generation

Auto-generated from cause name + problem statement. Pure function in `@variscout/core`:

```typescript
function generateHMWPrompts(
  causeName: string,
  problemStatement?: string
): Record<IdeaDirection, string>;
```

Template per direction:

- Prevent: "How might we prevent [cause] from causing [problem]?"
- Detect: "How might we detect [cause] problems before they cause defects?"
- Simplify: "How might we simplify the [cause] process to reduce variation?"
- Eliminate: "How might we eliminate the [cause] dependency entirely?"

When `problemStatement` is not available, falls back to generic: "How might we [verb] this?"

### Idea Interactions in the Modal

- **Add:** Type in the "+" input under each HMW direction. Direction auto-assigned from the quadrant.
- **Refine:** Tap any existing idea text to edit inline. Ideas are living post-its — the group shapes them through conversation.
- **Remove:** ✕ button or swipe (if an idea was a dead end).
- **No:** comments, authorship, edit history, metadata. All refinement happens after ideas enter the workspace.
- ✨ marks CoScout-generated ideas — the only annotation.

## Select Step (Dot-Vote)

After the analyst (or team) clicks "Done brainstorming →", the modal transitions to the Select step.

### Layout

All ideas shown in a flat list grouped by direction badges. Each idea has a ⭐ toggle — tap to select, tap again to deselect.

### Voting in Collaborative Mode

In a collaborative session, each participant's votes are independent. Only the **anonymous count** is shown (`⭐ 4`). No voter names, no avatars on votes. The server tracks voter IDs internally to prevent double-voting but never exposes them to the UI.

This prevents social pressure (voting for the boss's idea) and keeps the focus on idea quality.

### Exit

"Add N ideas to plan →" closes the modal. Selected ideas flow to the IdeaGroupCard with direction pre-set. Unselected ideas are kept as "parked" — dimmed at the bottom of the card, promotable later.

### Re-entry

The analyst can reopen the brainstorm modal from the IdeaGroupCard header at any time. Existing ideas appear in their quadrants. New ideas can be added. Already-selected ideas show their ⭐ state.

## CoScout as Creative Partner

### Three Creative Modes

**1. Data-Driven Sparks** — CoScout reads the analysis context (already available via `buildAIContext`) and surfaces non-obvious insights reframed as creative prompts. Example: "Your σ drops from 0.45 to 0.18 after the first 30 minutes — that's a setup problem, not a skill problem. Ideas in Prevent should target the startup window."

**2. Direction Nudges** — When quadrants are empty or ideas cluster in one direction, CoScout pushes thinking to unexplored angles. Example: "You have nothing in Eliminate — what would a permanent fix look like, even if it takes months?"

**3. Knowledge-Powered Analogies** — Draws from the Knowledge Base (past investigations that resolved similar causes) and domain knowledge. Example: "In Sachet Line 3, a similar shift pattern was fixed by locking machine parameters at handover — Cpk 0.71 → 1.38."

### Silence Rules

| Phase                   | CoScout behavior                                                            |
| ----------------------- | --------------------------------------------------------------------------- |
| Modal opens             | One opening insight based on data context                                   |
| Team is typing          | **Silent.** Don't interrupt creative momentum.                              |
| Idle pause (>30s)       | Direction nudge or data-driven spark                                        |
| "✨ Spark more" clicked | Generate ideas for empty directions + one bold idea + KB reference          |
| Select phase            | **Silent.** Selection is human judgment.                                    |
| Workspace (after modal) | Switches to advisor mode — scale-aware coaching, timeframe/cost suggestions |

### New Tool

`spark_brainstorm_ideas` — looser structure than `suggest_improvement_idea`. Returns `{ ideas: Array<{ text: string; direction: IdeaDirection }> }`. No timeframe, no cost, no risk. Multiple ideas at once. Used only in brainstorm context.

The existing `suggest_improvement_idea` tool remains unchanged for the workspace evaluate phase.

### Prompt Changes

New brainstorm coaching section in `buildCoScoutSystemPrompt`, activated when `context.brainstormSessionActive === true`:

- Reframe data insights as creative prompts, not analytical conclusions
- Surface factor comparisons that suggest specific improvement angles (e.g., "Shift A achieves Cpk 1.42 — what do they do differently?")
- When KB has matches, present as analogies ("In a similar case, they solved this by...")
- Do NOT suggest timeframe/cost/risk — that's evaluation, not brainstorming
- Do NOT evaluate feasibility — that belongs in the workspace

## Collaborative Brainstorm Sessions (Team Plan Only)

### Creating a Session

Lead opens the brainstorm modal (solo), then clicks "Invite team" in the session header. Creates a session via `POST /api/brainstorm/create`.

### Joining — Auto-Detect

Team plan users with any project open get polled every 30s via `GET /api/brainstorm/active?projectId=X`. If a session exists, a toast notification appears:

> "💡 Jukka-Matti started brainstorming ideas for **Shift (Night)**."
> [Join session] [Later]

One click to join — no link needed.

For users on a different project: toast appears with the project name. Clicking "Join" switches to that project and opens the modal.

### Joining — Link Fallback

For team members who don't have the app open. Lead clicks "Copy link" → shares via chat/email. Link opens the project in the app and auto-joins the session.

### Live Collaboration

- Ideas posted via `POST /api/brainstorm/idea`, broadcast to all via SSE (`GET /api/brainstorm/stream`)
- No authorship shown — ideas appear anonymously (only ✨ for CoScout)
- "Typing..." indicator shows activity without revealing who
- Participant count shown in session header (not individual avatars during brainstorm)
- Ideas are editable by anyone during the brainstorm phase — living post-its
- CoScout speaks to the whole group — one voice, shared creative partner

### Technical Architecture

**What we're syncing:** An append-only list of text strings, each with a direction. No edits to sync (in-place edits are last-write-wins on the server blob), no ordering conflicts. The simplest possible real-time data model.

**4 new Express endpoints** on existing `apps/azure/server.js`:

| Endpoint                 | Method | Purpose                                          |
| ------------------------ | ------ | ------------------------------------------------ |
| `/api/brainstorm/create` | POST   | Create session in Blob Storage, return sessionId |
| `/api/brainstorm/idea`   | POST   | Append/update idea, broadcast via SSE            |
| `/api/brainstorm/stream` | GET    | SSE event stream (ideas, votes, phase changes)   |
| `/api/brainstorm/active` | GET    | Check if active session for projectId            |

**Storage:** Session state in a single Blob per session. Auto-expires after 24h (Blob lifecycle policy or server-side TTL check).

**Auth:** EasyAuth — all participants must be authenticated. No anonymous access.

**No new infrastructure:** Express + SSE + existing Blob Storage. No WebSocket, no SignalR, no new Azure resources.

### Session Lifecycle

1. Lead creates session → sessionId + shareable URL
2. Team joins (auto-detect toast or link)
3. Brainstorm phase: everyone adds/edits ideas, CoScout sparks
4. Lead clicks "Move to voting →" → phase switches to `vote`
5. Vote phase: everyone taps ⭐, anonymous counts broadcast
6. Lead clicks "Add N ideas to plan →" → session closes
7. Selected ideas merge into the project (saved to ImprovementIdea on the lead's project)
8. Session blob auto-expires after 24h

## Data Model

### Changes to Existing Types

`ImprovementIdea` in `@variscout/core/types` — two new optional fields:

```typescript
// Added to existing ImprovementIdea interface
aiGenerated?: boolean;   // Show ✨ badge (CoScout-generated)
voteCount?: number;      // Anonymous vote count from brainstorm session
```

### New Types

```typescript
// Server-side only — not persisted in project state
interface BrainstormSession {
  sessionId: string;
  projectId: string;
  questionId: string; // Which cause
  createdBy: string; // userId of lead
  ideas: BrainstormIdea[];
  phase: 'brainstorm' | 'vote';
  voterIds: Set<string>; // Track who voted (prevent double-vote)
  participants: string[]; // userId list
  createdAt: number;
  expiresAt: number; // 24h TTL
}

interface BrainstormIdea {
  id: string;
  text: string;
  direction: IdeaDirection;
  aiGenerated: boolean;
  votes: string[]; // userId list (server-side, never sent to client)
  voteCount: number; // Sent to client (anonymous)
}
```

## UI Components

### New Components

| Component              | Package         | Purpose                                                                           |
| ---------------------- | --------------- | --------------------------------------------------------------------------------- |
| `BrainstormModal`      | `@variscout/ui` | Full-screen modal: 2×2 HMW grid (desktop) / swipeable tabs (mobile) + select step |
| `BrainstormQuadrant`   | `@variscout/ui` | Single direction section: badge, HMW text, idea list, inline edit, add input      |
| `BrainstormSessionBar` | `@variscout/ui` | Session header: participant count, "Invite team" / "Copy link", phase indicator   |
| `VoteButton`           | `@variscout/ui` | ⭐ toggle with anonymous count                                                    |

### Modified Components

| Component                  | Change                                                                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `IdeaGroupCard`            | Add "💡 Brainstorm" button in card header. Show ✨ badge for `aiGenerated` ideas. Show dimmed "parked" section for unselected brainstorm ideas. |
| `ImprovementWorkspaceBase` | Remove static `improve.fourDirections` hint line (line 180). Add `onOpenBrainstorm` callback prop.                                              |

### New Hooks

| Hook                   | Package            | Purpose                                                                                       |
| ---------------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| `useBrainstormSession` | `@variscout/hooks` | Session lifecycle: create, join, add idea, edit idea, vote, close. SSE connection management. |
| `useBrainstormDetect`  | `@variscout/hooks` | Polls `/api/brainstorm/active` every 30s (Team plan only). Shows join toast.                  |
| `useHMWPrompts`        | `@variscout/hooks` | Calls `generateHMWPrompts()` from cause + problem statement.                                  |

## What Stays the Same

The entire existing evaluate → prioritize → track pipeline is **unchanged**:

- PrioritizationMatrix (4 presets, cause colors, ghost dots, bidirectional navigation)
- IdeaGroupCard evaluation UI (timeframe, cost, risk, direction dropdowns, What-If projection)
- ImprovementContextPanel
- ImprovementSummaryBar (Convert → Actions button)
- RiskPopover (3×3 RDMAIC matrix)
- CauseSummaryCards (mobile)
- TrackView (PlanRecap, ActionTrackerSection, VerificationSection, OutcomeSection)
- What-If Simulator integration

## Feasibility Criteria

The documented Four Feasibility Criteria (Removes root cause? Can we do it ourselves? Can we try small? Can we measure it?) are **not implemented as a UI element**. Instead:

- CoScout's improvement coaching already includes feasibility assessment in its prompts
- For "just do" / "days" ideas, the lean criteria apply naturally
- For "weeks" / "months" ideas, CoScout adapts its coaching to scale — suggesting sponsors, piloting, business case considerations
- The criteria evolve by scale: "Can we do it ourselves?" → "Who sponsors this?" / "Can we try small?" → "Can we prove the concept?"

This is conversational guidance, not a checklist — avoiding the trap of filtering out bold investment-level ideas with lean-biased criteria.

## Platform Availability

| Feature                  | PWA | Azure Standard | Azure Team |
| ------------------------ | --- | -------------- | ---------- |
| Brainstorm modal (solo)  | —   | ✅             | ✅         |
| HMW prompts              | —   | ✅             | ✅         |
| CoScout creative partner | —   | ✅             | ✅         |
| Select (dot-vote, solo)  | —   | ✅             | ✅         |
| Collaborative sessions   | —   | —              | ✅         |
| Anonymous voting         | —   | —              | ✅         |
| Auto-detect join toast   | —   | —              | ✅         |

The Improvement workspace is Azure-only (Standard and Team). Collaborative features are Team plan only, consistent with all other collaboration features.

## Verification

1. **Solo brainstorm:** Open Improvement workspace → click "💡 Brainstorm" on a cause → 4 HMW prompts appear → add ideas in each quadrant → click "Done" → select ideas → "Add to plan" → ideas appear in IdeaGroupCard with correct direction badges
2. **CoScout sparks:** Open brainstorm → verify CoScout offers one data-driven insight on open → wait 30s idle → verify direction nudge for empty quadrants → click "Spark more" → verify ideas generated
3. **Re-entry:** Add ideas in brainstorm → close → reopen → verify existing ideas appear in correct quadrants
4. **Mobile:** Open brainstorm on <640px → verify swipeable tabs → verify idea input works → verify select step works
5. **Collaborative (Team):** User A creates session → User B with same project open receives toast → User B clicks Join → both see same ideas → User A adds idea → appears on User B's screen → move to vote → both vote → close → ideas in project
6. **Parked ideas:** Brainstorm 6 ideas → select 3 → add to plan → verify 3 are active in IdeaGroupCard, 3 are dimmed as "parked"

## Related

- [Improvement Workspace](../../03-features/workflows/improvement-workspace.md) — the existing workspace this integrates with
- [Improvement Prioritization](../../03-features/workflows/improvement-prioritization.md) — evaluate dimensions and matrix
- [Investigation to Action](../../03-features/workflows/investigation-to-action.md) — Four Directions methodology, feasibility criteria
- [ADR-035](../../07-decisions/adr-035-improvement-prioritization.md) — prioritization decision record
- [Improvement Hub Design](2026-04-02-improvement-hub-design.md) — full workspace layout spec
