# Holistic Journey Integration

> How the VaRiScout Journey threads through every page of the website.

---

## The Core Principle

**The Journey IS the Website.**

Every page is either:

1. **Entry point** → leads TO the journey
2. **Journey piece** → part OF the journey
3. **Exit point** → leads FROM journey to product

The 9 journey sections aren't just a page — they're the DNA of the entire experience.

---

## The Journey Sections (Recap)

| #   | Section  | Question                        | Color         | Pillar  |
| --- | -------- | ------------------------------- | ------------- | ------- |
| 1   | AVERAGES | What does the dashboard show?   | neutral-400   | —       |
| 2   | VALUE    | What does the customer need?    | green-500     | VALUE   |
| 3   | CHANGE   | What patterns does time reveal? | blue-500      | CHANGE  |
| 4   | FLOW     | Which factors drive variation?  | orange-500    | FLOW    |
| 5   | FAILURE  | Where do problems concentrate?  | red-500       | FAILURE |
| 6   | FIND IT  | Where's the 46%?                | purple-500    | —       |
| 7   | FIX IT   | What action did you take?       | amber-500     | —       |
| 8   | CHECK IT | Did the fix work?               | teal-500      | —       |
| 9   | CONTINUE | Where's YOUR 46%?               | brand-primary | —       |

**Tagline phases:** Find it (1-6) → Fix it (7) → Check it (8) → Continue (9)

---

## Site Architecture with Journey Integration

```
                                    ┌─────────────────┐
                                    │    HOMEPAGE     │
                                    │                 │
                                    │  AVERAGES hook  │
                                    │  "But is it?"   │
                                    │       ↓         │
                                    │  Mini-journey   │
                                    │       ↓         │
                                    │  "Take the      │
                                    │   full journey" │
                                    └────────┬────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              │                              │                              │
              ▼                              ▼                              ▼
    ┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
    │    /journey     │            │    /cases/*     │            │    /tools/*     │
    │                 │            │                 │            │                 │
    │  Full 9-step    │◄──────────►│  Each case      │◄──────────►│  Each tool      │
    │  scroll exp.    │            │  follows the    │            │  maps to a      │
    │                 │            │  journey arc    │            │  pillar         │
    │  AVERAGES       │            │                 │            │                 │
    │  VALUE          │            │  Act 1: Setup   │            │  /i-chart       │
    │  CHANGE         │            │  Act 2: Explore │            │   → CHANGE      │
    │  FLOW           │            │  Act 3: Reveal  │            │  /boxplot       │
    │  FAILURE        │            │                 │            │   → FLOW        │
    │  FIND IT        │            │  Same journey   │            │  /pareto        │
    │  FIX IT         │            │  different data │            │   → FAILURE     │
    │  CHECK IT       │            │                 │            │  /capability    │
    │  CONTINUE       │            │                 │            │   → VALUE       │
    └────────┬────────┘            └────────┬────────┘            └────────┬────────┘
             │                              │                              │
             └──────────────────────────────┼──────────────────────────────┘
                                            │
                                            ▼
                              ┌─────────────────────────┐
                              │      /app or /product   │
                              │                         │
                              │   "Find YOUR 46%"       │
                              │   Apply the journey     │
                              │   to your own data      │
                              └─────────────────────────┘
```

---

## Page-by-Page Integration

### 1. Homepage (`/`)

**Role:** Entry point — hook with AVERAGES, tease the journey

**Structure:**

```
┌─────────────────────────────────────────────────────────────┐
│ HERO: The Illusion                                          │
│   "See Beyond Averages"                                     │
│   [Dashboard showing 95% pass rate - looks fine]            │
│   "But is it?"                                              │
│   [↓ See what's hiding]                                     │
├─────────────────────────────────────────────────────────────┤
│ MINI-JOURNEY: The Transformation                            │
│   One scroll shows: Averages → Pattern → 46% discovery      │
│   "This is what VaRiScout reveals"                          │
│   [Take the full journey →]                                 │
├─────────────────────────────────────────────────────────────┤
│ FOUR PILLARS: The Framework                                 │
│   CHANGE | FLOW | FAILURE | VALUE                           │
│   (Color-coded, linked to tool pages)                       │
├─────────────────────────────────────────────────────────────┤
│ USE CASES: Your Context                                     │
│   LSS Training | Quality & Operations                       │
├─────────────────────────────────────────────────────────────┤
│ PRODUCTS: Choose Your Platform                              │
│   Web | Excel | Power BI | Azure                            │
├─────────────────────────────────────────────────────────────┤
│ FINAL CTA: Where's YOUR 46%?                                │
│   "Find it. Fix it. Check it. Continue."                    │
└─────────────────────────────────────────────────────────────┘
```

