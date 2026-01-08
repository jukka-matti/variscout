# VaRiScout Case-Based Learning Experience

> Transform the Four Pillars methodology into interactive learning through real-world cases.

---

## The Concept

Each case follows a three-act structure that creates engagement and delivers the "aha moment":

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ACT 1: THE CASE                                                │
│  Present the situation + averages view                          │
│  "Here's what the dashboard shows..."                           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ACT 2: YOUR TURN                                               │
│  Interactive VaRiScout exploration                              │
│  "Can you find what's hiding?"                                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ACT 3: THE SOLUTION                                            │
│  Scroll journey reveals the expert path                         │
│  "Here's what the data reveals..."                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## The Three Products

The website drives to three distinct products:

### 📱 VaRiScout Lite PWA (€49/year)

| Aspect         | Detail                                      |
| -------------- | ------------------------------------------- |
| **What**       | Browser-based Progressive Web App           |
| **Where**      | Any device with browser, works offline      |
| **For whom**   | Individual analysts, consultants, trainers  |
| **How to get** | Download from variscout.com, install as app |
| **Free tier**  | Yes, with watermark on exports              |

### 📊 VaRiScout Excel Add-in (€49/year)

| Aspect         | Detail                                          |
| -------------- | ----------------------------------------------- |
| **What**       | Native Excel add-in via Office.js               |
| **Where**      | Inside Excel (desktop, web, Mac)                |
| **For whom**   | Excel-heavy users, data already in spreadsheets |
| **How to get** | Microsoft AppSource                             |
| **Free tier**  | Trial period                                    |

### ☁️ VaRiScout Enterprise (€399-1999/year)

| Aspect         | Detail                            |
| -------------- | --------------------------------- |
| **What**       | Azure-deployed Teams app          |
| **Where**      | Customer's own Azure tenant       |
| **For whom**   | Teams, departments, organizations |
| **How to get** | Contact sales, deployment support |
| **Free tier**  | Demo/POC available                |

---

## The Three Acts in Detail

### Act 1: THE CASE

**Purpose:** Set the scene, create curiosity, show the "find what averages hide" starting point

**Components:**

- Industry context (who, what, where)
- The problem statement
- The dashboard view (bar chart comparing averages)
- The misleading conclusion

**Template:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🏭 [INDUSTRY ICON]                                             │
│                                                                 │
│  [CASE TITLE]                                                   │
│  [Subtitle: The situation]                                      │
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                        │
│  │ Factor A│  │ Factor B│  │ Factor C│   ← Bar chart          │
│  │  12.1   │  │  11.8   │  │  12.0   │     (averages)         │
│  └─────────┘  └─────────┘  └─────────┘                        │
│                                                                 │
│  "The dashboard says: [MISLEADING CONCLUSION]"                  │
│                                                                 │
│  But is that the real story?                                    │
│                                                                 │
│                    [Explore the Data →]                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Act 2: YOUR TURN

**Purpose:** Let users explore the case data, discover patterns, form their own hypotheses

**Components:**

- Interactive VaRiScout **demo** with case dataset pre-loaded (not user upload)
- All four charts available (I-Chart, Boxplot, Pareto, Capability)
- Linked cross-filtering enabled
- Hints available (optional)

**Important:** This is demo mode only. Users explore the CASE data, not their own. To analyze their own data, they need to get a product.

**Template:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  YOUR TURN: Explore the Case Data                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │         [INTERACTIVE VARISCOUT DEMO]                    │   │
│  │              Case: Cookie Weight                        │   │
│  │              150 data points loaded                     │   │
│  │                                                         │   │
│  │   ┌──────────┐  ┌──────────┐                           │   │
│  │   │ I-Chart  │  │ Boxplot  │   ← Tabs                  │   │
│  │   └──────────┘  └──────────┘                           │   │
│  │   ┌──────────┐  ┌──────────┐                           │   │
│  │   │ Pareto   │  │Capability│                           │   │
│  │   └──────────┘  └──────────┘                           │   │
│  │                                                         │   │
│  │   [Factor filters]  [Click to explore]                 │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  💡 Hint: Start with the I-Chart. What patterns do you see?    │
│                                                                 │
│           [I found it! Show me the solution →]                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Interaction Options:**
| Element | Action | Result |
|---------|--------|--------|
| Chart tabs | Click | Switch between four views |
| Data points | Click | Highlight + show details |
| Factor buttons | Click | Filter all charts |
| Boxes in boxplot | Click | Filter to that subgroup |
| Pareto bars | Click | Filter to that category |

