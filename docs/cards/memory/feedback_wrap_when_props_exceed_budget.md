---
title: 'wrap-when-props-exceed-budget'
description: 'When a component already has ~10+ props and a feature needs 5-7 more, wrap it instead of extending. New wrapper takes the new props + composes original component. Avoids prop-interface bloat AND keeps the original''s tested contract pristine.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 8ae69ffc0b150bbf
origin-session-id: 13d849fb-ae7d-4093-90ea-a9bff40322cf
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_wrap_when_props_exceed_budget.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When you're about to add 5-7 props to a component that already has 10+, stop and consider wrapping instead. A wrapper component takes the new props, internally composes the original with its existing prop shape, and adds the new rendering concern on top. Two benefits: (1) the original component's prop interface stays the size it earned by being widely consumed, and (2) consumers that don't need the new feature don't pay the interface complexity tax.

**When to wrap vs extend:**

- **Extend** if: the new props are conceptually part of the component's existing responsibility, the prop count stays under ~12, OR the wrapper would just be a thin pass-through with no new rendering.
- **Wrap** if: the new props introduce a distinct concern (e.g., a sub-feature like "plans on a hypothesis card"), the prop count crosses ~12, OR the new feature is conditionally rendered (consumer chooses whether to use the wrapper).
- **Bag pattern** (single `featureProps?: SomeFeatureProps` optional prop) as a middle ground: avoids 5 individual optional props at the cost of an "all or nothing" feature flag at the call site. Good for orchestration-layer surfaces like `<WallCanvas>` where consumers opt in to extension features wholesale.

**Concrete: PR-WV1-3b 2026-05-16.** `<HypothesisCard>` already had 13 props (geometry, status, drag handlers, callbacks). MeasurementPlan integration needed 7 more (plans, members, currentUserId, findings, onAddPlan, onLinkFinding, onEditPlan). Task 8's implementer + Strategy review + reviewer all converged on Strategy B: new `<HypothesisCardWithPlans>` wraps `<HypothesisCard>` and renders the plans extension via `foreignObject` below the card. Original HypothesisCard's API stayed pristine; the wrapper is conditionally rendered by `<DraggableHypothesisCard>` based on whether the parent (`<WallCanvas>`) supplied `planningProps`.

**Pre-commit signal for the bag pattern:** when the third optional `*Props` bag arrives at a parent component (e.g., `<WallCanvas planningProps msaProps evidenceProps>`), that's the signal to introduce a generic slot/extension model. Don't let three coexist long-term — log it as an `docs/investigations.md` followup when the second bag lands.

**Counter-signal:** if the wrapping component is doing nothing but passing every original prop through plus one new field, the wrapper is overkill — extend the original instead.

Companion: [[reuse-production-primitives]] (prefer existing primitives over fresh skeletons), [[no-backcompat-clean-architecture]] (required props by default — applies to whichever path you pick).
