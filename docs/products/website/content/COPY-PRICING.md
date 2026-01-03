# Pricing Copy

## Meta

```yaml
title: 'VaRiScout Pricing | Free to Start, Simple to Scale'
description: 'VaRiScout pricing: Free forever with watermark. €49/year for individuals. Team and enterprise options available through Microsoft AppSource.'
keywords: 'VaRiScout pricing, SPC software cost, variation analysis pricing'
```

---

## hero

```yaml
headline: 'Simple pricing.'
headline_emphasis: 'Start free.'
subhead: "Use VaRiScout free forever. Upgrade when you're ready — inside the app or through Microsoft."
```

---

## pricing_tiers

```yaml
section_id: 'tiers'

tiers:
  - name: 'Free'
    price: '€0'
    period: 'forever'
    description: 'Try full analysis — no signup needed'
    features:
      - 'All chart types (I-Chart, Boxplot, Pareto, Capability)'
      - 'Full analysis features'
      - 'CSV and Excel import'
      - 'Copy to clipboard'
      - 'Export PNG/CSV'
    limitations:
      - 'Watermark on exports'
      - "Session only — projects don't persist"
      - 'No .vrs file export'
    cta:
      text: 'Open VaRiScout'
      url: '/app'
    cta_note: 'No signup required'
    highlight: false

  - name: 'Individual'
    price: '€49'
    period: '/year'
    description: 'Save your work, share your files'
    features:
      - 'Everything in Free, plus:'
      - 'Save projects (persists in browser)'
      - 'Export/import .vrs project files'
      - 'Save analysis templates'
      - 'No watermark on exports'
      - 'Priority email support'
    where_to_get: 'Upgrade inside the app'
    cta:
      text: 'Start Free First'
      url: '/app'
    cta_note: 'Upgrade anytime in Settings'
    highlight: true
    badge: 'Most Popular'

  - name: 'Team'
    price: '€399'
    period: '/year'
    description: 'Power BI visuals for your team'
    features:
      - 'Up to 10 users'
      - 'All 4 Power BI visuals'
      - 'I-Chart, Boxplot, Pareto, Capability'
      - 'Cross-visual filtering'
      - 'Microsoft certified'
      - 'Email support'
    where_to_get: 'Microsoft AppSource'
    cta:
      text: 'View in AppSource'
      url: 'https://appsource.microsoft.com/...'
      external: true
    cta_note: 'Billed through Microsoft'
    highlight: false

  - name: 'Department'
    price: '€999'
    period: '/year'
    description: 'Power BI for larger groups, or Azure self-deploy'
    features:
      - 'Power BI: Up to 50 users'
      - 'OR Azure: Unlimited users'
      - 'All features'
      - 'Priority support'
      - 'Custom domain (Azure)'
      - 'Custom branding (Azure)'
    where_to_get: 'Microsoft AppSource or Azure Marketplace'
    cta:
      text: 'View Options'
      url: '/product/compare'
    cta_note: 'Billed through Microsoft'
    highlight: false

  - name: 'Enterprise'
    price: '€1,999'
    period: '/year'
    description: 'Power BI for the whole organization'
    features:
      - 'Unlimited users'
      - 'All 4 Power BI visuals'
      - 'Dedicated support'
      - 'Onboarding assistance'
      - 'Volume discounts available'
    where_to_get: 'Microsoft AppSource'
    cta:
      text: 'View in AppSource'
      url: 'https://appsource.microsoft.com/...'
      external: true
    cta_note: 'Billed through Microsoft'
    highlight: false
```

---

## how_buying_works