---

### Act 3: THE SOLUTION

**Purpose:** Reveal the expert path using the scroll journey, deliver the "aha"

**Components:**

- The full scroll journey (AVERAGES → CHANGE → FLOW → FAILURE → VALUE → CLARITY)
- Each section builds on the previous
- Culminates in the breadcrumb trail with cumulative math

**Template:**
Uses the full VaRiScout Journey Scroll Experience format:

```
📊 AVERAGES    → "The dashboard showed [X]"
        ↓
⏱️ CHANGE     → "But time revealed [PATTERN]"
        ↓
🔀 FLOW       → "[FACTOR] drives [X]% of variation"
        ↓
🎯 FAILURE    → "Within that, [SUBFACTOR] = [Y]%"
        ↓
✅ VALUE      → "Filter it out → [RESULT]"
        ↓
🏆 CLARITY    → "[X]% × [Y]% = [Z]% isolated"
              → "Fix [SPECIFIC ACTION]"
```

---

## User Engagement Levels

Different users can engage at different depths:

| Level            | Experience        | What They Do                    | Value They Get             |
| ---------------- | ----------------- | ------------------------------- | -------------------------- |
| **👀 Browse**    | Watch only        | Scroll through solution journey | "I understand the concept" |
| **🖱️ Explore**   | Light interaction | Click around demo VaRiScout     | "I see how it works"       |
| **🎯 Challenge** | Full engagement   | Try to find it, then compare    | "I can do this myself"     |
| **🛒 Convert**   | Ready to buy      | Choose their product            | "I want this for MY data"  |

**Important:** The website does NOT offer data upload. The goal is to create desire through cases, then convert to actual products.

---

## Case Library

### Case Categories

| Category             | Target Audience                     | Example Cases                              |
| -------------------- | ----------------------------------- | ------------------------------------------ |
| **Manufacturing**    | Quality teams, OpEx                 | Cookie weight, Weld defects, Assembly time |
| **Agriculture/Food** | Coffee, farming, processing         | Coffee grading, Moisture content, Yield    |
| **Service**          | Call centers, healthcare, logistics | Wait time, Delivery, Response time         |
| **Training**         | Green Belts, students               | Classic LSS examples, Sock Mystery data    |

---

### Case Template

Each case needs:

```yaml
case:
  id: 'cookie-weight'
  title: 'The Cookie Weight Mystery'
  industry: 'Food & Bakery'
  icon: '🍪'

  situation:
    context: 'A bakery receives complaints about inconsistent cookie weights'
    problem: 'Customer satisfaction dropping, returns increasing'

  data:
    rows: 150
    outcome: 'Weight (grams)'
    factors:
      - name: 'Line'
        levels: ['A', 'B', 'C']
      - name: 'Shift'
        levels: ['Day', 'Night']
      - name: 'Oven'
        levels: ['1', '2', '3']

  averages_view:
    comparison: 'Line'
    values:
      A: 52.1
      B: 51.2
      C: 52.0
    target: 52.0
    misleading_conclusion: 'Line B is 1.5% under target. Adjust Line B settings?'

  solution:
    path:
      - level: 'All Data'
        factor: 'Line'
        finding: 'Line B'
        percentage: 64
      - level: 'Line B'
        factor: 'Oven'
        finding: 'Oven 2'
        percentage: 81
    cumulative: 52 # 64% × 81%
    action: 'Recalibrate Oven 2 thermostat on Line B'
    result: 'Complaints dropped 48% in first week'

  journey:
    averages:
      title: 'Comparing Production Lines'
      narrative: 'Line B runs 1.5% under target weight...'
    change:
      title: 'What Patterns Does Time Reveal?'
      pattern: 'Cycling visible when Oven 2 runs'
      narrative: 'Plot every cookie weight in time order...'
    flow:
      title: 'Which Factors Drive Variation?'
      finding: 'Line B has 3x more spread'
      narrative: 'The Boxplot confirms what time hinted...'
    failure:
      title: 'Where Do Problems Concentrate?'
      concentration: 'Oven 2 = 81% of Line B issues'
      narrative: "Within Line B, it's not everything..."
    value:
      title: 'What If We Filter It Out?'
      before: '87% in spec'
      after: '99.4% in spec'
      narrative: 'Remove Oven 2 data from Line B...'
    clarity:
      breadcrumb: 'All Data → Line B (64%) → Oven 2 (81%)'
      cumulative: '52% of total variation'
      action: 'Recalibrate Oven 2 = half the complaints gone'
```

