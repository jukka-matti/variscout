# VaRiScout Web Experience: Holistic Evaluation

> A comprehensive review of all design decisions made for variscout.com

---

## Documents Created

| Document                                         | Purpose                               | Status      |
| ------------------------------------------------ | ------------------------------------- | ----------- |
| `variscout-four-pillars-methodology.md`          | Core methodology (Watson's framework) | ✅ Complete |
| `variscout-website-experience-strategies.md`     | 10 strategy options evaluated         | ✅ Complete |
| `variscout-journey-scroll-experience.md`         | Main scroll journey design            | ✅ Complete |
| `variscout-case-based-learning.md`               | Three-act case structure              | ✅ Complete |
| `variscout-two-voices-control-vs-spec-limits.md` | Educational content (Control vs Spec) | ✅ Complete |
| `variscout-tool-pages-concept.md`                | Concept note for tool pages           | ✅ Complete |
| `variscout-tool-pages-ui-ux.md`                  | UI/UX design for tool pages           | ✅ Complete |
| `variscout-tool-pages-template.md`               | Template for content creation         | ✅ Complete |

---

## The Big Picture

### Brand & Positioning

| Element         | Decision                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------- |
| **Brand**       | "See Beyond Averages"                                                                        |
| **Hook**        | "Find what averages hide"                                                                    |
| **Promise**     | "46% of your variation may be hiding in one place"                                           |
| **Action**      | "Find it. Fix it. Check it. Continue."                                                       |
| **Key Insight** | "VaRiScout finds WHERE to focus. Apply Lean thinking to find WHY — and what to do about it." |

### Philosophy

| Aspect           | Position                                                |
| ---------------- | ------------------------------------------------------- |
| **Approach**     | EDA (Exploratory Data Analysis) for process improvement |
| **Mindset**      | Practitioner, not academic statistician                 |
| **Goal**         | See with eyes, not prove with math                      |
| **Role**         | Analysis as starting point, not end goal                |
| **Verification** | Gemba verifies, not statistics alone                    |

### Framing Evolution

| From (Problem-focused) | To (Opportunity-focused)       |
| ---------------------- | ------------------------------ |
| "52% of the problem"   | "46% of improvement potential" |
| "Find the chaos"       | "Unlock the opportunity"       |
| "Averages lie"         | "Averages hide potential"      |
| Diagnostic tone        | Opportunity tone               |

---

## Site Architecture

```
variscout.com
│
├── /                           → Hero + Featured Journey
│
├── /journey                    → Full scroll experience (7 sections)
│   └── AVERAGES → CHANGE → FLOW → FAILURE → VALUE → CLARITY → CLOSE
│
├── /cases                      → Case library (three-act structure)
│   ├── /manufacturing          → Cookie weight, Weld defects...
│   ├── /agriculture            → Coffee grading, Moisture...
│   ├── /service                → Call wait time, Delivery...
│   └── /training               → Sock Mystery, Classic examples
│
├── /tools                      → Individual tool education
│   ├── /i-chart               → CHANGE pillar
│   ├── /boxplot               → FLOW pillar
│   ├── /pareto                → FAILURE pillar
│   ├── /capability            → VALUE pillar
│   └── /regression            → Add-on
│
├── /learn                      → Conceptual content
│   ├── /two-voices            → Control vs Spec limits
│   ├── /four-pillars          → Watson's methodology
│   └── /eda-philosophy        → EDA mindset
│
├── /products                   → Product comparison
│   ├── PWA (€49/yr)
│   ├── Excel Add-in (€49/yr)
│   └── Enterprise (€399-1999/yr)
│
└── /pricing                    → Pricing table
```

---

## Core Experiences

### 1. Journey Scroll Experience

**The 7 Sections:**

| #   | Section  | Question                            | What It Shows                             |
| --- | -------- | ----------------------------------- | ----------------------------------------- |
| 1   | AVERAGES | "What does the dashboard show?"     | Bar chart comparing averages (misleading) |
| 2   | CHANGE   | "What patterns does time reveal?"   | I-Chart showing patterns                  |
| 3   | FLOW     | "Which factors drive variation?"    | Boxplot comparison                        |
| 4   | FAILURE  | "Where do problems concentrate?"    | Pareto chart                              |
| 5   | VALUE    | "Does it meet customer specs?"      | Capability before/after                   |
| 6   | CLARITY  | "Where should Lean thinking focus?" | Breadcrumb trail + cumulative math        |
| 7   | CLOSE    | "Where's YOUR 46%?"                 | Product CTA                               |

**Narrative Arc:**

- Hook (mystery) → Journey (discovery) → Payoff (opportunity) → CTA (desire)

### 2. Case-Based Learning

**Three-Act Structure:**

| Act              | Purpose                     | User Experience                      |
| ---------------- | --------------------------- | ------------------------------------ |
| **THE CASE**     | Set scene, show averages    | "Here's what the dashboard shows..." |
| **YOUR TURN**    | Interactive exploration     | "Can you find what's hiding?"        |
| **THE SOLUTION** | Scroll journey reveals path | "Here's what the data reveals..."    |

**Engagement Levels:**

| Level        | Experience       | Value                      |
| ------------ | ---------------- | -------------------------- |
| 👀 Browse    | Watch journey    | "I understand the concept" |
| 🖱️ Explore   | Click around     | "I see how it works"       |
| 🎯 Challenge | Find it yourself | "I can do this myself"     |
| 📤 Apply     | Upload own data  | "What's MY 46%?"           |

### 3. Tool Pages

**10 Sections Per Page:**

| #   | Section                | Purpose                        |
| --- | ---------------------- | ------------------------------ |
| 1   | Hero                   | Immediate answer + recognition |
| 2   | When to Use            | Quick recognition              |
| 3   | What Data Do You Need? | Enable action                  |
| 4   | How to Read            | Visual literacy                |
| 5   | Patterns to Find       | Train the eye                  |
| 6   | Try It                 | Hands-on demo                  |
| 7   | VaRiScout Features     | Differentiation                |
| 8   | Two Mindsets           | EDA vs Traditional positioning |
| 9   | What's Next?           | Connected workflow             |
| 10  | CTA                    | Convert                        |

---

## Key Design Decisions

### 1. Website Does NOT Offer Data Upload

| Website               | Products              |
| --------------------- | --------------------- |
| Education layer       | Application layer     |
| Fixed case data       | User's own data       |
| Creates desire        | Fulfills desire       |
| Learn the methodology | Apply the methodology |

### 2. Data Requirements: Start Early

| Stage          | Points | Message                             |
| -------------- | ------ | ----------------------------------- |
| **Start**      | 5      | "Enough to see your first pattern!" |
| **Better**     | 25+    | "Control limits more meaningful"    |
| **Sweet spot** | 30     | "Statistically 'good enough'"       |

**Why 30?** At n=30, the t-distribution equals the normal distribution. Diminishing returns after 30.

**Key message:** "Don't wait for 'enough' data. Start with 5 and grow."

### 3. Two Mindsets (Not "Common Mistakes")

| EDA (VaRiScout)                                | Traditional                                |
| ---------------------------------------------- | ------------------------------------------ |
| "Where should I look?"                         | "Is this significant?"                     |
| Start with 5                                   | Wait for 30                                |
| See with eyes                                  | Prove with math                            |
| Verify at Gemba                                | Verify with stats                          |
| **Best for:** Daily improvement, finding focus | **Best for:** Publishing, regulatory proof |

**Key message:** "Both valid. Different purposes. Know which game you're playing."

### 4. Two Voices Framework

| Voice                     | Source                      | Question                    |
| ------------------------- | --------------------------- | --------------------------- |
| **Voice of the Process**  | Control Limits (calculated) | "What does the process do?" |
| **Voice of the Customer** | Spec Limits (defined)       | "What does customer need?"  |

**Goal:** Get control limits INSIDE specification limits.

**VaRiScout Feature:** Shows BOTH on I-Chart when specs added.

### 5. Special Cause vs Common Cause

| Type              | Who Acts                         | Action                     |
| ----------------- | -------------------------------- | -------------------------- |
| **Special Cause** | Local (Operator, Supervisor)     | Find & remove              |
| **Common Cause**  | System (OpEx, Corporate Quality) | Fundamental process change |

**Key insight:** Looking at stability is traditional — but when stable yet not capable, system-level action is needed.

---

## Visual & Interaction Design

### Design Principles

1. **Answer First** — No fluff intro
2. **Visual Before Verbal** — Show, then explain
3. **Progressive Disclosure** — Layer information
4. **Consistent But Not Boring** — Same structure, unique personality
5. **Mobile-First** — Many from mobile search

### Color/Identity by Tool

| Tool       | Pillar  | Color Accent |
| ---------- | ------- | ------------ |
| I-Chart    | CHANGE  | Blue         |
| Boxplot    | FLOW    | Orange       |
| Pareto     | FAILURE | Red/Yellow   |
| Capability | VALUE   | Green        |
| Regression | —       | Purple       |

### Key Interactions

| Element        | Action    | Result           |
| -------------- | --------- | ---------------- |
| Chart points   | Hover/tap | Show value       |
| Filter buttons | Click     | Filter all views |
| Pattern cards  | Click     | Expand detail    |
| Pareto bars    | Click     | Drill down       |

---

## Content Strategy

### SEO Opportunities

| Query Type   | Examples                                                  |
| ------------ | --------------------------------------------------------- |
| "How to..."  | "how to read a boxplot", "how to interpret control chart" |
| "What is..." | "what is pareto chart", "what is process capability"      |
| "When to..." | "when to use I-chart vs X-bar"                            |

### Target Length Per Tool Page

~1,050 words total:

- Hero: 50 words
- When to Use: 30 words
- Data Requirements: 150 words
- How to Read: 200 words
- Patterns: 120 words
- Demo: 50 words
- Features: 150 words
- Two Mindsets: 150 words
- What's Next: 100 words
- CTA: 50 words

### Writing Tone

| Do                                    | Don't                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| Practitioner language                 | Academic jargon                                                                 |
| "You" and "your"                      | "One" and "the user"                                                            |
| Short sentences                       | Long complex sentences                                                          |
| "See how your data changes over time" | "Statistical process control charts enable visualization of temporal variation" |

---

## User Journeys

### Journey A: Organic Search → Tool Page → Product

```
Google: "how to read control chart"
        ↓
/tools/i-chart (answers question)
        ↓
Try It demo (hands-on)
        ↓
"Where's YOUR pattern?" (CTA)
        ↓
Product page → Conversion
```

### Journey B: LinkedIn Post → Case → Product

```
LinkedIn: See case teaser
        ↓
/cases/cookie-weight
        ↓
Act 1: THE CASE (curiosity)
        ↓
Act 2: YOUR TURN (exploration)
        ↓
Act 3: THE SOLUTION (aha!)
        ↓
CTA → Product
```

### Journey C: Mean & Beyond → Challenge → Product

```
Weekly challenge email
        ↓
Challenge data (same as case)
        ↓
Try to solve it
        ↓
Website solution reveal
        ↓
"Do this with your own data"
        ↓
Product
```

---

## Strengths of Current Design

| Strength                  | Why It Matters                                    |
| ------------------------- | ------------------------------------------------- |
| **Clear methodology**     | Watson's Four Pillars gives structure             |
| **Opportunity framing**   | More motivating than problem framing              |
| **EDA positioning**       | Honest about what we are (and aren't)             |
| **Two Mindsets**          | Addresses traditionalist objections proactively   |
| **Start with 5**          | Removes "not enough data" barrier                 |
| **Both Voices**           | Differentiator feature clearly explained          |
| **Case-based learning**   | Teaches methodology while demoing product         |
| **Multiple entry points** | SEO, cases, tools, journey all lead to conversion |
| **Consistent CTA**        | "Where's YOUR 46%?" across all pages              |

---

## Potential Gaps / Open Questions

### Content Gaps

| Gap                         | Status                      | Priority |
| --------------------------- | --------------------------- | -------- |
| Actual case data (datasets) | Not created                 | High     |
| Interactive demo component  | Not built                   | High     |
| Tool page content (5 pages) | Template ready, not written | Medium   |
| Animation specifications    | Not detailed                | Medium   |
| Mobile responsive specs     | General only                | Medium   |

### Strategic Questions

| Question                  | Consideration                                                |
| ------------------------- | ------------------------------------------------------------ |
| **Pricing clarity**       | €49/yr for PWA and Excel — same price, is that clear enough? |
| **Enterprise journey**    | How do enterprise prospects find their path?                 |
| **Free trial?**           | Should there be a limited free tier?                         |
| **Community integration** | How tightly to link Mean & Beyond?                           |
| **Localization**          | Finnish version needed?                                      |

### Technical Questions

| Question          | Consideration                            |
| ----------------- | ---------------------------------------- |
| **Demo data**     | Pre-loaded or dynamically generated?     |
| **Chart library** | Which library for interactive charts?    |
| **CMS**           | What powers the case library?            |
| **Analytics**     | How to track engagement through journey? |

---

## Consistency Check

### Messaging Alignment

| Element                                | Consistent Across |
| -------------------------------------- | ----------------- |
| "See Beyond Averages"                  | ✅ All pages      |
| "Find what averages hide"              | ✅ All pages      |
| "46% of improvement potential"         | ✅ All pages      |
| "Find it. Fix it. Check it. Continue." | ✅ All pages      |
| EDA philosophy                         | ✅ All pages      |
| Two Mindsets framing                   | ✅ All pages      |
| Start with 5 points                    | ✅ All pages      |
| 30 = sweet spot                        | ✅ All pages      |
| CTA: three products                    | ✅ All pages      |

### Visual Consistency (To Ensure)

| Element           | Needs Definition   |
| ----------------- | ------------------ |
| Typography        | Not specified      |
| Color palette     | Pillar colors only |
| Spacing system    | Not specified      |
| Component library | Not specified      |
| Icon set          | Not specified      |

---

## Next Steps (Recommended Priority)

### Phase 1: Foundation

1. [ ] Define visual design system (colors, typography, spacing)
2. [ ] Build interactive chart component (reusable)
3. [ ] Create first case dataset (Cookie Weight)
4. [ ] Build journey scroll prototype

### Phase 2: Core Pages

5. [ ] Write I-Chart tool page (using template)
6. [ ] Write Capability tool page (Two Voices content exists)
7. [ ] Build case page template
8. [ ] Launch MVP with 1 case + 2 tool pages

### Phase 3: Expansion

9. [ ] Remaining 3 tool pages
10. [ ] Additional cases (3-4 more)
11. [ ] Learn section pages
12. [ ] Mobile optimization

### Phase 4: Integration

13. [ ] Mean & Beyond connection
14. [ ] Analytics implementation
15. [ ] A/B testing setup
16. [ ] SEO optimization

---

## Summary

### What We've Designed

A **comprehensive web experience** that:

1. **Educates** practitioners on variation analysis methodology
2. **Demonstrates** VaRiScout's unique approach through cases
3. **Positions** EDA mindset clearly vs traditional statistics
4. **Converts** visitors to product through multiple journeys
5. **Captures** organic search traffic through tool pages

### The Core Formula

```
Discovery (SEO/Social)
        ↓
Education (Tool pages, Learn pages)
        ↓
Experience (Journey, Cases)
        ↓
Desire ("What's MY 46%?")
        ↓
Conversion (Products)
```

### The Key Differentiator

> **VaRiScout is built for practitioners, not publications.**
>
> Start with 5 points. See patterns with your eyes. Verify at Gemba.
> Both Voices on one chart. Find WHERE to focus.
> Apply Lean thinking to find WHY — and what to do about it.

---

_"The website doesn't just sell a tool — it teaches a way of thinking about variation."_
