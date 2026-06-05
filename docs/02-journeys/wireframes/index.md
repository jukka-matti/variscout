---
tier: living
purpose: design
title: 'Named-View Wireframes — canonical visual identity per UI view'
audience: human
status: active
layer: L2
topic: [wireframes, views, journeys, ux]
related:
  - docs/02-journeys/traceability.md
  - docs/superpowers/specs/2026-06-06-first-session-journey-design.md
---

# Named-View Wireframes

One doc per **named view** — the canonical visual identity of each user-facing surface. Views belong to the product, not to initiatives: design specs **link** here, never restate. Edit in place as views evolve (this is a `tier: living` directory; the decision-log carries what changed when).

**Why this exists** (owner insight, 2026-06-06): the pipeline went brainstorm → prose spec → plan → code, so the first time any UI visually existed was when code rendered it — interaction design was decided implicitly, and five framing-concept generations shipped coherently in code without ever being integrated visually. Wireframes are the missing artifact, not ceremony. See the process rules in the [first-session journey spec §11](../../superpowers/specs/2026-06-06-first-session-journey-design.md).

**Conventions:**

- One markdown doc per view, named for the view (`b0-landing.md`), with the interaction contract in prose + ASCII, and a richer HTML wireframe in `assets/` (self-contained; open in any browser).
- Journey flow docs and `traceability.md` reference views by name — the chain is **journey step → named view → L3 feature → component**.
- Reviewer pairs on user-facing tasks verify the built interaction against the view doc (not just the spec prose).

## Views

| View                                  | Depicts                                                                     | Source design                                                                |
| ------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [`altitude-model`](altitude-model.md) | The product-wide altitude axis L1→L2→L3→Explore→condition + the way back up | First-session journey spec §1                                                |
| [`b0-landing`](b0-landing.md)         | Paste/sample landing: pre-filled FrameViewB0 + provenance + detection chips | First-session journey spec §4.1                                              |
| [`step-timings`](step-timings.md)     | Step-timestamps banner → StepTimingsModal → L2 flow with timing badges      | CCJ spec §4.3.1 (shipped) + first-session journey spec §4.3 (the front door) |
| [`capture-card`](capture-card.md)     | The one Finding draft card + its four entry gestures                        | First-session journey spec §5                                                |
| [`wall-arrival`](wall-arrival.md)     | Findings-forward Wall empty state + the status ladder                       | First-session journey spec §6                                                |