```yaml
section_id: 'how-it-works'
headline: 'How Buying Works'
subhead: 'Pay once, activated instantly'

steps:
  - number: 1
    icon: 'play'
    title: 'Try Free'
    description: 'Open VaRiScout in your browser. Upload your data, run analyses, copy charts. Full features, no signup.'
    detail: "Projects don't persist in Free — it's for trying things out."

  - number: 2
    icon: 'credit-card'
    title: 'Click Upgrade'
    description: "When you're ready to save your work, click Upgrade in Settings. Secure checkout takes 30 seconds."
    detail: 'Payment handled by Paddle, a trusted provider used by thousands of software companies.'

  - number: 3
    icon: 'zap'
    title: 'Instantly Activated'
    description: 'Your license activates in 2-3 seconds. No waiting for email. No license key to copy.'
    detail: 'A backup key is emailed to you for new devices.'

  - number: 4
    icon: 'check-circle'
    title: 'Save Your Work'
    description: 'Save projects, export .vrs files, share with colleagues. No watermark on exports.'
    detail: 'Your license works offline after activation.'

trust_badges:
  - icon: 'shield'
    text: 'Secure payment via Paddle'
  - icon: 'zap'
    text: 'Instant activation'
  - icon: 'file-text'
    text: 'VAT invoice included'
  - icon: 'refresh-cw'
    text: '30-day money-back'
```

---

## about_paddle

```yaml
section_id: 'about-paddle'
headline: 'About Payment'

content: |
  Payments are handled by **Paddle**, a trusted payment provider used by over 3,000 software companies worldwide.

  When you upgrade:
  - Your payment goes to Paddle, not directly to us
  - Paddle handles VAT/tax automatically based on your location
  - You receive a proper invoice immediately by email
  - Credit cards, PayPal, and other methods accepted

  We never see your payment details. Paddle sends us a notification, we generate your license key, and email it to you.

link:
  text: 'Learn more about Paddle'
  url: 'https://www.paddle.com'
  external: true
```

---

## team_options

```yaml
section_id: 'team-options'
headline: 'Need Team or Enterprise Features?'
subhead: 'For teams sharing dashboards or organizations needing central deployment'

options:
  - name: 'Power BI Visuals'
    icon: 'bar-chart-2'
    for: 'Teams using Power BI for reporting'
    description: |
      Add VaRiScout charts directly to your Power BI dashboards. 
      Same analysis, embedded in reports your team already uses.
    features:
      - '4 custom visuals: I-Chart, Boxplot, Pareto, Capability'
      - 'Cross-visual filtering with other Power BI elements'
      - 'Microsoft certified and supported'
      - 'Billed through Microsoft (familiar procurement)'
    tiers:
      - name: 'Team'
        users: 'Up to 10'
        price: '€399/year'
      - name: 'Department'
        users: 'Up to 50'
        price: '€999/year'
      - name: 'Enterprise'
        users: 'Unlimited'
        price: '€1,999/year'
    cta:
      text: 'View in AppSource'
      url: 'https://appsource.microsoft.com/...'
      external: true
    ideal_for:
      - 'Quality teams sharing dashboards'
      - 'Operations reporting'
      - 'Organizations standardized on Power BI'

  - name: 'Azure Deployment'
    icon: 'cloud'
    for: 'Organizations wanting full control'
    description: |
      Deploy VaRiScout to your own Azure tenant. 
      Your infrastructure, your domain, your branding.
    features:
      - 'Self-hosted on your Azure subscription'
      - 'Custom domain (e.g., analysis.yourcompany.com)'
      - 'Custom branding (your logo, colors)'
      - 'Unlimited users within your organization'
      - 'Data never leaves your Azure tenant'
    price: '€999/year + ~€5/month Azure hosting'
    cta:
      text: 'View in Azure Marketplace'
      url: 'https://azuremarketplace.microsoft.com/...'
      external: true
    ideal_for:
      - 'IT teams needing control'
      - 'Organizations with data residency requirements'
      - 'Companies wanting internal branding'
      - 'Large-scale deployment (100+ users)'

comparison_note: |
  **Not sure which to choose?**
  - Just you? → **Individual** (€49/year, upgrade in-app)
  - Team uses Power BI? → **Power BI visuals** (via AppSource)
  - Need self-hosted control? → **Azure** (via Marketplace)

  All options analyze data locally — we never see your data.
```

---

## choosing_right_product

