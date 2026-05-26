---
tier: stable
purpose: orient
title: 'Four personas — Process Owner / Process Engineer / Specialist / Leader'
audience: human
category: strategy
status: named-future
last-reviewed: 2026-05-17
parent: docs/01-vision/variscout-process/index.md
related:
  - docs/archive/specs/2026-05-14-variscout-coherence-design.md
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
  - docs/01-vision/constitution.md
layer: L1
---

# Four personas — Process Owner / Process Engineer / Specialist / Leader

> **Status: named-future capture.** The four-persona model was locked in Coherence Session A (2026-05-14) as the canonical model for VariScout. The 2026-05-16 wedge pivot retired this model for V1 — V1 collapses to a single Specialist persona with project-membership roles. The four-persona design migrates to VariScout Process unchanged. This file is the consolidated capture of the design.

## §1 Why four personas, not three or ten

Pre-wedge VariScout had ten persona files in `docs/02-journeys/personas/` — Analyst Alex, OpEx Olivia, MBB Mira, Engineering Eric, et al. The Coherence audit found that the ten conflated three orthogonal axes:

- **Persona** (who you are when you log into the product)
- **Entry archetype** (how you arrived — data-first paste, process-first authoring)
- **Task type** (quick exploratory analysis vs. chartered project)

Six of the original ten were buyer-evaluators, education-funnel students, tenant admins — not in scope for product UX design. They live in marketing / sales / education docs, not in the product persona model.

That left four product-user personas. The Coherence brainstorm tested "could it be three?" by considering whether SME-flavored work could be absorbed into the analyst persona. The conclusion was no: three of the four personas map cleanly to Constitution P7's three evidence types (Data / Gemba / Expert), and dropping the fourth left expert-evidence creation as "whoever happens to be in the RACI C role" — structurally vague. The four are minimal.

The Process Engineer persona was renamed from the pre-wedge "SME" label after the V1 pivot. The 2026-05-16 conversation surfaced that "SME" reads as a RACI role, not a persona — and the persona-vs-role confusion was the single most consequential terminology lock in Coherence Session A. **Process Engineer** is the canonical persona name in the named-future Process product. It captures the same role (expert input on artifacts; consulting on investigations from other Leads) while disambiguating from RACI.

## §2 The four personas

### §2.1 Process Owner

**Primary verb.** Monitor + decide.

**Real-world counterpart.** Operations manager responsible for one or more production lines, queues, or workflows. Goal-setter for the process. Receives drift signals, approves Improvement Project signoffs, owns cadence reviews.

**Default landing in Process.** Their assigned process's Process tab in State mode (read-only). L1 outcome panel surfaced first, decisions queue (Needs your decision) immediately under that. Process map with state badges below. No paste-screen, no analyze grid — the Process Owner does not enter Process to explore; they enter to scan and decide.

**Evidence type affinity.** Consumes evidence; doesn't primarily produce it. Reads Findings authored by Specialists and Process Engineers; approves response-path routing; signs off on Sustainment closure.

**What they see in Process that V1 doesn't surface.**

- **Persona-default Process-tab landing.** V1's Process tab lands the Specialist on the active project's L2; the Process Owner in Process lands on the Hub's L1 with decisions queue active.
- **Cadence prompts.** When a Hub's PMS triggers a cadence review ([measurement-system.md §3](measurement-system.md)), the prompt routes to the Process Owner's Inbox first.
- **Hub-overview drift dashboard.** A Process Owner monitoring multiple processes sees a portfolio shape ([hub-portfolios.md §3](hub-portfolios.md)) — child Hub miniatures side-by-side, drift indicators per Hub, signoff queue across all their Hubs.

### §2.2 Process Engineer

**Primary verb.** Provide expert input + frame process structure.

**Real-world counterpart.** Subject-matter expert. Engineering lead who knows the physics / mechanics / regulatory constraints / vendor relationships of the process. Authors the canonical map (Process tab Edit mode). Invited to consult on investigations where deep mechanism knowledge is required.

**Default landing in Process.** My Work surface in consult-shape — pending consult invitations at top, artifacts they've contributed to in the middle, recent Findings they authored at the bottom. Process Engineers don't lead investigations; they're invited into them.

**Evidence type affinity.** **Expert** (Constitution P7). Their primary contribution is expert assessment — annotated charts, mechanism notes, factor specifications, design intent. Process Engineers may occasionally produce Gemba evidence when their expert work involves direct observation (a Process Engineer doing a structured FMEA walk), but their default mode is desk-side expert input.

**What they see in Process that V1 doesn't surface.**

- **Process tab Edit mode default.** When a Process Engineer enters the Process tab, Edit mode is the default (they author the map). V1's default is State.
- **Cross-project Hypothesis cross-reference.** Process Engineers consulting on a new investigation see prior Hypotheses + Findings on the same Hub's history — pattern memory across projects ([scope-line.md §2.4](scope-line.md)). V1 has no cross-project memory.
- **Knowledge Catalyst contribution.** Process Engineers are the primary authors of durable knowledge artifacts in the Hub (mechanism notes, factor taxonomies, design intent). The Catalyst surface in Process is shaped for their workflow.

