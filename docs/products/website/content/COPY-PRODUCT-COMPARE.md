# Product: Compare Copy

## Meta

```yaml
title: 'Compare VaRiScout Products | Which Is Right for You?'
description: 'Compare VaRiScout Web, Excel, Power BI, and Azure. Find the right variation analysis tool for your workflow and organization.'
keywords: 'VaRiScout comparison, variation analysis tools, SPC software comparison'
```

---

## hero

```yaml
headline: 'Which VaRiScout is'
headline_emphasis: 'right for you?'
subhead: 'Same analysis engine. Different ways to access it.'
```

---

## quick_recommendation

```yaml
section_id: 'quick-rec'
headline: 'Quick Recommendation'

scenarios:
  - scenario: 'I want to try it right now'
    recommendation: 'Web App'
    cta: 'Open Web App'
    url: '/app'

  - scenario: 'I work mostly in Excel'
    recommendation: 'Excel Add-in'
    cta: 'Get Excel Add-in'
    url: '/product/excel'

  - scenario: 'My team uses Power BI dashboards'
    recommendation: 'Power BI Visuals'
    cta: 'View Power BI Suite'
    url: '/product/power-bi'

  - scenario: 'We need internal deployment'
    recommendation: 'Azure'
    cta: 'Learn About Azure'
    url: '/product/azure'
```

---

## comparison_table

```yaml
section_id: 'comparison'
headline: 'Feature Comparison'

columns:
  - 'Feature'
  - 'Web App'
  - 'Excel'
  - 'Power BI'
  - 'Azure'

rows:
  - feature: 'Try instantly (no signup)'
    web: '✓'
    excel: '–'
    powerbi: '–'
    azure: '–'

  - feature: 'Works offline'
    web: '✓'
    excel: '✓'
    powerbi: '–'
    azure: '✓'

  - feature: 'No installation'
    web: '✓'
    excel: '–'
    powerbi: '–'
    azure: '✓*'
    note: '*For end users. IT deploys once.'

  - feature: 'Excel integration'
    web: 'Import'
    excel: 'Native'
    powerbi: 'Data source'
    azure: 'Import'

  - feature: 'Dashboard embedding'
    web: '–'
    excel: '–'
    powerbi: '✓'
    azure: '–'

  - feature: 'Automatic refresh'
    web: '–'
    excel: 'Manual'
    powerbi: '✓'
    azure: '–'

  - feature: 'Custom domain'
    web: '–'
    excel: '–'
    powerbi: '–'
    azure: '✓'

  - feature: 'Custom branding'
    web: '–'
    excel: '–'
    powerbi: '–'
    azure: '✓'

  - feature: 'Microsoft certified'
    web: 'N/A'
    excel: '✓'
    powerbi: '✓'
    azure: '✓'

  - feature: 'Data stays local'
    web: '✓'
    excel: '✓'
    powerbi: '✓'
    azure: '✓'
```

---

## pricing_comparison

```yaml
section_id: 'pricing'
headline: 'Pricing Comparison'

columns:
  - 'Product'
  - 'Free'
  - 'Individual'
  - 'Team'
  - 'Enterprise'

rows:
  - product: 'Web App'
    free: '✓ (watermark)'
    individual: '€49/year'
    team: '–'
    enterprise: '–'

  - product: 'Excel'
    free: '✓ (watermark)'
    individual: '€49/year'
    team: '–'
    enterprise: '–'

  - product: 'Power BI'
    free: '–'
    individual: '–'
    team: '€399/year (10 users)'
    enterprise: '€999/year (50) or €1,999/year (unlimited)'

  - product: 'Azure'
    free: '–'
    individual: '–'
    team: '–'
    enterprise: '€999/year (unlimited)'
```

---

## best_for

```yaml
section_id: 'best-for'
headline: 'Best For'

products:
  - name: 'Web App'
    best_for:
      - 'Individual analysts'
      - 'Training and learning'
      - 'Quick ad-hoc analysis'
      - 'Green Belt projects'
    not_for:
      - 'Automated dashboards'
      - 'Team-wide deployment'

  - name: 'Excel'
    best_for:
      - 'Excel power users'
      - 'Analysis alongside data'
      - 'Sharing workbooks with analysis'
    not_for:
      - 'Non-Excel workflows'
      - 'Automated reporting'

  - name: 'Power BI'
    best_for:
      - 'BI teams'
      - 'Operational dashboards'
      - 'Automated refresh'
      - 'Organization-wide sharing'
    not_for:
      - 'One-off analysis'
      - 'Users without Power BI'

  - name: 'Azure'
    best_for:
      - 'Regulated industries'
      - 'Data sovereignty requirements'
      - 'Custom branding needs'
      - 'Large user counts'
    not_for:
      - 'Individual use'
      - 'Organizations without Azure'
```

---

## migration_paths

```yaml
section_id: 'migration'
headline: 'Common Paths'

paths:
  - from: 'Start'
    to: 'Web App'
    description: 'Try instantly, no commitment'

  - from: 'Web App'
    to: 'Excel or Power BI'
    description: 'When you want integration with existing workflow'

  - from: 'Power BI'
    to: 'Azure'
    description: 'When you need custom branding or data sovereignty'

  - from: 'Web App'
    to: 'Azure'
    description: 'When organization wants internal deployment'
```

---

## decision_helper

```yaml
section_id: 'decision'
headline: 'Help Me Choose'

questions:
  - question: 'How will you access VaRiScout?'
    options:
      - answer: 'Browser, any device'
        recommendation: 'Web App'
      - answer: 'From within Excel'
        recommendation: 'Excel'
      - answer: 'In Power BI dashboards'
        recommendation: 'Power BI'
      - answer: 'Internal company URL'
        recommendation: 'Azure'

  - question: 'How many people will use it?'
    options:
      - answer: 'Just me'
        recommendation: 'Web App or Excel (€0-49)'
      - answer: 'My team (2-10)'
        recommendation: 'Power BI Team (€399)'
      - answer: 'Department (10-50)'
        recommendation: 'Power BI Department (€999)'
      - answer: 'Many departments'
        recommendation: 'Azure or Power BI Enterprise'

  - question: "What's your IT situation?"
    options:
      - answer: "I don't want IT involved"
        recommendation: "Web App (it's just a website)"
      - answer: 'We use approved apps from AppSource'
        recommendation: 'Excel or Power BI'
      - answer: 'We need internal hosting'
        recommendation: 'Azure'
```

---

## final_cta

```yaml
section_id: 'final-cta'
headline: 'Still not sure?'
subhead: 'Try the Web App free — no signup required.'
cta:
  text: 'Open VaRiScout'
  url: '/app'
secondary_cta:
  text: 'Contact Us'
  url: '/contact'
```
