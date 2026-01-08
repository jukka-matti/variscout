# VaRiScout Website: User Flows & Architecture

> How users find, navigate, and convert on variscout.com

---

## Part 1: User Personas

### Primary Personas

| Persona             | Role                           | Goal                         | Knowledge Level                | Entry Point                       |
| ------------------- | ------------------------------ | ---------------------------- | ------------------------------ | --------------------------------- |
| **Green Belt Gary** | Quality Engineer, GB certified | Find better tools than Excel | Knows basics, wants efficiency | Google search, LinkedIn, YouTube  |
| **OpEx Olivia**     | OpEx Manager                   | Find tools for team          | Strategic, evaluates ROI       | Referral, LinkedIn                |
| **Curious Carlos**  | Operations Supervisor          | Understand variation better  | Interested but not trained     | YouTube, TikTok, Instagram        |
| **Student Sara**    | LSS student / trainee          | Learn methodology            | Learning, needs guidance       | Course link, Google, YouTube      |
| **Evaluator Erik**  | IT/Procurement                 | Assess for organization      | Technical, security-focused    | Direct link from colleague        |
| **Trainer Tina**    | LSS Trainer / Consultant       | Tools for courses & clients  | Expert, evaluates for students | LinkedIn, YouTube, Watson network |

### Secondary Personas

| Persona                | Role                                 | Goal               | Entry Point                |
| ---------------------- | ------------------------------------ | ------------------ | -------------------------- |
| **Consultant Chris**   | LSS Consultant                       | Tools for clients  | Conference, Watson network |
| **Academic Anna**      | Professor/Trainer                    | Teaching materials | Research, referral         |
| **Coffee Coop Carmen** | Quality manager (developing country) | Practical tools    | Origin IMS connection      |

---

## Part 2: Entry Points & First Impressions

### Entry Point Map

```
                                    ┌─────────────────┐
                                    │   variscout.com │
                                    └────────┬────────┘
                                             │
        ┌────────────────┬───────────────────┼───────────────────┬────────────────┐
        │                │                   │                   │                │
        ▼                ▼                   ▼                   ▼                ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Google Search │ │   LinkedIn    │ │   YouTube /   │ │    Referral   │ │  Direct URL   │
│               │ │               │ │   Social      │ │               │ │               │
│ "how to read  │ │ Post / Video  │ │ Full video /  │ │ Colleague /   │ │ Bookmark /    │
│  boxplot"     │ │ / Article     │ │ TikTok clip   │ │ Conference    │ │ Return visit  │
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └───────┬───────┘
        │                 │                 │                 │                 │
        ▼                 ▼                 ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  Tool Page    │ │   Homepage    │ │  Blog / Tool  │ │   Homepage    │ │   Homepage    │
│  /tools/X     │ │   /           │ │  Page         │ │   /           │ │   or /app     │
└───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘
```

### First Impression by Entry Point

| Entry Point                  | Lands On            | First Question                  | Must Answer in 5 Seconds        |
| ---------------------------- | ------------------- | ------------------------------- | ------------------------------- |
| Google "how to read boxplot" | /tools/boxplot      | "Does this answer my question?" | Yes — with visual + explanation |
| LinkedIn post about case     | /cases/bottleneck   | "Is this relevant to me?"       | Yes — industry recognition      |
| YouTube video link           | /blog/X or /tools/X | "Is there more?"                | Yes — deeper content + CTA      |
| TikTok/Instagram clip        | /tools/X or /       | "What is this tool?"            | Clear value prop + demo         |
| Colleague referral           | / (homepage)        | "What is this?"                 | Clear value prop + demo         |
| Return visit                 | / or /app           | "Where was I?"                  | Easy navigation to app/cases    |

---

## Part 3: Site Architecture

### Information Architecture

