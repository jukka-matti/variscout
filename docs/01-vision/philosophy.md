---
title: 'EDA for Process Improvement'
audience: [business, analyst]
category: methodology
status: stable
---

# EDA for Process Improvement

VariScout is **Exploratory Data Analysis (EDA) for process improvement** — not statistical verification.

---

## Two Mindsets

| Academic Statistician            | Process Improvement Practitioner |
| -------------------------------- | -------------------------------- |
| "Is this significant at p<0.05?" | "Where should I focus?"          |
| Hypothesis testing               | Pattern finding                  |
| Prove with math                  | See with eyes                    |
| Statistical correctness          | Directional guidance             |
| Analysis as end goal             | Analysis as starting point       |

---

## The Goal

- **Find where to focus** — which factor, which machine, which shift?
- **See where to apply Lean thinking** — visual patterns reveal opportunities
- **Guide improvement effort** — prioritize by impact, not guesswork
- **Move fast, iterate, improve** — 30-second answers, not 30-minute reports

---

## The Key Insight

> VaRiScout finds WHERE to focus. Apply Lean thinking to find WHY — and what to do about it.

VariScout identifies **factors driving variation**, not "root causes." EDA shows _which_ factors explain variation — the _why_ requires further investigation (5 Whys, experimentation, Gemba walks).

This distinction matters: we quantify contribution, not causation.

---

## The Promise

> **46% of your variation may be hiding in one place. Find it. Fix it. Check it. Continue.**

This isn't a marketing claim — it's what the drill-down methodology routinely reveals. By applying filter chips to the highest-impact factors, practitioners typically isolate a significant portion of total variation to specific, actionable conditions.

---

## The Process Detective's Toolkit: Four Lenses

VariScout's four core charts are **four lenses** — parallel ways to examine the same data. Like a detective switching between UV light, a magnifying glass, and a timeline reconstruction, each lens reveals something different:

| Lens                   | Detective Question                                                         |
| ---------------------- | -------------------------------------------------------------------------- |
| **I-Chart (CHANGE)**   | "What changed between yesterday's shift and today's shift?"                |
| **Boxplot (FLOW)**     | "Retrace the footprints upstream. Where did this come from?"               |
| **Pareto (FAILURE)**   | "Where is the 'blood spatter'? The chaotic, mixed data?"                   |
| **Capability (VALUE)** | "Am I looking at a clue (customer issue) or just noise (irrelevant spec)?" |

The first three lenses (CHANGE, FLOW, FAILURE) analyze internal process behavior. The VALUE lens is a different type of question — it brings in an external reference (customer specifications) to ask "does it actually matter?"

**Add-on:**

| Tool                         | Detective Question                               |
| ---------------------------- | ------------------------------------------------ |
| **Regression (CORRELATION)** | "Is there a connection between these two clues?" |

---

## The Guided Frustration Pedagogy

The Sock Mystery teaches through "guided frustration":

1. **Phase 1: Immersion in Chaos** — Let them fail so they ask why
2. **Phase 2: Physical Stratification** — Peel back layers with questions
3. **Phase 3: System Understanding** — Connect statistics to the real system

VariScout enables this same journey with real data:

1. Upload data → see chaotic I-Chart (frustration)
2. Click through factors → discover subgroups (stratification)
3. Drill down → find the actual variation source (understanding)

---

## AI Philosophy: Same Analysis, AI Optional

### PWA — Full Analysis Without AI

The free PWA has the same analytical power as the Azure App: Four Lenses, Factor Intelligence, question-driven investigation, the full FRAME → SCOUT → INVESTIGATE → IMPROVE journey. The only difference is the absence of CoScout AI. The analyst does the thinking — which builds statistical intuition for learners, and is the preferred workflow for experienced analysts who want direct control.

### Azure App — AI Augments, Never Replaces

The Azure App adds CoScout: optional AI-assisted analysis. The key principle: **AI explains deterministic conclusions, it doesn't generate competing ones.**

VariScout's statistical engine computes that Machine A accounts for 47% of variation. CoScout translates this into "Fill Head B accounts for 47% of weight variation — your process description mentions nozzle clogging as a concern." The conclusion is reproducible and auditable. The AI adds context and language, not statistics.

This maps to ISO/IEC 42001 human oversight requirements: the statistical engine is the authority, CoScout is the collaborator.

## Not What VariScout Does

VariScout is intentionally **not**:

- A hypothesis testing tool (use Minitab or R for that)
- A predictive modeling platform (use Python/ML tools)
- A DOE analysis system (use JMP or specialized software)
- A statistical verification engine (use academic tools)

VariScout is **the first step** — finding where to focus before investing in deeper analysis.

---

## See Also

- [Business Bible](business-bible.md) — Strategic hypotheses, value levers, and growth flywheel
- [Four Lenses](four-lenses/index.md) — The methodology framework
- [Two Voices](two-voices/index.md) — Control limits vs specification limits
- [Drill-Down](four-lenses/drilldown.md) — Progressive analysis methodology
- [Progressive Stratification](progressive-stratification.md) — Why this UI design is the right answer for variation analysis