### §2.3 Specialist

**Primary verb.** Analyze + improve.

**Real-world counterpart.** Improvement specialist — Black Belt, Green Belt, continuous-improvement practitioner. Runs Investigation Projects from Charter through Sustainment. The V1 persona; the only persona present at the V1 cutover.

**Default landing in Process.** My Work surface in project-shape — active investigations + Improvement Projects they lead at top, then prior projects, then their Hypotheses awaiting evidence. Identical to V1's Home surface, just persona-flagged so other personas have differently-shaped Homes.

**Evidence type affinity.** **Data** (Constitution P7). Their primary contribution is data analysis — EDA, factor intelligence, capability assessment, Hypothesis evidence. Specialists work at L3 (Local Mechanism) most of the time, with frequent zoom-outs to L1 (Outcome) for context.

**What they see in Process that V1 doesn't surface.**

- **Hub context above the project.** A Specialist working a project inside Process sees the Hub the project belongs to as a visible parent in the breadcrumb. V1 hides the Hub.
- **Multi-project on one Hub.** A Specialist may lead two projects on the same Hub simultaneously. V1 has no Hub container above projects, so this case doesn't arise.
- **Cross-Hub investigation.** A Specialist may be invited as Member on projects across multiple Hubs (the org's quality team typically operates this way). Inbox shows pending invitations across the portfolio; My Work shows their active projects across all Hubs.

The Specialist in Process is essentially the same persona as V1's Specialist, with the surrounding org structure now visible.

### §2.4 Leader

**Primary verb.** Read + sponsor.

**Real-world counterpart.** Executive sponsor, Champion, plant manager, VP of Operations. Authorizes Improvement Projects. Reads reports across the portfolio. May personally engage with one or two projects per quarter, but primarily consumes Process outputs.

**Default landing in Process.** Org-level overview — child Hub miniatures (the Hub-of-hubs portfolio view), portfolio drift indicators, signoff queue (projects awaiting Sponsor approval), recent Sustainment closures. The Leader's surface is the read-mostly version of the Process Owner's monitoring dashboard, summed across multiple Hubs.

**Evidence type affinity.** Consumes evidence; doesn't produce it. Reads Reports authored by Specialists, signs off on Charters where the Leader is the named Sponsor, occasionally drills into a specific Hub or project when something catches attention.

**What they see in Process that V1 doesn't surface.**

- **Portfolio overview.** Hub-of-hubs side-by-side rendering at the top of their default landing. V1 has no portfolio surface; the Sponsor in V1 reads everywhere within the projects they sponsor (same ACL tier as Member), but has no cross-project portfolio view.
- **Sponsor signoff queue.** In-app Sponsor signoff workflow (named-future per [wedge spec §4.1](../../superpowers/specs/2026-05-16-wedge-architecture-design.md) and [scope-line.md §4](scope-line.md)). V1 handles signoff out-of-band.
- **Cross-Hub drift roll-up — visual, never arithmetic.** The Leader's overview honors ADR-073: distributions per Hub, never an averaged cross-Hub Cpk. The signal is the visual comparison; no `meanCpkAcrossHubs()` exists or will exist.

## §3 RACI roles vs personas (terminology lock)

The single most consequential alignment from Coherence Session A: **personas and RACI roles are different concepts**, even though both have role-shaped names.

| Concept                          | Scope                                                                | Examples                                                | Stored as                                                 |
| -------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------- |
| **Persona** (Layer 1)            | Tenant account holder with a primary product role                    | Process Owner / Process Engineer / Specialist / Leader  | `teamMember.personaRole` (Process tenancy)                |
| **RACI role**                    | Responsibility slot on a specific artifact                           | Responsible / Accountable / Consulted / Informed        | RACI fields on the artifact (investigation, IP, action)   |
| **Artifact reference** (Layer 2) | Named person on an artifact who may or may not have a tenant account | Sponsor (in V1 ACL sense), external SME, named operator | `assignee` / `responsibleRole` / `sponsor` / `verifiedBy` |

Critical disambiguations:

- **A Process Engineer in the C RACI role** ≠ **a Specialist in the C RACI role on the same artifact**. Same RACI role, different persona. The persona drives default UI (Edit mode for Process Engineers, My Work landing for Specialists); the RACI role drives access + workflow on that specific artifact.
- **"Process Owner" the persona** (Layer 1 tenant user) ≠ **`processHub.processOwner` the field** (single tenant user reference per Hub — typically occupied by a Process Owner persona, but the field is the slot not the persona) ≠ **"Process Owner (Operations)" in RACI taxonomies** (a Layer 2 named operator who may not be a product user).
- **`ProcessMapNode.responsibleRole`** is a per-node label (e.g., "Maintenance lead") that scopes step ownership on the canvas. It is NOT a tenant user assignment; it doesn't gate access.

This lock prevents the "is this a persona, a role, or a label?" confusion that the pre-Coherence corpus carried.

## §4 Persona × evidence type (Constitution P7)

Three of the four personas map cleanly to the three evidence types:

| Persona                                               | Primary evidence type                                          |
| ----------------------------------------------------- | -------------------------------------------------------------- |
| Specialist                                            | **Data** — analysis, EDA, factor intelligence                  |
| Process Engineer                                      | **Expert** — mechanism notes, design intent, expert assessment |
| Process Owner                                         | (Consumes evidence)                                            |
| Leader                                                | (Consumes evidence)                                            |
| _(Anyone — typically Specialists or operators at L3)_ | **Gemba** — direct observation, walks, incident records        |

Gemba evidence doesn't have a primary persona owner because gemba work is contextual — the Specialist on the floor for an investigation walk, the Process Engineer reviewing a specific mechanism in person, or operators (who may or may not be product users) recording observations. This is a Layer 1 / Layer 2 seam: many gemba evidence authors are Layer 2 references on artifacts, not product users.

## §5 Persona-aware default landing per persona

The conceptual core of the Process product is **persona-aware default landing**. When a tenant user opens VariScout Process, the surface they see is shaped by their `personaRole`.

| Persona          | Default landing surface              | Default view within surface                            |
| ---------------- | ------------------------------------ | ------------------------------------------------------ |
| Process Owner    | Their assigned process's Process tab | State mode, L1 outcome panel, decisions queue surfaced |
| Process Engineer | My Work                              | Consult-shape: pending consult invitations at top      |
| Specialist       | My Work                              | Project-shape: active investigations + IPs they lead   |
| Leader           | Org-level overview                   | Hub-of-hubs portfolio + signoff queue                  |

V1 does not implement this — the V1 Home surface has one shape (Specialist) because V1 has one persona. The Process activation that introduces persona-aware landing is the most user-visible change between the products.

## §6 Persona-aware copy density

Different personas read different copy densities. Coherence Session C locked the copy strategy:

- **Plain (Flesch-Kincaid grade ≤ 12)** for Process Owners and operators (gemba contexts). Short sentences, common vocabulary, no methodology jargon.
- **Standard (grade ≤ 14)** for Specialists. Methodology vocabulary present but explained on first use per surface.
- **Standard + technical** for Process Engineers. Statistical methodology assumed; engineering and domain vocabulary present.
- **Leader copy** scales with the artifact — Reports use Plain; in-app summaries use Standard.

This is a Process feature, not a V1 feature. V1 ships one copy density (Standard) for the single Specialist persona.

## §7 Team workspaces inside artifacts

Personal queues (My Work, Today, Process tab) show the user's slice. Team coordination happens **inside the artifacts** — Improvement Projects and investigations are team workspaces with team roster (RACI per artifact), activity feed (who did what), threaded comments, @-mentions, signoff queue.

Cross-persona handoffs become visible in the artifact's activity feed: "Pat (Process Owner) approved Section 6 outcome — Dr. Chen (Process Engineer) added expert evidence — Specialist Mira marked action done." No separate "team coordination" surface; the artifact IS the workspace. GitHub / Linear / Asana pattern.

This pattern exists in V1's project membership model (Lead / Member / Sponsor on a project). Process expands the model with persona-aware defaults — a Process Engineer invited as Consulted on an investigation lands inside that investigation in their Process Engineer default view, not in a generic shared view.

## §8 Why this retired from V1

The V1 pivot collapsed to one persona because:

1. **Single-buyer onramp.** The V1 ICP is the Specialist buying the tool for their team. Persona-aware routing requires the buyer to set up tenant-wide persona assignments, which is enterprise IT work — incompatible with a self-service Azure Marketplace deployment for a single specialist.
2. **Engineering scope.** Persona infrastructure (tenant-admin persona assignment UI, persona-aware default routing across every surface, persona-adaptive Home variants) is multi-PR engineering work. V1 committed to ship with the smallest defensible anatomy.
3. **Methodology purity.** With one persona, every surface serves the same primary verb (analyze + improve). Multiple personas multiply the design surface (every screen has 4× the UX variants); V1 deliberately accepts the design constraint that comes with one persona.

The four-persona model migrates to Process intact. The infrastructure to support it (persona-aware routing, persona-adaptive Homes, RACI engagement-profile model, copy-density tiers) is Process scope, not V1.

## §9 Process activation — persona introduction order

If V1 validates and Process activates, persona introduction is sequenced rather than simultaneous:

1. **Specialist (already present from V1).** No change; the V1 Specialist continues in Process unchanged.
2. **Process Owner.** First new persona. Smallest activation: introduce `personaRole` on tenant-member records, route Process tab to State mode + decisions queue when the user is Process Owner. Everything else stays the same.
3. **Process Engineer.** Second activation. Adds Edit mode default + consult-shape My Work + cross-project Hypothesis cross-reference.
4. **Leader.** Last. Activates with portfolio overview ([hub-portfolios.md §3](hub-portfolios.md)) and Sponsor signoff workflow. Leader activation requires Process to already have multi-Hub installed base; introducing it before Process has enough Hubs to portfolio means an empty surface.

This is speculation, not commitment. When Process activates, the team will re-plan persona introduction against the customer-pull signal of the day.
