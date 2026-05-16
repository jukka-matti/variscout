---
tier: living
purpose: design
title: VariScout User Journeys — V1 Single-Persona Spine
audience: human
category: reference
status: active
last-reviewed: 2026-05-16
related: [personas, flows, journey, modes, v1-architecture]
---

# VariScout User Journeys — V1 Single-Persona Spine

Under V1 ([V1 architecture spec](superpowers/specs/2026-05-16-wedge-architecture-design.md) + [ADR-082](07-decisions/adr-082-wedge-architecture.md)), VariScout serves **one persona** — the **Improvement Specialist** — with project-membership roles applied inside individual projects. The legacy 10-persona spine retires for V1 and migrates to **VariScout Process**, the future enterprise product.

This doc captures: how the Specialist enters, how they work, how they bring teammates in, and which mode-specific docs to read next.

## The one persona — Improvement Specialist

A quality engineer, Lean practitioner, Six Sigma belt (Green / Black / MBB), CI engineer, or process analyst whose job is to _find and reduce variation in process data, then verify the fix worked_.

The Specialist may work:

- **Solo** — quick analysis on their own, no project, no team. Often the first session with VariScout.
- **As project Lead** — running a formal investigation with invited teammates and an executive Sponsor expecting a Report.
- **As project Member** — invited by another Lead to contribute SME knowledge, gemba observation, or analytical work to someone else's project.

Code ground truth for the canonical journeys lives in:

- `apps/azure/e2e/full-lifecycle.spec.ts` — end-to-end Project lifecycle (Charter → Sustainment)
- `packages/data/src/samples/journey.ts` — seeded journey-shaped dataset
- `apps/azure/src/lib/journeyPhaseConfig.ts` — phase configuration

When docs and code disagree, trust the code.

## Project membership roles

Within a Project, the Specialist takes one of three roles:

| Role        | Typical real-world counterpart                        | Capabilities                           | Manages membership? |
| ----------- | ----------------------------------------------------- | -------------------------------------- | ------------------- |
| **Lead**    | Black Belt / project lead                             | Full edit; sets lifecycle stage        | Yes                 |
| **Member**  | SME, analyst, frontline contributor, quality engineer | Full edit within project surfaces      | No                  |
| **Sponsor** | Executive sponsor / Champion                          | Report-only at V1; signoff out-of-band | No                  |

Project members must share the same Azure AD tenant. Cross-org collaboration is out of V1 (a deliberate privacy boundary).

## Two entry shapes — both first-class

**Quick analysis (exploratory).** Specialist pastes data → explores in Analyze → optionally creates Findings → optionally groups them into Hypotheses on the Investigation Wall. No project created. Free PWA supports session-only; Azure (€120/mo) adds persistence and CoScout.

**Project-anchored investigation.** Specialist creates a Project (or promotes a quick analysis to a Project via "+ Promote to Project"). The Charter ceremony adds problem statement, member invites, and optional refined goal. Project lifecycle runs Charter → Approach → Sustainment, producing a Report a Sponsor can sign off.

The two entry shapes share the same methodology and the same canvas — the difference is whether the work is wrapped in formal lifecycle.

## The journey spine — unchanged

Every investigation, whether quick or project-anchored, follows:

**FRAME → SCOUT → INVESTIGATE → IMPROVE**

- **FRAME.** State the problem (data-first or hypothesis-first). The process map gets sketched. CoScout helps articulate.
- **SCOUT.** Data is parsed and characterized. Four Lenses of variation emerge (central tendency, spread, pattern, distribution).
- **INVESTIGATE.** Specialist picks suspected causes — data-derived, gemba-observed, or expert-supplied — and examines each with Evidence Map, statistics, and targeted Questions. The Investigation Wall accumulates Findings linked to Hypotheses. Measurement Plans capture what evidence still needs collection.
- **IMPROVE.** Hypotheses converge on improvement actions. Inside a Project this becomes the **Improve tab** (action tracker) — top-level verb tab scoped to the active project — then Sustainment ("did it work? + close").

