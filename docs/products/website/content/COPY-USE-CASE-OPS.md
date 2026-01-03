# Use Case: Operations Copy

## Meta

```yaml
title: 'VaRiScout for Quality & Operations | Live Team Analysis'
description: 'VaRiScout for quality and operations teams. Analyze variation live in meetings. Answer questions instantly. Visual clarity for supervisors and managers.'
keywords: 'quality management tools, operations analytics, SPC software, variation analysis for manufacturing'
```

---

## hero

```yaml
headline: "See what's driving variation."
headline_emphasis: 'Decide as a team.'
subhead: 'Live analysis for daily decisions. No waiting for reports. No statistics jargon. Just clarity.'
cta_primary:
  text: 'Try with Your Data'
  url: '/app'
cta_secondary:
  text: 'Watch Demo'
  url: '#demo'
```

---

## the_problem

```yaml
section_id: 'problem'
headline: 'The Problem'

pain_points:
  - icon: 'clock'
    title: 'Reports Come Too Late'
    description: 'By the time analysis is ready, the meeting is over. Decisions wait another week.'

  - icon: 'message-circle'
    title: '"I''ll Check and Get Back to You"'
    description: "Questions in meetings can't be answered live. Every follow-up takes another cycle."

  - icon: 'help-circle'
    title: "Statistics That Don't Help"
    description: 'P-values and confidence intervals. What does that mean for my production line?'

  - icon: 'users'
    title: 'Only Analysts Can Use the Tools'
    description: "Supervisors and managers depend on others to run the analysis. Can't explore themselves."
```

---

## the_solution

```yaml
section_id: 'solution'
headline: 'A Better Way'

points:
  - title: 'Analyze in the Meeting'
    description: 'Upload data, see charts, answer questions — all live. No preparation needed.'

  - title: 'Plain Language Insights'
    description: '"Different? YES" — everyone understands. No statistics degree required.'

  - title: 'Click to Explore'
    description: '"What about Shift B?" — click, see, answer. Instantly.'

  - title: 'Anyone Can Use It'
    description: 'Simple enough for supervisors, managers, and team leads. Not just analysts.'
```

---

## for_supervisors

```yaml
section_id: 'supervisors'
headline: 'For Supervisors'

benefits:
  - title: 'Morning Check in Minutes'
    description: "Export yesterday's data. Upload. See what happened on your shift."

  - title: 'Answer Your Own Questions'
    description: "Don't wait for the analyst. Explore the data yourself."

  - title: 'Visual Evidence'
    description: 'Show your team what the data says. Build shared understanding.'

  - title: 'Quick Reports'
    description: 'Copy charts for your shift summary. Done in minutes, not hours.'

scenario: |
  Monday morning. You want to know why Saturday's output was low.

  Old way: Email the analyst. Wait for response. Maybe see something by Wednesday.

  With VaRiScout: Upload Saturday's data. See the boxplot. Click "Machine 2."
  Ah — Machine 2 had longer cycle times. Check the maintenance log.
```

---

## for_quality_managers

```yaml
section_id: 'quality-managers'
headline: 'For Quality Managers'

benefits:
  - title: 'Supplier Comparisons'
    description: 'Which supplier has more variation? See it immediately.'

  - title: 'Trend Visibility'
    description: 'I-Chart shows if your process is stable. Plain language verdict.'

  - title: 'Capability Tracking'
    description: 'Cp/Cpk with clear status. Are we meeting spec?'

  - title: 'Drill Down to Source'
    description: 'When quality drops, filter and find the factor. Machine? Shift? Material?'

scenario: |
  Quality review meeting. Customer complaints up this month.

  Old way: Request analysis. Review next meeting.

  With VaRiScout: Pull up this month's data. Filter to complaints.
  Pareto shows: 60% are from Product Line C.
  Boxplot shows: Supplier B has 3x the variation on that line.
  Action: Quality audit for Supplier B.
```

---

## for_ops_leaders