```yaml
section_id: 'choose'
headline: 'Which VaRiScout is Right for You?'

decision_tree:
  - question: 'How many people need access?'
    answers:
      - answer: 'Just me'
        result: 'Individual (€49/year)'
        next_action: 'Start free at /app, upgrade when ready'
      - answer: 'My team (2-50 people)'
        result: 'Power BI Team/Department or Azure'
        follow_up: 'Do you use Power BI?'
      - answer: 'Entire organization'
        result: 'Power BI Enterprise or Azure'
        follow_up: 'Contact us for volume pricing'

  - question: 'Do you use Power BI?'
    answers:
      - answer: 'Yes, we report in Power BI'
        result: 'Power BI visuals'
        reason: 'Embed VaRiScout charts in dashboards your team already uses'
      - answer: 'No / We want standalone'
        result: 'Azure deployment'
        reason: 'Self-hosted web app, your domain, unlimited users'

  - question: 'Data residency / IT requirements?'
    answers:
      - answer: 'Data must stay in our infrastructure'
        result: 'Azure deployment'
        reason: 'Deploy to your Azure tenant, full control'
      - answer: 'Browser-based is fine'
        result: 'Individual or Power BI'
        reason: 'Data stays in browser (Individual) or Power BI (visuals)'

quick_guide:
  - scenario: "I'm learning Lean Six Sigma"
    recommendation: 'Free — no upgrade needed'
  - scenario: "I'm a consultant doing client work"
    recommendation: 'Individual — save projects, clean exports'
  - scenario: 'Our quality team needs shared dashboards'
    recommendation: 'Power BI Team — embed in existing reports'
  - scenario: 'We want company-branded tool for 200 engineers'
    recommendation: 'Azure — your domain, unlimited users'
```

---

## where_to_get

```yaml
section_id: 'where-to-get'
headline: 'Where to Get VaRiScout'

products:
  - name: 'Web App'
    description: 'Browser-based analysis, works offline'
    icon: 'globe'
    free: 'variscout.com/app'
    paid: 'Upgrade inside the app (€49/year)'
    cta:
      text: 'Open Web App'
      url: '/app'

  - name: 'Excel Add-in'
    description: 'Analyze without leaving Excel'
    icon: 'table'
    free: 'Microsoft AppSource'
    paid: 'Upgrade inside the add-in (€49/year)'
    cta:
      text: 'Get from AppSource'
      url: 'https://appsource.microsoft.com/...'
      external: true

  - name: 'Power BI Visuals'
    description: 'Variation analysis in your dashboards'
    icon: 'bar-chart'
    free: null
    paid: '€399 - €1,999/year via AppSource'
    cta:
      text: 'View in AppSource'
      url: 'https://appsource.microsoft.com/...'
      external: true

  - name: 'Azure Deployment'
    description: 'Self-host on your Azure tenant'
    icon: 'cloud'
    free: null
    paid: '€999/year via Azure Marketplace'
    cta:
      text: 'View in Marketplace'
      url: 'https://azuremarketplace.microsoft.com/...'
      external: true
```

---

## tier_comparison

