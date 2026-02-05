# UX Research: VariScout Lite

## Design Thinking & JTBD Framework for Quality Professionals in Developing Countries

---

## Part 1: Simulated User Interview

### Interview Context

**Interviewer**: UX Researcher / Design Thinker
**Interviewee**: Grace Mwangi, Quality Assurance Manager
**Location**: Nairobi, Kenya (Remote Video Call)
**Organization**: East Africa Fresh Exports Ltd. (Agri-food export company)
**Date**: December 2024

---

### Interview Transcript

**Researcher**: Grace, thank you for joining us. Can you tell me about your role and what a typical day looks like for you?

**Grace**: I'm the QA Manager at East Africa Fresh. We export fresh produce - mangoes, avocados, passion fruit - mainly to Europe and the Middle East. My day starts early. I visit our collection centers where smallholder farmers bring their harvests. I check sample weights, inspect for defects, and make grading decisions. Then I'm back at the office analyzing data, preparing compliance reports for export certifications.

**Researcher**: What tools do you currently use for quality analysis?

**Grace**: Honestly? Excel. Lots and lots of Excel. I have templates I've built over years. I calculate averages, standard deviations, make charts for my reports. Sometimes I use pen and paper at the field sites because internet is not reliable there. Later I type everything into spreadsheets.

**Researcher**: What frustrates you most about your current process?

**Grace**: _sighs_ Where do I start?

First, the **time**. I spend maybe 3-4 hours every week just formatting charts and doing repetitive calculations. My management wants to see trends, but creating comparison charts in Excel takes forever.

Second, **internet dependency**. We tried cloud tools before - a quality management platform from Europe. Beautiful software, but useless when the connection drops at our upcountry collection centers. And the subscription? $200 per month? Our entire QA budget is maybe $500.

Third, **understanding variation**. I know there's something happening with our Farm C supplies - the rejection rate is higher. But proving it with data, showing the pattern clearly to management and to the farmers themselves... that's hard with static charts.

**Researcher**: Tell me about a recent situation where you struggled with your current tools.

**Grace**: Two weeks ago. We had a shipment rejected at Dubai port - 15% of mangoes were underweight. My manager wanted answers: Which farms? Which collection dates? What's the pattern?

I had the data in Excel, but linking it all together... I spent an entire day making pivot tables, creating separate charts, trying to show the connection between farm source and weight distribution. When I presented, my charts were confusing even to me. I knew the answer was in the data, but I couldn't make it _visible_.

**Researcher**: What would your ideal tool look like?

**Grace**: Something simple that just works. I upload my data, and immediately I can see: here are your control limits, here's which group is causing problems, here's your capability score for the export report.

It needs to work **offline** - at least let me do the analysis without internet, save it, and maybe sync later.

It should be **visual** - when I click on a problem area, show me everything connected to it. Like if I click on "Farm C" in a chart, highlight all the data points from Farm C across all my charts.

And **affordable**. We're not a big company. We can't pay enterprise software prices.

**Researcher**: What about data privacy? Does that matter to you?

**Grace**: Very much! Our farm yield data, our supplier quality scores... that's sensitive. Some of our European buyers have asked about our data handling. I'm not comfortable uploading everything to some American cloud server. If the tool keeps data on my computer, that's actually better.

**Researcher**: Have you heard of capability metrics like Cp and Cpk?

**Grace**: Yes, I learned about them in my food science degree. Cpk especially - it tells you if your process is centered. But calculating it manually? Too tedious. And explaining it to farmers? Forget it. But if I could show them a simple visual - "your Cpk is 0.8, it should be above 1.33, see this chart shows why" - that would help.

**Researcher**: What would success look like for you with a new tool?

**Grace**: I want to finish my weekly analysis in **one hour**, not four. I want to show my manager a single dashboard that answers: "Are we meeting specs? Which suppliers need support? Is it getting better or worse?" And I want farmers to see their own performance visualized - so they understand why we grade the way we grade.

**Researcher**: Last question - how do you feel about software that uses AI to make recommendations?

**Grace**: _hesitates_ I'm cautious. I've seen AI tools that give suggestions but don't show their work. In quality, I need to defend my decisions to auditors, to certification bodies. I need to see the math, see the logic. A tool that helps me analyze faster - yes. A tool that makes decisions for me - I'm not sure I can trust that in my reports.

---

## Part 2: User Personas

### Primary Persona: "The Export Quality Champion"

