---
title: Question-Driven EDA — CoScout Analysis Planning
audience: [analyst, engineer]
category: workflow
status: draft
related: [eda-mental-model, coscout, factor-intelligence, investigation, findings]
---

# Question-Driven EDA — CoScout Analysis Planning

> Implementing Turtiainen's EDA Mental Model (2019) in VariScout: Issue Statement → Questions to Check → Findings as Answers → Problem Statement with multiple suspected causes.

## Problem

Today, VariScout's investigation flow has a gap between FRAME (setup) and INVESTIGATE (hypothesis tree). The analyst enters a problem statement and upfront hypotheses during data import, then explores charts in SCOUT, but:

1. **No Analysis Planning step** — the rich context from the Analysis Brief (problem statement, hypotheses, factors) isn't synthesized into actionable questions
2. **Findings are standalone observations** — they don't link to the questions that motivated them
3. **The hypothesis tree is theory-first** — the analyst creates a formal hypothesis before having enough evidence, then works backward to validate it
4. **Single root cause enforced** — `causeRole` allows only one primary per tree, but real investigations often identify multiple contributing causes
5. **No progressive sharpening** — the problem statement is static text entered once, not an evolving understanding that gets more precise as analysis progresses

## Foundation: The EDA Mental Model

The design is grounded in Turtiainen's Master's thesis _"Mental Model for Exploratory Data Analysis Applications for Structured Problem-Solving"_ (LUT, 2019), validated by 9 Lean Six Sigma Master Black Belt experts. Key principles:

### Issue Statement vs. Problem Statement

- **Issue Statement** (input): A vague concern that initiates investigation. Watson (2019a): _"a concern that arises as a difference between customer expectation and their observations."_ Example: _"Some parts are delivered later than others by supplier."_
- **Problem Statement** (output): Precise, answering Watson's three questions: (1) What measure needs to change? (2) How should it change? (3) What is the scope? Example: _"Decrease cycle time of process step 2 for product A."_

The issue statement **evolves** through iterative EDA loops. Each answered question sharpens it until a problem statement can be formulated.

### Three EDA Levels (progressive depth)

| Level       | Input                         | Analysis Focus                           | Output            |
| ----------- | ----------------------------- | ---------------------------------------- | ----------------- |
| **Level 1** | Performance deviation noticed | Y-measure, high-level sub-groups         | Issue Statement   |
| **Level 2** | Issue Statement               | Process flow details, middle-level X's   | Problem Statement |
| **Level 3** | Problem Statement             | Operational details, product/process X's | Solutions Space   |

### Inner PDCA Loop (Figure 44 of thesis)

Each EDA level contains an iterative loop: **Analysis Planning → Data Organizing → Exploratory Analysis → Evaluation**. The Evaluation step has three possible outcomes:

1. Output for next level (issue/problem statement/solutions space)
2. Trigger for another rotation at the same level (additional questions to check)
3. Trigger for deeper exploration (more detail needed)

## Design

### 1. Issue Statement (renamed from "Problem Statement")

The existing `problemStatement` field in the Analysis Brief is renamed to **Issue Statement**. It is the starting seed — a vague concern, not a precise problem.

**Changes:**

- Rename label in ColumnMapping Analysis Brief section: "Problem Statement" → "Issue Statement"
- Rename in ProcessContext type: `problemStatement` → `issueStatement`
- Add new field: `problemStatement` — this is the OUTPUT, formulated when enough questions are answered
- Issue statement is editable throughout SCOUT (not just during FRAME)
- CoScout (when available) suggests sharpened versions as findings accumulate

**Issue Statement sharpening example:**

1. Start: _"Fill weight on line 3 is too variable"_
2. After Shift finding: _"Fill weight variation on line 3 is driven by night shift"_
3. After Head finding: _"...night shift, heads 5-8"_
4. After capability check: _"...Cpk 0.62, target 1.33"_

### 2. Question Generation (Two Sources)

Questions are generated from two complementary sources and merged into a single ranked checklist.

#### Source A: Factor Intelligence Layer 1 (deterministic, always available)

Best Subsets R²adj ranking runs when SCOUT begins (already implemented). Each factor and factor combination becomes a question:

- **Single factors:** "Does [Factor] explain variation?" with R²adj percentage
- **Factor combinations:** "Does [Factor A] + [Factor B] together explain more?" with R²adj
- **Auto-answered:** Factors with R²adj < 5% are automatically marked as "ruled out" — these are negative learnings captured without analyst effort

#### Source B: Heuristic + CoScout (AI layer, Azure with CoScout only)

CoScout generates additional questions from context that Factor Intelligence can't derive:

- From issue statement text: natural language understanding of what the analyst cares about
- From upfront hypotheses in Analysis Brief: "Is Night shift worse?" (from analyst's prior hypothesis)
- From factor roles (auto-detected column keywords): temporal questions, equipment questions
- From spec limits: "Is the process capable?" (always relevant when specs exist)
- From data patterns: "Is there a time trend?" (I-Chart stability)

#### Merged Checklist (ranked)

| Priority  | Question                                            | Source                  | Status          |
| --------- | --------------------------------------------------- | ----------------------- | --------------- |
| R²adj=52% | Does Shift + Fill Head combination drive variation? | Factor Intel L1         | open            |
| R²adj=34% | Does Shift alone explain variation?                 | Factor Intel L1         | open            |
| —         | Is the process in statistical control?              | Heuristic               | open            |
| —         | Is Head 7 specifically different?                   | Upfront hypothesis      | open            |
| R²adj=2%  | Does Material Batch matter?                         | Factor Intel L1         | auto: ruled out |
| —         | Is the process capable?                             | Heuristic (specs exist) | open            |

Questions with R²adj evidence are ranked by it. Heuristic questions are interleaved based on relevance. Auto-ruled-out questions sort to the bottom but remain visible (negative learnings).

#### Layer 2-3 Follow-Up Questions (gated, emerge as earlier questions are answered)

When Layer 1 questions are answered (R²adj > 5%), deeper questions auto-generate:

- **Layer 2 (Main Effects):** "Is Night shift specifically worse than Day?" — X-level target questions that turn "the factor matters" into "HERE is the problem"
- **Layer 3 (Interactions, gated: ≥2 significant main effects):** "Do Shift and Fill Head interact — is the Head 5-8 problem worse on Night shift?" — questions that progressive stratification alone cannot answer

These appear in the checklist as children of the parent question, forming the question tree.

### 3. Question Lifecycle

**Question states:**

- `open` — not yet checked
- `answered` — checked, finding linked (with evidence: yes/no/partial)
- `auto-answered` — Factor Intelligence determined the answer (R²adj < 5% = ruled out; or auto-validated via η² thresholds)
- `ruled-out` — explicitly ruled out by analyst or auto-answer

**When a question is answered:**

1. A Finding is linked to the question (existing finding mechanism — captures filter state, stats snapshot, chart source)
2. The issue statement is suggested to sharpen (CoScout proposes update; without CoScout, analyst edits manually)
3. Follow-up questions may spawn from Factor Intelligence L2-3 or from CoScout context
4. The question tree grows — follow-up questions are children of the answered question

**Clicking any question (regardless of status):**

- The dashboard switches to show the evidence: the relevant factor is applied to the boxplot/pareto, filters are set if scoped
- Same as clicking a filter chip — no context switch, charts update in place
- For auto-answered "ruled out" questions: the dashboard shows the flat boxplot (η²=2%), the analyst can point to it and explain "we checked, it doesn't matter"

**This is critical for the analyst's workflow:** questions come from colleagues, management, sponsors. When someone asks "did you check material batch?", the analyst clicks the question and the dashboard shows the evidence. The question checklist is a **presentation tool**, not just a tracking tool.

### 4. Question Tree (reframed Hypothesis Tree)

The existing hypothesis tree data model is reframed semantically. The tree mechanics (parentId, linkedFindingIds, factor/level linking, validation types, depth limits) remain the same.

**Semantic mapping:**

| Current field      | Current meaning                         | New meaning                                                                   |
| ------------------ | --------------------------------------- | ----------------------------------------------------------------------------- |
| `text`             | Hypothesis statement                    | Question text                                                                 |
| `parentId`         | Parent hypothesis                       | Parent question (spawned from)                                                |
| `factor` / `level` | Factor being tested                     | Factor/level the question is about                                            |
| `status`           | supported/contradicted/partial/untested | answered-yes/answered-no/partial/open                                         |
| `linkedFindingIds` | Evidence for hypothesis                 | Findings that answer this question                                            |
| `validationType`   | data/gemba/expert                       | Same — some questions need floor visits                                       |
| `causeRole`        | primary/contributing (one primary max)  | suspected-cause/contributing/ruled-out (**multiple suspected-cause allowed**) |
| `ideas`            | Improvement ideas                       | Same — attached to suspected-cause questions                                  |

**Key change: Multiple suspected causes.** Remove the one-primary-per-tree constraint in `setCauseRole`. Multiple questions can be marked as `suspected-cause`. The problem statement synthesizes all of them, ranked by evidence (η²/R²adj).

**Tree depth max 3 (unchanged):** Initial question → follow-up → deep follow-up. Maps to thesis Level 1 → Level 2 → Level 3.

### 5. Problem Statement + Suspected Causes (conclusion)

The Problem Statement is the **output** of SCOUT, not the input. It emerges when enough questions are answered to satisfy Watson's three elements:

1. **What measure needs to change?** — the Y-measure (already selected in FRAME)
2. **How should it change?** — direction + target (from improvement target in Brief, or from capability findings)
3. **What is the scope?** — the intersection of all suspected causes (factors + levels identified)

**Multiple suspected causes (ranked by evidence):**

1. Night shift / Operator B technique (η²=34%) — suspected cause
2. Heads 5-8 mechanical wear (η²=22%) — suspected cause
3. Shift × Head interaction: worse together (ΔR²=4%) — contributing
4. ~~Material batch~~ — ruled out (R²adj=2%)

Each suspected cause becomes an improvement target in the IMPROVE phase. Ruled-out answers are preserved as negative learnings (ISO 10.2 compliance).

### 6. UI: Investigation Panel (evolved Findings Panel)

The existing Findings panel evolves into an **Investigation panel** that houses the full question-driven workflow. It retains all current findings functionality and adds the question layer.

**Architecture:**

- **Stats Sidebar** (left) = pure data view — numbers, distributions, Factor Intelligence ranking
- **Investigation Panel** (findings panel, inline or popout) = the analytical journey — questions, answers, conclusions
- **CoScout** (right sidebar) = conversational companion — works across both
- **Dashboard** (center) = visual evidence — Four Lenses, updated when questions are clicked

**Investigation Panel structure:**

| Section               | Content                                                   | Always visible?                        |
| --------------------- | --------------------------------------------------------- | -------------------------------------- |
| **Issue Statement**   | Editable text at the top, sharpens over time              | Yes                                    |
| **Questions**         | Ranked checklist with status dots, clickable              | Yes (collapsible)                      |
| **Findings**          | Finding cards linked to questions, existing functionality | Yes                                    |
| **Question Tree**     | Replaces hypothesis tree view — same mechanics            | Toggle (tree/board/list views)         |
| **Problem Statement** | Emerging conclusion — measure + direction + scope         | Appears when enough questions answered |
| **Suspected Causes**  | Multiple, ranked by evidence, with improvement ideas      | Appears with problem statement         |

**Popout window:** The Investigation panel can be opened in a separate window (existing popout capability). This becomes the **presentation view** for meetings — walk through issue → questions → answers → suspected causes → problem statement.

**Factor Intelligence feeds the Investigation panel:** R²adj ranking from the Stats sidebar generates questions in the Investigation panel. The analyst can look at Factor Intelligence for raw numbers, or the Investigation panel for the analytical narrative. Factor Intelligence is the engine; the Investigation panel is the dashboard.

### 7. Without CoScout (PWA + Azure AI-off)

The question model works without AI because Factor Intelligence is deterministic.

| Capability                            | PWA (free, ≤3 factors) | Azure no AI (≤6 factors) | Azure + CoScout  |
| ------------------------------------- | ---------------------- | ------------------------ | ---------------- |
| Issue Statement field                 | Yes                    | Yes                      | Yes              |
| Factor Intel L1-3 questions           | Yes                    | Yes                      | Yes              |
| Auto-answered (R²adj < 5%)            | Yes                    | Yes                      | Yes              |
| Click question → dashboard            | Yes                    | Yes                      | Yes              |
| Finding links to question             | Yes                    | Yes                      | Yes              |
| Multiple suspected causes             | Yes                    | Yes                      | Yes              |
| Heuristic questions (from issue text) | No                     | No                       | Yes              |
| Issue statement auto-sharpening       | Manual only            | Manual only              | CoScout suggests |
| Problem statement formulation         | Manual only            | Manual only              | CoScout assists  |
| Natural language follow-ups           | No                     | No                       | Yes              |

**PWA gets the statistical backbone.** CoScout adds the natural language layer. The core question-driven workflow works everywhere.

### 8. Interaction with Existing Features

**Progressive Stratification:** Unchanged. Drill-down via filter chips still works. Questions provide a structured overlay on top of the existing drill-down — the analyst can follow questions OR drill freely. Questions auto-update status when findings are pinned during drill-down.

**CoScout Tools:** The existing `create_hypothesis` tool becomes `create_question` (or adds a question variant). `suggest_save_finding` can link to a question. `buildSuggestedQuestions()` is replaced/extended by the question checklist.

**NarrativeBar + ChartInsightChips:** Unchanged. These are the passive AI layer; questions are the active investigation layer.

**Report View:** The problem statement + suspected causes + ruled-out factors become a natural "Investigation Summary" section in reports.

**Staged Analysis (IMPROVE):** Before/after comparison verifies whether the suspected causes were actually addressed. Multiple suspected causes means multiple verification targets.

### 9. Question-Finding Auto-Link UX

The question model is an invisible thinking structure — the analyst interacts with charts and findings (familiar patterns). Questions organize their thinking; linking happens automatically.

**Click question → spotlight:** Clicking a question in the checklist applies `selectedGroups` on the boxplot for the question's factor/level (full opacity, others dim to 30%). If the question is about a different factor, the boxplot switches factors. This is the same visual as clicking a boxplot category directly.

**Auto-link finding to focused question:** When the analyst pins a finding (via chart context menu, CoScout proposal, or any existing creation path) while a question is "in focus" (last clicked), the finding automatically links to that question via `hypothesisId`. The question status updates based on evidence (η² ≥15% → supported, <5% → contradicted, 5-15% → partial).

**Auto-generated finding text (both-layered):** When a finding is created from a question context, the system generates deterministic text first ("Shift: η²=34%, Night is worst"). CoScout enriches it asynchronously when available — same pattern as ChartInsightChips (deterministic-first, AI-enhanced). The analyst can always edit the text.

**Chart annotations are opt-in:** Findings appear in the findings list and question checklist. A "Show on chart" toggle (eye icon) on the finding card controls whether ChartAnnotationLayer renders it. Default: hidden. This keeps charts clean — the analyst curates which observations appear visually.

**No "Answer" button:** There is no explicit "answer question" button on question rows. The question row is a single click target (spotlight/navigate). Answering happens through the natural finding creation flow.

## Implementation Phases

### Phase 1: Question Model Foundation

- Rename `problemStatement` → `issueStatement` in Analysis Brief + ProcessContext
- Add `problemStatement` as new output field
- Question data type (reframed from Hypothesis, or new type with migration)
- Question checklist UI in Investigation panel (basic: list with status dots)
- Factor Intelligence L1 → question generation (deterministic)
- Click question → switch dashboard factor/filter
- Multiple `causeRole` allowed (remove one-primary constraint)
- Finding links to question on creation

### Phase 2: Progressive Sharpening

- Issue statement edit-in-place in Investigation panel
- CoScout question generation from issue text + upfront hypotheses (AI layer)
- CoScout suggests issue statement sharpening
- Layer 2-3 follow-up questions (gated, auto-generated)
- Question tree view (replaces hypothesis tree semantics)
- Problem statement formulation (manual + CoScout-assisted)

### Phase 3: Presentation + Reporting

- Investigation panel popout as presentation view
- Problem statement + suspected causes in Report View
- Ruled-out factors as negative learnings section
- Question trail as investigation audit record

## Mode-Aware Extension (Phase 2)

> See [ADR-054: Mode-Aware Question Strategy](../../07-decisions/adr-054-mode-aware-question-strategy.md)

The question model above covers Standard mode. Phase 2 extends question generation to adapt across all analysis modes via `getStrategy().questionStrategy`:

**Integration point:** `AnalysisModeStrategy` in `analysisStrategy.ts` gains a `questionStrategy` field defining the generator, evidence metric, and validation method per mode.

**Implementation sequence:**

1. **Capability adapter** (easiest) — Same data model as Standard. Wraps `generateQuestionsFromRanking()` to reword "variation" → "Cpk" when specs are present. Adds centering-vs-spread diagnostic questions. No new statistical model needed.

2. **Yamazumi generator** (new model) — Create `packages/core/src/yamazumi/questions.ts`. Generates lean questions from `YamazumiBarData[]`: takt compliance, waste composition, waste drivers, temporal trends, kaizen targeting. Evidence: waste contribution %, not R²adj.

3. **Performance adapter** — Wraps questions to focus on channel health ranking. Evidence: channel Cpk.

**Key design constraint:** All changes are additive. The existing Standard mode question pipeline is untouched. Mode routing uses the strategy pattern (ADR-047), not scattered ternaries.

## Key Files to Modify

| File                                                            | Change                                                                      |
| --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `packages/core/src/findings/types.ts`                           | Extend Hypothesis type with question semantics; relax causeRole constraint  |
| `packages/core/src/ai/types.ts`                                 | Rename `problemStatement` → `issueStatement`; add `problemStatement` output |
| `packages/core/src/stats/bestSubsets.ts`                        | Add question generation from R²adj ranking                                  |
| `packages/core/src/ai/suggestedQuestions.ts`                    | Extend with Factor Intelligence-driven questions                            |
| `packages/core/src/ai/prompts/coScout.ts`                       | Update prompts for question-driven workflow                                 |
| `packages/hooks/src/useHypotheses.ts`                           | Relax one-primary constraint; add question lifecycle                        |
| `packages/hooks/src/useFindings.ts`                             | Link finding to question on creation                                        |
| `packages/ui/src/components/ColumnMapping/index.tsx`            | Rename "Problem Statement" → "Issue Statement"                              |
| `packages/ui/src/components/FindingsWindow/`                    | Evolve into Investigation panel with question checklist                     |
| `packages/ui/src/components/FindingsLog/HypothesisTreeView.tsx` | Reframe as Question tree                                                    |
| `packages/ui/src/components/ProcessDescriptionField/`           | May need issue statement variant                                            |
| `apps/azure/src/features/investigation/`                        | New or extended feature module for question state                           |

## Verification

1. **Without AI (PWA):** Load sample data with 3 factors → Factor Intelligence generates ranked questions → click question → dashboard shows factor → pin finding → finding links to question → question status updates
2. **With CoScout:** Enter issue statement → CoScout generates additional questions → answer questions → CoScout suggests issue sharpening → problem statement emerges
3. **Multiple causes:** Two factors show η² > 15% → both marked as suspected cause → problem statement includes both
4. **Negative learning:** Factor with R²adj < 5% → auto-answered "ruled out" → click → dashboard shows flat boxplot → visible in report as "checked, doesn't matter"
5. **Presentation flow:** Open Investigation panel as popout → walk through issue → questions → answers → problem statement → suspected causes

## Documentation Plan

This is a methodology change, not just a feature. Documentation updates are required across multiple layers.

### New Documents

#### 1. Thesis Reference (`docs/01-vision/references/turtiainen-2019-eda-mental-model.md`)

Key excerpts and figure descriptions from Turtiainen (2019) _"Mental Model for Exploratory Data Analysis Applications for Structured Problem-Solving"_ (LUT University). Contains:

- Watson's Issue Statement vs. Problem Statement definitions (§2.2-2.3)
- Three EDA Levels: Level 1 (Y-measure → Issue Statement), Level 2 (Issue → Problem Statement), Level 3 (Problem → Solutions Space) (§6.1)
- Analysis Planning template with 5W+1H questions (Figure 42)
- Inner PDCA loop: Analysis Planning → Data Organizing → Exploratory Analysis → Evaluation (Figure 44)
- Progressive sharpening case study: supplier delivery analysis, 4 EDA loops (§8.2, Figure 58)
- Mind map of analyzed sub-groups showing drill-down logic (Figures 45-46)
- Proper academic citations

#### 2. EDA Methodology (`docs/01-vision/eda-mental-model.md`)

Standalone methodology document synthesizing thesis principles with VariScout's implementation:

1. **Foundation** — The EDA Mental Model (Turtiainen, 2019), scientific method in quality, DMAIC integration
2. **Issue Statement → Problem Statement** — The progressive sharpening concept, Watson's 3 questions
3. **VariScout's EDA Implementation**
   - Four Lenses as parallel exploration (not sequential tools)
   - Factor Intelligence as the question engine (evidence-ranked)
   - Progressive stratification with η² contribution tracking
   - Probability Plot for distribution validation + inflection points
4. **Question-Driven Investigation Flow**
   - Question generation (deterministic + CoScout)
   - Findings as answers, negative learnings
   - Multiple suspected causes
   - Problem Statement as output
5. **Integration with DMAIC/PDCA** — How VariScout's 4-phase journey maps to Lean Six Sigma
6. **References** — Links to thesis reference doc, ADRs, design spec

#### 3. ADR-053: Question-Driven Investigation (`docs/07-decisions/adr-053-question-driven-investigation.md`)

Architecture decision record documenting:

- Context: Hypothesis-first model creates gap between FRAME and INVESTIGATE
- Decision: Adopt question-driven EDA model from Turtiainen (2019)
- Key changes: Issue/Problem statement reframe, question tree replaces hypothesis tree, multiple suspected causes, Factor Intelligence as question engine
- References: Thesis, design spec, methodology doc

### Documentation Updates (by priority)

#### Critical (substantial rewrite)

| Document                                                   | Change                                                                                                                     |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `docs/01-vision/methodology.md`                            | Section 3: "Hypothesis Investigation" → "Question-Driven Investigation"; add Issue vs. Problem Statement; question sources |
| `docs/03-features/workflows/hypothesis-investigation.md`   | Rename to `question-driven-investigation.md`; reframe entire doc from hypotheses to questions                              |
| `docs/05-technical/architecture/mental-model-hierarchy.md` | "Hypothesis Thread" → "Investigation Thread"; update SCOUT/INVESTIGATE phase descriptions                                  |
| `docs/07-decisions/adr-020-investigation-workflow.md`      | Add "Semantic Reframing" section; multiple suspected causes; question lifecycle                                            |

#### Major (significant section updates)

| Document                                                    | Change                                                                              |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `docs/03-features/workflows/investigation-lifecycle-map.md` | Phase descriptions: hypothesis → question language; update sub-flow                 |
| `docs/03-features/workflows/analysis-journey-map.md`        | FRAME: Issue Statement; SCOUT: question generation; INVESTIGATE: question answering |
| `docs/05-technical/architecture/ai-journey-integration.md`  | CoScout behavior per phase: question generation + follow-ups                        |

#### Moderate (terminology + reference updates)

| Document                                                   | Change                                                               |
| ---------------------------------------------------------- | -------------------------------------------------------------------- |
| `docs/05-technical/architecture/ai-context-engineering.md` | Tier 2: "Hypothesis tree" → "Question tree"; rename problemStatement |
| `docs/07-decisions/adr-029-ai-action-tools.md`             | `create_hypothesis` → `create_question` tool variant                 |
| `docs/07-decisions/adr-049-coscout-context-and-memory.md`  | ProcessContext field renaming                                        |

#### Minor (label + reference updates)

| Document                                                         | Change                                                                                |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `CLAUDE.md`                                                      | Add question-driven EDA spec to task-to-doc mapping; update Investigation entry point |
| `docs/06-design-system/patterns/navigation.md`                   | Investigation panel references; question clickability                                 |
| `docs/05-technical/architecture/journey-phase-screen-mapping.md` | Issue statement reference                                                             |
| `docs/01-vision/progressive-stratification.md`                   | One note: "system-suggested question" vs "hypothesis"                                 |
