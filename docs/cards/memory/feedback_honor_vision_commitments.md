---
title: 'Honor vision-spec commitments; don''t hedge or amend at implementation time'
description: 'When a brainstorm offers forks between (1) honor the vision verbatim, (2) hybrid/escape-hatch, (3) status-quo + amend the spec — for a world-class product, default to (1). Hedging multiplies mental models; amending after-the-fact admits the spec was aspirational rather than load-bearing.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 906cccde-0cd3-4d5a-bbda-f82a5855e4cc
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_honor_vision_commitments.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When implementation brainstorms surface multiple forks for a vision-spec commitment, **default to honoring the commitment verbatim**. Hedging or amending the spec at implementation time is a smell — it usually means the implementer is shaping product intent around current implementation friction, not around the user's experience of the finished product.

**Why:** in VariScout's PR8 sub-PR 8e brainstorm (Wall mirror in canvas overlay), three forks were on the table:

1. **Embedded Wall viewport** — render `WallCanvas` inline as canvas overlay layer (honors vision §5.6 verbatim: *"Same data, two views"*)
2. **Hybrid** — keep current badge-projection + add "expand to Wall view" button (mid-fidelity escape hatch)
3. **Status-quo + spec amendment** — accept current badge-projection as V1 dual-home; amend §5.6 wording

User direction (2026-05-08): pick (1). Reasoning that generalizes:

- Hedging (fork 2) **multiplies mental models** — "the badges are a summary; click expand for the real Wall." Two paradigms for the same data is the opposite of "same data, two views." Best products collapse mental models, they don't multiply them.
- Status-quo amendment (fork 3) **demotes the vision-spec from product-positioning to aspirational** — admitting after-the-fact that the commitment was decorative undermines every other vision-spec claim future readers encounter.
- Verbatim honoring (fork 1) **preserves the product's competitive position** — vision specs are written because something distinctive emerged from the design; that distinctiveness IS the product moat against tools that fragment the same surfaces.

**How to apply:**

1. **When brainstorming a fork-decision around a vision-spec commitment, frame the question explicitly: "Does this honor the commitment, or amend it?"** Make the framing visible to the user — they may not realize a "scope question" is also a "do we still believe this?" question.
2. **Verify the commitment is technically achievable before defaulting to it.** Honor-verbatim only beats hedge if the implementation is feasible at world-class quality. Audit existing infrastructure (components, hooks, store boundaries) — often "ambitious commitments" are smaller post-prior-work than they look. PR8 8e example: `WallCanvas` already exists; 8d shipped overlay infrastructure; F4 layered state means store assignment is mechanical. The "embedded Wall" fork shrunk from ~6 tasks to "compose existing pieces" once those enablers were verified.
3. **If honor-verbatim is genuinely infeasible at world-class quality, amend the spec FIRST in a separate amendment commit, not via implementation hedging.** A spec amendment is a deliberate product decision; an implementation hedge is silent drift.
4. **Use V1 scope splits to make commitments achievable, not to dilute them.** "Embedded Wall (read-only V1) → write-capable V2" honors §5.6 ("same data, two views") with V1; "Hybrid (badges + escape hatch)" hedges §5.6 permanently. The split shape matters — V1/V2 ladder beats two-paradigm coexistence.

**Counter-case:** when a vision-spec commitment IS demonstrably wrong (e.g., methodology mistake — see `feedback_verify_methodology_before_gating`), amend the spec. The rule is "honor what's load-bearing"; methodology mistakes aren't load-bearing, they're errors.

**Generalizes to:** any product surface where vision specs (written deliberately by a product owner) collide with implementation forks. Particularly load-bearing for products that compete on UX coherence (Linear, Figma, Notion, Stripe Dashboard) — their vision-spec commitments ARE the moat.

**See also:** `feedback_full_vision_spec` (don't V1/V2/V3-phase designs at spec time; that's the OPPOSITE rule and applies at SPEC time, not at implementation-fork time — the two compose: full-vision spec, full-honor-implementation, V1/V2 scope split for delivery cadence); `feedback_world_class_critique` (bring opinionated critique when asked); `feedback_verify_methodology_before_gating` (counter-case for amendment).