```yaml
section_id: 'comparison'
headline: 'Compare Plans'

columns:
  - 'Feature'
  - 'Free'
  - 'Individual'
  - 'Team'
  - 'Department'
  - 'Enterprise'

rows:
  - feature: 'All chart types'
    free: '✓'
    individual: '✓'
    team: '✓'
    department: '✓'
    enterprise: '✓'

  - feature: 'Full analysis features'
    free: '✓'
    individual: '✓'
    team: '✓'
    department: '✓'
    enterprise: '✓'

  - feature: 'Copy to clipboard'
    free: '✓'
    individual: '✓'
    team: '✓'
    department: '✓'
    enterprise: '✓'

  - feature: 'Export PNG/CSV'
    free: '✓ (watermark)'
    individual: '✓'
    team: '✓'
    department: '✓'
    enterprise: '✓'

  - feature: 'Save projects'
    free: '–'
    individual: '✓'
    team: '✓'
    department: '✓'
    enterprise: '✓'

  - feature: 'Export .vrs files'
    free: '–'
    individual: '✓'
    team: '✓'
    department: '✓'
    enterprise: '✓'

  - feature: 'Save templates'
    free: '–'
    individual: '✓'
    team: '✓'
    department: '✓'
    enterprise: '✓'

  - feature: 'Web App'
    free: '✓'
    individual: '✓'
    team: '–'
    department: 'via Azure'
    enterprise: '–'

  - feature: 'Excel Add-in'
    free: '✓'
    individual: '✓'
    team: '–'
    department: '–'
    enterprise: '–'

  - feature: 'Power BI Visuals'
    free: '–'
    individual: '–'
    team: '✓'
    department: '✓'
    enterprise: '✓'

  - feature: 'Azure Deployment'
    free: '–'
    individual: '–'
    team: '–'
    department: '✓'
    enterprise: '–'

  - feature: 'Users'
    free: '1'
    individual: '1'
    team: '10'
    department: '50 / Unlimited'
    enterprise: 'Unlimited'

  - feature: 'Support'
    free: 'Community'
    individual: 'Email'
    team: 'Email'
    department: 'Priority'
    enterprise: 'Dedicated'

  - feature: 'Where to Get'
    free: 'variscout.com/app'
    individual: 'In-app upgrade'
    team: 'AppSource'
    department: 'AppSource / Azure'
    enterprise: 'AppSource'

  - feature: 'Billed By'
    free: '—'
    individual: 'Paddle'
    team: 'Microsoft'
    department: 'Microsoft'
    enterprise: 'Microsoft'
```

---

## product_pricing

```yaml
section_id: 'by-product'
headline: 'Pricing by Product'

products:
  - name: 'Web App'
    where: 'variscout.com/app'
    tiers:
      - tier: 'Free'
        price: '€0'
        notes: 'Watermark on exports'
      - tier: 'Individual'
        price: '€49/year'
        notes: 'Upgrade in-app'

  - name: 'Excel Add-in'
    where: 'Microsoft AppSource'
    tiers:
      - tier: 'Free'
        price: '€0'
        notes: 'Watermark on exports'
      - tier: 'Individual'
        price: '€49/year'
        notes: 'Upgrade in add-in'

  - name: 'Power BI'
    where: 'Microsoft AppSource'
    tiers:
      - tier: 'Team (10 users)'
        price: '€399/year'
        notes: 'Billed by Microsoft'
      - tier: 'Department (50 users)'
        price: '€999/year'
        notes: 'Billed by Microsoft'
      - tier: 'Enterprise (unlimited)'
        price: '€1,999/year'
        notes: 'Billed by Microsoft'

  - name: 'Azure'
    where: 'Azure Marketplace'
    tiers:
      - tier: 'Self-Deploy'
        price: '€999/year'
        notes: '+ ~€5/mo Azure hosting, billed by Microsoft'
```

---

## faq

