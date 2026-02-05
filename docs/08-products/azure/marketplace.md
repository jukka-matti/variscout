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

| Requirement          | Status   |
| -------------------- | -------- |
| Azure Static Web App | ✓        |
| ARM template         | ✓        |
| MSAL integration     | ✓        |
| Privacy policy URL   | Required |
| Terms of service URL | Required |
| Support URL          | Required |

---

## Offer Types

### Azure Application (Recommended)

VariScout uses **Solution Template** offer type:

```
Azure Application > Solution Template
├── Deploys ARM template to customer subscription
├── Customer owns all resources
├── No managed app access needed
└── Supports BYOL (Bring Your Own License)
```

**Why Solution Template:**

- Customer fully controls their deployment
- No Azure Managed Application overhead
- Simple billing model (pay-per-tier)
- Data stays in customer environment

---

## Pricing Configuration

### Tier Setup in Partner Center

| Plan ID      | Display Name    | Price (EUR) | Billing |
| ------------ | --------------- | ----------- | ------- |
| `individual` | Individual Plan | €99         | Annual  |
| `team`       | Team Plan       | €499        | Annual  |
| `enterprise` | Enterprise Plan | €1,790      | Annual  |

### Price Breakdown

```
Gross Price:    €99  / €499  / €1,790
Microsoft Fee:  -€3  / -€15  / -€54   (3%)
Net Revenue:    €96  / €484  / €1,736
```

### Regional Pricing

Partner Center supports per-region pricing. Recommended approach:

- **EUR zone**: Base prices (€99/€499/€1,790)
- **USD zone**: Equivalent prices ($109/$549/$1,969)
- **GBP zone**: Equivalent prices (£85/£425/£1,529)

Microsoft handles currency conversion and VAT.

---

## Listing Content

### Offer Name

```
VariScout - Statistical Process Control for Quality Teams
```

### Short Description (100 chars)

```
Offline-first variation analysis with I-Charts, Boxplots, Pareto, and Cpk capability analysis.
```

### Long Description (3000 chars)

```markdown
**VariScout** is a statistical process control (SPC) tool designed for quality professionals
who need to analyze manufacturing variation without complex setup or cloud dependencies.

### Key Features

**Four Pillars of Variation Analysis**

- Change: I-Charts with Nelson Rules for process stability
- Failure: Capability analysis (Cp/Cpk) against specifications
- Flow: Pareto charts for prioritizing improvement efforts
- Value: Boxplot comparisons across categories

**Performance Mode**
Analyze hundreds of measurement channels simultaneously:

- Multi-channel Cpk tracking
- Worst-first Pareto ranking
- Interactive drill-down to individual channels

**No Backend Required**

- Deploys entirely to your Azure tenant
- Data stays in your OneDrive
- Zero external API calls
- Full offline support after initial load

### Who Is It For?

- Quality engineers analyzing production data
- Manufacturing teams tracking process capability
- Consultants conducting capability assessments
- Students learning statistical quality control

### Pricing Tiers

- **Individual** (€99/year): Single user, full features
- **Team** (€499/year): Up to 10 users, shared projects
- **Enterprise** (€1,790/year): Unlimited users, priority support

### Integration

Works seamlessly with the FREE VariScout Excel Add-in from AppSource.
Azure deployment automatically unlocks full Excel features.
```

### Screenshots (Required: 5-10)

1. Performance Dashboard - Multi-channel Cpk overview
2. I-Chart - Control chart with Nelson Rules
3. Capability Histogram - Cp/Cpk analysis
4. Boxplot Comparison - Category comparison
5. Pareto Chart - Improvement prioritization
6. Drill-Down Navigation - Filter breadcrumbs
7. OneDrive Sync - Project saving

### Videos (Optional but Recommended)

- Product overview (2-3 min)
- Quick start tutorial
- Feature highlights

---

## Technical Configuration

### ARM Template Publication

Partner Center requires ARM template for Solution Template offers:

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "tier": {
      "type": "string",
      "allowedValues": ["individual", "team", "enterprise"],
      "metadata": {
        "description": "VariScout license tier"
      }
    }
  },
  "resources": [
    // Static Web App resource
    // App Registration resource
    // Configuration settings
  ]
}
```

See [ARM Template Documentation](arm-template.md) for full template.

### Plan Visibility

| Plan       | Visibility | Audience            |
| ---------- | ---------- | ------------------- |
| Individual | Public     | All Azure customers |
| Team       | Public     | All Azure customers |
| Enterprise | Public     | All Azure customers |

---

## Certification Process

### Pre-Submission Checklist

- [ ] ARM template validates successfully
- [ ] App deploys without errors
- [ ] MSAL authentication works
- [ ] Privacy policy URL accessible
- [ ] Terms of service URL accessible
- [ ] Support contact information complete
- [ ] All screenshots meet requirements (1280x720 min)
- [ ] Video links work (if included)

### Microsoft Review (~5-10 business days)

1. **Automated validation**: Template syntax, resource definitions
2. **Manual review**: Listing content, pricing, policies
3. **Security scan**: Vulnerability assessment
4. **Functionality test**: Deployment verification

### Common Rejection Reasons

| Issue                      | Fix                                    |
| -------------------------- | -------------------------------------- |
| Invalid ARM template       | Validate with Azure CLI before submit  |
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

1. Update ARM template version
2. Submit for re-certification
3. Typically 2-3 day review for updates

### Customer Support

| Tier       | Response Time | Channel       |
| ---------- | ------------- | ------------- |
| Individual | 48 hours      | Email         |
| Team       | 24 hours      | Email         |
| Enterprise | 8 hours       | Email + Phone |

---

## See Also

- [Pricing Tiers](pricing-tiers.md)
- [ARM Template](arm-template.md)
- [Partner Center Documentation](https://docs.microsoft.com/partner-center/)
