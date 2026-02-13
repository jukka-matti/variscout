# Patient Wait Time Variation

## The Problem

A Hospital Operations Analyst or Clinic Manager reports "average wait time: 45 minutes — within target." But patients complain about 2-hour waits, and staff on night shift are overwhelmed. The dashboard shows a daily average that hides massive variation between shifts, departments, days of the week, and patient acuity levels.

The data is in the hospital information system — thousands of rows with timestamps. But reports aggregate to daily or weekly averages, hiding the peaks that drive patient dissatisfaction and staff burnout. Nobody asks "what's the _variation_ in wait times?" — they only track the average.

## Target Searcher

| Role                           | Industry   | Searches for                                                | Current tool                    |
| ------------------------------ | ---------- | ----------------------------------------------------------- | ------------------------------- |
| Hospital Operations Analyst    | Healthcare | "hospital wait time analysis," "ED wait time variation"     | BI dashboards (averages), Excel |
| Clinic / Department Manager    | Healthcare | "patient flow bottleneck," "reduce patient wait times"      | Monthly reports, gut feel       |
| Healthcare Quality Coordinator | Healthcare | "Lean Six Sigma hospital," "healthcare quality improvement" | Manual audits, patient surveys  |

## Keyword Cluster

**Primary:**

- hospital wait time analysis
- patient wait time variation
- ED wait time reduction

**Long-tail:**

- how to analyze patient wait time data
- average hides variation in healthcare
- patient flow bottleneck analysis
- wait time by shift and department
- healthcare operations analytics SPC

**Related queries:**

- Lean Six Sigma hospital examples
- healthcare quality improvement tools
- patient satisfaction wait time correlation
- bed utilization analysis
- emergency department throughput

## The VariScout Journey

1. **Paste wait time data** — rows with Department, Shift, Day-of-Week, Acuity Level, Wait Time, Service Time columns
2. **I-Chart** — daily average wait times look "okay" but individual patient wait times show extreme outliers (some 3-4 hours)
3. **Boxplot by Shift** — night shift median is 2x day shift. eta-squared: "Shift explains 31% of wait time variation"
4. **Boxplot by Department** — Emergency has widest spread (expected), but Radiology has surprising peaks
5. **Drill-down: Night shift** — boxplot by Day-of-Week reveals Monday and Friday nights are the worst
6. **Drill-down: Night shift + Monday** — boxplot by Acuity. Low-acuity patients wait 3x longer than high-acuity (expected triage), but the _variation_ in low-acuity wait is enormous
7. **Capability vs SLA** — against "90% of patients seen within 60 minutes" target: day shift Cpk = 1.2, night shift Cpk = 0.4

**Aha moment:** "Our overall average of 45 minutes met the target. But night shift is at 95% utilization with 2-hour waits that the daily average hides. The 'average is fine' reporting was masking a staffing crisis on specific shifts."

## Before / After

| Before VariScout                   | After VariScout                                          |
| ---------------------------------- | -------------------------------------------------------- |
| "Average wait: 45 min — on target" | Night shift: 90 min average, Cpk = 0.4 vs SLA            |
| Patient complaints seem random     | Monday/Friday night shift = predictable peaks            |
| Staffing based on daily averages   | Staffing based on variation patterns by shift/day        |
| No quantification of shift impact  | eta-squared: "Shift explains 31% of wait time variation" |
| Dashboard hides the peaks          | Boxplot shows the full distribution, not just the middle |

## Website Content Map

**Landing page:** `/solutions/healthcare-operations`

- Headline: "Your average wait time is fine. Your patients' experience isn't."
- Key message: Averages hide the worst experiences. Variation analysis reveals where patients actually wait — and why.
- Interactive demo: Hospital wait time dataset by shift and department

**Case study:** Hospital operations data — 3 departments, 3 shifts, 7 days, 3 months

- Narrative: "The dashboard said 45 minutes. Monday night shift patients waited over 2 hours."
- The aggregation trap in healthcare: daily averages hide shift-level crises
- Capability against SLA showing shift-by-shift gap

**Blog posts:**

- "The Aggregation Trap in Healthcare: Why Average Wait Time Is Misleading" (methodology)
- "Using SPC for Hospital Operations: A Practical Guide" (educational)
- "Patient Wait Time Variation: What the Dashboard Doesn't Show" (problem awareness)

**Social:**

- LinkedIn: "Average wait time: 45 min (within target). Night shift wait time: 2 hours (crisis hidden by the average). Here's how one hospital found the pattern." (data story)
- YouTube: "Healthcare Aggregation Trap" — 3-minute explainer with VariScout demo

## Platform Fit

| Stage              | Product                 | Why                                                                     |
| ------------------ | ----------------------- | ----------------------------------------------------------------------- |
| Investigation      | **PWA** (free)          | Paste HIS export, find variation patterns instantly                     |
| Ongoing monitoring | **Excel Add-in** (free) | Connect to operations spreadsheet, slicer by shift/department           |
| Operations team    | **Azure App** (paid)    | Multiple analysts, Performance Mode across departments, shared insights |
