# Learn Section Specification

> Conceptual content that positions VaRiScout's approach and methodology.

**Routes**: `/[lang]/learn/[topic]`

---

## Purpose

The Learn section provides the theoretical foundation for VaRiScout's approach. While Tool pages teach _how_ to use specific charts, Learn pages explain _why_ we analyze data this way.

**Target audience**: Practitioners who want to understand the methodology, not just use the tools.

---

## The 4 Learn Pages

| Page            | Route                    | Core Concept                                   |
| --------------- | ------------------------ | ---------------------------------------------- |
| Two Voices      | `/learn/two-voices`      | Control limits vs Spec limits                  |
| Four Pillars    | `/learn/four-pillars`    | Watson's CHANGE-FLOW-FAILURE-VALUE methodology |
| EDA Philosophy  | `/learn/eda-philosophy`  | Exploratory Data Analysis mindset              |
| Staged Analysis | `/learn/staged-analysis` | Compare process phases with separate limits    |

---

## Page 1: Two Voices

**Route**: `/[lang]/learn/two-voices`

### Core Concept

Two voices that must be understood together:

- **Voice of the Process** (VoP): What the process actually does (control limits)
- **Voice of the Customer** (VoC): What the customer needs (specification limits)

### Content Structure

```
# Two Voices: Control Limits vs Spec Limits

## The Two Questions

| Voice | Source | Question |
|-------|--------|----------|
| Voice of the Process | Control Limits (UCL/LCL) | "What does my process DO?" |
| Voice of the Customer | Spec Limits (USL/LSL) | "What does my customer NEED?" |

## Why Both Matter

### Control Limits (Voice of the Process)
- **Calculated** from your data
- Show what the process IS doing
- Based on natural variation
- Used to detect CHANGE

### Spec Limits (Voice of the Customer)
- **Defined** by requirements
- Show what the process SHOULD do
- Based on customer needs
- Used to judge CONFORMANCE

## The Goal

Get your control limits INSIDE your spec limits.

[Visual: I-Chart showing both limit types]

## Common Mistakes

| Mistake | Reality |
|---------|---------|
| "My specs are my control limits" | Specs come from customer, controls from process |
| "Process is in control = good" | In control but not capable is still a problem |
| "Reduce spec range to improve quality" | This just creates more rejects |

## VaRiScout Approach

VaRiScout shows BOTH voices on the same chart:
- Control limits (dotted lines): Process behavior
- Spec limits (solid lines): Customer requirements

[PWA embed showing dual limits]

"See both voices. Understand the gap. Close it."
```

### Key Visual

I-Chart with:

- UCL/LCL (dashed blue) = Voice of Process
- USL/LSL (solid red/green) = Voice of Customer
- Data points showing the relationship

---

## Page 2: Four Pillars

**Route**: `/[lang]/learn/four-pillars`

### Core Concept

Watson's methodology for variation analysis:

1. **CHANGE**: How does data change over time? (I-Chart)
2. **FLOW**: Where does variation come from? (Boxplot)
3. **FAILURE**: Where do problems concentrate? (Pareto)
4. **VALUE**: Does it meet requirements? (Capability)

### Content Structure

```
# The Four Pillars of Variation Analysis

## The Framework

Developed by Dr. Gregory H. Watson, this methodology structures how we analyze variation:

| Pillar | Question | Tool |
|--------|----------|------|
| CHANGE | "What patterns does time reveal?" | I-Chart |
| FLOW | "Which factors drive variation?" | Boxplot |
| FAILURE | "Where do problems concentrate?" | Pareto |
| VALUE | "Does it meet customer specs?" | Capability |

## Pillar 1: CHANGE

"First, look at time."

Before comparing factors or prioritizing defects, understand:
- Is the process stable?
- Are there patterns?
- Did something change?

[I-Chart visual]

**Key insight**: An unstable process needs different action than a stable one.

## Pillar 2: FLOW

"Then, find where variation hides."

Compare:
- Machines
- Operators
- Shifts
- Materials

[Boxplot visual]

**Key insight**: The box with the biggest spread is where improvement potential lives.

## Pillar 3: FAILURE

"Next, prioritize problems."

Not all problems are equal:
- 80/20 rule often applies
- Focus resources on the vital few

[Pareto visual]

**Key insight**: Fixing the top bar often fixes half the problem.

## Pillar 4: VALUE

"Finally, prove the business case."

Connect process behavior to customer requirements:
- Cpk measures capability
- Before/after shows improvement

[Capability visual]

**Key insight**: This is where the money is.

## The Connected Workflow

VaRiScout links these pillars:

```

I-Chart → click point → filters Boxplot
Boxplot → click box → filters I-Chart
Pareto → click bar → filters both
Capability → shows overall result

```

"Four views. One story. Connected."

## The Lineage

```

1997 Gregory Watson Four Pillars framework
2019 Turtiainen thesis Mental model for EDA in DMAIC
2026 VaRiScout Digital implementation

```

```

### Key Visual

Four-quadrant diagram with:

- CHANGE (top-left): I-Chart thumbnail
- FLOW (top-right): Boxplot thumbnail
- FAILURE (bottom-left): Pareto thumbnail
- VALUE (bottom-right): Capability thumbnail
- Arrows showing connections

---

## Page 3: EDA Philosophy

**Route**: `/[lang]/learn/eda-philosophy`

### Core Concept

Exploratory Data Analysis is a mindset, not a method:

- Look at data first
- Let patterns guide investigation
- Statistics confirm what eyes find

### Content Structure

