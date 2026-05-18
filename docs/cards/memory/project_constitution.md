---
title: 'VariScout Constitution'
description: '10 non-negotiable principles (3+4+3) governing product, methodology, and architecture decisions. Revised Apr 2026. Terminology enforced across all docs.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 5066d6a3096e69fd
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_constitution.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Constitution at `docs/01-vision/constitution.md`, condensed summary in CLAUDE.md (6 of 10).

**Why:** Previous constitution was too code-focused. Missing fundamental product principles (journey, data sovereignty, collaboration). Revised based on GitHub Spec Kit best practices.

**How to apply:** Constitution is the gate for every architectural decision. If a proposed feature conflicts with a principle, the principle wins.

## 10 Principles (3+4+3)

**Product Identity:**
1. Journey-driven variation analysis — FRAME→SCOUT→INVESTIGATE→IMPROVE
2. Same analysis everywhere, AI optional — PWA=Azure analytical power; CoScout adds depth
3. Customer-owned data — browser processing; data stays in customer's Azure tenant

**Methodology:**
4. Four Lenses simultaneously — linked filtering, analyst's eye integrates
5. Question-first investigation (Turtiainen 2019) — questions before theories, multiple suspected causes
6. Progressive stratification — η²/R²adj guided, anchored to Total
7. Three evidence types — data (auto), gemba (go-see + photos), expert; tasks through Teams

**Architecture:**
8. Deterministic first, AI enhances — statistical engine is authority, analyst confirms
9. Shared packages, props-based — dependencies flow downward
10. Strategy pattern for modes — resolveMode() + getStrategy() sole source of truth

## Key Decisions (Apr 2026)

- "Guided frustration" is valid as PEDAGOGICAL concept (Sock Mystery teaching methodology) but NOT as product positioning for PWA
- "Knowledge compounds" (H9) NOT in constitution — unvalidated hypothesis
- Dev conventions live in `.claude/rules/documentation.md`, not constitution
- Terminology defined by ADRs must be enforced everywhere (see feedback_terminology_consistency.md)
