---
title: 'sdd-architectural-findings'
description: '5 architectural drifts surfaced by M0 subagent grounding during SDD migration — known mismatches between canonical docs and actual code.'
purpose: remember
tier: card
status: active
date: 2026-05-28
topic: [memory, project]
related: []
verified-against-commit: ca45f469
last-verified: 2026-05-28
source-hash: 30bd2c371ff12cc8
origin-session-id: d5bc876c-0411-4916-8f0e-6f6a3357eac6
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_sdd_architectural_findings.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# SDD M0 architectural findings (2026-05-18)

These came up while subagents read packages/* and apps/* code to ground L3 stub claims. They are **known mismatches** between canonical docs/agent-context and actual shipped code. Worth carrying into future refactors.

## 1. Stores layer has 9 stores, not 7

**Canonical**: `packages/stores/CLAUDE.md` + ADR-078 table documents **7 stores** (Project, Investigation, Canvas, Viewport, Preferences, Active-IP, View) across 3 layers (Document ×3, Annotation ×3, View ×1).

**Reality**: `packages/stores/src/index.ts` exports **9 stores**, including two not in the canonical table:
- `useProjectMembershipStore` — annotation-per-user (per-project ACL state, persisted to localStorage)
- `useImprovementProjectStore` — Document layer (V1 wedge projects)

**Why**: Both stores were added during wedge V1 work but the canonical 3-layer / 7-store framing in ADR-078 wasn't amended.

**Impact**: Agents reading `packages/stores/CLAUDE.md` get incomplete picture.

**Refactor candidate**: ADR-078 amendment OR new ADR documenting the membership + improvement-project stores as outside-the-canonical-3-layer additions.

## 2. No `packages/sync/` package

**Canonical hint** (e.g., in early SDD inventory + my plan): "sync logic lives in `packages/sync/`."

**Reality**: There is no `packages/sync/` package. ETag concurrency + cloud sync live entirely in `apps/azure/src/services/`:
- `apps/azure/src/services/blobClient.ts` (`updateBlobEvidenceSnapshotsConditional`, `saveProcessHubToCloud`)
- `apps/azure/src/services/cloudSync.ts` (wraps blobClient)
- `apps/azure/src/db/schema.ts` (Dexie-based sync queue)

**Why**: Sync is Azure-tenant-specific in V1 (single SKU). No PWA need to sync (PWA is session-only + .vrs export).

**Impact**: Agents looking for sync code in `packages/` mis-route. The reality is per-call-site discipline in apps/azure/.

**Refactor candidate**: If PWA ever needs sync (post-V1), promote to `packages/sync/`. Until then, keep as-is — extraction without a real PWA need is premature.

## 3. CoScout lives in `packages/core/src/ai/`, not its own package

**Canonical hint**: "CoScout package."

**Reality**: All CoScout code is under `packages/core/src/ai/`:
- `assembleCoScoutPrompt()` — prompt assembly
- `packages/core/src/ai/prompts/coScout/` — prompt templates
- `apps/azure/src/features/ai/useAIOrchestration.ts` + `aiStore.ts` — Azure orchestration
- The 5 V1 response paths (per `project_response_path_system_v1`)
- ADR-080 — Sustainment auto-fire pattern

**Why**: Designed as a core capability (response paths, prompts) shared between PWA and Azure. Azure-specific orchestration lives in apps/azure/.

**Impact**: Naming convention "CoScout package" misleads. The boundary is conceptual, not packaged.

**Refactor candidate**: Extract `packages/coscout/` IF response paths grow significantly OR multi-provider support arrives. Today: stay in core; clarify in `packages/core/CLAUDE.md` that CoScout is a core sub-domain.

## 4. ACL lives in `packages/core/src/projectMembership/`

**Canonical hint**: "ACL in apps/azure/src/services/."

**Reality**:
- `packages/core/src/projectMembership/` — pure-TS `canAccess()`, `ProjectAction` union, `ROLE_PERMISSIONS` table. **In core so PWA can use them too.**
- `packages/stores/src/useProjectMembershipStore.ts` — per-user pending-invitation store (annotation layer per ADR-078)
- `apps/azure/src/auth/easyAuth.ts` — only provides EasyAuthUser identity. EasyAuth's tenant-wide `VariScout.Admin` role is separate from per-project ACLs.

**Why**: Three-way split is intentional. Pure ACL logic (role × action → bool) belongs in core. State (who-is-invited-where) is annotation. Identity provider is app-specific.

**Impact**: Agents need to know all three locations to reason about ACL.

**Refactor candidate**: NONE — split is correctly bounded. Update agent-context docs (`packages/core/CLAUDE.md` should mention projectMembership/ as a sub-domain).

## 5. `GapTrendChart` is actually `CapabilityGapTrendChart` in code

**Doc canonical name**: `GapTrendChart` (used in `docs/03-features/analysis/gap-trend-chart.md` and stubs).

**Code reality**: `packages/charts/src/CapabilityGapTrendChart.tsx` — the `Capability` prefix.

**Why**: Code reflects a tighter semantic (it's specifically the gap-trend-relative-to-Cpk-target chart, not a general gap chart). Docs used a shorter name.

**Impact**: Agents searching code for `GapTrendChart` won't find it; searching for `CapabilityGapTrendChart` won't match docs.

**Refactor candidate** (easy): Rename either the doc title to match code OR rename the component to match doc. Component rename has more blast radius (consumers, tests, snapshots). Doc rename is cheaper. **Recommend: rename doc to `capability-gap-trend-chart.md` + update title.** Naming drift like this is exactly what feature-spec frontmatter `serves:` + intent diagram should prevent going forward.

## Patterns

These findings share a pattern: **canonical docs lag actual code structure**. The drift accumulated because:
- ADR-078 was written when stores were 7; the 2 new stores landed without ADR amendment
- Package boundaries (`packages/sync/`, `packages/coscout/`) were named in plans but never realized
- Component names evolved more granular than doc names

The SDD migration's `implements:` frontmatter + `serves:` cross-refs + `pnpm docs:check` HARD-FAIL discipline should catch this going forward — but the **historical drift remains** until cleaned up.

Related: [[sdd-5-layer-stack-delivered]], [[wedge-v1]]