Mode-specific tooling varies inside each phase; the spine never changes.

## Process learning levels — methodology, not personas

The same dataset can start at any of three levels of process understanding. This generalizes the Y / X / x EDA language.

| Level                               | Main user question                                                  |
| ----------------------------------- | ------------------------------------------------------------------- |
| **System / outcome (L1)**           | Are we meeting the customer or business requirement?                |
| **Flow / process model (L2)**       | Where does time, rate, throughput, wait, or bottleneck loss live?   |
| **Local mechanism / evidence (L3)** | Which physics, recipe, condition, or measurement issue explains it? |

A customer complaint or Cpk gap starts at L1. Timestamped station data starts at L2. A scoped Yamazumi study, maintenance record, or gemba check starts at L3.

VariScout's job is to connect those levels into durable process understanding within a project — and across the team's portfolio of projects over time.

## Hypothesis-first vs data-first investigation

Both starting points converge on the **Investigation Wall** (per [V1 spec §3.6](superpowers/specs/2026-05-16-wedge-architecture-design.md#§36-investigation-wall--measurement-plans)).

| Start                            | Path                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Data-first (exploratory)**     | Paste → explore in Analyze → notice patterns → create Findings → group into Hypotheses on the Wall                                                                                                                       |
| **Hypothesis-first (deductive)** | Open Wall → create Hypothesis (no Findings yet) → add Measurement Plans (what evidence is needed) → coordinate collection out-of-product → re-paste new data → new Findings link to Plans → Hypothesis status progresses |

The Measurement Plan sub-entity supports recurring data collection without forcing a separate "Measure" stage.

## Mode-specific journeys

Each analysis mode has its own user-journey doc capturing the canvas chart suite, the questions it answers, and the typical Specialist flow inside it:

- [Standard](USER-JOURNEYS.md) — continuous measurement data; this doc's spine
- [Capability](USER-JOURNEYS-CAPABILITY.md) — Cp/Cpk against specifications
- [Yamazumi](USER-JOURNEYS-YAMAZUMI.md) — lean cycle-time analysis
- [Performance](USER-JOURNEYS-PERFORMANCE.md) — multi-channel monitoring
- [Defect](USER-JOURNEYS-DEFECT.md) — events → rates
- [Process Flow](USER-JOURNEYS-PROCESS-FLOW.md) — bottleneck + flow diagnostics

Each mode doc strips personas to the single Specialist and references code ground truth.

## What's out of V1 scope (defers to VariScout Process)

The legacy multi-persona / Hub-centric framing migrates to **VariScout Process**, a future enterprise product:

- 4-persona model (Process Owner / Project Lead / SME / Frontline) — V1 collapses to single Specialist + project-membership roles (V1 spec §3.5; canonical design: [four-personas.md](01-vision/variscout-process/four-personas.md))
- Process Hub as a user-visible primary container — V1 keeps Hub internal-only
- Process-owner cadence + Current Process State surfaces — defers
- Multi-Hub portfolio scans + cross-Hub orchestration — defers
- Process Measurement System as a separate surface — defers
- Five response paths surfaced from canvas drill — V1 reduces to 3 (Investigate, Quick Action, Charter); Sustainment auto-fires; Handoff folds into Sustainment closure
- Trainer / Student / Curious / Evaluator / Admin / Field separate persona variants — V1 single-persona, addressed via PWA vs Azure tier choice + project-membership role

These aren't lost — they're moved to a separate roadmap item. V1 marketing doesn't reference VariScout Process; it's mentioned only when customers ask about enterprise / process-ownership use cases.

## Where to go next

- **Canonical V1 design**: [V1 architecture spec](superpowers/specs/2026-05-16-wedge-architecture-design.md)
- Overview: [OVERVIEW.md](OVERVIEW.md)
- Data lifecycle: [DATA-FLOW.md](DATA-FLOW.md)
- Glossary: [glossary.md](glossary.md)
- Mode docs: linked above
