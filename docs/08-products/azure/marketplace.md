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
└── Two plans: Standard €79/month, Team €199/month
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
| `standard` | VariScout Standard | €79         | Monthly |
| `team`     | VariScout Team     | €199        | Monthly |

### Price Breakdown

```
Standard:       €79/month  → Net €76.63/month  (€920/year)
Team:           €199/month → Net €193.03/month (€2,316/year)
Microsoft Fee:  3% on each plan
```

### Regional Pricing

Partner Center supports per-region pricing. Recommended approach:

- **EUR zone**: €79 / €199 per month
- **USD zone**: $87 / $219 per month
- **GBP zone**: £68 / £170 per month

Microsoft handles currency conversion and VAT.

---

## Listing Content

### Offer Name

```
VariScout - Structured Investigation for Process Improvement
```

### Short Description (100 chars)

```
Question-driven investigation combining data analysis, gemba observations, and expert knowledge for process improvement.
```

### Long Description (3000 chars)

```markdown
**VariScout** is a structured investigation platform for process improvement —
guiding teams from concern to measured result through question-driven analysis, without complex setup or cloud dependencies.

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

- Quality engineers investigating process variation
- Operations teams driving measurable improvement
- Consultants guiding structured investigations
- Anyone improving a process with data, gemba observations, and team expertise

### Pricing

**Standard — €79/month** — Full analysis with AI-assisted CoScout, unlimited users in your tenant.
**Team — €199/month** — Everything in Standard, plus Teams, OneDrive, SharePoint, Knowledge Base & Catalyst, mobile, and photo evidence.

### Integration

Try the FREE VariScout Web App to learn the investigation methodology
before upgrading to the full Azure App for professional team investigations.
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