**Key elements:**

- Hero shows AVERAGES visual (the illusion)
- Mini-journey teases the full experience
- Four Pillars connect to tool pages
- Everything leads to journey or app

---

### 2. Journey Page (`/journey`)

**Role:** The full experience — 9 sections, scroll-driven narrative

**Already implemented** with:

- AVERAGES → VALUE → CHANGE → FLOW → FAILURE → FIND IT → FIX IT → CHECK IT → CONTINUE
- Progress indicator (dots/labels)
- Scroll-snap sections
- Animated CHECK IT section
- Final CTA with products

**Enhancements:**

- Add "back to home" at top
- Add "skip to section" navigation
- Add "next: explore cases" after CONTINUE

---

### 3. Case Studies (`/cases/*`)

**Role:** Journey in context — same arc, real-world data

**Structure per case:**

```
┌─────────────────────────────────────────────────────────────┐
│ CASE HERO                                                   │
│   Industry tag | Difficulty | Time to complete              │
│   "The Coffee Grading Mystery"                              │
├─────────────────────────────────────────────────────────────┤
│ ACT 1: THE SETUP (= AVERAGES)                               │
│   "The roastery's dashboard shows 94% grade compliance..."  │
│   [Dashboard visual - looks fine]                           │
├─────────────────────────────────────────────────────────────┤
│ ACT 2: YOUR TURN (= CHANGE → FLOW → FAILURE)                │
│   Interactive PWA embed                                     │
│   "Can you find what's hiding?"                             │
│   Hints available if stuck                                  │
├─────────────────────────────────────────────────────────────┤
│ ACT 3: THE REVEAL (= FIND IT → FIX IT → CHECK IT)           │
│   Breadcrumb shows drill-down path                          │
│   "Night shift + Drying Bed C = 46% of variation"           │
│   Before/after comparison                                   │
├─────────────────────────────────────────────────────────────┤
│ CONTINUE                                                    │
│   [Try another case] [Take the full journey] [Try your data]│
└─────────────────────────────────────────────────────────────┘
```

**Journey mapping:**
| Case Act | Journey Section |
|----------|-----------------|
| Setup | AVERAGES |
| Explore | VALUE → CHANGE → FLOW → FAILURE |
| Reveal | FIND IT → FIX IT → CHECK IT |
| CTA | CONTINUE |

---

### 4. Tool Pages (`/tools/*`)

**Role:** Deep-dive on one pillar — educational, SEO-focused

**Journey connection:**
| Tool Page | Pillar | Journey Section | Color |
|-----------|--------|-----------------|-------|
| `/tools/i-chart` | CHANGE | Section 3 | blue-500 |
| `/tools/boxplot` | FLOW | Section 4 | orange-500 |
| `/tools/pareto` | FAILURE | Section 5 | red-500 |
| `/tools/capability` | VALUE | Section 2 | green-500 |

**Structure per tool page:**

```
┌─────────────────────────────────────────────────────────────┐
│ PILLAR BADGE: "CHANGE" (blue)                               │
│ "Step 3 of the VaRiScout Journey"                           │
├─────────────────────────────────────────────────────────────┤
│ HERO: What question does this answer?                       │
│ "What patterns does time reveal?"                           │
├─────────────────────────────────────────────────────────────┤
│ [Tool content: When to use, How to read, Patterns, etc.]    │
├─────────────────────────────────────────────────────────────┤
│ JOURNEY NAVIGATION                                          │
│ ← VALUE (previous) | FLOW (next) →                          │
│ [See this in the full journey]                              │
├─────────────────────────────────────────────────────────────┤
│ CTA: "Find YOUR patterns"                                   │
│ [Try the app] [Take the journey]                            │
└─────────────────────────────────────────────────────────────┘
```

---

### 5. Product Pages (`/product/*`)

**Role:** Conversion — apply the journey to your own data

**Journey connection:**

- Show screenshots labeled by journey phase
- "Run your own journey with [Product]"
- Feature list organized by pillar

**Structure:**