| Attribute        | Details                                                              |
| ---------------- | -------------------------------------------------------------------- |
| **Name**         | Grace Mwangi                                                         |
| **Role**         | Quality Assurance Manager                                            |
| **Location**     | Nairobi, Kenya                                                       |
| **Organization** | Mid-size agri-food export company (50-200 employees)                 |
| **Education**    | BSc Food Science, trained in basic statistics                        |
| **Tech Comfort** | Intermediate - proficient with Excel, smartphones, basic cloud tools |
| **Age**          | 32-45                                                                |

#### Goals

- Ensure export shipments meet buyer specifications
- Identify and address quality issues with specific suppliers
- Produce clear reports for management and certification bodies
- Support smallholder farmers in improving their quality

#### Frustrations

- Too much time spent on manual Excel work
- Unreliable internet at field locations
- Difficulty visualizing complex patterns in data
- Expensive software with features she doesn't need
- Showing farmers their performance in understandable ways

#### Context

- Works across multiple locations (office + field sites)
- Budget-constrained organization
- Data privacy important for competitive and compliance reasons
- Needs audit-ready outputs (must show methodology, not black-box)

#### Quote

> "I know the answers are in my data. I just need a faster way to make them visible."

---

### Secondary Persona: "The Factory Floor Analyst"

| Attribute        | Details                                      |
| ---------------- | -------------------------------------------- |
| **Name**         | Raj Sharma                                   |
| **Role**         | Quality Engineer                             |
| **Location**     | Coimbatore, India                            |
| **Organization** | Textile manufacturing unit                   |
| **Education**    | B.Tech Textile Engineering                   |
| **Tech Comfort** | High - comfortable with statistical concepts |

#### Context

- Works on shop floor with tablets
- Needs real-time variation monitoring
- Reports to plant manager on shift performance
- Compares performance across looms and operators

---

### Tertiary Persona: "The Cooperative Trainer"

| Attribute        | Details                           |
| ---------------- | --------------------------------- |
| **Name**         | Carlos Mendez                     |
| **Role**         | Quality Training Coordinator      |
| **Location**     | Guatemala                         |
| **Organization** | Coffee cooperative network        |
| **Education**    | Agricultural extension background |

#### Context

- Trains farmer groups on quality improvement
- Needs educational tool with predictable behavior
- Uses projected dashboard in group training sessions
- Works in areas with limited connectivity

---

## Part 3: Jobs-to-be-Done (JTBD) Framework

### Core Functional Jobs

#### Job 1: Assess Batch Conformance

> **When I** receive a batch of products from suppliers,
> **I want to** quickly determine what percentage meets specifications,
> **So I can** make accept/reject decisions and provide feedback to suppliers.

**Success Metrics:**

- Time to analyze batch: < 5 minutes
- Clear pass/fail visualization
- Breakdown by grade tier visible

**Current Alternatives:**

- Manual Excel calculations
- Visual inspection only
- Sampling-based judgment

---

#### Job 2: Identify Variation Sources

> **When I** observe quality problems in my process,
> **I want to** see which factors (suppliers, machines, shifts) correlate with poor performance,
> **So I can** take targeted corrective action.

**Success Metrics:**

- Ability to filter by any factor
- Cross-chart highlighting of related data
- Clear factor-to-outcome visualization

**Current Alternatives:**

- Multiple Excel pivot tables
- Manual chart creation
- Intuition-based investigation

---

#### Job 3: Monitor Process Capability

> **When I** need to demonstrate our quality capability to buyers or certifiers,
> **I want to** show statistical metrics (Cpk, pass rate, control limits) in a professional format,
> **So I can** prove we meet standards and build trust.

**Success Metrics:**

- Industry-standard metrics (Cp, Cpk) calculated automatically
- Exportable charts for reports
- Spec limits clearly visualized

**Current Alternatives:**

- Manual Cpk calculation in Excel
- Third-party SPC software (expensive)
- Verbal assurances without data

---

#### Job 4: Communicate Quality Issues

> **When I** need to explain quality problems to farmers, operators, or management,
> **I want to** show clear, visual comparisons of performance across groups,
> **So I can** drive understanding and motivate improvement.

**Success Metrics:**

- Intuitive visualizations (boxplots, Pareto)
- Exportable as images for presentations
- Simple enough for non-statisticians to understand

**Current Alternatives:**

- PowerPoint with static charts
- Verbal explanations
- Written reports

---

#### Job 5: Work Without Internet

> **When I** am at field sites or factory floors with unreliable connectivity,
> **I want to** perform full analysis locally on my device,
> **So I can** do my work regardless of network conditions.

**Success Metrics:**

- 100% functionality offline
- Data persisted locally
- Analysis resumable after reconnection

**Current Alternatives:**