```yaml
section_id: 'ops-leaders'
headline: 'For Operations Leaders'

benefits:
  - title: 'Team Problem-Solving'
    description: 'Explore data together in meetings. Everyone sees the same picture.'

  - title: 'Ask Better Questions'
    description: 'Understand the analysis. Challenge assumptions. Guide the exploration.'

  - title: 'Faster Decisions'
    description: 'Answer questions in the meeting, not after. Decide and move.'

  - title: 'Management Reporting'
    description: 'Copy the exact chart you discussed. Same view for your boss.'

scenario: |
  Weekly ops review. Discussing cycle time variance.

  Old way: Analyst shows static slides. Questions require new analysis.

  With VaRiScout: Analyst shares screen. You ask "What about Line 3?"
  They click. Charts update. You see the answer.
  You ask "And second shift?" Another click. There's your problem.
  Decision made in the meeting.
```

---

## for_ci_teams

```yaml
section_id: 'ci-teams'
headline: 'For CI Teams'

benefits:
  - title: 'Rapid Factor Screening'
    description: 'Which factors drive variation? See in minutes, not hours.'

  - title: 'Before/After Comparison'
    description: 'Did the improvement work? Compare baseline to current.'

  - title: 'Visual Reporting'
    description: 'Charts for your improvement reports. Copy and paste.'

  - title: 'Team Engagement'
    description: 'Show the team what the data says. Build ownership.'
```

---

## typical_workflow

```yaml
section_id: 'workflow'
headline: 'Typical Workflow'

workflow:
  - time: 'Monday 8:00 AM'
    action: "Export last week's data from MES/ERP"
    duration: '2 min'

  - time: 'Monday 8:02 AM'
    action: 'Upload to VaRiScout, template auto-maps columns'
    duration: '30 sec'

  - time: 'Monday 8:03 AM'
    action: 'See charts, review patterns'
    duration: '5 min'

  - time: 'Monday 8:30 AM'
    action: 'Weekly review meeting — explore live, answer questions'
    duration: 'Meeting'

  - time: 'Monday 9:00 AM'
    action: 'Copy key charts to weekly report'
    duration: '2 min'

total: 'Under 10 minutes prep + live meeting use'
```

---

## what_you_can_see

```yaml
section_id: 'visibility'
headline: 'What You Can See'

views:
  - title: 'Process Stability'
    chart: 'I-Chart'
    question: 'Is my process stable? Are there unusual points?'

  - title: 'Factor Comparison'
    chart: 'Boxplot with ANOVA'
    question: 'Which shift/machine/supplier shows different results?'

  - title: 'Top Issues'
    chart: 'Pareto'
    question: 'Which defect types/products/lines dominate?'

  - title: 'Process Capability'
    chart: 'Capability'
    question: "Are we meeting spec? What's our Cpk?"
```

---

## comparison

```yaml
section_id: 'comparison'
headline: 'vs. Traditional Reporting'

comparison:
  - aspect: 'Time to insight'
    traditional: 'Days (request → analysis → report)'
    variscout: 'Minutes (upload → see)'

  - aspect: 'Follow-up questions'
    traditional: 'Another request cycle'
    variscout: 'Click and see immediately'

  - aspect: 'Who can use it'
    traditional: 'Analysts only'
    variscout: 'Anyone with data'

  - aspect: 'Meeting readiness'
    traditional: 'Prepare beforehand'
    variscout: 'Analyze live'

  - aspect: 'Shared understanding'
    traditional: 'Analyst explains stats'
    variscout: 'Everyone sees together'
```

---

## deployment_options

```yaml
section_id: 'deployment'
headline: 'For Your Organization'

options:
  - name: 'Start Simple'
    description: 'Use the free web app. Try it with your data today.'
    cta: 'Open Web App'
    url: '/app'

  - name: 'Integrate with Power BI'
    description: 'Add VaRiScout visuals to your existing dashboards.'
    cta: 'View Power BI'
    url: '/product/power-bi'

  - name: 'Deploy Internally'
    description: 'Run VaRiScout in your Azure tenant with your branding.'
    cta: 'Learn About Azure'
    url: '/product/azure'
```

---

## final_cta

```yaml
section_id: 'final-cta'
headline: 'Try It Today'
subhead: 'No signup. No installation. Just upload your data and see.'
cta:
  text: 'Open VaRiScout'
  url: '/app'
```