```
variscout.com
│
├── / (Homepage)
│   ├── Hero: "See Beyond Averages" + featured case journey
│   ├── Value prop section
│   ├── Tool overview (4 pillars visual)
│   ├── Case teaser (3 cases)
│   ├── Product comparison
│   └── CTA: "Find YOUR 46%"
│
├── /journey
│   └── Full scroll experience (7 sections)
│       └── AVERAGES → CHANGE → FLOW → FAILURE → VALUE → CLARITY → CLOSE
│
├── /cases (Case Library Hub)
│   ├── Index: Browse by industry, filter by complexity
│   │
│   ├── /cases/bottleneck
│   ├── /cases/hospital-ward
│   ├── /cases/coffee
│   ├── /cases/packaging
│   └── /cases/avocado
│
├── /tools (Tool Education Hub)
│   ├── Index: Overview of 4 pillars + tools
│   │
│   ├── /tools/i-chart      (CHANGE)
│   ├── /tools/boxplot      (FLOW)
│   ├── /tools/pareto       (FAILURE)
│   ├── /tools/capability   (VALUE)
│   └── /tools/regression   (Add-on)
│
├── /learn (Conceptual Content Hub)
│   ├── Index: Learning paths
│   │
│   ├── /learn/four-pillars     (Methodology)
│   ├── /learn/two-voices       (Control vs Spec)
│   ├── /learn/eda-philosophy   (EDA vs Traditional)
│   └── /learn/variation-types  (Special vs Common cause)
│
├── /products
│   ├── Overview: Compare all products
│   │
│   ├── /products/pwa           (Browser app)
│   ├── /products/excel         (Excel add-in)
│   └── /products/enterprise    (Team solution)
│
├── /pricing
│   └── Pricing table + FAQ
│
├── /app (Application entry)
│   └── Launches PWA directly (no login needed)
│
├── /about
│   ├── Story (The Why - full narrative)
│   └── Team (RDMAIC Oy)
│
└── /support
    ├── Getting started
    ├── FAQ
    └── Contact (technical support)
```

**Note on /about/story:** This is a key differentiator page. Not a generic "About Us" but a narrative that establishes WHY VaRiScout exists - the founder journey, the 100-year lineage, and the insight that led to the product. Watson connection is woven into this story rather than a separate page.

### Navigation Structure

**Primary Navigation (Header)**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Logo: VaRiScout]                                                          │
│                                                                             │
│  Journey    Cases    Tools ▼    Learn ▼    Pricing    [Try VaRiScout]      │
│                      ├─ I-Chart    ├─ Four Pillars                          │
│                      ├─ Boxplot    ├─ Two Voices                            │
│                      ├─ Pareto     ├─ EDA Philosophy                        │
│                      ├─ Capability └─ Variation Types                       │
│                      └─ Regression                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Footer Navigation**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PRODUCT           LEARN              COMPANY          CONNECT              │
│  ─────────         ─────              ───────          ───────              │
│  PWA               Four Pillars       About            YouTube              │
│  Excel Add-in      Two Voices         Team             LinkedIn             │
│  Enterprise        EDA Philosophy     Support          @variationscouting   │
│  Pricing           Case Library                        Newsletter           │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────── │
│  © 2026 RDMAIC Oy  ·  Privacy  ·  Terms  ·  "See What's Driving Variation" │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 4: User Flows

### Flow 1: SEO Learner → Product

**Persona:** Green Belt Gary searching "how to read control chart"

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

**Key Metrics:**

- Tool page → Demo interaction: >50%
- Demo → Product page: >15%
- Product page → Conversion: >10%

---

### Flow 2: Social Discovery → Case → Product

**Persona:** Curious Carlos sees LinkedIn post

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

**Key Metrics:**

- LinkedIn → Case page: (click-through from post)
- Case Act 1 → Act 2 (demo): >60%
- Case Act 2 → Act 3 (solution): >70%
- Case → Product page: >20%
- Case → Another case: >30%

---

### Flow 3: YouTube / Content → Website → Product

**Persona:** Curious Carlos discovers VaRiScout through content

**The Content Engine:**

```
1 VIDEO (Jukkis talking, 5-10 min)
        │
        ├── YouTube (full video)
        ├── Blog post (transcript + expansion)
        ├── LinkedIn posts (2-3 per week)
        ├── TikTok clips (3-5 per video)
        └── Instagram reels + carousel
```

**The 16-Week Campaign Narrative:**

```
Month 1: ESTIEM    → "What students taught me"
Month 2: ABB       → "What practitioners taught me"
Month 3: Africa    → "What simplicity really means"
Month 4: Current   → "This is what I built. This is what I use."
```

**User Flow:**

