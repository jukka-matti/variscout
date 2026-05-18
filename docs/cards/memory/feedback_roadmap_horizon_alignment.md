---
title: 'Roadmap-horizon alignment when scoping phases'
description: 'Cross-check the Product Method Roadmap horizons (H0/H1/H2/H3) before scoping any V*/Phase work. Don''t wedge later-horizon features into earlier phase implementation.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: efb5d588-ee52-4005-996f-a8f1d0dca016
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_roadmap_horizon_alignment.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

**UPDATE 2026-05-03:** The product-method-roadmap spec was archived. Horizons (H0–H4) are now described in `docs/superpowers/specs/2026-05-03-variscout-vision-design.md` §6 (with §8.6 noting horizons may be collapsed to a delivery-sequence appendix outside the vision; status pending confirmation). When horizons matter, treat the vision spec as canonical and the §8.6 default as the current shape.

Before scoping any V*/Phase implementation, **read the current vision spec** at `docs/superpowers/specs/2026-05-03-variscout-vision-design.md` and verify each proposed feature aligns with what the vision commits to. Don't wedge work that violates the vision's commitments (e.g., reintroducing "tributary" jargon, re-creating the b0 → b1/b2 transition shock, building a new Analysis tab as a separate destination) into a phase implementation.

**Why:** During Phase 2 V2 brainstorming (2026-04-27), the planned PR #3 ("snapshot mode in LayeredProcessView with hub-rendered ProcessMap") kept revealing structural problems — no per-tributary state data, currentState lives on Dashboard not Editor, ProcessMap is investigation-scoped not hub-scoped. The user surfaced the right question: "what would a world-class team think — do we have an adoption maturity journey?" The Product Method Roadmap explicitly puts "Level-aware Process Hub map" at **Horizon 3** (line 226). The whole hub-canonical-map design we were trying to retrofit into V2 is an H3 capability. Each "patch" was forcing more compromises because the prerequisite (H3 hub-level structural model) didn't exist yet. Once we re-aligned, the actual H1 work (response-path routing + evidence aggregation on `ProcessHubCurrentStatePanel`) became obviously the right Phase 2 V2 closure.

**How to apply:**
- At the start of every brainstorming or planning session that touches "Phase N" or "V*" scoping, locate the current Product Method Roadmap and identify which horizon each proposed capability belongs to per the roadmap's "Key capabilities" sections.
- If a proposal's structural prerequisites belong to a later horizon (e.g., needs schema additions promised in H3, needs a new surface promised in H2), that's a strong signal to defer rather than retrofit.
- Flag horizon mismatch *during* brainstorming. Ask: "what horizon is this in the roadmap?" before going deep on architecture.
- Coexists with `feedback_full_vision_spec`: still spec the full vision for whatever IS in scope; horizon mismatch is one of the genuine "blocked on prerequisite" reasons that legitimately go in a spec's Non-goals.
- Roadmap evolves; treat "the current roadmap doc" as ground truth, not a frozen reference. If the doc has been updated since this memory was written, follow the updated doc.
