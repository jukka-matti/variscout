# Flow 1: SEO Learner → Product

> Green Belt Gary searches Google, finds a tool page, discovers VaRiScout
>
> **Priority:** Highest - largest volume potential
>
> See also: [OVERVIEW.md](./OVERVIEW.md) for site architecture

---

## Persona: Green Belt Gary

| Attribute         | Detail                                        |
| ----------------- | --------------------------------------------- |
| **Role**          | Quality Engineer, Green Belt certified        |
| **Goal**          | Find better tools than Excel                  |
| **Knowledge**     | Knows basics, wants efficiency                |
| **Pain points**   | Excel is tedious, Minitab is expensive        |
| **Entry points**  | Google search, LinkedIn, YouTube              |
| **Decision mode** | Evaluates tool capability, ease of use, price |

### What Gary is thinking:

- "I need to create a control chart but Excel is painful"
- "Minitab costs too much for what I need"
- "I just want something that works for basic SPC"

---

## Entry Points

| Search Query                   | Lands On          | Intent                    |
| ------------------------------ | ----------------- | ------------------------- |
| "how to read control chart"    | /tools/i-chart    | Learning + tool discovery |
| "boxplot interpretation"       | /tools/boxplot    | Specific tool help        |
| "capability analysis tutorial" | /tools/capability | Learning Cp/Cpk           |
| "free control chart software"  | /tools/i-chart    | Tool shopping             |
| "Minitab alternative"          | / or /products    | Direct comparison         |

---

## Journey Flow

```
┌─────────────────┐
│ Google Search   │
│ "how to read    │
│  control chart" │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ /tools/i-chart  │
│                 │
│ ✓ Answers query │
│ ✓ Visual first  │
│ ✓ Data needed   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Scrolls down    │────▶│ "Try It" Demo   │
│                 │     │                 │
│ Sees patterns   │     │ Interactive     │
│ section         │     │ exploration     │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ "Two Mindsets"  │     │ "I like this!"  │
│                 │     │                 │
│ Resonates with  │     │ Clicks CTA      │
│ EDA approach    │     │                 │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌─────────────────┐
         │ /products or    │
         │ /pricing        │
         │                 │
         │ Evaluates       │
         │ options         │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ CONVERSION      │
         │                 │
         │ Signs up for    │
         │ PWA or Excel    │
         └─────────────────┘
```

---

## Page Sequence

### 1. Tool Page (/tools/i-chart)

**Must answer in 5 seconds:** "Does this answer my question?"

Page structure:

1. **Hero:** Interactive I-Chart with sample data
2. **What it shows:** Clear explanation of control limits, patterns
3. **Try it section:** Demo with pre-loaded data
4. **Two Mindsets:** EDA vs traditional approach (resonance point)
5. **Next steps:** Links to related tools

**Key content:**

- Visual explanation first, math second
- Pattern recognition guide
- "Why VaRiScout is different" section

### 2. Demo Interaction

Gary clicks around, explores the demo:

- Sees linked filtering in action
- Notices ease of use vs Excel
- Gets curious about other features

### 3. Product/Pricing Page

Gary evaluates:

- Free tier vs paid
- PWA vs Excel add-in
- Comparison to Minitab

---

## CTAs on This Journey

| Location       | CTA Text                   | Destination        | Note                    |
| -------------- | -------------------------- | ------------------ | ----------------------- |
| Tool page hero | "Try Demo"                 | /app               | Opens browser demo      |
| After demo     | "Install to Upload"        | /app               | Leads to install prompt |
| Two Mindsets   | "See the full methodology" | /learn or /journey |                         |
| End of page    | "Try Demo - No Signup"     | /app               | Opens browser demo      |
| Related tools  | "Next: Boxplot"            | /tools/boxplot     |                         |

**Updated Journey:**

1. Tool page → "Try Demo" → Explore with samples
2. Like it? → "Install to Upload" → Install PWA (free)
3. Want to save? → Upgrade to Licensed (€49/year)

---

## Cross-Links from Tool Pages

| From           | Links To          | Reason                       |
| -------------- | ----------------- | ---------------------------- |
| /tools/i-chart | /tools/boxplot    | "Next: find which factor"    |
| /tools/i-chart | /tools/capability | "Check: does it meet specs?" |
| /tools/i-chart | /learn/two-voices | "Deep dive: Two Voices"      |
| /tools/i-chart | /cases/bottleneck | "See it in action"           |

---

## Mobile Considerations

- Tool demo must work on mobile (touch-optimized)
- Sticky "Try VaRiScout" button at bottom
- Simplified chart interactions
- Key content visible without scrolling

---

## Success Metrics

| Metric                       | Target |
| ---------------------------- | ------ |
| Tool page → Demo interaction | >50%   |
| Demo → Product page          | >15%   |
| Product page → Conversion    | >10%   |
| Tool page bounce rate        | <60%   |
| Time on tool page            | >90s   |

---

## SEO Notes

Target keywords per tool page:

- /tools/i-chart: "control chart", "I-MR chart", "how to read control chart"
- /tools/boxplot: "boxplot", "box and whisker", "boxplot interpretation"
- /tools/pareto: "pareto chart", "80/20 analysis", "pareto diagram"
- /tools/capability: "Cp Cpk", "capability analysis", "process capability"

Content structure for SEO:

- H1 matches primary keyword
- Clear answer in first paragraph
- Visual content (charts) with alt text
- Internal links to related content