```
┌─────────────────┐
│ YouTube Search  │
│ "how to read    │
│  control chart" │
│       OR        │
│ TikTok/IG clip  │
│ "AI vs I-Chart" │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ VaRiScout       │
│ Content         │
│                 │
│ Educational     │
│ video/clip      │
│ with demo       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Video CTA:      │
│ "Try VaRiScout" │
│ Link in bio/    │
│ description     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────────┐
│ /blog  │ │ /tools/X   │
│ (post) │ │            │
└────┬───┘ └─────┬──────┘
     │           │
     │    ┌──────┴──────┐
     │    │             │
     │    ▼             ▼
     │ ┌────────┐ ┌────────────┐
     │ │Try demo│ │ Deeper     │
     │ │        │ │ content    │
     │ └────┬───┘ └─────┬──────┘
     │      │           │
     └──────┼───────────┘
            │
            ▼
   ┌─────────────────┐
   │ /products       │
   │                 │
   │ Warm from video │
   │ Ready to try    │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ CONVERSION      │
   │       OR        │
   │ TRAINING        │
   │ INQUIRY         │
   └─────────────────┘
```

**Weekly Content Cycle:**
| Day | Content |
|-----|---------|
| **Monday** | YouTube video + Blog post |
| **Tuesday** | LinkedIn post #1 + TikTok clip #1 |
| **Wednesday** | Instagram carousel + TikTok clip #2 |
| **Thursday** | LinkedIn post #2 + TikTok clip #3 |
| **Friday** | LinkedIn post #3 (engagement/discussion) |

**The Flywheel:**

```
Free tool user
      ↓
Sees value, wants to learn more
      ↓
Training participant (GB course)
      ↓
Uses tool in real project (at gemba)
      ↓
Needs coaching support
      ↓
Coaching client (explore data together)
      ↓
Recommends to colleagues → New free tool users
```

**Key Metrics:**

- YouTube → Website: track UTM (target >5%)
- TikTok/IG → Website: track UTM (target >2%)
- Content viewers → Product page: >10%
- Content viewers → Training inquiry: track

---

### Flow 4: Enterprise Evaluator

**Persona:** OpEx Olivia evaluating for team

```
┌─────────────────┐
│ Referral from   │
│ colleague or    │
│ conference      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ / (Homepage)    │
│                 │
│ Quick scan:     │
│ "What is this?" │
│ "Who is it for?"│
└────────┬────────┘
         │
    ┌────┴────────────┐
    │                 │
    ▼                 ▼
┌────────────┐  ┌────────────┐
│ /journey   │  │ /products  │
│            │  │            │
│ See the    │  │ Jump to    │
│ methodology│  │ enterprise │
└─────┬──────┘  └─────┬──────┘
      │               │
      ▼               │
┌────────────┐        │
│ "I get it" │        │
│            │        │
│ Now eval   │        │
│ for team   │────────┘
└─────┬──────┘
      │
      ▼
┌─────────────────┐
│ /products/      │
│ enterprise      │
│                 │
│ Features        │
│ Security docs   │
│ Deployment guide│
│ Pricing         │
└────────┬────────┘
      │
      ▼
┌─────────────────┐
│ Questions:      │
│                 │
│ • SSO/Security? │ → Documentation
│ • Data hosting? │ → "Your Azure, your data"
│ • Deployment?   │ → 1-click ARM template
│ • Need help?    │ → Your LSS/IT consultants can assist
└────────┬────────┘
      │
 ┌────┴────────────────┐
 │                     │
 ▼                     ▼
┌────────────┐  ┌─────────────────┐
│ SELF-SERVE │  │ NEED HELP?      │
│            │  │                 │
│ Purchase   │  │ Your existing   │
│ online     │  │ consultants     │
│ Deploy     │  │ can deploy it   │
└────────────┘  └─────────────────┘
```

**Self-Serve Enterprise Model:**

- All pricing visible online
- Purchase via Paddle (individual) or AppSource (Power BI)
- Azure deployment: 1-click ARM template
- Documentation answers technical questions
- Your existing LSS or IT consultants can help with implementation

**Key Metrics:**

- Homepage → Enterprise page: track this path
- Enterprise page → Purchase: >5%

---

### Flow 5: Return Visitor → App

**Persona:** Existing user returning

```
┌─────────────────┐
│ Direct URL or   │
│ Bookmark        │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌─────────────────┐
│ /app   │ │ / (Homepage)    │
│        │ │                 │
│ Direct │ │ "I know what    │
│ to PWA │ │ this is"        │
└────────┘ └────────┬────────┘
                    │
                    ▼
           ┌─────────────────┐
           │ Clicks:         │
           │                 │
           │ [Try VaRiScout] │
           └────────┬────────┘
                    │
                    ▼
           ┌─────────────────┐
           │ /app            │
           │                 │
           │ PWA loads       │
           │ (license in     │
           │  IndexedDB)     │
           └─────────────────┘
```