---

## Sample Cases

### Case 1: Cookie Weight (Manufacturing/Food)

| Element           | Value                                               |
| ----------------- | --------------------------------------------------- |
| **Situation**     | Bakery complaints about inconsistent cookie weights |
| **Averages show** | "Line B is 1.5% under target"                       |
| **Reality**       | Oven 2 on Line B = 52% of all variation             |
| **Action**        | Recalibrate Oven 2 thermostat                       |

---

### Case 2: Coffee Grading (Agriculture)

| Element           | Value                                             |
| ----------------- | ------------------------------------------------- |
| **Situation**     | Coffee cooperative seeing grade drops             |
| **Averages show** | "Lot 7 grades 5% lower than average"              |
| **Reality**       | Wet mill timing on Lot 7 = 61% of grade variation |
| **Action**        | Standardize fermentation timing at wet mill       |

---

### Case 3: Call Center Wait Time (Service)

| Element           | Value                                          |
| ----------------- | ---------------------------------------------- |
| **Situation**     | Customer complaints about hold times           |
| **Averages show** | "Team B has 12% longer wait times"             |
| **Reality**       | Monday AM + New staff = 58% of excessive waits |
| **Action**        | Add experienced staff to Monday morning shift  |

---

### Case 4: Weld Defects (Manufacturing)

| Element           | Value                                          |
| ----------------- | ---------------------------------------------- |
| **Situation**     | Automotive supplier seeing weld rejects        |
| **Averages show** | "Robot 3 has 8% higher defect rate"            |
| **Reality**       | Material Batch X + Robot 3 = 67% of defects    |
| **Action**        | Adjust Robot 3 parameters for Batch X material |

---

### Case 5: Delivery Time (Logistics)

| Element           | Value                                            |
| ----------------- | ------------------------------------------------ |
| **Situation**     | E-commerce company with late delivery complaints |
| **Averages show** | "Friday deliveries are 15% slower"               |
| **Reality**       | Route C on Friday = 71% of delays                |
| **Action**        | Rebalance Route C load on Fridays                |

---

## Website Structure

```
variscout.com
│
├── /                       → Landing (featured case journey + product CTA)
│
├── /journey                → The core scroll experience
│   └── [Flagship case with full journey]
│
├── /cases                  → Case library
│   ├── index              → Browse all cases by industry
│   │
│   ├── /manufacturing
│   │   ├── /cookie-weight
│   │   ├── /weld-defects
│   │   └── /assembly-time
│   │
│   ├── /agriculture
│   │   ├── /coffee-grading
│   │   ├── /moisture-content
│   │   └── /yield-variation
│   │
│   ├── /service
│   │   ├── /call-wait-time
│   │   ├── /delivery-time
│   │   └── /response-time
│   │
│   └── /training
│       ├── /sock-mystery
│       └── /classic-examples
│
├── /products               → Product comparison & selection
│   ├── /pwa               → VaRiScout Lite PWA details + download
│   ├── /excel             → Excel Add-in details + AppSource link
│   └── /enterprise        → Azure deployment + contact form
│
└── /pricing                → Clear pricing table for all products
```

### Each Case Ends With Product CTA

Every case journey ends with the same conversion point:

