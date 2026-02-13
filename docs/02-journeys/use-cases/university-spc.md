# University SPC Course

## The Problem

A university lecturer teaches SPC or quality management to Industrial Engineering, Business, or Food Science students. The curriculum covers control charts, capability indices, and variation analysis — but students learn formulas on paper and never apply them to real data. Minitab licenses cost the university thousands per year and the interface overwhelms beginners. Students need to _think_ about variation, not learn which menu to click.

The lecturer wants students to paste homework data and see results instantly, with built-in explanations of what the charts mean. After the course ends, students should still have access — not be locked out when the license expires.

## Target Searcher

| Role                            | Industry                                  | Searches for                                                        | Current tool                                           |
| ------------------------------- | ----------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| University Lecturer / Professor | Higher Education (IE, Business, Food Sci) | "free SPC software for students," "control chart tool for teaching" | Minitab (expensive), Excel (manual), hand calculations |
| LSS Student / Trainee           | Education, Corporate training             | "free Cpk calculator," "how to read a control chart"                | YouTube, textbook examples, nothing interactive        |
| Teaching Assistant              | Higher Education                          | "SPC tutorial with examples," "process capability calculator"       | Whatever the professor assigns                         |

## Keyword Cluster

**Primary:**

- free SPC software for students
- control chart tutorial
- process capability calculator online
- SPC training tool

**Long-tail:**

- free control chart maker with explanation
- how to interpret a control chart step by step
- Cpk calculator with histogram
- boxplot vs control chart when to use which
- SPC software without login

**Related queries:**

- Minitab alternative free
- SPC practice problems with data
- quality management tools for teaching
- how to teach SPC effectively
- variation analysis for beginners

## The VariScout Journey

1. **Arrive from course link or Google** — no login, no install, no license key
2. **Explore sample dataset** — Coffee quality case study: familiar, engaging, real data
3. **I-Chart** — see process stability, learn to spot out-of-control signals
4. **Boxplot by factor** — "Oh, the variation _between_ roasters is bigger than _within_" — eta-squared quantifies it
5. **Capability** — connect the histogram to Cp/Cpk, see what "capable" actually means visually
6. **Glossary** — click any statistical term, get a plain-language definition
7. **Paste homework data** — copy from course spreadsheet, analyze in seconds
8. **Four Lenses** — learn the systematic framework: Change, Failure, Flow, Value

**Aha moment:** "I finally _see_ what Cpk means. The textbook formula made no sense until I saw the histogram with spec limits overlaid. And I can show my friends — they just open the link."

## Before / After

| Before VariScout                                 | After VariScout                                        |
| ------------------------------------------------ | ------------------------------------------------------ |
| Students memorize formulas, forget after exam    | Interactive exploration builds intuitive understanding |
| Minitab license: $1,000+/year for lab            | Free forever, no license management                    |
| Students lose access after course                | Bookmark the PWA, use it in their careers              |
| Homework: hand-calculate Cpk from 10 values      | Paste 200 rows, see capability instantly               |
| "Click File > Stat > Quality Tools > Capability" | Guided workflow teaches the _thinking_, not the menus  |
| No glossary in the tool                          | Every term explained in context                        |

## Website Content Map

**Landing page:** `/solutions/education`

- Headline: "Free SPC software for students and educators. No license. No login. Forever."
- Key message: Built-in case studies, glossary, Four Lenses methodology — designed to teach thinking, not button-clicking
- CTA: "Try the Coffee Quality Case Study" (direct link to PWA with sample data)

**Case study:** Coffee quality dataset (already exists in `packages/data`)

- Guided walkthrough: "Find the answer" format — guided frustration that builds understanding
- Step-by-step: paste data → I-Chart → Boxplot → Capability → interpretation
- Curriculum alignment: maps to common SPC course objectives

**Blog posts:**

- "Teaching SPC Without Minitab: A Free Alternative" (competitive + educational)
- "Why Students Should Learn Variation Thinking, Not Software Menus" (methodology)
- "5 SPC Exercises You Can Run in a Browser — No Install Required" (practical)

**Social:**

- LinkedIn: "I stopped requiring Minitab for my SPC course. Here's what I use instead — and it's free." (professor testimonial angle)
- YouTube: 5-minute demo — "Analyze a dataset in VariScout: from paste to interpretation"

## Platform Fit

| Stage               | Product                | Why                                                                         |
| ------------------- | ---------------------- | --------------------------------------------------------------------------- |
| Course delivery     | **PWA** (free forever) | No license, no install, works on student laptops and phones                 |
| Advanced projects   | **PWA** (free)         | Regression, Gage R&R, ANOVA cover Green Belt curriculum                     |
| Department adoption | **Azure App** (paid)   | Research groups, shared datasets, Performance Mode for multi-factor studies |