**Key Insight:** Return users can bookmark /app directly. No login needed - license stored locally.

**Header (same for all users):**

```
[Logo]  Journey  Cases  Tools ▼  Learn ▼  Pricing  [Try VaRiScout]
```

---

## Part 5: Page Connections

### Cross-Linking Map

```
                    ┌─────────────┐
                    │  Homepage   │
                    │      /      │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    ┌───────────┐    ┌───────────┐    ┌───────────┐
    │  Journey  │    │   Cases   │    │   Tools   │
    │ /journey  │    │  /cases   │    │  /tools   │
    └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
          │                │                │
          │                │                │
          ▼                ▼                ▼
    ┌─────────────────────────────────────────────┐
    │                                             │
    │              CROSS-LINKS                    │
    │                                             │
    │  Journey ←──→ Cases (same methodology)      │
    │  Cases ←──→ Tools (tool used in case)       │
    │  Tools ←──→ Learn (deeper concepts)         │
    │  Tools ←──→ Tools (workflow: I-Chart→Box)   │
    │  All ───→ Products (CTA)                    │
    │                                             │
    └─────────────────────────────────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Products   │
                    │ /products   │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Pricing    │
                    │ /pricing    │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ CONVERSION  │
                    └─────────────┘
```

### Specific Cross-Links

**From Tool Pages:**

| From              | Links To          | Reason                             |
| ----------------- | ----------------- | ---------------------------------- |
| /tools/i-chart    | /tools/boxplot    | "Next: find which factor"          |
| /tools/i-chart    | /tools/capability | "Check: does it meet specs?"       |
| /tools/i-chart    | /learn/two-voices | "Deep dive: Two Voices"            |
| /tools/i-chart    | /cases/bottleneck | "See it in action"                 |
| /tools/boxplot    | /tools/pareto     | "Next: where problems concentrate" |
| /tools/boxplot    | /tools/i-chart    | "First: check time patterns"       |
| /tools/pareto     | /tools/capability | "Next: impact on capability"       |
| /tools/capability | /tools/i-chart    | "First: check stability"           |
| /tools/capability | /learn/two-voices | "Deep dive: Two Voices"            |

**From Case Pages:**

| From              | Links To             | Reason                     |
| ----------------- | -------------------- | -------------------------- |
| /cases/bottleneck | /tools/i-chart       | "Learn more about I-Chart" |
| /cases/bottleneck | /cases/hospital-ward | "Next case"                |
| /cases/bottleneck | /learn/four-pillars  | "The methodology"          |

**From Learn Pages:**

| From                | Links To          | Reason                |
| ------------------- | ----------------- | --------------------- |
| /learn/two-voices   | /tools/i-chart    | "See it in VaRiScout" |
| /learn/two-voices   | /tools/capability | "Capability view"     |
| /learn/four-pillars | /journey          | "See full journey"    |
| /learn/four-pillars | /tools (all)      | "Individual tools"    |

---

## Part 6: Conversion Points

### Primary CTAs by Page Type

| Page Type  | Primary CTA                             | Secondary CTA                 |
| ---------- | --------------------------------------- | ----------------------------- |
| Homepage   | "Find YOUR 46%" → /products             | "See how it works" → /journey |
| Journey    | "Where's YOUR pattern?" → /products     | "See more cases" → /cases     |
| Case page  | "Do this with your data" → /products    | "Try another case" → /cases   |
| Tool page  | "Try VaRiScout" → /products             | "See it in a case" → /cases   |
| Learn page | "Apply this with VaRiScout" → /products | "See it in action" → /cases   |
| Products   | [Get PWA] / [Get Excel] / [Enterprise]  | Compare options               |
| Pricing    | [Choose plan]                           | FAQ / Documentation           |

### Email Capture Points

| Location               | Trigger          | Offer                                             |
| ---------------------- | ---------------- | ------------------------------------------------- |
| Case completion        | After Act 3      | "Get more case studies + analysis tips"           |
| Tool page (scroll 70%) | Exit intent      | "Download data collection template"               |
| Homepage               | After journey    | "Subscribe for weekly variation scouting content" |
| Blog post              | End of article   | "Get video + tips in your inbox"                  |
| Pricing page           | If no conversion | "Get notified of discounts"                       |

