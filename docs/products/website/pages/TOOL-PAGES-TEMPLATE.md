# VaRiScout Tool Page Template

> Consistent structure for all five tool pages

---

## How to Use This Template

1. Copy this template for each tool page
2. Replace `[TOOL_NAME]` with the tool name (e.g., "I-Chart")
3. Replace `[PILLAR]` with the Watson pillar (CHANGE, FLOW, FAILURE, VALUE)
4. Fill in each section following the guidance
5. Keep the structure consistent across all tools

---

## Page Metadata

```
URL:           /tools/[tool-slug]
Title:         [TOOL_NAME] — VaRiScout | See Beyond Averages
Description:   Learn how to read and use [TOOL_NAME] for process improvement.
               Find patterns, understand variation, take action.
Keywords:      [tool name], [tool synonyms], how to read, interpretation,
               process improvement, variation analysis
```

---

## Section 1: Hero

**Purpose:** Immediate answer + recognition

```markdown
# [ICON] [TOOL_NAME]

[Full name if different] [PILLAR badge]

[HERO VISUAL - Interactive or animated chart]

> "[CORE QUESTION]"

[ONE-SENTENCE ANSWER - what this tool does in plain language]

[↓ Learn more]
```

**Content to provide:**

| Element             | This Tool                         |
| ------------------- | --------------------------------- |
| Icon                | [emoji or custom icon]            |
| Tool name           | [name]                            |
| Full name           | [if abbreviation, spell out]      |
| Pillar              | [CHANGE / FLOW / FAILURE / VALUE] |
| Core question       | [The question this tool answers]  |
| One-sentence answer | [Plain language, no jargon]       |

**Examples from other tools:**

| Tool       | Core Question                     |
| ---------- | --------------------------------- |
| I-Chart    | "What patterns does time reveal?" |
| Boxplot    | "Which factors drive variation?"  |
| Pareto     | "Where do problems concentrate?"  |
| Capability | "Does it meet customer specs?"    |
| Regression | "Is there a relationship?"        |

---

## Section 2: When to Use

**Purpose:** Quick recognition — "yes, this is what I need"

```markdown
## When to Use [TOOL_NAME]

[6 cards in 2x3 grid, each with icon + short phrase]

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ [icon] │ │ [icon] │ │ [icon] │
│ [Use case 1] │ │ [Use case 2] │ │ [Use case 3] │
└─────────────────┘ └─────────────────┘ └─────────────────┘

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ [icon] │ │ [icon] │ │ [Use case 4] │
│ [Use case 4] │ │ [Use case 5] │ │ [Use case 6] │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

**Content to provide:**

| Use Case # | Icon | Short Phrase (3-5 words) |
| ---------- | ---- | ------------------------ |
| 1          |      |                          |
| 2          |      |                          |
| 3          |      |                          |
| 4          |      |                          |
| 5          |      |                          |
| 6          |      |                          |

---

## Section 3: What Data Do You Need?

**Purpose:** Enable action — even without data yet

```markdown
## What Data Do You Need?

### 📊 Data Type

[What kind of data this tool requires]

### 📏 How Much?

