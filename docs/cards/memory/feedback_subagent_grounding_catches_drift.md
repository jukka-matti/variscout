---
title: 'subagent-grounding-catches-drift'
description: 'Subagents that read actual code to ground doc claims surface canonical-vs-real drift no top-down audit catches.'
purpose: remember
tier: card
status: active
date: 2026-05-28
topic: [memory, feedback]
related: []
verified-against-commit: ca45f469
last-verified: 2026-05-28
source-hash: 60d47b775b4977b0
origin-session-id: d5bc876c-0411-4916-8f0e-6f6a3357eac6
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_subagent_grounding_catches_drift.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Subagent grounding catches architectural drift

Pattern observed during SDD M0 inventory + L3 stub creation (2026-05-18).

**Rule**: When dispatching subagents to write stubs/specs about shipped capabilities, instruct them to **read the actual source code** (CLAUDE.md + top-level exports + ~2 key files) BEFORE writing. Grounded subagents surface mismatches between canonical docs and reality that no doc-only audit can catch.

**Why**: Canonical docs lag code. Every project accumulates drift between architectural intent (ADRs, CLAUDE.md, plans) and shipped reality (actual file paths, function names, package boundaries). Top-down audits read the docs; the docs are wrong; the audit is wrong.

**How to apply**:
- In any subagent prompt that produces docs about a capability, include: "Glob the relevant code paths first. Read 1-2 key files (~50 lines each). Ground your claim in real function/component names. Cite actual paths."
- The subagent's output should include "deviations from hints" — places where the user's guidance was inaccurate against shipped reality. These ARE the findings.
- Pair with `docs:check` validator's `errorBrokenImplementsPath` / `errorBrokenServesPath` HARD-FAILs to enforce that retrofit work uses real paths.

**Canonical examples from SDD M0**:
- Stub-creation subagent reading `packages/stores/CLAUDE.md` discovered 9 actual stores, not the canonical 7 (per ADR-078)
- Stub-creation subagent for sync discovered no `packages/sync/` exists — sync logic is in `apps/azure/src/services/`
- Stub-creation subagent for CoScout discovered it's under `packages/core/src/ai/`, not its own package
- Stub-creation subagent for GapTrendChart discovered it's actually `CapabilityGapTrendChart` in code

**Counterpattern (avoid)**: Subagents that write docs from a brief alone, without reading code. They produce confident-sounding prose that's structurally wrong. The user then needs to discover the drift later via code review or production bugs.

**Companion**: [[sdd-5-layer-stack-delivered]], [[sdd-architectural-findings]], [[feedback_verify_review_claims_against_code]].