- Paper-based field notes
- Delayed analysis at office
- Mobile hotspot (unreliable/expensive)

---

#### Job 6: Protect Sensitive Data

> **When I** analyze supplier quality or production data,
> **I want to** keep that data on my own device (not sent to cloud servers),
> **So I can** maintain competitive confidentiality and comply with data requirements.

**Success Metrics:**

- Zero data transmission to external servers
- Local storage only
- Clear privacy assurance

**Current Alternatives:**

- Air-gapped Excel files
- Avoid digital tools entirely
- Trust cloud providers (reluctantly)

---

### Emotional Jobs

#### Job 7: Feel Confident in Analysis

> **When I** present quality data to stakeholders,
> **I want to** understand exactly how calculations were done,
> **So I can** confidently answer questions and defend my conclusions.

**Anxieties:**

- "What if the AI made an error I can't explain?"
- "Can I trust this metric for an audit?"
- "What if someone asks how I calculated this?"

---

#### Job 8: Feel Efficient and Professional

> **When I** spend less time on tedious data manipulation,
> **I want to** feel like a strategic professional, not a spreadsheet operator,
> **So I can** focus on insights and actions rather than mechanics.

**Desired Outcome:**

- Reduce analysis time by 75%+
- Professional-looking outputs
- Modern tool that reflects professional standards

---

### Social Jobs

#### Job 9: Demonstrate Value to Organization

> **When I** show management clear quality insights,
> **I want to** be seen as a data-driven professional who adds measurable value,
> **So I can** strengthen my role and advance my career.

---

#### Job 10: Empower Suppliers/Farmers

> **When I** share performance data with suppliers,
> **I want to** help them understand their quality standing without judgment,
> **So I can** build collaborative improvement rather than adversarial relationships.

---

## Part 4: Use Cases

### Use Case 1: Daily Incoming Inspection

**Actor**: Quality Champion (Grace)
**Trigger**: New batch arrives at collection center
**Precondition**: Tablet with VariScout Lite installed (PWA)

**Flow**:

1. Open VariScout Lite (works offline)
2. Enter measurements manually or upload CSV from digital scale
3. System auto-detects weight as outcome, farm as factor
4. View I-chart showing individual measurements against spec limits
5. View boxplot comparing farms in this batch
6. View stats panel: 94% pass rate, Cpk = 1.1
7. Identify Farm C as underperforming (red highlighting)
8. Save analysis with batch ID
9. Export PNG for batch record

**Outcome**: Batch accepted with documented analysis; Farm C flagged for follow-up

---

### Use Case 2: Weekly Performance Review

**Actor**: Quality Champion (Grace)
**Trigger**: End of week, management meeting tomorrow
**Precondition**: Week's data collected in CSV

**Flow**:

1. Upload week's data (500 rows)
2. Configure: Weight as outcome; Farm, Variety as factors
3. Set spec limits: LSL=300g, USL=350g
4. View I-chart trending over the week
5. Click Pareto bar for "Farm C" → filters all charts to Farm C data
6. Stats update: Farm C Cpk = 0.7 vs overall 1.1
7. See boxplot confirms Farm C lower and more variable
8. Export dashboard as PNG for presentation
9. Save analysis as "Week 48 Review"

**Outcome**: Clear visualization showing Farm C needs intervention; data-backed recommendation to management

---

### Use Case 3: Export Certification Report

**Actor**: Quality Champion (Grace)
**Trigger**: Buyer requests capability evidence for certification
**Precondition**: 3 months of data available

**Flow**:

1. Load historical data (2000 rows)
2. Set outcome and factors
3. Configure buyer's specs (USL/LSL/Target)
4. View Cpk = 1.45 (above 1.33 threshold - green)
5. View pass rate = 98.2%
6. Export dashboard as PNG
7. Download .vrs file as data backup

**Outcome**: Professional capability evidence for certification; data archived for audit trail

---

### Use Case 4: Farmer Training Session

**Actor**: Training Coordinator (Carlos)
**Trigger**: Monthly cooperative quality meeting
**Precondition**: Month's defect data collected

**Flow**:

1. Load cooperative's coffee defect data
2. Configure multi-tier grades: Specialty (≤5), Premium (6-8), Exchange (9-23), Off-Grade (>23)
3. Project dashboard to group
4. Show I-chart with colored bands for each grade
5. Click each cooperative in Pareto → show their grade distribution
6. Farmers see: "Coop North = 84% Specialty; Coop South = 52% Specialty"
7. Discuss visible patterns (processing method correlation)
8. Save analysis for follow-up

