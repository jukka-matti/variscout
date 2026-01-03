# Resources Copy

## Meta

```yaml
title: 'VaRiScout Resources | Tutorials, Sample Data, Videos'
description: 'VaRiScout resources: #VariationScouting videos, downloadable sample datasets, tutorials, and guides. Learn to analyze variation in minutes.'
keywords: 'VaRiScout tutorials, SPC sample data, variation analysis examples, learn Six Sigma tools'
```

---

## hero

```yaml
headline: 'Learn.'
headline_emphasis: 'Practice. Master.'
subhead: 'Everything you need to get the most from VaRiScout.'
```

---

## resource_categories

```yaml
section_id: 'categories'

categories:
  - id: 'variation-scouting'
    title: '#VariationScouting'
    description: 'Weekly 3-minute videos showing real analysis'
    icon: 'video'
    cta: 'Watch Videos'
    url: '/resources/variation-scouting'

  - id: 'sample-data'
    title: 'Sample Datasets'
    description: 'Downloadable CSV files for practice'
    icon: 'file-spreadsheet'
    cta: 'Download Data'
    url: '/resources/sample-data'

  - id: 'tutorials'
    title: 'Tutorials'
    description: 'Step-by-step guides for each feature'
    icon: 'book-open'
    cta: 'View Tutorials'
    url: '/resources/tutorials'
```

---

## variation_scouting

```yaml
section_id: 'variation-scouting'
headline: '#VariationScouting'
subhead: 'Real analysis in 3 minutes or less'

description: |
  Every week, we publish a new case with data and a short video 
  showing how to analyze it with VaRiScout. Watch, learn, try yourself.

format:
  - component: 'Dataset (CSV)'
    description: 'Real-world scenario, 100-500 rows'

  - component: 'Case Description'
    description: 'The business question in one paragraph'

  - component: 'Video (3 min)'
    description: 'Upload → Explore → Find the factor → Present'

sample_episodes:
  - title: 'Pizza Delivery Times'
    theme: 'Service variation'
    question: 'Which factor drives late deliveries?'
    dataset_url: '/data/pizza-delivery.csv'
    video_url: '#'

  - title: 'Manufacturing Defects'
    theme: 'Quality'
    question: 'Why did defects spike last month?'
    dataset_url: '/data/manufacturing-defects.csv'
    video_url: '#'

  - title: 'Call Center Wait Times'
    theme: 'Process variation'
    question: 'What drives wait time variation?'
    dataset_url: '/data/call-center.csv'
    video_url: '#'

cta:
  text: 'Watch All Episodes'
  url: '/resources/variation-scouting'

hashtag_note: |
  Found something interesting in your data? 
  Share with #VariationScouting on LinkedIn.
```

---

## sample_data

```yaml
section_id: 'sample-data'
headline: 'Sample Datasets'
subhead: 'Practice with realistic data'

datasets:
  - name: 'Pizza Delivery'
    rows: 500
    columns: 'Delivery_Time, Driver, Day, Distance, Order_Size'
    good_for: 'Boxplot, ANOVA, factor comparison'
    download_url: '/data/pizza-delivery.csv'

  - name: 'Manufacturing Cycle Time'
    rows: 1000
    columns: 'Cycle_Time, Machine, Shift, Operator, Product'
    good_for: 'I-Chart, Capability, drill-down'
    download_url: '/data/cycle-time.csv'

  - name: 'Supplier Quality'
    rows: 300
    columns: 'Measurement, Supplier, Part_Type, Batch'
    good_for: 'Boxplot, supplier comparison'
    download_url: '/data/supplier-quality.csv'

  - name: 'Call Center'
    rows: 750
    columns: 'Wait_Time, Time_of_Day, Day, Agent, Issue_Type'
    good_for: 'Pareto, factor screening'
    download_url: '/data/call-center.csv'

  - name: 'Hospital Discharge'
    rows: 400
    columns: 'Length_of_Stay, Department, Day, Admission_Type'
    good_for: 'Healthcare variation analysis'
    download_url: '/data/hospital-discharge.csv'

cta:
  text: 'Download All Datasets'
  url: '/data/all-samples.zip'
```

