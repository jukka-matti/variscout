---
title: 'Azure Marketplace Certification Guide'
audience: [admin, architect]
category: reference
status: stable
---

# Azure Marketplace Certification Guide

Permanent reference for what Microsoft evaluates during Managed Application certification review, mapped to VariScout's architecture.

---

## Three Layers of Review

### Layer 1: Publisher Business Eligibility

Prerequisites before any code is reviewed:

| Requirement                     | Details                                                               |
| ------------------------------- | --------------------------------------------------------------------- |
| Partner Center account          | Registered at [partner.microsoft.com](https://partner.microsoft.com/) |
| Publisher profile               | Company name (RDMAIC Oy), logo, description                           |
| Bank verification               | Finnish IBAN for payouts, 2–5 business days                           |
| Marketplace Publisher Agreement | Legal review and acceptance                                           |
| App Certification Policies      | Acceptance required                                                   |

**Timeline:** Varies, typically 1–2 weeks for new publishers.

---

### Layer 2: Content Validation (Manual, ~2–5 days)

Microsoft reviewers manually check listing quality:

| Check              | Requirement                                       | VariScout Status                          |
| ------------------ | ------------------------------------------------- | ----------------------------------------- |
| Listing text       | Accurate, no misleading claims                    | Draft in [marketplace.md](marketplace.md) |
| Screenshots        | 1280×720+ PNG, no browser chrome, product UI only | Not yet created                           |
| Privacy policy URL | HTTPS, must return 200                            | variscout.com/legal/privacy               |
| Terms of use URL   | HTTPS, must return 200                            | variscout.com/legal/terms                 |
| Support contact    | Email with response time commitment               | hello@variscout.com                       |
| Categories         | Correct marketplace category selection            | Pending                                   |
| Keywords           | Relevant search terms                             | Pending                                   |

**Common rejections:** Broken legal URLs, screenshots with browser chrome, description too vague, missing response time commitment on support contact.

---

### Layer 3: Technical Validation (Automated + Manual, ~3–10 days)

The deepest review layer. Covers ARM template, security, and functionality.

#### ARM Template (arm-ttk automated tests)

| Rule                       | Requirement                                                        | VariScout                                  |
| -------------------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| Valid JSON schema          | `2019-04-01/deploymentTemplate.json#`                              | ✅ Correct                                 |
| `apiVersion` freshness     | ≤24 months old on all resources                                    | ✅ `2025-01-01`                            |
| `secureString` for secrets | Passwords and keys use `secureString` type                         | ✅ `clientSecret` is `secureString`        |
| Parameter descriptions     | All parameters have `metadata.description`                         | ✅ All 5 parameters described              |
| No hardcoded URIs          | Portal/management endpoints, deployment URLs must be parameterized | ✅ `packageUrl` is a parameter             |
| No unnecessary Owner RBAC  | Publisher shouldn't request Owner over managed RG                  | ✅ No publisher access set                 |
| `uniqueString()` in names  | Resource names must be globally unique                             | ✅ `appName` default uses `uniqueString()` |
| Correct `dependsOn`        | Resources reference dependencies properly                          | ✅ Site → Plan, Auth → Site                |
| Zip structure              | `mainTemplate.json` + `createUiDefinition.json` at zip root        | Manual step at packaging                   |

#### createUiDefinition Validation

| Rule                      | Requirement                                           | VariScout                            |
| ------------------------- | ----------------------------------------------------- | ------------------------------------ |
| Outputs map to parameters | Every CUID output must match a mainTemplate parameter | ✅ 4 outputs → 4 parameters          |
| `PasswordBox` for secrets | Secrets use password input, not TextBox               | ✅ `clientSecret` uses `PasswordBox` |
| Regex constraints         | Input validation where appropriate                    | ✅ `appName` + `clientId` have regex |
| Sandbox rendering         | Must render without errors in portal sandbox          | Needs testing                        |

#### Security Scan

| Check               | Details                                | VariScout                                 |
| ------------------- | -------------------------------------- | ----------------------------------------- |
| Malware scan        | Automated scan of deployment package   | Low risk — static SPA                     |
| Network monitoring  | No unexpected outbound calls           | Only Graph API (OneDrive)                 |
| Data exfiltration   | No data sent to unauthorized endpoints | Offline-first, data stays in browser      |
| npm vulnerabilities | Dependency audit                       | Verify with `npm audit` before submission |

#### Functionality Test

Microsoft deploys the app through the marketplace flow and verifies:

1. Deployment completes successfully (target: <10 minutes)
2. App loads at the deployed URL
3. Authentication redirects work (EasyAuth → Azure AD)
4. Core functionality operates (charts render, data can be loaded)

#### Managed Application Specific

| Check            | Details                                                                      | VariScout                                                                |
| ---------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| CUID tracking    | Customer Usage Attribution — auto-injected by Partner Center at publish time | ✅ No manual action needed (no nested `Microsoft.Resources/deployments`) |
| Publisher access | Authorization level over managed resource group                              | ✅ No publisher access (customer-controlled)                             |
| Lock level       | Resource lock on managed RG                                                  | Default (customer controls)                                              |

---

## VariScout-Specific Notes

### Why CUID Is Automatic

Partner Center auto-injects the Customer Usage Attribution tracking ID into the deployment template at publish time. This works because our template doesn't use nested `Microsoft.Resources/deployments` — the resources deploy directly. No manual GUID injection or tracking code is needed.

### Security Posture

VariScout has a minimal attack surface for certification:

- **Offline-first SPA** — all statistical processing runs in the browser
- **No backend API** — no server-side code to exploit
- **Only external call** — Microsoft Graph API for OneDrive sync (Team plan only; delegated permissions: `User.Read` + `Files.ReadWrite`). Standard plan has no external API calls.
- **EasyAuth** — authentication handled entirely by Azure App Service platform
- **HTTPS enforced** — `httpsOnly: true` in ARM template
- **TLS 1.2 minimum** — `minTlsVersion: "1.2"` in site config
- **FTP disabled** — `ftpsState: "Disabled"` in site config

### Template Validation

```bash
# Install arm-ttk (PowerShell)
Install-Module -Name arm-ttk -Force

# Run validation
Test-AzTemplate -TemplatePath infra/mainTemplate.json

# Test createUiDefinition in portal sandbox
# https://portal.azure.com/#blade/Microsoft_Azure_CreateUIDef/SandboxBlade
```

---

## See Also

- [Submission Checklist](submission-checklist.md) — live tracker of submission status
- [Marketplace Guide](marketplace.md) — listing content and pricing
- [ARM Template](arm-template.md) — template documentation
- [Authentication](authentication.md) — EasyAuth setup
