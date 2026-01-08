# VaRiScout Tool Pages: Concept Note

> Individual educational pages for each VaRiScout Lite tool

---

## The Concept

Each tool in VaRiScout Lite gets its own dedicated page on variscout.com. These pages serve as both **educational resources** and **product demonstrations**.

---

## Why Individual Tool Pages?

### Multiple Entry Points

| User Journey                              | Entry Point          |
| ----------------------------------------- | -------------------- |
| Google search "how to read control chart" | → I-Chart page       |
| LinkedIn post about Pareto analysis       | → Pareto page        |
| Quality manager researching capability    | → Capability page    |
| Green Belt looking for boxplot help       | → Boxplot page       |
| In-app "Learn more" link                  | → Relevant tool page |

**Not everyone enters through the front door.** Tool pages create multiple doors.

### Different Audiences, Different Needs

| Audience         | What They Need                              |
| ---------------- | ------------------------------------------- |
| **Learner**      | "How do I read this chart?"                 |
| **Practitioner** | "When should I use this vs that?"           |
| **Evaluator**    | "Does this tool do what I need?"            |
| **Buyer**        | "What's special about VaRiScout's version?" |

One page serves all four — in the right sequence.

### SEO Value

High-search-volume queries we can capture:

| Query Type | Examples                                                  |
| ---------- | --------------------------------------------------------- |
| How to...  | "how to read a boxplot", "how to interpret control chart" |
| What is... | "what is pareto chart", "what is process capability"      |
| When to... | "when to use I-chart vs X-bar", "when to use pareto"      |
| Examples   | "control chart examples", "capability analysis example"   |

Each tool page becomes a landing page for organic search traffic.

### In-App Help Integration

```
┌─────────────────────────────────────────────────────────────────┐
│  VaRiScout Lite App                                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  I-CHART                              [?] Learn more    │   │
│  │                                            ↓            │   │
│  │  ●  ●     ●    ●                    Opens /tools/i-chart│   │
│  │     ●  ●     ●                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Context-sensitive help:** User confused about control limits? One click to the explanation.

---

## The Five Tools

| Tool           | Pillar   | Question                          | Primary Use         |
| -------------- | -------- | --------------------------------- | ------------------- |
| **I-Chart**    | CHANGE   | "What patterns does time reveal?" | Stability over time |
| **Boxplot**    | FLOW     | "Which factors drive variation?"  | Compare subgroups   |
| **Pareto**     | FAILURE  | "Where do problems concentrate?"  | Prioritize problems |
| **Capability** | VALUE    | "Does it meet customer specs?"    | Spec compliance     |
| **Regression** | (Add-on) | "Is there a relationship?"        | Correlation check   |

---

## What Each Page Should Accomplish

### 1. Answer the Search Query (Immediately)

User searched "how to read boxplot" → First thing they see answers that question.

No fluff. No company intro. **Answer first.**

### 2. Educate Without Overwhelming

| Layer   | Content                                | For Whom      |
| ------- | -------------------------------------- | ------------- |
| Surface | Visual + one-sentence answer           | Skimmers      |
| Middle  | How to read, when to use, data needed  | Learners      |
| Deep    | Patterns, mindset differences, nuances | Practitioners |

**Progressive disclosure.** Don't dump everything at once.

### 3. Enable Data Collection

Many visitors don't have data yet. Show them:

| Question                | Answer                                        |
| ----------------------- | --------------------------------------------- |
| "What data do I need?"  | Data type (continuous, categorical, counts)   |
| "How much?"             | Start with 5, improve as you collect more     |
| "What else to capture?" | Factors for filtering (shift, machine, batch) |
| "How do I start?"       | Simple collection template                    |

**This removes a major barrier:** "I'd love to use this, but I don't have data."

### 4. Show VaRiScout's Implementation

After education, show how VaRiScout does it:

| Standard Tool | VaRiScout Addition                        |
| ------------- | ----------------------------------------- |
| Basic boxplot | Linked filtering across all charts        |
| Control chart | Both control AND spec limits visible      |
| Pareto        | Click to filter, see impact on capability |
| Capability    | Side-by-side before/after comparison      |

**Differentiation through demonstration.**

### 5. Connect to Lean Thinking

Each tool answers a question. But then what?

| Tool Shows                        | Lean Thinking Asks                  |
| --------------------------------- | ----------------------------------- |
| "Shift B has more variation"      | "Go see Shift B. What's different?" |
| "Machine C is the top Pareto bar" | "What's unique about Machine C?"    |
| "Process not capable"             | "What system change is needed?"     |

> VaRiScout finds WHERE to focus. Apply Lean thinking to find WHY — and what to do about it.

### 6. Convert Interest to Action

Every page ends with clear path to product:

```
"Ready to find YOUR patterns?"