---

## Part 6.5: Content Marketing Strategy

### Campaign: "See What's Driving Variation"

**Duration:** 16 weeks (4 months) + Month 5 bonus
**Content Creator:** Jukkis / RDMAIC Oy

### The Narrative Arc

```
Month 1-3: THE LEARNINGS
─────────────────────────────────────────────────────
ESTIEM → "I learned what students need to SEE"
           ↓
ABB    → "I learned what practitioners need to EXPLORE"
           ↓
Africa → "I learned what simplicity really means"


Month 4: THE SYNTHESIS
─────────────────────────────────────────────────────
"I built VaRiScout Lite from all of this.
 It's not theoretical - it's what I use TODAY
 in every training I deliver and every project I coach."

Month 5: THE GB TOOLKIT (Bonus)
─────────────────────────────────────────────────────
3-Way AI Comparison: Copilot vs Analyst Agent vs VaRiScout
(Capability, Probability Plot, Gage R&R, Regression, Full Workflow)
```

### Four Weekly Themes (Rotating Each Month)

| Week | Theme              | Core Message                                            | Barrier Removed            |
| ---- | ------------------ | ------------------------------------------------------- | -------------------------- |
| 1    | Accessibility      | "Not for statisticians - for problem solvers"           | Fear / intimidation        |
| 2    | Practitioner-built | "Built at the gemba, not in the boardroom"              | "Is this practical?" doubt |
| 3    | Economics          | "Statistical software costs 2k€. Your browser is free." | Budget gatekeepers         |
| 4    | AI Reality Check   | "AI hallucinates. Your process data doesn't."           | Shiny-object syndrome      |

### The Content Engine

```
1 VIDEO (Jukkis talking, 5-10 min)
        │
        ├── YouTube (full video)
        ├── Blog post (transcript + expansion)
        ├── LinkedIn posts (2-3 per week)
        ├── TikTok clips (3-5 per video)
        └── Instagram (reels + carousel)
```

### Weekly Publishing Schedule

| Day           | Content                                           |
| ------------- | ------------------------------------------------- |
| **Monday**    | YouTube video + Blog post + LinkedIn announcement |
| **Tuesday**   | LinkedIn post #1 + TikTok clip #1                 |
| **Wednesday** | Instagram carousel + TikTok clip #2               |
| **Thursday**  | LinkedIn post #2 + TikTok clip #3                 |
| **Friday**    | LinkedIn post #3 (engagement/discussion)          |

### Brand Architecture

| Element                 | Name               | Use                                   |
| ----------------------- | ------------------ | ------------------------------------- |
| **Product/Tool**        | VaRiScout          | Official name, website, company pages |
| **Practice/Philosophy** | variation scouting | What you DO, hashtag, verb            |
| **Social Handles**      | @variationscouting | TikTok, Instagram (cleaner to type)   |

### Hashtag Strategy

| Tag                       | Use                    |
| ------------------------- | ---------------------- |
| #VariationScouting        | Primary - the practice |
| #VaRiScout                | The tool specifically  |
| #SeeWhatsDrivingVariation | Campaign tagline       |
| #LeanSixSigma             | Community reach        |
| #ProcessImprovement       | Community reach        |

### Key Messages

| Context            | Message                                                          |
| ------------------ | ---------------------------------------------------------------- |
| **Headline**       | See What's Driving Variation                                     |
| **Tagline**        | EDA for process improvement                                      |
| **Philosophy**     | Explore first. Stats when you need them.                         |
| **Differentiator** | Built for discovery, not just confirmation                       |
| **Live analysis**  | Analyze AND present in the same meeting                          |
| **Gemba-tested**   | Built at the gemba, not in the boardroom                         |
| **The synthesis**  | Built from 10+ years of learnings. This is what I use every day. |

### Integrated Service Offering

VaRiScout Lite connects to RDMAIC Oy's services:

| Offering                | VaRiScout Role                                     |
| ----------------------- | -------------------------------------------------- |
| **Green Belt Training** | Primary analysis tool throughout the course        |
| **Project Coaching**    | Live exploration tool in coaching sessions         |
| **Gemba Visits**        | Quick analysis of process data on-site             |
| **Tollgate Reviews**    | Presentation-ready outputs for stakeholder reviews |

