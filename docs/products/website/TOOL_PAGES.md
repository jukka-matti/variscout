# Tool Pages Specification

> SEO-optimized educational pages for each statistical tool.

**Routes**: `/[lang]/tools/[tool]`

---

## Purpose

Tool pages serve two goals:

1. **SEO capture**: Rank for "how to read a boxplot", "what is control chart", etc.
2. **Education**: Teach practitioners visual literacy before selling the product

**Philosophy**: Answer the question first, then show how VaRiScout makes it easy.

---

## The 6 Tools

| Tool       | Route               | Pillar  | Color            | SEO Target                                      |
| ---------- | ------------------- | ------- | ---------------- | ----------------------------------------------- |
| I-Chart    | `/tools/i-chart`    | CHANGE  | Blue (#3b82f6)   | "control chart", "I-chart", "individuals chart" |
| Boxplot    | `/tools/boxplot`    | FLOW    | Orange (#f97316) | "box plot", "box and whisker"                   |
| Pareto     | `/tools/pareto`     | FAILURE | Red (#ef4444)    | "pareto chart", "80/20 rule"                    |
| Capability | `/tools/capability` | VALUE   | Green (#22c55e)  | "cpk", "process capability"                     |
| Regression | `/tools/regression` | —       | Purple (#8b5cf6) | "regression analysis", "scatter plot"           |
| Gage R&R   | `/tools/gage-rr`    | —       | Teal (#14b8a6)   | "gage r&r", "measurement system analysis"       |

---

## 10-Section Template

Every tool page follows this structure:

### 1. Hero (50 words)

```
# [Tool Name]

[One-sentence answer to "what is it"]

[PWA Embed showing the tool with sample data]

"[Tool] helps you [primary benefit]."
```

### 2. When to Use (30 words)

```
## When to Use [Tool]

- [Recognition trigger 1]
- [Recognition trigger 2]
- [Recognition trigger 3]

"If you're asking [question], you need a [tool]."
```

### 3. What Data Do You Need? (150 words)

```
## What Data Do You Need?

**Minimum**: 5 observations
- Enough to see your first pattern
- Better than no data

**Better**: 25+ observations
- Control limits become meaningful
- Patterns become reliable

**Sweet spot**: 30 observations
- Statistically "good enough" (t = normal at n=30)
- Diminishing returns after this

**Don't wait.** Start with 5. Add more as you go.

### Data Format
- [Column requirement 1]
- [Column requirement 2]
```

### 4. How to Read (200 words)

```
## How to Read a [Tool]

[Annotated diagram with callouts]

### Key Elements

| Element | What It Shows |
|---------|---------------|
| [Element 1] | [Explanation] |
| [Element 2] | [Explanation] |
| [Element 3] | [Explanation] |

### The Quick Check

1. [First thing to look at]
2. [Second thing to look at]
3. [Third thing to look at]
```

### 5. Patterns to Find (120 words)

```
## Patterns to Find

### [Pattern 1 Name]
[Visual] + [What it means] + [What to do]

### [Pattern 2 Name]
[Visual] + [What it means] + [What to do]

### [Pattern 3 Name]
[Visual] + [What it means] + [What to do]

"The pattern tells the story. Trust your eyes."
```

### 6. Try It (50 words)

```
## Try It

[Full-size PWA embed with sample data]

**Click around.** Filter. Explore. See what you find.

[Hint text for this tool's key interaction]
```

### 7. VaRiScout Features (150 words)

```
## VaRiScout Features

### [Feature 1]
[How VaRiScout makes this easier]

### [Feature 2]
[Unique capability]

### [Feature 3]
[Integration with other tools]

| Feature | VaRiScout | Traditional Tools |
|---------|-----------|-------------------|
| [Feature] | [Ours] | [Theirs] |
```

### 8. Two Mindsets (150 words)

```
## Two Mindsets

| EDA (VaRiScout) | Traditional |
|-----------------|-------------|
| "Where should I look?" | "Is this significant?" |
| Start with 5 | Wait for 30 |
| See with eyes | Prove with math |
| Verify at Gemba | Verify with stats |

**Both valid. Different purposes.**

Use EDA when:
- Daily improvement
- Finding focus
- Quick decisions

Use Traditional when:
- Publishing results
- Regulatory compliance
- Statistical proof

"VaRiScout is built for practitioners, not publications."
```

### 9. What's Next? (100 words)

```
## What's Next?

After [Tool], you might want to:

### [Next Tool 1]
[When to use it after this tool]

### [Next Tool 2]
[When to use it after this tool]

### Related Learning
- [Learn page 1]
- [Learn page 2]
```

### 10. CTA (50 words)

```
## Where's YOUR Pattern?

[Three-card layout]

**Try Free**: No signup, works offline
**Excel Add-in**: For spreadsheet users
**Enterprise**: Team deployment

"Your data stays on your device. Always."
```

---

## Tool-Specific Content

### I-Chart (CHANGE)

**Hero**: "See how your data changes over time."

**When to Use**:

- Monitoring a process over time
- Looking for shifts or trends
- Detecting special causes

**Patterns**:

1. Points outside control limits (special cause)
2. Run of 7+ points on one side (shift)
3. Trend of 7+ points up/down (drift)
4. Alternating pattern (overcontrol)

**Two Voices Connection**: UCL/LCL = Voice of Process, USL/LSL = Voice of Customer

**Staged Analysis**: Compare process phases with separate control limits per stage

---

### Boxplot (FLOW)

**Hero**: "Compare groups to find where variation hides."

**When to Use**:

- Comparing machines, operators, shifts
- Finding which factor matters most
- Before/after comparisons

**Patterns**:

1. Different medians (location shift)
2. Different spreads (variation difference)
3. Outliers (special cases)
4. Skewness (asymmetric process)

**Key Interaction**: Click a box to filter I-Chart

---

### Pareto (FAILURE)

**Hero**: "Find where problems concentrate."

**When to Use**:

- Prioritizing defects or issues
- 80/20 analysis
- Resource allocation decisions

**Patterns**:

1. Classic 80/20 (one category dominates)
2. Flat distribution (no clear priority)
3. Cumulative plateau (diminishing returns)

**Key Interaction**: Click a bar to drill down

---

### Capability (VALUE)

**Hero**: "See if your process meets customer requirements."

**When to Use**:

- Comparing process to spec limits
- Cpk/Ppk calculations
- Before/after improvement verification

**Patterns**:

1. Centered and capable (Cpk > 1.33)
2. Capable but shifted (Cp > Cpk)
3. Not capable (wide distribution)

**Two Voices**: This is where both voices appear together

---

### Regression (Add-on)

**Hero**: "Find the relationship between X and Y."

**When to Use**:

- Predicting outcomes
- Understanding relationships
- Optimizing process parameters

**Patterns**:

1. Strong correlation (tight around line)
2. Weak correlation (scattered)
3. Non-linear relationship (curved)
4. Outliers affecting fit

**Key stat**: R² = % of variation explained

---

### Gage R&R (MSA)

**Hero**: "Is your measurement system trustworthy?"

**When to Use**:

- Before any analysis (is the data valid?)
- New measurement equipment
- Different operators measuring same thing

**Patterns**:

1. High repeatability (equipment issue)
2. High reproducibility (operator issue)
3. Interaction effects (operator × part)

**Rule**: %GRR < 10% = excellent, < 30% = acceptable, > 30% = needs work

---

## Technical Implementation

### Dynamic Routing

```astro
// pages/[lang]/tools/[tool].astro
export function getStaticPaths() {
  const tools = ['i-chart', 'boxplot', 'pareto', 'capability', 'regression', 'gage-rr'];
  const languages = ['en', 'de', 'es', 'fr', 'pt'];

  return languages.flatMap(lang =>
    tools.map(tool => ({ params: { lang, tool } }))
  );
}
```

### Tool Data Structure

```typescript
// src/data/toolsData.ts
interface ToolData {
  slug: string;
  name: string;
  pillar: 'CHANGE' | 'FLOW' | 'FAILURE' | 'VALUE' | null;
  color: string;
  hero: { title: string; subtitle: string };
  whenToUse: string[];
  dataRequirements: { minimum: number; better: number; sweet: number };
  howToRead: { elements: Array<{ name: string; description: string }> };
  patterns: Array<{ name: string; visual: string; meaning: string; action: string }>;
  features: Array<{ name: string; description: string }>;
  sampleKey: string;
  nextTools: string[];
  relatedLearn: string[];
}
```

---

## SEO Requirements

### Per-Page Meta

```html
<title>[Tool Name] Guide | VaRiScout</title>
<meta
  name="description"
  content="Learn how to read and use [tool] for process improvement. Interactive demo included."
/>
<meta name="keywords" content="[tool], how to read [tool], [tool] analysis, process improvement" />
```

### Structured Data

```json
{
  "@type": "HowTo",
  "name": "How to Read a [Tool]",
  "step": [...]
}
```

---

## Related Files

- `apps/website/src/pages/[lang]/tools/[tool].astro` - Dynamic page
- `apps/website/src/components/ToolPageTemplate.astro` - Template component
- `apps/website/src/data/toolsData.ts` - Tool content/metadata
- `docs/products/website/pages/TOOL-PAGES-TEMPLATE.md` - Existing template reference