```
# The EDA Philosophy

## What is EDA?

**Exploratory Data Analysis** is an approach championed by John Tukey:

> "The greatest value of a picture is when it forces us to notice what we never expected to see."
> — John Tukey, 1977

## Two Approaches Compared

| EDA (VaRiScout) | Traditional Statistics |
|-----------------|------------------------|
| "What do I see?" | "What do I prove?" |
| Start with visualization | Start with hypothesis |
| Let data guide questions | Let questions guide analysis |
| Verify at Gemba | Verify with p-value |
| **Best for**: Finding focus | **Best for**: Proving claims |

## The EDA Workflow

```

Traditional:
Question → Hypothesis → Test → Conclusion

EDA:
Data → Visualization → Pattern → Investigation → Action

```

## Why EDA for Process Improvement?

### 1. Speed
- No hypothesis needed to start
- See patterns immediately
- Investigate what matters

### 2. Discovery
- Find unexpected patterns
- Reveal hidden factors
- See connections

### 3. Practicality
- Works with 5 observations
- Guides Gemba investigation
- Focuses resources

## When to Use What

### Use EDA When:
- Daily improvement work
- Finding where to focus
- Quick decisions needed
- Gemba verification possible

### Use Traditional Statistics When:
- Publishing results
- Regulatory compliance
- Contractual requirements
- Statistical proof needed

## The VaRiScout Position

"VaRiScout is built for practitioners, not publications."

We believe:
- 5 data points beats waiting for 30
- Pattern recognition beats p-value hunting
- Gemba verification beats statistical proof
- Finding focus beats proving significance

## The Lineage

```

1924 Shewhart Control charts for process monitoring
1977 Tukey Exploratory Data Analysis book
1980s Shainin Progressive Search methodology
2019 Turtiainen Mental model for EDA in DMAIC
2026 VaRiScout EDA-first variation analysis tool

```

"See first. Count later."
```

### Key Visual

Side-by-side comparison:

- Left: Traditional workflow (linear, hypothesis-driven)
- Right: EDA workflow (iterative, data-driven)

---

## Page 4: Staged Analysis

**Route**: `/[lang]/learn/staged-analysis`

### Core Concept

When a process changes, control limits calculated from combined data can mask real improvements or hide problems:

- **Combined data**: Wide limits obscure phase differences
- **Staged analysis**: Separate limits per phase reveal true performance

### Content Structure

```
# Staged Analysis: Compare Process Phases

## The Problem

When your process changes, single control limits hide the story:

| Approach | What It Shows | What It Hides |
|----------|---------------|---------------|
| Combined limits | Overall average | Phase-specific behavior |
| Staged limits | Each phase separately | Nothing - full picture |

## When to Use Staged Analysis

- Before/after process improvements
- Batch-to-batch comparisons
- Equipment or material changes
- Shift or time period analysis

## How It Works

1. Select your stage column (e.g., "Phase", "Batch", "Period")
2. Choose stage ordering (auto-detect, alphabetical, first occurrence)
3. See separate UCL/Mean/LCL for each stage

[PWA embed showing staged I-Chart]

## Interpreting Results

| Pattern | Meaning |
|---------|---------|
| Lower mean in Stage B | Process shifted |
| Tighter limits in Stage B | Variation reduced (improvement) |
| Wider limits in Stage B | Variation increased (problem) |

## Try It

[Interactive demo with before/after data]

"When your process changes, your control limits should too."
```

### Key Visual

Before/After comparison showing:

- Combined limits hiding improvement
- Staged limits revealing true performance per phase

---

## Technical Implementation

### Dynamic Routing

```astro
// pages/[lang]/learn/[topic].astro
export function getStaticPaths() {
  const topics = ['two-voices', 'four-pillars', 'eda-philosophy', 'staged-analysis'];
  const languages = ['en', 'de', 'es', 'fr', 'pt'];

  return languages.flatMap(lang =>
    topics.map(topic => ({ params: { lang, topic } }))
  );
}
```

### Learn Data Structure

```typescript
// src/data/learnData.ts
interface LearnPage {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  sections: Array<{
    title: string;
    content: string;
    visual?: 'chart' | 'diagram' | 'table';
  }>;
  relatedTools: string[];
  relatedCases: string[];
}
```

---

## Page Layout

Each Learn page follows this structure:

1. **Hero**: Title + subtitle + key visual
2. **Core Concept**: The main idea in 2-3 paragraphs
3. **Comparison Table**: Traditional vs VaRiScout approach
4. **Detailed Sections**: 3-5 expandable sections
5. **PWA Demo**: Embedded example showing the concept
6. **Related Content**: Links to tools and cases
7. **CTA**: "Apply this to your data"

---

## SEO Requirements

### Two Voices

- Title: "Control Limits vs Spec Limits: Two Voices | VaRiScout"
- Keywords: "control limits", "specification limits", "UCL LCL", "voice of process"

### Four Pillars

- Title: "Four Pillars of Variation Analysis | VaRiScout"
- Keywords: "variation analysis", "process improvement", "six sigma tools"

### EDA Philosophy

- Title: "Exploratory Data Analysis for Process Improvement | VaRiScout"
- Keywords: "EDA", "exploratory data analysis", "John Tukey", "data visualization"

---

## Related Files

- `apps/website/src/pages/[lang]/learn/[topic].astro` - Dynamic page
- `apps/website/src/data/learnData.ts` - Content/metadata
- `docs/concepts/TWO_VOICES_CONTROL_VS_SPEC.md` - Source content
- `docs/concepts/FOUR_PILLARS_METHODOLOGY.md` - Source content
