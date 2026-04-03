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

Votes during the Select step show anonymous counts only. No voter names or avatars. The server tracks voter IDs to prevent double-voting but never exposes them. This prevents social pressure and ownership bias.

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
- [ ] Select step with dot-vote, anonymous counts in collaborative mode
- [ ] Selected ideas flow to IdeaGroupCard with direction pre-set; unselected are "parked"
- [ ] Re-entry: reopening modal shows existing ideas in correct quadrants
- [ ] CoScout `spark_brainstorm_ideas` tool generates ideas with text + direction only
- [ ] CoScout brainstorm coaching section with silence rules
- [ ] Collaborative session: create, join (auto-detect + link), live SSE, vote, close
- [ ] 4 server endpoints: create, idea, stream, active
- [ ] Auto-detect toast for Team plan users with project open
- [ ] Unit tests for `generateHMWPrompts()`, tool definition, hooks
- [ ] Component tests for BrainstormModal, BrainstormQuadrant, VoteButton
- [ ] Documentation updated: improvement-workspace.md, investigation-to-action.md, feature-parity.md, CLAUDE.md
