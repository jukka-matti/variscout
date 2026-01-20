# Flow 2: Social Discovery → Case → Product

> Curious Carlos sees a LinkedIn post, explores a case study, discovers VaRiScout
>
> **Priority:** High - best conversion story
>
> See also: [OVERVIEW.md](./OVERVIEW.md) for site architecture

---

## Persona: Curious Carlos

| Attribute         | Detail                                        |
| ----------------- | --------------------------------------------- |
| **Role**          | Operations Supervisor                         |
| **Goal**          | Understand variation better                   |
| **Knowledge**     | Interested but not formally trained           |
| **Pain points**   | Sees problems but lacks tools to analyze them |
| **Entry points**  | YouTube, TikTok, Instagram, LinkedIn          |
| **Decision mode** | Needs to "see it work" before committing      |

### What Carlos is thinking:

- "That post about finding 46% of problems in one place is interesting"
- "I wonder if I could do something like this at my plant"
- "This seems easier than the stats stuff I've seen before"

---

## Entry Points

| Social Source      | Content Type         | Lands On          |
| ------------------ | -------------------- | ----------------- |
| LinkedIn post      | Case study teaser    | /cases/bottleneck |
| LinkedIn article   | "How we found 46%"   | /cases/X          |
| Instagram carousel | Before/after visuals | /cases/X or /     |
| TikTok clip        | "Watch me find it"   | / or /tools/X     |

---

## Journey Flow

```
┌─────────────────┐
│ LinkedIn        │
│                 │
│ "This bakery    │
│ found 46% of    │
│ their problem   │
│ in ONE place"   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│/cases/bottleneck│
│                 │
│ ACT 1: THE CASE │
│ Sees averages   │
│ "Line B is      │
│ under target"   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ACT 2: YOUR TURN│
│                 │
│ Explores demo   │
│ Clicks around   │
│ Maybe finds it  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ACT 3: SOLUTION │
│                 │
│ Scroll journey  │
│ "Aha! That's    │
│ how you think   │
│ about it!"      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────────┐
│ Another│ │ CTA:       │
│ case   │ │ "What's    │
│        │ │ YOUR 46%?" │
└────┬───┘ └─────┬──────┘
     │           │
     │           ▼
     │    ┌─────────────────┐
     │    │ /products       │
     │    │                 │
     │    │ Evaluates       │
     └───▶│                 │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ CONVERSION      │
          │ or              │
          │ EMAIL CAPTURE   │
          └─────────────────┘
```

---

## The 3-Act Case Structure

Every case page follows this narrative arc:

### Act 1: The Setup

- Present the problem as management sees it
- Show the averages, the dashboard view
- "Line B is 3% under target"
- Create cognitive dissonance: "But wait..."

### Act 2: Your Turn

- Interactive demo with the case data
- User explores freely
- Some hints available if stuck
- "Can you find where the 46% is hiding?"

### Act 3: The Solution

- Scroll-based reveal of the analysis journey
- Step by step: I-Chart → Boxplot → Pareto → Drill-down
- The "aha moment": "46% was in Machine C, Shift 2, Operator X"
- Methodology connection: This is the Four Pillars in action

---

## Page Sequence

### 1. Case Landing (/cases/bottleneck)

**Must answer in 5 seconds:** "Is this relevant to me?"

- Industry recognition (manufacturing, bakery, coffee - something relatable)
- Clear problem statement
- Engaging visual teaser

### 2. Act 1 Content

Carlos reads the setup:

- Identifies with the problem
- Recognizes the "averages trap"
- Gets curious about the solution

### 3. Act 2 Demo

Carlos interacts:

- Clicks on charts
- Sees linked filtering
- May or may not find the answer
- Feels engaged, not lectured

### 4. Act 3 Reveal

Carlos learns the methodology:

- Sees the step-by-step analysis
- Understands the thinking process
- "I could do this with my data"

---

## CTAs on This Journey

| Location      | CTA Text                    | Destination          | Note                           |
| ------------- | --------------------------- | -------------------- | ------------------------------ |
| After Act 3   | "Find YOUR 46%"             | /app                 | Opens demo to try with samples |
| After Act 3   | "Install to Upload"         | /app                 | For users ready for own data   |
| After Act 3   | "Try another case"          | /cases               |                                |
| After Act 3   | "Get case studies by email" | Email capture        |                                |
| Sidebar       | "Learn the methodology"     | /learn/four-pillars  |                                |
| Related cases | "Next: Hospital Ward Case"  | /cases/hospital-ward |                                |

**Updated Journey:**

1. Case study → "Find YOUR 46%" → Try Demo with samples
2. Like it? → "Install to Upload" → Install PWA (free)
3. Want to save? → Upgrade to Licensed (€49/year)

---

## Case Cross-Links

| From Case         | Links To             | Reason                     |
| ----------------- | -------------------- | -------------------------- |
| /cases/bottleneck | /tools/i-chart       | "Learn more about I-Chart" |
| /cases/bottleneck | /cases/hospital-ward | "Next case"                |
| /cases/bottleneck | /learn/four-pillars  | "The methodology"          |
| Any case          | /products            | "Do this with your data"   |

---

## Mobile Considerations

- Act 2 demo simplified for touch
- Swipe-based Act 3 scroll experience
- Sticky "Find YOUR 46%" at bottom
- Charts optimized for portrait orientation

---

## Success Metrics

| Metric                    | Target |
| ------------------------- | ------ |
| Case Act 1 → Act 2 (demo) | >60%   |
| Case Act 2 → Act 3        | >70%   |
| Case → Product page       | >20%   |
| Case → Another case       | >30%   |
| Email capture rate        | >5%    |

---

## Social Post Templates

### LinkedIn Post (teaser)

```
This bakery found 46% of their quality problems in ONE place.

The dashboard said "Line B is 3% under target."
But that average hid the real story.

Here's how they found it → [link to /cases/bottleneck]

#VariationScouting #LeanSixSigma #ProcessImprovement
```

### Instagram Carousel

1. "What the dashboard showed" (bar chart)
2. "What the data revealed" (I-Chart with pattern)
3. "Where the problem hid" (Boxplot showing Factor C)
4. "46% in one place" (Pareto)
5. "Find YOUR 46%" (CTA)