### CTAs by Audience

| Audience               | Primary CTA        | Secondary CTA            |
| ---------------------- | ------------------ | ------------------------ |
| Practitioners / GBs    | Try VaRiScout free | RDMAIC training info     |
| Trainers / Consultants | Try VaRiScout free | Use it with your clients |
| Quality/Ops Managers   | Try VaRiScout free | RDMAIC in-house training |
| Organizations          | Try VaRiScout free | Self-deploy guide        |

**Note:** All purchases are self-serve via Paddle or AppSource. RDMAIC Oy provides training/coaching services separately.

---

## Part 7: Mobile Considerations

### Mobile Navigation

```
┌─────────────────────────┐
│ [☰]  VaRiScout   [Try]  │
├─────────────────────────┤
│                         │
│  [Page content]         │
│                         │
│                         │
├─────────────────────────┤
│ [Try VaRiScout]  STICKY │
└─────────────────────────┘

Mobile menu (hamburger):
┌─────────────────────────┐
│ Journey                 │
│ Cases                 ▶ │
│ Tools                 ▶ │
│ Learn                 ▶ │
│ Pricing                 │
│ ─────────────────────── │
│ [Try VaRiScout]         │
└─────────────────────────┘
```

### Mobile-Specific Flows

| Desktop Flow   | Mobile Adaptation           |
| -------------- | --------------------------- |
| Journey scroll | Same, but touch-optimized   |
| Case demo      | Simplified interaction      |
| Tool page demo | May need "full screen" mode |
| Navigation     | Hamburger menu              |
| CTA            | Sticky bottom button        |

---

## Part 8: Analytics & Tracking

### Key Events to Track

| Category        | Event                        | Purpose                    |
| --------------- | ---------------------------- | -------------------------- |
| **Entry**       | Landing page by source       | Know where users come from |
| **Engagement**  | Scroll depth (25/50/75/100%) | Content engagement         |
| **Interaction** | Demo clicks                  | Product interest           |
| **Navigation**  | Page-to-page flow            | Understand journeys        |
| **Conversion**  | Product page view            | Purchase intent            |
| **Conversion**  | Pricing page view            | Serious intent             |
| **Conversion**  | Purchase / App launch        | Success                    |
| **Email**       | Email capture                | Lead gen                   |

### Funnel Definition

```
AWARENESS
    │
    ▼
┌─────────────────┐
│ Site Visit      │ ← Entry metric
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Engagement      │ ← >60s on site OR >50% scroll OR demo click
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Interest        │ ← Views product OR pricing page
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Conversion      │ ← Signs up or purchases
└─────────────────┘
```

---

## Part 9: Gap Analysis

### What's Missing?

| Gap                          | Impact                               | Priority  |
| ---------------------------- | ------------------------------------ | --------- |
| **Enterprise page content**  | Enterprise evaluators need more info | 🔴 High   |
| **Mobile navigation design** | Mobile users may struggle            | 🟡 Medium |
| **Search functionality**     | Can't find specific content          | 🟡 Medium |
| **Breadcrumbs**              | Users may feel lost in deep pages    | 🟡 Medium |
| **Related content**          | Manual cross-links only              | 🟢 Low    |

### Recommended Additions

1. **Enterprise page:** Full page with security, deployment, support info
2. **Mobile:** Sticky CTA at bottom of all pages
3. **Search:** Simple search in header for larger site
4. **Breadcrumbs:** On all pages below homepage level
5. **PWA install prompt:** Guide users to install for offline access

### No Login Needed

VaRiScout is 100% client-side:

- **Free users:** Just use /app directly
- **Paid users:** Enter license key once → stored in IndexedDB
- **Return users:** Bookmark /app or click [Try VaRiScout]
- **No accounts:** "We don't have your data" (GDPR simple)

---

## Part 10: Revised Site Map

### Complete Site Map with All Pages