[📱 PWA €49/yr]  [📊 Excel €49/yr]  [☁️ Enterprise]
```

---

## Content Depth by Tool

Not all tools need equal depth. Some have more nuance:

| Tool           | Depth  | Why                                                     |
| -------------- | ------ | ------------------------------------------------------- |
| **I-Chart**    | Deep   | Two Voices concept, special vs common cause, patterns   |
| **Boxplot**    | Medium | Straightforward interpretation, linked filtering is key |
| **Pareto**     | Medium | 80/20, cumulative %, drilling down                      |
| **Capability** | Deep   | Cp vs Cpk, spec limits, distribution shape              |
| **Regression** | Light  | Simple correlation check, when to use                   |

---

## Data Requirements by Tool

Each tool has specific data needs. **Start with what you have — even 5 points teaches you something.**

| Tool           | Data Type                    | Start With  | Sweet Spot    | Key Requirements                         |
| -------------- | ---------------------------- | ----------- | ------------- | ---------------------------------------- |
| **I-Chart**    | Continuous measurement       | 5 points    | 30            | Timestamp required, factors for coloring |
| **Boxplot**    | Continuous + Grouping factor | 5 per group | 15+ per group | At least 1 categorical factor            |
| **Pareto**     | Categories or Counts         | 20 total    | 50+           | Category labels, optionally nested       |
| **Capability** | Continuous + Specs           | 10 points   | 30            | USL and/or LSL required                  |
| **Regression** | Two continuous variables     | 10 pairs    | 30            | X and Y must be related measurements     |

### Why 30 is the "Sweet Spot"

The number 30 comes from statistics:

| Concept                   | What Happens at n=30                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| **Central Limit Theorem** | Sampling distribution of the mean approximates normal — regardless of underlying data distribution |
| **t-distribution**        | At 30 degrees of freedom, t-distribution essentially equals normal distribution                    |
| **Practical implication** | After 30 points, additional data gives diminishing returns in statistical confidence               |

**This doesn't mean wait for 30.** It means:

- Start exploring at 5 — patterns emerge early
- Control limits stabilize around 25-30
- After 30, you're statistically "good enough" for most practical purposes

> **Don't wait for "enough" data. Start exploring now. The 30-point mark is when you can trust your conclusions more confidently.**

### Factors Worth Capturing

Even if not sure they matter, capture these for later filtering:

| Category        | Examples                              |
| --------------- | ------------------------------------- |
| **Time**        | Timestamp, Shift, Day of week, Season |
| **People**      | Operator, Team, Trainer               |
| **Equipment**   | Machine, Line, Station, Tool          |
| **Material**    | Batch, Supplier, Grade                |
| **Method**      | Recipe, Process version, Settings     |
| **Environment** | Temperature, Humidity, Location       |

> "Capture factors even if you don't know they matter — VaRiScout can reveal if they do."

---

## Connections Between Tools

Each page should show how tools work together:

### From I-Chart Page:

> "See patterns in time? Use **Boxplot** to find which factor drives them."

### From Boxplot Page:

> "Found a high-variation subgroup? Use **Pareto** to find where problems concentrate within it."

### From Pareto Page:

> "Identified top contributor? Use **Capability** to see the impact of filtering it out."

### From Capability Page:

> "Not capable? Use **I-Chart** to check if it's stable first. Use **Boxplot** to find what drives variation."

**The tools form a system.** Each page hints at the connected workflow.

---

## Educational Philosophy

### Not a Manual — A Thinking Guide

| Manual Approach          | VaRiScout Approach                            |
| ------------------------ | --------------------------------------------- |
| "Click here to add data" | "What question are you asking?"               |
| "The UCL formula is..."  | "Control limits are the voice of the process" |
| "Steps to create chart"  | "What patterns should you look for?"          |

**Teach thinking, not clicking.**

### Practitioner Language

| Academic                      | Practitioner          |
| ----------------------------- | --------------------- |
| "Statistical process control" | "Is it stable?"       |
| "Capability index"            | "Does it meet specs?" |
| "Interquartile range"         | "Where's the spread?" |
| "Assignable cause"            | "What changed?"       |

**Speak like they think.**

### Visual First

Every concept should be **shown** before explained:

```
BAD:  "A boxplot displays the distribution of data through quartiles..."

GOOD: [Visual of boxplot with clear labels]
      "The box shows where 50% of your data falls."
