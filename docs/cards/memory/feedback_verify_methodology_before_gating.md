---
title: 'Verify the methodology''s actual sequence before gating UX on it'
description: 'When a UX gate refers to a domain methodology (DMAIC, Kanban, Agile, etc.), check the methodology''s canonical sequence before locking the gate logic. Don''t assume mid-flow position from the term alone — the term may be the methodology''s FIRST step, not a later one.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: c6490d868a370c44
origin-session-id: 906cccde-0cd3-4d5a-bbda-f82a5855e4cc
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_verify_methodology_before_gating.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When designing UX visibility / gating / progressive-disclosure rules around a domain-methodology concept (e.g., "Charter," "Sprint Review," "Standup," "Retrospective"), **verify the methodology's actual canonical sequence before locking the gate logic.** The term's position in the methodology may differ from the intuition implied by its surface meaning.

**Why:** in VariScout's canvas PR8 sub-PR 8a (canvas response-path CTAs), the original plan gated "Charter" behind hub-cadence ("Available once your Hub has cadence") on the assumption that chartering is a late-stage workflow act after enough data accumulates. **DMAIC research disproved this** — Project Charter is the FIRST step of the Define phase ([SixSigma Institute](https://www.sixsigma-institute.org/Six_Sigma_DMAIC_Process_Define_Phase_Six_Sigma_Project_Charter.php), [DMAIC.com](https://www.dmaic.com/faq/project-charter/), [SixSigma.us](https://www.6sigma.us/project-management/the-project-charter-and-define-phase-are-inseparable/)); a paid-tier user with a brand-new ProcessHub charters a project on day 1, not after months. The original gating shipped would have been methodologically wrong, taught users the wrong vocabulary, and confused LSSGB students learning DMAIC. Caught during plan review (2026-05-07) before any code shipped; correction landed in plan amendment + decision-log + ADR cross-references.

**How to apply:**

1. **When a domain-methodology term appears in a UX gate or progressive-disclosure rule, search the canonical methodology** (Lean Six Sigma, Agile/Scrum, ITIL, Toyota Production System, etc.) before locking the gate logic. Don't ship gating until you've grounded the term in source material.
2. **Cite sources in the plan / spec** so reviewers can verify. Web search 2-3 authoritative sources (institutional sites: SixSigma Institute, ASQ, Scrum.org, etc.) and link them in the design doc. Avoids re-litigation later.
3. **Distinguish vocabulary roles**: an internal-product term (e.g., "cadence" in VariScout) ≠ a methodology term (e.g., "Charter" in DMAIC). Internal jargon goes in code; methodology terms are user-facing and must respect their canonical meaning.
4. **Watch for the inverse mistake too**: gating something that the methodology says is universally available (e.g., "Quick action") behind paid-tier or workflow position will under-deliver to free-tier users.

**Counter-case:** when the methodology is internally-developed (e.g., your team's bespoke RDMAIC, your company's "Improvement Cycle"), the canonical sequence IS whatever your team's spec says. Verify against THAT spec instead of external research. The rule is "ground the gating in canonical sequence" — the canonical source can be internal or external depending on which methodology owns the term.

**Cost:** ~10-15 minutes of web search before plan-write. Compared to a wrong-shipped UX gate that propagates user-facing methodology-jargon mistakes (and has to be unwound + re-taught), the search is a clear win.

**Generalizes to:** any product surface that gates / sequences / progressively-discloses based on domain-vocabulary terms. Particularly load-bearing for products that serve trained practitioners (Six Sigma Black Belts, Scrum Masters, ITIL specialists) — they will notice methodology mistakes and lose trust.