```
variscout.com
│
├── / ────────────────────────────────── Homepage
│
├── /journey ─────────────────────────── Full scroll experience
│
├── /cases ───────────────────────────── Case library hub
│   ├── /cases/bottleneck ────────────── Week 1: Process step analysis
│   ├── /cases/hospital-ward ─────────── Week 5: Aggregation trap
│   ├── /cases/coffee ────────────────── Week 9: Drying bed comparison
│   ├── /cases/packaging ─────────────── Week 9: Defect analysis
│   └── /cases/avocado ───────────────── Week 12: Regression analysis
│
├── /tools ───────────────────────────── Tools hub
│   ├── /tools/i-chart
│   ├── /tools/boxplot
│   ├── /tools/pareto
│   ├── /tools/capability
│   ├── /tools/regression
│   └── /tools/gage-rr ───────────────── MSA for Green Belts
│
├── /learn ───────────────────────────── Learning hub
│   ├── /learn/four-pillars
│   ├── /learn/two-voices
│   ├── /learn/eda-philosophy
│   └── /learn/variation-types
│
├── /products ────────────────────────── Products hub
│   ├── /products/pwa
│   ├── /products/excel
│   └── /products/enterprise ←────────── NEW: Full enterprise page
│
├── /pricing ─────────────────────────── Pricing page
│
├── /app ─────────────────────────────── PWA application (no login needed)
│   └── License activation via Settings (key stored in IndexedDB)
│
├── /about ───────────────────────────── About hub
│   ├── /about/story ─────────────────── THE WHY (key page - see below)
│   └── /about/team ──────────────────── RDMAIC Oy team
│
├── /support ─────────────────────────── Support hub
│   ├── /support/getting-started
│   ├── /support/faq
│   └── /support/contact (technical support)
│
├── /blog ────────────────────────────── Content marketing hub
│   ├── /blog (index)
│   └── /blog/{slug} (individual posts)
│
└── /legal
    ├── /legal/privacy
    └── /legal/terms
```

### Content Distribution Channels

| Channel               | Handle             | Purpose                |
| --------------------- | ------------------ | ---------------------- |
| **YouTube**           | VaRiScout          | Full videos, tutorials |
| **LinkedIn Personal** | Jukkis             | Thought leadership     |
| **LinkedIn Company**  | VaRiScout          | Product news           |
| **TikTok**            | @variationscouting | Short clips, discovery |
| **Instagram**         | @variationscouting | Reels, carousels       |
| **Blog**              | variscout.com/blog | SEO, detailed content  |

### Page Count Summary

| Section    | Pages | Status                                                     |
| ---------- | ----- | ---------------------------------------------------------- |
| Core pages | 4     | To design                                                  |
| Cases      | 6     | 4 ready (Cookie, Coffee, Packaging, Avocado), 2 future     |
| Tools      | 6     | I-Chart, Boxplot, Pareto, Capability, Regression, Gage R&R |
| Learn      | 4     | Partial content                                            |
| Products   | 4     | To design                                                  |
| Support    | 3     | To design                                                  |
| About      | 2     | Story page is key                                          |
| Legal      | 2     | Standard                                                   |
| **Total**  | ~31   |                                                            |

---

## Part 11: The Story Page (/about/story)

### Why This Page Matters

This isn't a generic "About Us" page. It's VaRiScout's **origin story** - the narrative that differentiates us from every other stats tool. When someone asks "Why should I trust this tool?", this page answers.

### Narrative Arc