```yaml
section_id: 'faq'
headline: 'Pricing FAQ'

items:
  - question: "What's the difference between Free and Individual?"
    answer: "Free gives you full analysis features for one-off use, but projects don't persist — your work is gone when you close the browser. Individual (€49/year) lets you save projects, export .vrs files to share with colleagues, and removes the watermark from exports."

  - question: 'Can I use Free for real work?'
    answer: "Absolutely. Free has full analysis features. It's great for quick analyses where you don't need to save. When you find yourself spending 20+ minutes on an analysis, you'll probably want to upgrade so you can save your work."

  - question: 'How do I upgrade from Free to Individual?'
    answer: "Click 'Upgrade' in the app's Settings. Complete the secure checkout (powered by Paddle). Your license activates instantly — no waiting for email."

  - question: 'What is Paddle?'
    answer: 'Paddle is a trusted payment provider used by thousands of software companies. They handle the payment, VAT/tax, and send you a receipt with invoice. Your payment details go to Paddle, not to us.'

  - question: 'How does activation work?'
    answer: 'Instantly! After you pay, the app activates within 2-3 seconds. No need to check email or enter a license key. A backup key is emailed to you in case you need to set up on a new device later.'

  - question: 'How do I get an invoice?'
    answer: 'Paddle emails you a receipt immediately after purchase. This receipt is a proper VAT invoice that you can use for expense reports or company reimbursement.'

  - question: 'What if I need to use VaRiScout on a new device?'
    answer: 'Check your email for the license key we sent after purchase. Enter it in Settings on your new device. The key format is VSL-XXXX-XXXX-XXXX-XXXX.'

  - question: 'Can I use my license on multiple devices?'
    answer: 'Yes. Your license key (sent via email as backup) works on any device. The license is tied to your email, not to a specific device.'

  - question: 'What if I lose my license key?'
    answer: "Check your email from Paddle/VaRiScout. If you can't find it, contact us with your purchase email and we'll resend it."

  - question: 'Why are Power BI and Azure purchased through Microsoft?'
    answer: "Enterprise products are available through Microsoft AppSource and Azure Marketplace. This means familiar procurement, billing on your Microsoft invoice, and compliance with your organization's purchasing policies."

  - question: 'When should I choose Power BI vs Azure?'
    answer: "Choose Power BI if your team already uses Power BI for reporting — you'll get VaRiScout charts embedded in dashboards you already use. Choose Azure if you want a standalone web app with your own domain, branding, and full infrastructure control."

  - question: 'Can I try Power BI visuals before buying?'
    answer: 'Power BI visuals have a free trial period through AppSource. Install them, test with your data, then purchase when ready.'

  - question: "What's included in Azure pricing?"
    answer: 'The €999/year license covers the VaRiScout software. You also pay Azure hosting costs (~€5/month) directly to Microsoft. You get unlimited users, custom domain, and custom branding.'

  - question: 'Is the Individual license for Web App or Excel?'
    answer: 'You choose one. €49/year covers either the Web App or Excel Add-in. Need both? Contact us for a bundle.'

  - question: 'Do you offer discounts for training organizations?'
    answer: 'Yes. Contact us for volume pricing for training companies and educational institutions.'

  - question: 'Is there a money-back guarantee?'
    answer: 'Yes. 30-day money-back guarantee for Individual licenses, no questions asked. For Microsoft purchases, their refund policies apply.'

  - question: 'Where does my data go?'
    answer: "Nowhere. VaRiScout runs entirely in your browser. Your data never leaves your device. We don't have servers that see your data — that's by design."
```

---

## data_privacy_callout

```yaml
section_id: 'data-privacy'
headline: 'Your Data Stays Yours'
icon: 'shield-check'

content: |
  VaRiScout is designed for sensitive operational data. 
  That's why we built it to run entirely on your side:

  - **Web App**: Runs in your browser. Data never uploaded.
  - **Excel**: Runs in Excel. Data stays in your spreadsheet.
  - **Power BI**: Runs in your Power BI. Your data model, your tenant.
  - **Azure**: Deploy to your own Azure. Your infrastructure, your control.

note: "We don't operate servers that see your data. We can't access your analyses. That's by design."
```

---

## enterprise_cta

```yaml
section_id: 'enterprise'
headline: 'Enterprise & Training Organizations'

content: |
  Need volume licensing, custom deployment support, 
  or multi-region agreements? Let's talk.

features:
  - 'Volume discounts'
  - 'Training organization pricing'
  - 'Multi-year agreements'
  - 'Deployment assistance'

cta:
  text: 'Contact Us'
  url: '/contact'
```

---

## training_callout

```yaml
section_id: 'training'
headline: 'Learning & Training'
icon: 'graduation-cap'

content: |
  The free tier has full analysis features — it works well for classroom use, 
  workshops, and learning. Students can analyze, learn, and move on.

  When you need to save projects for ongoing work, upgrade to Individual (€49/year).

cta:
  text: 'Learn More: LSS Training'
  url: '/use-cases/lss-training'
```

---

## trust_signals

```yaml
section_id: 'trust'
items:
  - '30-day money-back guarantee'
  - 'Microsoft certified (AppSource)'
  - 'Data never leaves your browser'
  - 'Cancel anytime'
  - 'No credit card for Free tier'
```

---

## final_cta

```yaml
section_id: 'final-cta'
headline: 'Start Free Today'
subhead: 'No signup. No credit card. Just open and analyze.'
cta:
  text: 'Open VaRiScout'
  url: '/app'
```
