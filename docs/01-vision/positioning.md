---
title: 'Positioning Bible'
audience: [analyst, engineer]
category: reference
status: stable
related: [strategy, positioning, methodology, category, messaging]
---

# Positioning Bible

How we talk about VariScout — at every level, to every audience. A living document that captures the strategic inflection of March–April 2026 and guides all future messaging, product decisions, and documentation.

Companion to the [Constitution](constitution.md) (what we believe) and the [Business Bible](business-bible.md) (how we grow).

---

## 1. The Inflection Point

In March 2026, VariScout stopped being a chart tool with investigation features and became an investigation platform that happens to have great charts.

596 commits across three weeks (March 15 – April 2) delivered six architectural decisions that together represent a category shift:

- **ADR-055**: Investigation promoted from a 320px sidebar to a full-width workspace tab. Five workspace tabs (Overview | Analysis | Investigation | Improvement | Report) now mirror the investigation journey directly in navigation.
- **ADR-056**: Process Intelligence panel redesigned with Questions | Journal | Stats tabs — making the investigation methodology visible in the UI.
- **ADR-057**: CoScout visual grounding — AI now points at chart elements, not just explains in text.
- **ADR-059**: Teams SDK removed, admin-consent permissions eliminated. Zero enterprise friction.
- **ADR-060**: Five-pillar CoScout intelligence architecture — hot context, investigation retrieval, external documents, question interaction, mode-aware methodology coaching.

The workspace tabs aren't UI. They're a published opinion about how process improvement works.

### The Watson Moment

On March 29, an MBB expert sat down with VariScout and visitor/tourism data — not manufacturing data. In four minutes, he naturally followed question-driven investigation:

1. I-Chart on "total" → saw seasonal pattern
2. Created "summer visitors" factor → boxplot by month
3. The question emerged naturally: "For those summer months, which countries have the highest amount?"
4. The gap: "I'm not able to answer with the current data structure"
5. The benchmark: "I can do it in Minitab"
6. The teaching moment: "This is the kind of test you have to do"

He didn't need coaching. The Four Lenses naturally generated the questions. The questions naturally led deeper. The methodology validated itself on non-manufacturing data in real time.

In the same session, he articulated the core philosophy:

> "Don't search for the function first. Don't search for the equation first. Search for which variables make a difference by contributing to the overall explanation of variation and which ones don't."

That quote is VariScout in one sentence.

---

## 2. What VariScout Is

### Core Positioning Statement

**VariScout is structured investigation for process improvement — question-driven, evidence-based, AI-assisted. It turns process data into investigations that end in measurable improvement.**

### What VariScout Is Not

- **Not a dashboard tool.** Dashboards show what happened. VariScout helps you figure out why and guides you to fix it.
- **Not a statistics package.** Statistics are one evidence type. VariScout structures the investigation around them.
- **Not an AI analytics tool.** AI assists. The methodology and the team drive the investigation.

### Multi-Level Pitch

| Context                 | Pitch                                                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **One sentence**        | VariScout guides structured investigations that turn process data into measurable improvement.                                                                                                                                              |
| **Dinner / elevator**   | You paste your data, VariScout shows you where the problems are. Then your team goes and checks — photos, observations, expertise. It guides the whole investigation, not just the data part.                                               |
| **Website hero**        | Turn process data into structured team investigations. Generate questions from data. Answer them with statistics, gemba observations, and team expertise. Prove your fix worked.                                                            |
| **Marketplace listing** | Structured investigation for process improvement. Question-driven analysis that guides teams from concern to measured result — combining data analysis, gemba observations, and expert knowledge in one investigation flow, assisted by AI. |
| **Internal strategy**   | VariScout is the first tool that embodies structured EDA investigation as a product. The methodology (Turtiainen 2019) is the product. The AI augments. The collaboration scales it. The knowledge accumulates.                             |

---

## 3. The Investigation Method

### Four Phases — Investigation as Navigation

The investigation journey is encoded in the workspace tabs:

| Phase           | Question                   | Lens                                                                                      | Workspace           |
| --------------- | -------------------------- | ----------------------------------------------------------------------------------------- | ------------------- |
| **FRAME**       | What am I looking at?      | Column mapping, factor selection, analysis brief                                          | Overview → Analysis |
| **SCOUT**       | Where does variation live? | Four Lenses (I-Chart, Boxplot, Pareto, Stats), linked filtering                           | Analysis            |
| **INVESTIGATE** | Why is this happening?     | Question tree, three evidence types, CoScout collaboration                                | Investigation       |
| **IMPROVE**     | What do we do about it?    | Design thinking: synthesis → ideation → risk prioritization → PDCA actions → verification | Improvement         |
| **REPORT**      | What did we learn?         | Knowledge capture, audit trail, audience-adapted reports                                  | Report              |

Each phase serves a different purpose — discovery (where does variation live?), understanding (why is this factor significant?), and verification (did the fix work?). The same tool serves all phases; the workspace changes the lens.

### Three Evidence Types — Investigation Beyond the Desk