```
THE STORY OF VARISCOUT
─────────────────────────────────────────────────────────────────

ACT 1: THE PROBLEM
─────────────────────────────────────────────────────────────────
"Quality tools became statisticians' tools"

• Minitab costs €2,000/year
• 90% of features unused by practitioners
• Green Belts afraid to touch the software
• The gap between "stats people" and "gemba people"

Visual: Screenshot of overwhelming Minitab interface


ACT 2: THE LINEAGE
─────────────────────────────────────────────────────────────────
"But it wasn't always this way"

Timeline showing:
1924 │ Shewhart    │ Control charts - visual first
1950s│ Deming      │ "In God we trust, all others bring data"
1977 │ Tukey       │ EDA - "The data must be looked at"
1980s│ Shainin     │ "Talk to the parts"
1997 │ Watson/ASQ  │ Six Sigma body of knowledge

The insight: Quality pioneers used VISUAL methods.
Statistics came later, to confirm what they SAW.

Visual: Timeline graphic with photos/quotes


ACT 3: THE WATSON CONNECTION
─────────────────────────────────────────────────────────────────
"Learning from the source"

• Dr. Gregory H. Watson - only Westerner with JUSE Deming Medal
• Designer of original ASQ Six Sigma training
• 450+ Black Belts, 50+ Master Black Belts trained in Finland
• BEST Lean Six Sigma methodology

"I had the privilege of learning directly from someone
 who shaped how the world teaches Six Sigma."

Visual: Photo of Jukkis & Watson


ACT 4: THE GEMBA LESSONS
─────────────────────────────────────────────────────────────────
"Three experiences that shaped VaRiScout"

ESTIEM (European Students)
├── 1000+ students across Europe
├── Insight: They need to SEE before they calculate
└── "Show me the pattern first"

ABB (Corporate Practitioners)
├── Real manufacturing data, real problems
├── Insight: Tools must fit into workflow
└── "I don't have time for a stats course"

Africa (QC Circles)
├── Coffee processors, basic smartphones
├── Insight: Simplicity is not optional
└── "If it needs a laptop, it won't be used"


ACT 5: THE THESIS
─────────────────────────────────────────────────────────────────
"Turning art into science"

2019 Master's Thesis at LUT University:
"Mental Model for Exploratory Data Analysis
 Applications for Structured Problem-Solving"

The problem: EDA was described as "more art than science"
The solution: A structured 3-level mental model

Level 1: What's the Y? (Management data)
    │
    ▼
Level 2: Where in the process? (Flow analysis)
    │
    ▼
Level 3: Which factors? (Root cause)

Visual: Thesis cover + simplified model diagram


ACT 6: THE TOOL
─────────────────────────────────────────────────────────────────
"VaRiScout is all of this, in your browser"

• EDA-first: See the pattern before the p-value
• Linked filtering: Click any chart, all charts respond
• Gemba-ready: Works offline, no install
• Accessible: €49/year, not €2,000

"I built the tool I wish I had when I started training."

Visual: VaRiScout screenshot with "46%" highlight

[Try VaRiScout]
```

### Page Structure

| Section        | Content                                 | Visual               |
| -------------- | --------------------------------------- | -------------------- |
| Hero           | "Why VaRiScout Exists" + 1-line summary | Subtle background    |
| The Problem    | Stats tools became inaccessible         | Minitab screenshot   |
| The Lineage    | 100-year timeline                       | Interactive timeline |
| The Connection | Watson/RDMAIC story                     | Photo                |
| The Lessons    | ESTIEM/ABB/Africa cards                 | 3 cards with icons   |
| The Thesis     | Academic foundation                     | Thesis diagram       |
| The Tool       | This is what it all became              | Product screenshot   |
| CTA            | "Try VaRiScout"                         | Primary button       |

### Tone

- **Personal** but not self-promotional
- **Humble** - "I learned from..."
- **Credible** - Watson connection, thesis, real experience
- **Clear** - Why this matters to YOU (the reader)

### Who Reads This Page?

1. **Skeptics** - "Why should I trust this unknown tool?"
2. **Quality nerds** - "What's the methodology behind this?"
3. **Evaluators** - "Who made this? Are they credible?"
4. **Trainers** - "Can I trust this for my courses?"

### Links FROM This Page

- /learn/eda-philosophy → Deep dive on EDA methodology
- /learn/four-pillars → The teaching framework
- /products/pwa → Try the tool
- External: LUT thesis PDF, Watson bio, ESTIEM program

### Links TO This Page

- Footer: "Our Story"
- /journey (scroll): Link at credibility section
- /about/team: "Read the full story"
- Blog posts: When discussing methodology origins

---

## Summary

### User Flow Priorities

| Priority | Flow                                | Why                             |
| -------- | ----------------------------------- | ------------------------------- |
| 🔴 1     | SEO → Tool Page → Product           | Highest volume potential        |
| 🔴 2     | Social → Case → Product             | Best conversion story           |
| 🔴 3     | YouTube/Content → Website → Product | Authority + warm leads          |
| 🟡 4     | Enterprise evaluation               | Self-serve, documentation-first |
| 🟡 5     | Return user → App                   | Retention/activation            |

### Architecture Principles

1. **Multiple entry points** — Every page can be a landing page
2. **Clear paths to conversion** — CTA on every page
3. **Cross-linking** — No dead ends, always "what's next"
4. **Progressive depth** — Surface → Middle → Deep layers
5. **Mobile-first** — Sticky CTAs, simplified navigation

### Key Insight

> **The website is a collection of interconnected experiences, not a linear funnel.**
>
> Users can enter anywhere, explore in any order, and convert when ready.
> Every page must stand alone AND connect to the whole.

---

_"Design for the journey, not just the destination."_