```
┌─────────────────────────────────────────────────────────────┐
│ HERO: "Your data. Your journey."                            │
├─────────────────────────────────────────────────────────────┤
│ WHAT YOU CAN DO (organized by journey):                     │
│                                                             │
│ FIND IT                                                     │
│   - See patterns with I-Chart (CHANGE)                      │
│   - Compare factors with Boxplot (FLOW)                     │
│   - Find concentration with Pareto (FAILURE)                │
│   - Check specs with Capability (VALUE)                     │
│                                                             │
│ FIX IT                                                      │
│   - Drill down to isolate root cause                        │
│   - Export breadcrumb for action planning                   │
│                                                             │
│ CHECK IT                                                    │
│   - Re-run analysis after fix                               │
│   - Compare before/after                                    │
│                                                             │
│ CONTINUE                                                    │
│   - Save projects, track progress                           │
├─────────────────────────────────────────────────────────────┤
│ PRICING + CTA                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Visual Consistency System

### Pillar Colors (Used Everywhere)

| Pillar/Section | Tailwind Class | Hex     | Usage                 |
| -------------- | -------------- | ------- | --------------------- |
| AVERAGES       | neutral-400    | #9ca3af | Muted, "before" state |
| VALUE          | green-500      | #22c55e | Customer voice        |
| CHANGE         | blue-500       | #3b82f6 | Time patterns         |
| FLOW           | orange-500     | #f97316 | Factor comparison     |
| FAILURE        | red-500        | #ef4444 | Problem concentration |
| FIND IT        | purple-500     | #a855f7 | Discovery moment      |
| FIX IT         | amber-500      | #f59e0b | Action taken          |
| CHECK IT       | teal-500       | #14b8a6 | Verification          |
| CONTINUE       | brand-primary  | —       | Call to action        |

### Journey Progress Component

Reusable component showing where you are:

```
○───○───●───○───○───○───○───○───○
AVG VAL CHG FLO FAI FND FIX CHK CON
            ↑
        You are here
```

Use on:

- Journey page (full)
- Tool pages (highlight relevant section)
- Case studies (show progress through acts)

---

## Navigation Integration

### Primary Nav

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  VaRiScout    Journey    Tools ▼    Cases    Products ▼    [Try Free]        │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Journey** is now a primary nav item (not hidden in hero CTA).

### Tools Dropdown (with journey context)

```
┌─────────────────────────────┐
│ THE FOUR PILLARS            │
│ ─────────────────────────── │
│ 🔵 I-Chart (CHANGE)         │
│ 🟠 Boxplot (FLOW)           │
│ 🔴 Pareto (FAILURE)         │
│ 🟢 Capability (VALUE)       │
│ ─────────────────────────── │
│ See them in action →        │ → /journey
└─────────────────────────────┘
```

---

## Cross-Linking Strategy

### From any page, users can:

1. **Go deeper** → Full journey page
2. **Go specific** → Tool page for that pillar
3. **Go practical** → Case study with real data
4. **Go action** → App to try with own data

### Link patterns:

| From       | To        | Link Text                 |
| ---------- | --------- | ------------------------- |
| Homepage   | Journey   | "Take the full journey"   |
| Homepage   | Tools     | Pillar cards              |
| Journey    | Cases     | "See this with real data" |
| Journey    | App       | "Find YOUR 46%"           |
| Tool page  | Journey   | "See this in context"     |
| Tool page  | Next tool | "Next: FLOW →"            |
| Case study | Journey   | "Learn the methodology"   |
| Case study | App       | "Try with your data"      |

---

## Implementation Phases

### Phase 1: Homepage ✅

- [x] Add AVERAGES visual to hero
- [x] Add mini-journey section
- [x] Add Four Pillars section with colors
- [x] Update navigation

### Phase 2: Tool Pages ✅

- [x] Add pillar badge + journey position (JourneyToolBadge)
- [x] Add journey navigation prev/next (JourneyToolNav)
- [x] Color-code by pillar

### Phase 3: Case Studies ✅

- [x] Structure cases with Act 1/2/3
- [x] Map acts to journey sections (JourneyCaseBadge)
- [x] Add journey progress indicator

### Phase 4: Products ✅

- [x] Organize features by journey phase (JourneyFeatures)
- [x] Add journey tagline (JourneyProductBadge)

---

## Success Metrics

| Metric                  | Target             | Measures                 |
| ----------------------- | ------------------ | ------------------------ |
| Journey completion rate | >40%               | Users who reach CONTINUE |
| Cross-page navigation   | >2.5 pages/session | Journey → Tools → App    |
| Case study engagement   | >60% reach Act 3   | Complete the narrative   |
| Conversion              | >5% journey → app  | Start using product      |

---

## Summary

**The website IS the journey.**

Every page either:

- **Hooks** with AVERAGES (the illusion)
- **Reveals** through the pillars (CHANGE, FLOW, FAILURE, VALUE)
- **Delivers** the aha (FIND IT - the 46%)
- **Completes** the cycle (FIX IT, CHECK IT, CONTINUE)

Visitors experience the methodology before they ever touch the product.
When they do try the app, they already know what questions to ask.

> "Find it. Fix it. Check it. Continue."