**Outcome**: Farmers understand grading visually; discussion grounded in data not opinion

---

### Use Case 5: Root Cause Investigation

**Actor**: Quality Engineer (Raj)
**Trigger**: Sudden increase in fabric defects
**Precondition**: Production data from last 2 weeks

**Flow**:

1. Upload production data
2. Set tensile strength as outcome; Loom ID, Operator, Shift as factors
3. View I-chart: see jump in variation starting 5 days ago
4. Click that time period → filters to those dates
5. View Pareto: Loom 7 accounts for 60% of failures
6. View boxplot: Loom 7 dramatically lower than others
7. Cross-reference: Loom 7 had maintenance 6 days ago
8. Save analysis as "Loom 7 Investigation"

**Outcome**: Root cause identified (Loom 7 post-maintenance issue); maintenance team notified

---

### Use Case 6: Offline Field Analysis

**Actor**: Quality Champion (Grace)
**Trigger**: At remote collection center, no internet
**Precondition**: VariScout Lite installed as PWA

**Flow**:

1. Open app (loads from cache, no network needed)
2. Enter measurements via manual entry grid
3. Paste data from clipboard (copied from scale readout)
4. Full analysis available offline
5. Save analysis to browser storage
6. Later at office: open saved project, export as needed

**Outcome**: Complete analysis capability regardless of connectivity

---

## Part 5: Feature Priority Matrix

Based on JTBD and use cases, prioritized features:

### Must Have (Core JTBD)

| Feature                              | Job Served   |
| ------------------------------------ | ------------ |
| CSV/Excel import with auto-detection | All jobs     |
| I-Chart with control limits          | Jobs 1, 2, 3 |
| Boxplot factor comparison            | Jobs 2, 4    |
| Pareto frequency analysis            | Jobs 2, 4    |
| Linked cross-filtering               | Job 2        |
| Spec limits (USL/LSL)                | Jobs 1, 3    |
| Cpk/Cp calculation                   | Job 3        |
| Offline PWA operation                | Job 5        |
| Local-only data storage              | Job 6        |
| PNG export                           | Jobs 3, 4    |

### Should Have (Enhanced Value)

| Feature                   | Job Served                                 |
| ------------------------- | ------------------------------------------ |
| Multi-tier grading system | Jobs 1, 4 (coffee/agriculture)             |
| Project save/load         | Job 7 (confidence through reproducibility) |
| .vrs file export/import   | Job 6 (backup, transfer)                   |
| Manual data entry         | Job 5 (field use)                          |
| Sample datasets           | Job 7 (learning, demo)                     |

### Nice to Have (Future)

| Feature                     | Job Served                            |
| --------------------------- | ------------------------------------- |
| Multi-language support      | Accessibility in developing countries |
| Trend analysis over time    | Job 2 (pattern detection)             |
| Comparative period analysis | Job 2 (before/after)                  |
| Report templates            | Job 3 (certification reports)         |

---

## Part 6: Key Insights Summary

### What We Learned

1. **Offline-first is non-negotiable** - Field work in developing countries means unreliable internet. The tool must work fully offline.

2. **Privacy = competitive advantage** - Unlike enterprise tools pushing cloud storage, local-only data is a feature, not a limitation.

3. **Time savings is the primary value** - Reducing 4-hour Excel work to 1 hour is transformative for busy QA professionals.

4. **Linked visualization is the "magic"** - The ability to click one chart and filter all others is the key differentiator from Excel.

5. **Transparency over AI** - Users need to defend their analysis to auditors. "The algorithm decided" is not acceptable. Transparent statistics are preferred.

6. **Multi-tier grading matters** - For agriculture exports (coffee, produce), grade-based classification is as important as simple pass/fail.

7. **Visual communication to non-experts** - Charts must be clear enough to show farmers/operators without statistical training.

8. **Cost sensitivity is extreme** - $200/month is unacceptable for SMEs in developing countries. Free or very low cost is essential.

---

## Part 7: Design Principles for VariScout Lite

Based on this research, the following design principles should guide development:

1. **Offline by default** - Every feature must work without network connectivity
2. **Data stays local** - Zero external data transmission
3. **Transparent math** - Show formulas, explain metrics, no black boxes
4. **Linked exploration** - Charts talk to each other through filtering
5. **Fast to first insight** - Under 30 seconds from upload to visualization
6. **Export-ready outputs** - Professional charts suitable for reports
7. **Progressive complexity** - Simple defaults, optional advanced settings
8. **Domain-aware** - Sample data and terminology that matches user contexts

---

_Document prepared as UX research artifact for VariScout Lite product development_