```

---

## Relationship to Other Site Content

```
variscout.com
│
├── /                       → Hero + Journey
│
├── /journey                → Full scroll experience (uses all tools)
│
├── /cases                  → Case library (tools in context)
│
├── /tools                  → Tool education hub
│   ├── /i-chart           → Deep dive
│   ├── /boxplot           → Deep dive
│   ├── /pareto            → Deep dive
│   ├── /capability        → Deep dive
│   └── /regression        → Deep dive
│
├── /learn                  → Conceptual content
│   ├── /two-voices        → Control vs Spec limits
│   ├── /four-pillars      → Watson's methodology
│   └── /variation-drivers → EDA for process improvement
│
├── /products               → Product comparison
│
└── /pricing                → Pricing table
```

### How They Connect

| Content Type    | Purpose                     | Links To                                  |
| --------------- | --------------------------- | ----------------------------------------- |
| **Journey**     | Experience the methodology  | Tool pages for "learn more"               |
| **Cases**       | See tools in context        | Tool pages for deep dive                  |
| **Tool pages**  | Understand individual tools | Cases for examples, Journey for full flow |
| **Learn pages** | Conceptual understanding    | Tool pages for application                |

---

## Success Metrics

### Per Tool Page

| Metric                 | Target                   | Why It Matters          |
| ---------------------- | ------------------------ | ----------------------- |
| Organic search traffic | Growing month-over-month | SEO working             |
| Time on page           | >2 minutes               | Content engaging        |
| Scroll depth           | >70%                     | Content useful          |
| Demo interaction rate  | >40%                     | Tool demonstrated       |
| Click to product       | >10%                     | Conversion path working |
| In-app help clicks     | Tracked                  | Integration valuable    |

### Cross-Page

| Metric                   | Target | Why It Matters       |
| ------------------------ | ------ | -------------------- |
| Tool page → Case page    | >15%   | Connected content    |
| Tool page → Another tool | >20%   | System understanding |
| Tool page → Product      | >10%   | Conversion           |

---

## Key Decisions to Make

### 1. Depth vs Breadth

| Option                                  | Pros               | Cons                  |
| --------------------------------------- | ------------------ | --------------------- |
| **Deep pages** (2000+ words)            | SEO, comprehensive | May overwhelm         |
| **Concise pages** (500-800 words)       | Scannable, focused | May miss SEO          |
| **Layered pages** (expandable sections) | Best of both       | More complex to build |

**Recommendation:** Layered pages with progressive disclosure.

### 2. Interactive Demo Placement

| Option             | Pros                 | Cons               |
| ------------------ | -------------------- | ------------------ |
| **Top of page**    | Immediate engagement | May skip education |
| **Middle of page** | After context        | Interrupts reading |
| **Bottom of page** | After full education | May not reach it   |
| **Sticky sidebar** | Always available     | Screen space       |

**Recommendation:** After "How to Read" section, before "VaRiScout Features."

### 3. Case Data vs Generic Examples

| Option                          | Pros             | Cons           |
| ------------------------------- | ---------------- | -------------- |
| **Generic examples**            | Universal        | Less memorable |
| **Case data** (cookies, coffee) | Story, memorable | Context needed |
| **Both**                        | Flexibility      | More content   |

**Recommendation:** Use case data with brief context. Connects to case library.

### 4. Video vs Text vs Interactive

| Format                   | Best For                      |
| ------------------------ | ----------------------------- |
| **Text + visuals**       | SEO, skimmers, reference      |
| **Short video** (30-60s) | Visual learners, social       |
| **Interactive demo**     | Hands-on learners, conversion |

**Recommendation:** All three. Text for SEO, video for engagement, demo for conversion.

---

## Summary

### The Concept in One Sentence

> Individual tool pages that educate practitioners, demonstrate VaRiScout's implementation, and convert interest to product trials — while capturing organic search traffic.

### The Formula

```
Answer the Question (SEO, immediate value)
        ↓
Teach How to Read (education)
        ↓
Show Patterns to Find (practitioner value)
        ↓
Demonstrate VaRiScout (differentiation)
        ↓
Two Mindsets: EDA vs Traditional (positioning)
        ↓
Connect to Lean Thinking (action)
        ↓
Convert to Product (business value)
```

### Next Steps

1. **UI/UX Design** — How should the page look and feel?
2. **Template** — Consistent structure across all tools
3. **Content Creation** — Write each tool page
4. **Demo Integration** — Interactive elements
5. **Cross-linking** — Connect to cases, journey, other tools

---

_"Each tool page is a door. Make sure every door leads somewhere valuable."_