| Stage          | Data Points | What You Get            |
| -------------- | ----------- | ----------------------- |
| **Start**      | [X] points  | [What's possible]       |
| **Better**     | [Y] points  | [What improves]         |
| **Sweet spot** | [Z] points  | Statistically confident |

💡 **Why [Z]?** At n=[Z], the t-distribution equals the normal distribution.
After [Z] points, additional data gives diminishing returns.

👉 **Don't wait. Start with [X] and grow.**

### 🏷️ What Else to Capture?

For filtering and deeper analysis, also record:

- [Factor 1]
- [Factor 2]
- [Factor 3]
- [Factor 4]

💡 Capture factors even if you're not sure they matter —
VaRiScout can reveal if they do!

### 🚫 Don't Have Data Yet?

1. Pick ONE measurement that matters
2. Record it with timestamp
3. Note the conditions ([relevant factors])
4. After [X] points → run your first [TOOL_NAME]!

[Download: Simple Data Collection Template →]
```

**Content to provide:**

| Element                | This Tool                                  |
| ---------------------- | ------------------------------------------ |
| Data type              | [Continuous / Categorical / Counts / etc.] |
| Start with             | [X] points                                 |
| Better                 | [Y] points                                 |
| Sweet spot             | [Z] points                                 |
| Key factors to capture | [List 4-6 relevant factors]                |

---

## Section 4: How to Read

**Purpose:** Visual literacy — understand what you're seeing

```markdown
## How to Read [TOOL_NAME]

[ANNOTATED VISUAL with callout lines pointing to each element]

┌─────────────────────────────────────────────────────────────┐
│ │
│ [Chart visual with labeled elements] │
│ │
│ Element A ←─── Explanation of Element A │
│ Element B ←─── Explanation of Element B │
│ Element C ←─── Explanation of Element C │
│ │
└─────────────────────────────────────────────────────────────┘

### Key Concepts

| Element     | What It Shows | Where It Comes From  |
| ----------- | ------------- | -------------------- |
| [Element A] | [Meaning]     | [Source/calculation] |
| [Element B] | [Meaning]     | [Source/calculation] |
| [Element C] | [Meaning]     | [Source/calculation] |

[Link to deeper concept page if applicable, e.g., "Learn more: Two Voices →"]
```

**Content to provide:**

| Element | Label | Meaning | Source |
| ------- | ----- | ------- | ------ |
|         |       |         |        |
|         |       |         |        |
|         |       |         |        |
|         |       |         |        |

**Related concept pages to link:**

- [ ] Two Voices (Control vs Spec limits)
- [ ] Four Pillars methodology
- [ ] Other: ******\_\_\_******

---

## Section 5: Patterns to Find

**Purpose:** Train the eye — what to look for

```markdown
## Patterns to Find

[Grid of pattern cards, each with visual + label + description]

┌─────────────────────────────┐ ┌─────────────────────────────┐
│ [Pattern visual] │ │ [Pattern visual] │
│ │ │ │
│ ⚠️ [PATTERN NAME] │ │ ⚠️ [PATTERN NAME] │
│ [One-line description] │ │ [One-line description] │
└─────────────────────────────┘ └─────────────────────────────┘

┌─────────────────────────────┐ ┌─────────────────────────────┐
│ [Pattern visual] │ │ [Pattern visual] │
│ │ │ │
│ ⚠️ [PATTERN NAME] │ │ ✅ [PATTERN NAME] │
│ [One-line description] │ │ [One-line description] │
└─────────────────────────────┘ └─────────────────────────────┘

[Click any pattern for more detail →]
```

**Content to provide:**

| Pattern | Icon  | Name | Description | What It Means | What to Do |
| ------- | ----- | ---- | ----------- | ------------- | ---------- |
| 1       | ⚠️/✅ |      |             |               |            |
| 2       | ⚠️/✅ |      |             |               |            |
| 3       | ⚠️/✅ |      |             |               |            |
| 4       | ⚠️/✅ |      |             |               |            |
| 5       | ⚠️/✅ |      |             |               |            |
| 6       | ⚠️/✅ |      |             |               |            |

---

## Section 6: Try It (Interactive Demo)

**Purpose:** Hands-on experience with the tool

```markdown
## Try It: [Case Name]

[Brief context - 1-2 sentences about the case]

┌─────────────────────────────────────────────────────────────┐
│ │
│ [INTERACTIVE CHART - Pre-loaded with case data] │
│ │
└─────────────────────────────────────────────────────────────┘

[Filter buttons for relevant factors]
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ ○ All │ │ ● Factor A │ │ ○ Factor B │
└──────────────┘ └──────────────┘ └──────────────┘

💡 [Hint text guiding exploration]

[See full case study →]
```

**Content to provide:**

| Element           | This Tool                    |
| ----------------- | ---------------------------- |
| Case name         | [e.g., "Cookie Weight Case"] |
| Case context      | [1-2 sentences]              |
| Available filters | [List of factors]            |
| Hint text         | [Guide user to discovery]    |
| Link to full case | [URL]                        |

---

## Section 7: VaRiScout Features

**Purpose:** Differentiation — why our implementation is special

```markdown
## What's Special in VaRiScout

[3-4 feature cards, each with icon, title, description, and visual]

┌─────────────────────────────────────────────────────────────┐
│ 🔗 [FEATURE 1 NAME] │
│ │
│ [Description of feature - what it does, why it matters] │
│ │
│ [Visual/animation showing feature in action] │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 👁️ [FEATURE 2 NAME] │
│ │
│ [Description of feature - what it does, why it matters] │
│ │
│ [Visual/animation showing feature in action] │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🎨 [FEATURE 3 NAME] │
│ │
│ [Description of feature - what it does, why it matters] │
│ │
│ [Visual/animation showing feature in action] │
└─────────────────────────────────────────────────────────────┘
```

**Content to provide:**

| Feature # | Icon | Name | Description | Visual Needed |
| --------- | ---- | ---- | ----------- | ------------- |
| 1         |      |      |             |               |
| 2         |      |      |             |               |
| 3         |      |      |             |               |

**Common VaRiScout features across tools:**

| Feature                 | Applicable Tools             |
| ----------------------- | ---------------------------- |
| Linked filtering        | All                          |
| Color by factor         | I-Chart, Boxplot, Regression |
| Two Voices view         | I-Chart, Capability          |
| Click to drill down     | Pareto                       |
| Before/after comparison | Capability                   |

---

## Section 8: Two Mindsets

**Purpose:** Acknowledge different approaches — position VaRiScout clearly

```markdown
## Two Mindsets: Know the Difference

There are two valid ways to use [TOOL_NAME]. VaRiScout follows the EDA mindset.

┌─────────────────────────────────────────────────────────────────┐
│ │
│ 🔍 EDA MINDSET (VaRiScout) 📊 TRADITIONAL MINDSET │
│ ───────────────────────── ────────────────────── │
│ │
│ "Where should I look?" "Is this significant?" │
│ │
│ Start with [X] points Wait for [Y] points │
│ See patterns with eyes Prove with statistics │
│ Directional guidance Statistical certainty │
│ Analysis → Gemba → Action Analysis → Conclusion │
│ Move fast, verify in reality Move slow, be certain │
│ │
│ ───────────────────────────────────────────────────────────── │
│ │
│ BEST FOR: BEST FOR: │
│ • Daily improvement • Publishing research │
│ • Finding where to focus • Regulatory compliance │
│ • Guiding Lean thinking • Final verification │
│ • Operational decisions • High-stakes conclusions │
│ │
└─────────────────────────────────────────────────────────────────┘

### VaRiScout Philosophy

VaRiScout is built for practitioners, not publications.

| We Believe                      | Because                                 |
| ------------------------------- | --------------------------------------- |
| 5 points can reveal a pattern   | Waiting for "enough" data delays action |
| Your eyes are valid instruments | Patterns visible to humans matter       |
| Direction beats precision       | Knowing WHERE to look is the first step |
| Gemba verifies, not statistics  | Reality is the final test               |

### When to Switch Mindsets

| Situation                                               | Use EDA | Use Traditional |
| ------------------------------------------------------- | ------- | --------------- |
| "Which machine should I investigate?"                   | ✅      |                 |
| "Is this difference statistically significant for FDA?" |         | ✅              |
| "Where should we focus our Kaizen?"                     | ✅      |                 |
| "Can we publish this finding?"                          |         | ✅              |
| "What's causing this variation?"                        | ✅      |                 |
| "Has the process capability truly improved?"            |         | ✅              |

> **VaRiScout finds WHERE to focus. Traditional statistics can confirm WHAT you found — if confirmation is needed.**

### What Traditionalists Might Say

A statistician trained in classical methods might question:

| They Say                                              | We Say                                                  |
| ----------------------------------------------------- | ------------------------------------------------------- |
| "[X] points isn't enough"                             | "It's enough to see where to look. We verify at Gemba." |
| "You can't trust patterns without significance tests" | "We're not publishing — we're finding focus."           |
| "This isn't rigorous"                                 | "Rigor comes from reality, not just math."              |
| "You might see false patterns"                        | "Gemba will reveal truth. Cost of looking is low."      |

Both approaches have value. Know which game you're playing.

[Learn more: EDA Philosophy →]
```

**Content to provide:**

| Element                            | This Tool                               |
| ---------------------------------- | --------------------------------------- |
| EDA "start with" points            | [X]                                     |
| Traditional "wait for" points      | [Y]                                     |
| Tool-specific EDA examples         | [2-3 examples of EDA questions]         |
| Tool-specific Traditional examples | [2-3 examples of traditional questions] |
| Common traditionalist objections   | [2-3 things a statistician might say]   |
| VaRiScout responses                | [2-3 practitioner responses]            |

---

## Section 9: What's Next? (Connected Tools)

**Purpose:** Show the workflow — tools work together

```markdown
## What's Next?

[TOOL_NAME] shows [what it reveals]. Then what?

┌────────────────────────────────────────────────────────────┐
│ │
│ [TOOL_NAME] reveals... → [NEXT TOOL] finds... │
│ │
│ "[Specific finding]" → "[Next question]" │
│ │
│ [Explore [NEXT TOOL] →]│
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ │
│ [TOOL_NAME] shows... → Apply Lean Thinking │
│ │
│ "[Specific finding]" → "[Lean action]" │
│ │
│ [Go to Gemba] │
└────────────────────────────────────────────────────────────┘
```

**Content to provide:**

| If [TOOL_NAME] Shows | Then       | Next Action            |
| -------------------- | ---------- | ---------------------- |
| [Finding 1]          | Use [Tool] | [What to look for]     |
| [Finding 2]          | Use [Tool] | [What to look for]     |
| [Finding 3]          | Apply Lean | [Specific Lean action] |

**Tool Connection Map:**

```
I-Chart → Boxplot → Pareto → Capability
   ↓         ↓         ↓          ↓
  Lean     Lean      Lean       Lean
```

---

## Section 10: CTA

**Purpose:** Convert interest to product

```markdown
---
## Where's YOUR pattern?

46% of your variation may be hiding in one place.
Find it. Fix it. Check it. Continue.

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│                 │  │                 │  │                 │
│   📱 PWA        │  │   📊 EXCEL      │  │   ☁️ ENTERPRISE │
│                 │  │                 │  │                 │
│  Browser-based  │  │  Work in Excel  │  │  Team-wide      │
│  €49/year       │  │  €49/year       │  │  €399+/year     │
│                 │  │                 │  │                 │
│  [Get Started →]│  │  [Get Add-in →] │  │  [Contact →]    │
│                 │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘

Same methodology. Choose where you work.
---

### Keep Learning

- [See all cases →]
- [Four Pillars methodology →]
- [Mean & Beyond community →]
```

**Note:** This section is identical across all tool pages.

---

## Tool-Specific Content Checklist

### I-Chart

- [ ] Hero: Core question, one-sentence answer
- [ ] When to Use: 6 use cases
- [ ] Data Requirements: Start 5, Sweet spot 30
- [ ] How to Read: Control limits, spec limits, patterns
- [ ] Patterns: Trend, Shift, Cycle, Run, Out-of-control, Stable
- [ ] Demo: Cookie weight case with shift/line filters
- [ ] Features: Two Voices view, Color by factor, Linked filtering
- [ ] Two Mindsets: EDA (see patterns) vs Traditional (prove stability)
- [ ] Next: → Boxplot, → Capability, → Lean (Gemba, 5 Whys)
- [ ] CTA: Standard

### Boxplot

- [ ] Hero: Core question, one-sentence answer
- [ ] When to Use: 6 use cases
- [ ] Data Requirements: Start 5 per group, Sweet spot 15+ per group
- [ ] How to Read: Median, IQR, whiskers, outliers
- [ ] Patterns: Wide vs narrow, shifted median, outliers, asymmetry
- [ ] Demo: Cookie weight case with machine/shift filters
- [ ] Features: Side-by-side comparison, Color by factor, Linked filtering
- [ ] Two Mindsets: EDA (see differences) vs Traditional (test significance)
- [ ] Next: → Pareto, → I-Chart for time patterns, → Lean
- [ ] CTA: Standard

### Pareto

- [ ] Hero: Core question, one-sentence answer
- [ ] When to Use: 6 use cases
- [ ] Data Requirements: Start 20, Sweet spot 50+
- [ ] How to Read: Bars, cumulative line, 80/20 mark
- [ ] Patterns: Steep curve, flat curve, single dominant bar
- [ ] Demo: Defect types with drill-down
- [ ] Features: Click to filter, nested drill-down, Linked filtering
- [ ] Two Mindsets: EDA (find vital few) vs Traditional (statistical ranking)
- [ ] Next: → Capability to see impact, → Lean (focus on vital few)
- [ ] CTA: Standard

### Capability

- [ ] Hero: Core question, one-sentence answer
- [ ] When to Use: 6 use cases
- [ ] Data Requirements: Start 10, Sweet spot 30
- [ ] How to Read: Distribution, spec limits, Cp, Cpk, % out of spec
- [ ] Patterns: Centered, shifted, wide, narrow, bimodal
- [ ] Demo: Cookie weight with before/after filter
- [ ] Features: Two Voices view, Before/after comparison, Linked filtering
- [ ] Two Mindsets: EDA (see fit) vs Traditional (calculate indices precisely)
- [ ] Next: → I-Chart to check stability, → Boxplot to find source, → Lean
- [ ] CTA: Standard

### Regression

- [ ] Hero: Core question, one-sentence answer
- [ ] When to Use: 6 use cases
- [ ] Data Requirements: Start 10 pairs, Sweet spot 30
- [ ] How to Read: Scatter, trend line, R², residuals
- [ ] Patterns: Linear, no relationship, curved, clusters
- [ ] Demo: Temperature vs quality case
- [ ] Features: Color by factor, Linked filtering
- [ ] Two Mindsets: EDA (see relationship) vs Traditional (prove significance)
- [ ] Next: → Designed experiments, → Lean (verify with Gemba)
- [ ] CTA: Standard

---

## Writing Guidelines

### Tone

| Do                    | Don't                  |
| --------------------- | ---------------------- |
| Practitioner language | Academic jargon        |
| Active voice          | Passive voice          |
| "You" and "your"      | "One" and "the user"   |
| Short sentences       | Long complex sentences |
| Questions             | Statements only        |

### Examples

| Instead of                                                                      | Write                                      |
| ------------------------------------------------------------------------------- | ------------------------------------------ |
| "Statistical process control charts enable visualization of temporal variation" | "See how your data changes over time"      |
| "The interquartile range represents the middle 50% of the distribution"         | "The box shows where half your data falls" |
| "Assignable cause variation should be investigated"                             | "Find out what changed"                    |

### Length Guidelines

| Section           | Target Length            |
| ----------------- | ------------------------ |
| Hero              | 50 words                 |
| When to Use       | 6 × 5 words = 30 words   |
| Data Requirements | 150 words                |
| How to Read       | 200 words                |
| Patterns          | 6 × 20 words = 120 words |
| Demo              | 50 words                 |
| Features          | 3 × 50 words = 150 words |
| Two Mindsets      | 150 words                |
| What's Next       | 100 words                |
| CTA               | 50 words (standard)      |
| **Total**         | ~1,050 words per page    |

---

## Visual Assets Needed

### Per Tool Page

| Asset           | Format          | Notes                     |
| --------------- | --------------- | ------------------------- |
| Hero chart      | SVG/Animation   | Interactive or animated   |
| Annotated chart | SVG             | With callout lines        |
| Pattern visuals | SVG × 6         | One per pattern           |
| Demo chart      | React component | Interactive with filters  |
| Feature visuals | GIF/Video × 3   | Showing feature in action |

### Shared Assets

| Asset                                        | Used On   |
| -------------------------------------------- | --------- |
| Product cards (PWA, Excel, Enterprise)       | All pages |
| Pillar badges (CHANGE, FLOW, FAILURE, VALUE) | All pages |
| Icon set                                     | All pages |

---

## SEO Checklist

- [ ] Title tag includes tool name and "VaRiScout"
- [ ] Meta description is compelling and under 160 characters
- [ ] H1 is the tool name
- [ ] Core question appears in first 100 words
- [ ] Alt text on all images
- [ ] Internal links to related tools and concept pages
- [ ] External links to authoritative sources (if applicable)
- [ ] Schema markup for HowTo or FAQ

---

## Quality Checklist Before Publishing

- [ ] All sections complete
- [ ] Core question matches pillar
- [ ] Data requirements include "start with X" and "sweet spot"
- [ ] At least 4 patterns described
- [ ] Demo is interactive and pre-loaded with data
- [ ] At least 2 VaRiScout-specific features highlighted
- [ ] Two Mindsets section clearly positions EDA vs Traditional
- [ ] Links to at least 2 other tools
- [ ] CTA section matches standard
- [ ] Mobile responsive
- [ ] Page loads in under 3 seconds
- [ ] All interactive elements work

---

_"Consistency creates trust. Every tool page should feel familiar yet fresh."_