No variation problem is solved from a desk alone (Constitution §7):

1. **Data evidence** — η², R²adj, ANOVA, Cpk. Automatic, computed from the dataset. The statistical engine is the authority.
2. **Gemba evidence** — Go-and-see observations, photos from the process, site visits. The physical world provides context that data cannot.
3. **Expert knowledge** — Team members contributing domain expertise, validating findings. The people who run the process know things the data doesn't show.

These three types converge in the question tree: each question can be validated by data, gemba, or expert evidence. The investigation isn't complete until the evidence types corroborate.

Teams can also upload organizational documents — SOPs, FMEAs, control plans, previous investigation reports — that become searchable context for CoScout. The AI draws on both the live investigation and the organization's accumulated process knowledge.

### Question-Driven EDA (Turtiainen 2019)

The investigation methodology is grounded in _"Mental Model for Exploratory Data Analysis Applications for Structured Problem-Solving"_ (LUT University, 2019), validated by nine Lean Six Sigma Master Black Belt experts across multiple industries.

The core flow:

```
Issue Statement (vague)
    → Questions generated from data + Factor Intelligence
        → Findings (evidence-backed answers)
            → Problem Statement (precise, actionable)
                → Improvement actions with measured outcomes
```

- Investigation starts from questions, not theories (Constitution §5)
- Multiple suspected causes are correct outcomes, not failures
- The question tree tracks status: Open → Investigating → Answered / Ruled Out
- Each answered question sharpens the problem statement

This methodology works identically on manufacturing data (fill weight variation), healthcare data (patient wait times), service data (call handle times), government data (processing times), and any domain with repeated measurements and factors.

---

## 4. The Competitive Frame

VariScout occupies a space that existing tools leave empty:

| Tool                   | What it does well                         | What it doesn't do                                                         |
| ---------------------- | ----------------------------------------- | -------------------------------------------------------------------------- |
| **Minitab / JMP**      | Computes statistical tests with precision | Doesn't guide which test to run or structure the investigation journey     |
| **Power BI / Tableau** | Creates interactive dashboards            | Doesn't help investigate why or track questions to evidence-backed answers |
| **Excel**              | Stores and charts data flexibly           | No investigation structure, no linked filtering, no evidence capture       |
| **InfinityQS**         | Monitors production quality at scale      | Enterprise-heavy implementation, no question-driven investigation          |
| **VariScout**          | **Guides structured investigation**       | The methodology is the product                                             |

### The Unique Combination

No other tool combines all of these in one flow:

1. **Structured EDA methodology** — question-driven investigation with a published, peer-reviewed foundation
2. **Four simultaneous linked views** — I-Chart, Boxplot, Pareto, Stats with cross-chart filtering
3. **Question-driven investigation** — questions generated from data, tracked to answers
4. **Three evidence types** — data, gemba observations, and expert knowledge
5. **AI collaboration** — CoScout explains, suggests, remembers, and points at charts. Teams upload SOPs, FMEAs, and process documents that CoScout searches during investigation — organizational knowledge becomes part of the conversation.
6. **Design thinking for improvement** — Improvement actions emerge through structured ideation: synthesis of root causes, idea generation and grouping, risk-based prioritization (3×3 matrix), and conversion to tracked PDCA actions. The creative problem-solving is as structured as the analytical investigation.
7. **Measured improvement** — Cpk before/after, verified outcomes, organizational knowledge

### The Core Differentiator

Most tools assume the practitioner already knows what to look for. VariScout guides the investigation from "something's wrong" to "here's proof it's fixed." The methodology does the structuring so the analyst can focus on thinking.

---

## 5. Audience-Specific Messaging

| Audience                 | What they care about                              | Lead with                                                                                                                                      |
| ------------------------ | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Business leader**      | "My process isn't performing. Why?"               | Guides you from concern to measured result — no statistics degree needed. Paste your data, see where problems are, investigate with your team. |
| **Quality engineer**     | "I need more than Excel but less than Minitab"    | Four Lenses with linked filtering. Question-driven investigation. Unlimited users from €79/month.                                              |
| **OpEx / LSS leader**    | "I need tools for my team's improvement projects" | PDCA built into the investigation flow. Three evidence types. Team collaboration. AI knowledge that accumulates across projects.               |
| **Trainer / consultant** | "I need a tool that teaches the methodology"      | Free PWA teaches structured EDA — same methodology, same lenses. The guided investigation builds statistical intuition.                        |
| **IT / Procurement**     | "Is this safe? Is it worth it?"                   | Zero admin-consent permissions. Customer-owned data in their Azure tenant. Browser-based, offline-capable. Unlimited users per deployment.     |

### Audience-Journey Mapping

| Audience             | Entry point           | First experience                                                                | Upgrade trigger                           |
| -------------------- | --------------------- | ------------------------------------------------------------------------------- | ----------------------------------------- |
| **Business leader**  | Direct link, referral | Paste data → see where variation lives → understand the investigation structure | "My team needs to do this systematically" |
| **Quality engineer** | Google, LinkedIn      | PWA with sample data → linked filtering "magic moment" → own data               | "I need to save this and come back to it" |
| **OpEx leader**      | Referral, case study  | Team demo → see investigation + improvement flow → pilot project                | "This captures the full PDCA cycle"       |
| **Trainer**          | LinkedIn, conference  | PWA in training session → students learn through guided investigation           | "I want to embed this in my curriculum"   |

