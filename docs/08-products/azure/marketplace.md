---
title: 'Azure Marketplace Guide'
---

# Azure Marketplace Guide

How to publish and manage VariScout on Azure Marketplace.

---

## Overview

Azure Marketplace is Microsoft's enterprise application store. Publishing VariScout here provides:

- Access to millions of Azure customers
- Microsoft-handled billing and invoicing
- Enterprise procurement integration
- Trust signal from Microsoft certification

---

## Prerequisites

### Partner Center Account

1. Register at [Partner Center](https://partner.microsoft.com/)
2. Complete publisher profile
3. Verify bank account for payouts
4. Accept marketplace agreements

### Technical Requirements

| Requirement                           | Status   |
| ------------------------------------- | -------- |
| Azure App Service                     | Required |
| ARM template (mainTemplate.json)      | Required |
| EasyAuth (App Service Authentication) | Required |
| Privacy policy URL                    | Required |
| Terms of service URL                  | Required |
| Support URL                           | Required |

---

## Offer Type

### Managed Application (Required for Billing)

VariScout uses the **Managed Application** offer type:

```
Azure Application > Managed Application
├── Deploys ARM template to customer subscription (managed RG)
├── Customer has full access to deployed resources
├── Publisher management DISABLED (zero access)
├── Microsoft handles billing (3% fee)
└── Two plans: Standard €99/month, Team €299/month
```

**Why Managed Application (not Solution Template):**

- **Solution Templates are not transactable** — Microsoft will not bill customers for them
- Managed Applications support Microsoft-billed monthly subscriptions
- Customer still controls their deployment (publisher access disabled)
- Data stays in customer environment
- No backend needed

**Permission configuration:**

| Setting              | Value        | Notes                                     |
| -------------------- | ------------ | ----------------------------------------- |
| Publisher Management | **Disabled** | No publisher access to customer resources |
| Customer Access      | **Enabled**  | Full customer control                     |

These settings are **immutable after publishing**.

### Deployment Package

Partner Center requires a `.zip` package for Managed Application offers:

```
variscout-managed-app.zip
├── mainTemplate.json         # ARM template for resources
└── createUiDefinition.json   # Azure portal deployment wizard UI
```

See [ARM Template Documentation](arm-template.md) for the full template.

---

## Pricing Configuration

### Two Plans

| Plan ID    | Display Name       | Price (EUR) | Billing |
| ---------- | ------------------ | ----------- | ------- |
| `standard` | VariScout Standard | €99         | Monthly |
| `team`     | VariScout Team     | €299        | Monthly |

### Price Breakdown

```
Standard:       €99/month  → Net €96.03/month  (€1,152/year)
Team:           €299/month → Net €290.03/month (€3,480/year)
Microsoft Fee:  3% on each plan
```

### Regional Pricing

Partner Center supports per-region pricing. Recommended approach:

- **EUR zone**: €99 / €299 per month
- **USD zone**: $109 / $329 per month
- **GBP zone**: £85 / £255 per month

Microsoft handles currency conversion and VAT.

---

## Listing Content

### Offer Name

```
VariScout - Statistical Process Control for Quality Teams
```

### Short Description (100 chars)

```
Offline-first variation analysis with I-Charts, Boxplots, Pareto, and process capability analysis.
```

### Long Description (3000 chars)

```markdown
**VariScout** is a variation analysis tool designed for quality professionals
who need to understand process variation without complex setup or cloud dependencies.

### Key Features

**Four Lenses of Variation Analysis**

- Change: I-Charts with Nelson Rules for process stability
- Failure: Capability analysis (Cp/Cpk) against specifications
- Flow: Pareto charts for prioritizing improvement efforts
- Value: Boxplot comparisons across categories

**Performance Mode**
Analyze hundreds of measurement channels simultaneously:

- Multi-channel capability tracking (Cpk)
- Worst-first Pareto ranking
- Interactive drill-down to individual channels

**No Backend Required**

- Deploys entirely to your Azure tenant
- Standard: Data stored locally in browser. Team: Syncs to your OneDrive
- Zero external API calls
- Full offline support after initial load

### Who Is It For?

- Quality engineers analyzing production data
- Manufacturing teams tracking process capability
- Consultants conducting capability assessments
- Students learning statistical quality control

### Pricing

**Standard — €99/month** — Full analysis, unlimited users in your tenant.
**Team — €299/month** — Everything in Standard, plus Teams, OneDrive, SharePoint, mobile, and photo evidence.

### Integration

Try the FREE VariScout Web App for training and learning SPC fundamentals
before upgrading to the full Azure App for team use.
```

### Screenshots (Required: 5-10)

1. Performance Dashboard - Multi-channel capability overview
2. I-Chart - Control chart with Nelson Rules
3. Capability Histogram - Cp/Cpk analysis
4. Boxplot Comparison - Category comparison
5. Pareto Chart - Improvement prioritization
6. Drill-Down Navigation - Filter breadcrumbs
7. OneDrive Sync - Analysis saving (Team plan)

### Videos (Optional but Recommended)

- Product overview (2-3 min)
- Quick start tutorial
- Feature highlights

---

## Technical Configuration

### Plan Visibility

| Plan     | Visibility | Audience            |
| -------- | ---------- | ------------------- |
| Standard | Public     | All Azure customers |
| Team     | Public     | All Azure customers |

---

## Certification Process

### Pre-Submission Checklist

- [ ] Deployment package (.zip) validates successfully
- [ ] mainTemplate.json passes ARM TTK validation
- [ ] createUiDefinition.json renders correctly in sandbox
- [ ] App deploys without errors from marketplace flow
- [ ] EasyAuth authentication works post-deployment
- [ ] OneDrive sync works (save/load analyses) — Team plan only
- [ ] Privacy policy URL accessible
- [ ] Terms of service URL accessible
- [ ] Support contact information complete
- [ ] All screenshots meet requirements (1280x720 min)
- [ ] Video links work (if included)

### Microsoft Review (~5-10 business days)

1. **Automated validation**: Template syntax, resource definitions, package structure
2. **Manual review**: Listing content, pricing, policies
3. **Security scan**: Vulnerability assessment
4. **Functionality test**: Deployment verification via marketplace flow

### Common Rejection Reasons

| Issue                      | Fix                                    |
| -------------------------- | -------------------------------------- |
| Invalid ARM template       | Validate with ARM TTK and Azure CLI    |
| Invalid createUiDefinition | Test in sandbox portal                 |
| Missing privacy policy     | Add public URL to listing              |
| Screenshot quality         | Minimum 1280x720, PNG format           |
| Description too short      | Expand feature descriptions            |
| Support contact incomplete | Add email and response time commitment |

---

## Post-Publication

### Monitoring

- Partner Center Analytics for sales data
- Customer deployment telemetry (anonymous)
- Support ticket tracking

### Updates

1. Update deployment package (.zip)
2. Submit for re-certification
3. Typically 2-3 day review for updates

### Customer Support

| Response Time | Channel |
| ------------- | ------- |
| 24 hours      | Email   |

---

## See Also

- [How It Works](how-it-works.md) — end-to-end architecture guide
- [Pricing Tiers](pricing-tiers.md)
- [ARM Template](arm-template.md)
- [Authentication](authentication.md)
- [Partner Center Documentation](https://docs.microsoft.com/partner-center/)
