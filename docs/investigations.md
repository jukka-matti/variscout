---
title: VariScout — Things to Investigate
audience: [engineer, designer, analyst]
category: living-index
status: living
last-reviewed: 2026-05-03
---

# VariScout — Things to Investigate

Code-level smells, UX follow-ups, and architectural questions surfaced during work that are **not yet decisions**. Lighter than `decision-log.md` (Open Questions are decisions waiting to happen); heavier than a TODO comment (these deserve to outlive a single PR).

**When to add an entry:** while shipping fix A you notice problem B that's adjacent / related / surfaced by the same change. B isn't blocking A and you don't want to inflate scope, but it's worth not losing.

**When to remove an entry:**

- It became a decision → move to `decision-log.md` (Open Questions or Replayed Decisions).
- It became a spec → link to `docs/superpowers/specs/...` and remove.
- It became an ADR → link and remove.
- It was fixed → remove (the diff is the record).
- It was tried and rejected → move to `decision-log.md` Replayed Decisions with rationale.

**Each entry:** short title; one-paragraph description; surfaced-by (date / PR / session); possible directions; promotion path.

---

## Active investigations

### Stats-bar "Set specs →" link reads project-wide specs only

**Surfaced by:** FRAME b0 spec wiring fixes, 2026-05-03 (branch `feature/full-vision-frame-b0`).

**Description:** The Analysis tab's stats-bar shows a "Set specs →" link even after the user has saved per-column specs via FRAME b0's `+ add spec` editor. Same root cause as the I-Chart bug fixed in this batch: the link reads `useProjectStore(s => s.specs)` (project-wide) rather than `measureSpecs[outcome]` (per-column).

**Possible directions:**

- Mirror the I-Chart fix locally: derive an effective spec object from `measureSpecs[outcome] ?? specs` at the consumer.
- Sweep all consumers of `s.specs` and apply the same fallback uniformly.
- Address the root cause via the parallel-stores investigation below.

**Promotion path:** trivial fix (one consumer) → ship in a follow-up PR. Wide sweep → audit task in `decision-log.md` Open Questions.

---

### Cpk badge in standard (Measurements) I-Chart mode

**Surfaced by:** FRAME b0 walkthrough, 2026-05-03.

**Description:** Once a spec is saved, the I-Chart in Measurements mode draws USL/LSL/target lines but shows no Cpk readout. Cpk is only surfaced when the user flips to "Cpk stability" / capability mode. Natural user expectation after spec save: a Cpk number visible somewhere alongside the trend chart.

**Possible directions:**

- Cpk badge in the stats-bar next to `x̄ | σ | n | Set specs →`.
- Cpk readout on the I-Chart's right-edge labels (alongside USL / Mean / LSL).
- Per-mode placement: Performance mode already has a `ProcessHealthBar` chip — generalize for the standard I-Chart.

**Promotion path:** UX decision → design slice → ADR if it changes Cpk presentation policy across modes; otherwise spec + implementation.

---

### Parallel spec sources of truth: `specs` vs `measureSpecs[outcome]`

**Surfaced by:** FRAME b0 spec wiring fixes, 2026-05-03.

**Description:** `projectStore` exposes two distinct spec fields: `specs: SpecLimits` (legacy project-wide single spec) and `measureSpecs: Record<string, SpecLimits>` (per-column, the newer Phase B model per `packages/ui/CLAUDE.md`). Writers branch on whether an outcome is set: with outcome → `setMeasureSpec(outcome, ...)`; without → `setSpecs(...)`. Readers are inconsistent: `resolveCpkTarget` already prefers per-column, but several other consumers read `specs` directly (the I-Chart wrapper was one — fixed locally; the stats-bar link, see above, is another). The asymmetry guarantees drift between "spec is set" indicators and the chart actually drawing the spec lines.

**Possible directions:**

- **Status quo + sweep:** keep both fields, sweep all consumers to use the per-column-first fallback. Cheapest now, leaves the smell.
- **Make `specs` derived:** treat `specs` as a computed view (`specs = outcome ? (measureSpecs[outcome] ?? {}) : projectWideFallback`). Eliminates the asymmetry without removing the field; readers don't change.
- **Unify on `measureSpecs`:** retire `specs`, route all reads / writes through `measureSpecs[outcome]`. Cleanest, biggest blast radius (legacy consumers, persistence shape, possibly Azure app).
- **ADR:** if the issue keeps biting, write an ADR that picks one of the above and locks it.

**Promotion path:** ADR-worthy if it bites again. Could also be folded into a Phase B follow-up spec, since per-characteristic specs (`SpecEditor`, `setMeasureSpec`) are the documented intent.

---