---

## 6. The Product Ladder

The positioning flows through product tiers as ascending levels of investigation capability:

| Tier                  | Role in the story              | What it proves                                                                                                                                          |
| --------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PWA (Free)**        | Learn structured investigation | The methodology works on any data. The Four Lenses reveal what Excel can't. Guided frustration builds statistical intuition. The struggle is the point. |
| **Standard (€79/mo)** | Do it professionally           | Save investigations. Full analysis suite with all modes. AI assists the investigation. Persistence between sessions. Up to 6 factors, 250K rows.        |
| **Team (€199/mo)**    | Do it as an organization       | Shared investigations. Gemba photos from the floor. Knowledge base that accumulates. AI that remembers what worked across projects. Unlimited users.    |

### Upgrade Triggers

The upgrade isn't about features — it's about **scale of impact**:

- **Free → Standard**: "I want to save this investigation and come back to it." The analyst hits the PWA's session-only limitation after their first real investigation.
- **Standard → Team**: "My team needs to see this. The operator on the floor needs to add their observations." The investigation outgrows a single analyst.

AI features (NarrativeBar, ChartInsightChips, CoScout) are included in all Azure plans — the customer deploys their own Azure AI Foundry resources. The Team plan adds the Knowledge Base layer that turns individual investigations into organizational learning.

---

## 7. The Knowledge Flywheel

### The Long-Term Moat (H9)

> After 50+ resolved findings, CoScout has genuine organizational knowledge. "Last time this happened on Line 3, we changed the nozzle spacing and Cpk went from 0.6 to 1.4."

### How It Works

1. **Team investigates** — questions generated, evidence gathered, findings carry Cpk values and verified outcomes (not subjective RPN scores)
2. **Findings resolve** — resolved findings feed the knowledge base with measurement-backed outcomes
3. **Next investigation** — CoScout suggests based on organizational history, not just current data
4. **Improvement measured** — Cpk before/after proves the fix worked. Knowledge is verified, not assumed.

### Why This Is Defensible

- **Customer-owned**: Knowledge stays in the customer's Azure tenant. No vendor lock-in on data.
- **Measurement-backed**: Traditional FMEA uses subjective 1-10 RPN scores. VariScout findings carry actual Cpk values and verified outcomes.
- **Investigation-structured**: Knowledge isn't raw documents — it's question → evidence → conclusion → outcome chains, enriched by uploaded SOPs and FMEAs that provide organizational context.
- **Accumulating**: Each resolved finding makes the next investigation faster. The moat deepens with usage.

### The Flywheel

```
Structured investigation
    → Evidence-backed findings
        → Measured improvement (Cpk before/after)
            → Knowledge base grows
                → AI suggests from history
                    → Next investigation is faster
                        → More resolved findings
                            → Deeper knowledge
```

No competitor captures the full PDCA cycle with verified outcomes feeding an AI knowledge base.

---

## 8. Methodology as Brand

### The Academic Foundation

VariScout's investigation methodology is grounded in published, peer-reviewed academic research:

- **Turtiainen (2019)**: _"Mental Model for Exploratory Data Analysis Applications for Structured Problem-Solving"_ — Master's thesis, LUT University. Validated by nine Lean Six Sigma Master Black Belt experts across manufacturing, healthcare, and service industries.
- **Builds on**: Shewhart's control charts (1924), Tukey's Exploratory Data Analysis (1977), Juran's Pareto principle (1950s), Watson's structured EDA approach (2015).
- **The methodology is published and peer-reviewed.** The product is the implementation.

### Expert Validation

The March 29, 2026 expert testing sessions demonstrated that:

1. The question-driven investigation methodology works on non-manufacturing data (visitor/tourism) without modification
2. An MBB expert naturally follows the investigation flow without coaching
3. The Four Lenses generate questions that lead to deeper investigation
4. The probability plot serves as a process diagnostic tool (inflection points = process transitions, steepness = capability)

Key teaching from the sessions:

> "Don't search for the function first. Don't search for the equation first. Search for which variables make a difference by contributing to the overall explanation of variation and which ones don't. So that's best subsets regression. That's what you teach first."

This teaching progression — understanding before modeling, variables before functions — is the design philosophy behind VariScout's Factor Intelligence and progressive stratification.

### The Brand Proposition

VariScout is the only tool that implements a validated EDA methodology as a product. The investigation structure is not a feature bolted onto a chart tool — it is the product. The charts, the AI, the collaboration, the knowledge base all serve the investigation.

The methodology works on any data with repeated measurements and factors. Manufacturing, healthcare, logistics, government services, education — the questions are different, the investigation structure is the same.

**The methodology is the brand. The investigation is the product. The knowledge is the moat.**
