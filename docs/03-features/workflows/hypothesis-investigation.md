# Hypothesis Investigation Flow

Structured root cause investigation using the diamond pattern — diverge, validate, converge.

## Overview

When you identify a key variation driver through drill-down analysis, the next question is _why_. The Hypothesis Investigation Flow provides a structured way to explore possible causes, test them against data and real-world evidence, and converge on confirmed root causes.

The investigation follows a **diamond pattern**:

1. **Start** with a root hypothesis (your best guess at the cause)
2. **Diverge** — generate sub-hypotheses (break the broad cause into testable theories)
3. **Validate** — test each sub-hypothesis using data, gemba inspection, or expert review
4. **Converge** — eliminate contradicted theories, confirm supported ones
5. **Ideate** — brainstorm improvement ideas, attach What-If projections, compare impact vs effort
6. **Act** — select the best idea(s) and define corrective actions

This mirrors how experienced quality engineers think: cast a wide net, then narrow down. VariScout structures this natural process so nothing is lost and the reasoning trail is documented.

## Data Validation vs Gemba/Expert Validation

Not every hypothesis can be tested with data. VariScout supports three validation types:

| Validation Type | When to Use                                      | How It Works                                             |
| --------------- | ------------------------------------------------ | -------------------------------------------------------- |
| **Data**        | The hypothesis links to a factor in your dataset | ANOVA eta-squared automatically validates the hypothesis |
| **Gemba**       | You need to physically inspect something         | Define a task, go look, record what you find             |
| **Expert**      | You need domain knowledge beyond the data        | Consult an expert, record their assessment               |

### Data Validation (Automatic)

Link a hypothesis to a factor column and value. VariScout runs ANOVA and automatically sets the hypothesis status based on eta-squared thresholds:

- **Supported** (>= 15% eta-squared) — the factor explains meaningful variation
- **Contradicted** (< 5% eta-squared) — the factor explains negligible variation
- **Partial** (5-15% eta-squared) — inconclusive, may warrant further investigation

This is the same auto-validation from the existing hypothesis feature, now extended to work within a tree structure.

### Gemba Validation (Go and See)

For hypotheses like "the nozzle tip is worn" or "the conveyor belt is misaligned," you cannot validate from data alone. Create a gemba task:

1. Write what to check ("Inspect nozzle tip wear on Machine 5")
2. Go to the shop floor and inspect
3. Mark the task as completed
4. Record what you found ("Nozzle tip worn 0.3mm beyond tolerance")
5. Set the hypothesis status manually (supported/contradicted/partial)

### Expert Validation (Domain Knowledge)

Similar to gemba, but for questions that require expertise rather than physical inspection. "Could the resin batch variation cause this pattern?" — consult the materials engineer, record their assessment.

## Using the Tree View

### In the Findings Panel

When a finding has hypotheses with sub-hypotheses, the Findings panel can display them in tree view mode. Toggle between List, Board, and Tree views using the view mode selector.

Tree view shows one finding at a time with its full hypothesis tree:

```
Hypotheses                                [+ Add]

● Machine 5 is causing drift               [data]
  ├── ● Worn nozzle tip                   [gemba]
  │     Task: Check nozzle wear           [Done]
  │     "Worn 0.3mm beyond spec"
  ├── ● Temperature instability             [data]
  │     Factor: Temperature  eta=23%
  └── ✗ Operator technique variance         [data]
        Factor: Operator  eta=3%

Progress: 2/3 tested, 1 contradicted
```

- **Status dots** use the standard colors (amber = untested, blue = partial, green = supported, red = contradicted)
- **Factor badges** show the linked factor name and eta-squared percentage
- **Validation type icons** distinguish data, gemba, and expert hypotheses
- **Contradicted hypotheses** are dimmed (50% opacity) with strikethrough text — visible but clearly eliminated
- **Children summaries** show "N children (M supported)" when a node is collapsed

### In the Popout Window

The FindingsWindow popout adds two features for investigation:

**Problem Brief Header** — When you have set a problem statement (in Settings or column mapping), it appears as a compact header at the top of the popout window, keeping the investigation goal visible.

**CoScout Sidebar** — A collapsible sidebar on the right shows the current investigation phase, suggests uncovered factor categories, and provides a link to open CoScout with investigation context pre-loaded.

### Tree Constraints

To keep investigations focused and manageable:

| Constraint   | Limit | Why                                                                    |
| ------------ | ----- | ---------------------------------------------------------------------- |
| Max depth    | 3     | Root, child, grandchild. Deeper means you should decompose differently |
| Max children | 8     | Per parent. More than 8 sub-hypotheses = too broad                     |
| Max total    | 30    | Per finding. Hard cap across the entire tree                           |

## CoScout Investigation Prompts

When AI is configured, CoScout adapts its suggestions to the current investigation phase:

| Phase      | What CoScout Helps With                                                 |
| ---------- | ----------------------------------------------------------------------- |
| Initial    | Suggests possible causes based on the problem and data                  |
| Diverging  | Suggests additional sub-hypotheses, highlights uncovered factor roles   |
| Validating | Suggests how to validate untested hypotheses (data checks, gemba tasks) |
| Converging | Helps evaluate which supported hypotheses are most likely root cause    |
| Acting     | Suggests corrective actions based on the confirmed root cause           |

CoScout also checks which factor categories (equipment, temporal, operator, material, location) have been covered by hypotheses and nudges the analyst to consider uncovered categories. For example, if you have equipment and temporal hypotheses but no material hypothesis, CoScout might suggest: "Have you considered whether raw material batch variation could explain the drift?"

## Example: Machine 5 Packaging Line

### Scenario

Fill weight variation on a packaging line exceeds the +/-2g specification. I-Chart shows a drift pattern starting two weeks ago. ANOVA drill-down identifies Machine 5 as the top contributor (47% eta-squared).

### Investigation

**1. Root hypothesis:** "Machine 5 mechanical issue is causing fill weight drift"

**2. Diverge — generate sub-hypotheses:**

- "Worn nozzle tip" (gemba — needs physical inspection)
- "Temperature controller drift" (data — temperature factor in dataset)
- "Operator technique variance" (data — operator factor in dataset)
- "Vibration from adjacent line" (expert — ask maintenance engineer)

**3. Validate each:**

- **Worn nozzle tip** [gemba]: Go to Machine 5, inspect nozzle. Result: "Tip worn 0.3mm beyond tolerance." Status: **Supported**.
- **Temperature drift** [data]: Link to Temperature factor. eta-squared = 23%. Status: **Supported**.
- **Operator variance** [data]: Link to Operator factor. eta-squared = 3%. Status: **Contradicted**.
- **Vibration** [expert]: Ask maintenance. Result: "Adjacent line was offline during the drift period, no vibration." Status: **Contradicted**.

**4. Converge:**

Two hypotheses supported (worn nozzle + temperature drift), two contradicted. The worn nozzle is the primary root cause hypothesis — it directly explains the mechanical drift and the temperature instability (worn nozzle affects heat transfer).

**5. Ideate improvements:**

With the supported hypotheses identified, brainstorm improvement ideas before committing to actions. Each idea can carry an effort estimate (low/medium/high) and a What-If projection that computes its expected Cpk impact. For example:

- "Replace nozzle tip weekly" (effort: low, projected Cpk: 1.25)
- "Install automated nozzle wear sensor" (effort: high, projected Cpk: 1.40)
- "Tighten temperature controller PID loop" (effort: medium, projected Cpk: 1.15)

Comparing projected impact against effort helps the team select the best option(s) before defining formal actions. Selected ideas flow into the corrective actions list.

**6. Act:**

Mark "Worn nozzle tip" as the root cause hypothesis. Define corrective actions:

- Replace nozzle tip on Machine 5
- Add nozzle inspection to weekly PM checklist
- Calibrate temperature controller after nozzle replacement

After actions are completed and new data confirms Cpk improvement (0.85 to 1.35), the finding is resolved and the root cause is **confirmed**.

## Terminology

VariScout uses deliberate terminology to maintain the distinction between theory and proof:

| Stage                       | Term                  | Meaning                                       |
| --------------------------- | --------------------- | --------------------------------------------- |
| Created                     | Hypothesis            | A testable theory about cause                 |
| Evidence supports it        | Supported Hypothesis  | Data, gemba, or expert evidence supports this |
| Tree converges on it        | Root Cause Hypothesis | Best-supported theory after investigation     |
| Corrective action effective | Confirmed Root Cause  | The fix worked — theory proven correct        |

VariScout never auto-labels anything as "root cause." The analyst explicitly promotes a supported hypothesis when they are confident enough to act on it. Confirmation only happens when the outcome assessment at "Resolved" status shows the fix was effective.

## Platform Availability

| Capability                    | PWA (Free)        | Azure Standard        | Azure Team            |
| ----------------------------- | ----------------- | --------------------- | --------------------- |
| Hypotheses per finding        | 1 (flat, no tree) | Up to 30 (tree)       | Up to 30 (tree)       |
| Validation types              | Data only (auto)  | Data + gemba + expert | Data + gemba + expert |
| Gemba/expert tasks            | -                 | Task + completion     | + task assignment     |
| Tree view                     | -                 | Yes                   | Yes                   |
| CoScout investigation sidebar | -                 | Yes (with AI)         | Yes (with AI)         |
| Teams posting on convergence  | -                 | -                     | Yes                   |

## Related Documentation

- [Investigation to Action](investigation-to-action.md) — Full investigation workflow (findings, actions, outcomes)
- [Drill-Down Workflow](drill-down-workflow.md) — ANOVA drill-down mechanics
- [Deep Dive](deep-dive.md) — 30-minute investigation pattern
- [AI-Assisted Analysis](ai-assisted-analysis.md) — CoScout and AI features
- [Findings Components](../../06-design-system/components/findings.md) — Design system specs
- [ADR-020: Investigation Workflow](../../07-decisions/adr-020-investigation-workflow.md) — Architectural decisions