```
🏆 CLARITY
"Machine C on Shift B = 52% of variation"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What's YOUR average hiding?

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  📱 PWA      │  │  📊 Excel    │  │  ☁️ Enterprise│
│  €49/year    │  │  €49/year    │  │  €399+/year  │
│  [Download]  │  │  [Get it]    │  │  [Contact]   │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## The Pedagogical Connection

This case-based approach mirrors the "Guided Frustration" pedagogy from the Sock Mystery:

| Sock Mystery                         | VaRiScout Cases                          |
| ------------------------------------ | ---------------------------------------- |
| **Phase 1: Immersion in Chaos**      | Act 1: Show the averages (false comfort) |
| Let them fail so they ask why        | Show misleading dashboard conclusion     |
| **Phase 2: Physical Stratification** | Act 2: Interactive exploration           |
| Peel back layers with questions      | Four Pillars charts available            |
| **Phase 3: System Understanding**    | Act 3: Solution journey                  |
| Connect to real-world process        | Breadcrumb trail + specific action       |

---

## Success Metrics

### Per Case

| Metric                       | Target                      |
| ---------------------------- | --------------------------- |
| Time on page                 | >2 min average              |
| Interactive exploration rate | >50% click on demo          |
| Solution completion rate     | >70% scroll to end          |
| Product CTA click rate       | >15% click a product option |

### Overall

| Metric                   | Target               |
| ------------------------ | -------------------- |
| Cases viewed per session | >1.5 average         |
| Return visitors          | >30% within 7 days   |
| Product page visits      | >25% of case viewers |
| Conversion to purchase   | >5% of case viewers  |

### By Product

| Product    | Conversion Path     | Target               |
| ---------- | ------------------- | -------------------- |
| PWA        | Case → Download     | 3% of case viewers   |
| Excel      | Case → AppSource    | 2% of case viewers   |
| Enterprise | Case → Contact form | 0.5% of case viewers |

---

## Content Creation Process

For each new case:

1. **Source the scenario** - Real or realistic industry situation
2. **Design the dataset** - 100-200 rows, 3-4 factors, clear hidden pattern
3. **Calculate the path** - Determine variation percentages at each level
4. **Write the journey** - All six sections with metrics and narrative
5. **Build the interactive** - Pre-load data into VaRiScout component
6. **Test the experience** - Ensure aha moment lands

---

## Integration with Mean & Beyond

The case library directly supports the Mean & Beyond community:

| Mean & Beyond                    | VaRiScout Website                 |
| -------------------------------- | --------------------------------- |
| Weekly challenge announcement    | Featured case teaser on website   |
| Challenge dataset (downloadable) | Same case available as journey    |
| Solution video                   | Solution journey (scroll version) |
| Community discussion             | "Did you find the same path?"     |
| "Want to analyze your own data?" | Product CTA (PWA / Excel / Azure) |

**The funnel:**

```
Mean & Beyond Challenge (free, community)
            ↓
Download dataset, try in VaRiScout product
            ↓
See solution journey on website
            ↓
"I want to do this with MY work data"
            ↓
Purchase VaRiScout (PWA / Excel / Enterprise)
```

---

## The Ultimate CTA Flow

```
CASE JOURNEY
    ↓
"What's YOUR average hiding?"
    ↓
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  CHOOSE YOUR VARISCOUT                                          │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │                 │  │                 │  │                 │ │
│  │   📱 PWA        │  │   📊 EXCEL      │  │   ☁️ AZURE      │ │
│  │                 │  │                 │  │                 │ │
│  │  Browser-based  │  │  Add-in for     │  │  Enterprise     │ │
│  │  Offline-first  │  │  Excel users    │  │  deployment     │ │
│  │                 │  │                 │  │                 │ │
│  │  €49/year       │  │  €49/year       │  │  €399-1999/yr   │ │
│  │                 │  │                 │  │                 │ │
│  │ [Download PWA]  │  │ [Get Add-in]    │  │ [Contact Sales] │ │
│  │                 │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  "Same methodology. Choose where you work."                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Product Selection Logic

| User Says                         | Recommend                   |
| --------------------------------- | --------------------------- |
| "I work in browser / on the go"   | PWA (€49/year)              |
| "My data is already in Excel"     | Excel Add-in (€49/year)     |
| "We need this for the whole team" | Azure App (€399+/year)      |
| "I want to try it first"          | PWA free tier (watermarked) |

---

## Summary

The case-based learning experience transforms variscout.com from a "product page" into an **education platform that creates demand**.

**The philosophy:** VaRiScout is EDA for process improvement — not statistical verification. Use your eyes to see where to focus. That's what VaRiScout is for.

**The key insight:**

> VaRiScout finds WHERE to focus. Apply Lean thinking to find WHY — and what to do about it.

**The message:** Users don't come to buy software — they come to solve problems. The cases show them WHAT's possible, then the products let them DO it with their own data.

**The promise:**

> 46% of your variation may be hiding in one place. Find it. Fix it. Check it. Continue.

**The separation:**
| Website (variscout.com) | Products (PWA / Excel / Azure) |
|-------------------------|--------------------------------|
| Education | Application |
| Demo data only | User's own data |
| Creates desire | Delivers value |
| Free to explore | Paid to use |

**The formula:**

> Case (curiosity) + Exploration (engagement) + Solution Journey (aha) = Product Desire

**The flow:**

```
"I see how this works" → "I want this for MY data" → Choose product → Purchase
```

---

_Each case is a mini Sock Mystery — guided frustration leading to profound understanding, then channeled into product conversion._
