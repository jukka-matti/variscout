# AppSource Publication Guide

How to publish and manage the VariScout Excel Add-in on Microsoft AppSource.

---

## Overview

Microsoft AppSource is the marketplace for Microsoft 365 add-ins. Publishing VariScout here provides:

- Direct access from Excel's Add-ins dialog
- Microsoft certification (trust signal)
- Automatic updates for users
- Enterprise admin deployment support

---

## Distribution Model

### FREE Listing with Freemium Model

The Excel Add-in is listed **FREE** on AppSource:

| Tier     | Price | Trigger                       | Features                       |
| -------- | ----- | ----------------------------- | ------------------------------ |
| **Free** | €0    | Install from AppSource        | Basic charts, 50 channel limit |
| **Full** | €0    | Tenant has Azure App deployed | All features, unlimited        |

**No payment processing** in the Add-in - all billing flows through Azure Marketplace.

### Why FREE on AppSource?

1. **Friction-free adoption**: Users can try immediately
2. **Lead generation**: Free users discover value, upgrade to Azure
3. **Excel discoverability**: FREE listings rank higher
4. **Enterprise deployment**: Admins can push to all users

---

## Prerequisites

### Partner Center Account

Same account as Azure Marketplace:

1. Register at [Partner Center](https://partner.microsoft.com/)
2. Enable "Office Store" program
3. Complete publisher verification

### Technical Requirements

| Requirement                 | Status   |
| --------------------------- | -------- |
| Manifest.xml valid          | ✓        |
| HTTPS hosting               | ✓        |
| Privacy policy URL          | Required |
| Terms of service URL        | Required |
| Support URL                 | Required |
| Microsoft 365 Certification | Required |

---

## Listing Content

### App Name

```
VariScout - SPC Charts for Excel
```

### Short Description (100 chars)

```
Statistical process control with I-Charts, Boxplots, Pareto, and Cpk capability analysis.
```

### Long Description (3000 chars)

```markdown
**VariScout** brings professional statistical process control directly into Excel.

### What You Get (Free Tier)

- **I-Charts**: Control charts with automatic control limits
- **Boxplots**: Compare distributions across categories
- **Pareto Charts**: Prioritize improvement opportunities
- **Capability Histograms**: Basic Cp/Cpk analysis
- **50 channel limit** for Performance Mode

### Unlock Full Features

Upgrade to full features automatically when your organization deploys the
VariScout Azure App from Azure Marketplace:

- **Unlimited channels** in Performance Mode
- **Advanced drill-down** navigation
- **Team collaboration** features
- **Priority support**

### How It Works

1. Select your data table in Excel
2. Open VariScout from the Add-ins ribbon
3. Run the Setup Wizard (5 quick steps)
4. View interactive charts in the Content Add-in

Charts respond to Excel slicers - filter your data and charts update automatically!

### Who Is It For?

- Quality engineers analyzing production data
- Manufacturing teams tracking Cpk
- Students learning SPC concepts
- Anyone with variation data in Excel

### No Data Leaves Excel

All calculations happen locally in your browser. Your data never leaves
your workbook or your organization's Microsoft 365 tenant.
```

### Screenshots (Required: 5-10)

1. Performance Dashboard in Excel
2. I-Chart with slicers
3. Capability Histogram
4. Setup Wizard - Step 1
5. Setup Wizard - Specs configuration
6. Pareto chart drill-down

### Categories

- **Primary**: Productivity > Data Analysis
- **Secondary**: Business Intelligence > Analytics

### Supported Products

- Excel on Windows (Office 2019+)
- Excel on Mac (Office 2019+)
- Excel on the web
- Excel on iPad/iPhone (limited)
- Excel on Android (limited)

---

## Technical Configuration

### Manifest Requirements

```xml
<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:type="TaskPaneApp">

  <Id>{GUID}</Id>
  <Version>1.0.0.0</Version>
  <ProviderName>VariScout</ProviderName>
  <DefaultLocale>en-US</DefaultLocale>
  <DisplayName DefaultValue="VariScout - SPC Charts"/>
  <Description DefaultValue="Statistical process control for Excel"/>

  <SupportUrl DefaultValue="https://variscout.com/support"/>
  <AppDomains>
    <AppDomain>https://excel.variscout.com</AppDomain>
  </AppDomains>

  <Hosts>
    <Host Name="Workbook"/>
  </Hosts>

  <Requirements>
    <Sets>
      <Set Name="ExcelApi" MinVersion="1.9"/>
    </Sets>
  </Requirements>

  <!-- Task Pane and Content Add-in definitions -->

</OfficeApp>
```

### Hosting Setup

Production hosting on Azure Static Web Apps:

```
https://excel.variscout.com/
├── taskpane.html     # Setup wizard
├── content.html      # Charts display
├── assets/           # JS, CSS bundles
└── manifest.xml      # For direct download
```

### API Requirements

| API              | Min Version | Used For                 |
| ---------------- | ----------- | ------------------------ |
| ExcelApi         | 1.9         | Tables, charts, bindings |
| ExcelApi         | 1.10        | Slicers                  |
| CustomProperties | 1.1         | State persistence        |

---

## Microsoft 365 Certification

### Requirements

1. **Security Review**
   - No data exfiltration
   - HTTPS only
   - Content Security Policy headers

2. **Privacy Compliance**
   - Clear privacy policy
   - No unnecessary data collection
   - User consent for any tracking

3. **Functionality Testing**
   - Works in all supported Excel versions
   - Graceful degradation for older versions
   - No crashes or data loss

4. **Accessibility**
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader support

### Certification Timeline

- Initial review: 5-10 business days
- Fixes and resubmission: 3-5 days each
- Total expected: 2-4 weeks

---

## Free Tier Feature Gating

### Feature Limits

| Feature           | Free Tier   | Full Tier (Azure) |
| ----------------- | ----------- | ----------------- |
| I-Chart           | ✓           | ✓                 |
| Boxplot           | ✓           | ✓                 |
| Pareto            | ✓           | ✓                 |
| Capability        | ✓           | ✓                 |
| Performance Mode  | 50 channels | Unlimited         |
| Drill-down depth  | 2 levels    | Unlimited         |
| State persistence | ✓           | ✓                 |

### Upgrade Prompt

When free tier users hit limits:

```typescript
if (channelCount > FREE_TIER_CHANNEL_LIMIT && !hasAzureApp) {
  showUpgradePrompt({
    title: 'Unlock Unlimited Channels',
    message:
      'Your organization can unlock full features by deploying VariScout from Azure Marketplace.',
    learnMoreUrl: 'https://variscout.com/azure',
  });
}
```

---

## Analytics & Tracking

### Allowed Telemetry

- Feature usage (which charts, frequency)
- Error rates (anonymous)
- Performance metrics (load time, render time)

### Not Collected

- User identity
- Data content
- Organization details
- File names

### Implementation

```typescript
// Anonymous telemetry via Application Insights (optional)
trackEvent('chart_rendered', {
  chartType: 'i-chart',
  tier: 'free', // or 'full'
  channelCount: channels.length,
});
```

---

## Post-Publication

### Update Process

1. Update version in manifest.xml
2. Build new production bundle
3. Deploy to Azure Static Web Apps
4. Submit update in Partner Center
5. Review (typically 2-3 days for updates)

### User Communication

- In-app changelog for major updates
- Blog post for feature announcements
- Email for breaking changes

### Support Tiers

| Tier | Channel       | Response       |
| ---- | ------------- | -------------- |
| Free | GitHub Issues | Best effort    |
| Full | Email         | Per Azure tier |

---

## Metrics to Track

### Adoption

- AppSource installs (weekly)
- Active users (MAU)
- Free vs Full tier ratio

### Conversion

- Free users who upgrade to Azure
- Time from install to upgrade
- Features that trigger upgrades

### Quality

- Error rates by Excel version
- Performance by chart type
- Support ticket volume

---

## See Also

- [License Detection](license-detection.md)
- [Excel Strategy](strategy.md)
- [Azure Marketplace Guide](../azure/marketplace.md)
- [AppSource Documentation](https://docs.microsoft.com/office/dev/store/)