---

## tutorials

```yaml
section_id: 'tutorials'
headline: 'Tutorials'
subhead: 'Step-by-step guides'

tutorials:
  - category: 'Getting Started'
    items:
      - title: 'Your First Analysis'
        description: 'Upload data, see charts, find patterns'
        time: '5 min'
        url: '/resources/tutorials/first-analysis'

      - title: 'Understanding the Dashboard'
        description: 'What each chart shows and how they connect'
        time: '10 min'
        url: '/resources/tutorials/dashboard-overview'

  - category: 'Chart Types'
    items:
      - title: 'I-Chart: Process Stability'
        description: 'Reading control limits and identifying patterns'
        time: '8 min'
        url: '/resources/tutorials/i-chart'

      - title: 'Boxplot & ANOVA: Comparing Groups'
        description: 'Finding which factors differ significantly'
        time: '10 min'
        url: '/resources/tutorials/boxplot-anova'

      - title: 'Pareto: Finding the Vital Few'
        description: 'Identifying top contributors'
        time: '5 min'
        url: '/resources/tutorials/pareto'

      - title: 'Capability: Meeting Spec'
        description: 'Understanding Cp and Cpk'
        time: '8 min'
        url: '/resources/tutorials/capability'

  - category: 'Techniques'
    items:
      - title: 'Drilling Down: From Pattern to Root Factor'
        description: 'Using filters to find what matters'
        time: '12 min'
        url: '/resources/tutorials/drill-down'

      - title: 'Saving Templates for Repeat Analysis'
        description: 'Set up once, analyze quickly next time'
        time: '5 min'
        url: '/resources/tutorials/templates'

      - title: 'Copying Charts for Presentations'
        description: 'Export options and best practices'
        time: '5 min'
        url: '/resources/tutorials/export'

  - category: 'Integration'
    items:
      - title: 'VaRiScout in Excel'
        description: 'Using the add-in effectively'
        time: '10 min'
        url: '/resources/tutorials/excel-addin'

      - title: 'Power BI Dashboard Design'
        description: 'Building effective variation dashboards'
        time: '15 min'
        url: '/resources/tutorials/powerbi-dashboard'
```

---

## training_materials

```yaml
section_id: 'training'
headline: 'For Trainers'
subhead: 'Materials for your LSS courses'

materials:
  - title: 'Training Exercise: Pizza Delivery'
    type: 'Exercise + Solution'
    description: 'Complete exercise with learning objectives and solution guide'
    download_url: '/training/pizza-exercise.zip'

  - title: 'Slide Template: Introducing VaRiScout'
    type: 'PowerPoint'
    description: 'Slides for introducing VaRiScout in your training'
    download_url: '/training/intro-slides.pptx'

  - title: 'Quick Reference Card'
    type: 'PDF'
    description: 'One-page guide for students'
    download_url: '/training/quick-reference.pdf'

contact_note: |
  Need custom training materials or exercises?
  Contact us at training@variscout.com
```

---

## community

```yaml
section_id: 'community'
headline: 'Join the Conversation'

channels:
  - platform: 'LinkedIn'
    action: 'Follow #VariationScouting'
    description: 'Weekly videos, tips, and community posts'
    url: 'https://linkedin.com/...'

  - platform: 'YouTube'
    action: 'Subscribe'
    description: 'All #VariationScouting episodes'
    url: 'https://youtube.com/...'
```

---

## final_cta

```yaml
section_id: 'final-cta'
headline: 'Ready to Practice?'
subhead: 'Download a sample dataset and start exploring.'
cta:
  text: 'Open VaRiScout'
  url: '/app'
```
