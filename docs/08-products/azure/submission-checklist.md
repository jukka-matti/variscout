# Azure Marketplace Submission Checklist

Living tracker for Azure Marketplace Managed Application submission. Single source of truth for what's done, what's pending, and what's blocking.

**Target offer type:** Azure Application → Managed Application
**Pricing:** Three plans: Standard €99/month, Team €199/month, Team AI €279/month

---

## 1. Partner Center Account

| Item                                                         | Status         | Notes                                    |
| ------------------------------------------------------------ | -------------- | ---------------------------------------- |
| Register at [Partner Center](https://partner.microsoft.com/) | ⬜ Not started | Need Microsoft account for RDMAIC Oy     |
| Complete publisher profile                                   | ⬜ Not started | Company name, logo, description          |
| Verify bank account for payouts                              | ⬜ Not started | Finnish IBAN, may take 2–5 business days |
| Accept Marketplace Publisher Agreement                       | ⬜ Not started | Legal review before accepting            |
| Accept Microsoft App Certification Policies                  | ⬜ Not started |                                          |

---

## 2. Technical Package

| Item                              | Status                  | Notes                                                                                                     |
| --------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `mainTemplate.json` written       | ✅ Done                 | `infra/mainTemplate.json` — App Service + EasyAuth, customer-provided App Registration                    |
| `createUiDefinition.json` written | ✅ Done                 | `infra/createUiDefinition.json` — portal wizard with Authentication step (clientId + clientSecret)        |
| ARM TTK validation passes         | ⚠️ Manual review passed | `apiVersion` updated to `2025-01-01` (valid until Jan 2028); automated `Test-AzTemplate` needs PowerShell |
| CUID tracking                     | ✅ Auto-injected        | Partner Center auto-injects tracking ID at publish time (no nested deployments)                           |
| Package URL parameterized         | ✅ Done                 | `packageUrl` parameter with default — satisfies arm-ttk no-hardcoded-URI rule                             |
| createUiDefinition sandbox test   | ⬜ Not tested           | Test at `https://portal.azure.com/#blade/Microsoft_Azure_CreateUIDef/SandboxBlade`                        |
| Package `.zip` created            | ⬜ Not done             | Zip `mainTemplate.json` + `createUiDefinition.json` → `variscout-managed-app.zip`                         |
| Publisher management disabled     | ✅ Done                 | ARM template sets no publisher access to managed RG                                                       |
| Customer access enabled           | ✅ Done                 | Full customer control over deployed resources                                                             |

---

## 3. Build Hosting

The ARM template uses `WEBSITE_RUN_FROM_PACKAGE` to deploy the app as a static zip. The zip URL must be publicly accessible at deployment time.

| Item                                    | Status      | Notes                                                             |
| --------------------------------------- | ----------- | ----------------------------------------------------------------- |
| Azure Storage account created           | ⬜ Not done | For hosting the app build `.zip`                                  |
| Blob container with public read access  | ⬜ Not done | Or use SAS token URL                                              |
| Production build uploaded               | ⬜ Not done | `pnpm --filter @variscout/azure-app build` → zip `dist/` → upload |
| `WEBSITE_RUN_FROM_PACKAGE` URL verified | ⬜ Not done | Confirm URL downloads correctly                                   |
| URL referenced in ARM template          | ⬜ Not done | Update `packageUrl` in `mainTemplate.json`                        |

---

## 4. Legal

| Item                                  | Status                | Notes                                                                      |
| ------------------------------------- | --------------------- | -------------------------------------------------------------------------- |
| Privacy policy page live              | ✅ Done               | `apps/website/src/pages/legal/privacy.astro` → variscout.com/legal/privacy |
| Terms of use page live                | ✅ Done               | `apps/website/src/pages/legal/terms.astro` → variscout.com/legal/terms     |
| Support contact defined               | ✅ Done               | hello@variscout.com                                                        |
| RDMAIC Oy company details on pages    | ✅ Done               | Helsinki, Finland on both pages                                            |
| Privacy policy URL accessible (HTTPS) | ⬜ Needs verification | Confirm live URL returns 200                                               |
| Terms URL accessible (HTTPS)          | ⬜ Needs verification | Confirm live URL returns 200                                               |

---

## 5. Listing Content

| Item                                 | Status         | Notes                                                                             |
| ------------------------------------ | -------------- | --------------------------------------------------------------------------------- |
| Offer name                           | ✅ Draft ready | "VariScout - Statistical Process Control for Quality Teams"                       |
| Short description (≤100 chars)       | ✅ Draft ready | See `marketplace.md`                                                              |
| Long description (≤3000 chars)       | ✅ Draft ready | See `marketplace.md` — review before submission                                   |
| Logo (216×216 PNG)                   | ⬜ Not done    | Required for Partner Center listing                                               |
| Logo (48×48 PNG)                     | ⬜ Not done    | Small icon for search results                                                     |
| Screenshots (5–10, min 1280×720 PNG) | ⬜ Not done    | Performance Dashboard, I-Chart, Capability, Boxplot, Pareto, Drill-Down, OneDrive |
| Video (optional)                     | ⬜ Not started | 2–3 min product overview recommended                                              |
| Categories selected                  | ⬜ Not done    | Analytics, Business Intelligence, or IT & Management Tools                        |
| Search keywords                      | ⬜ Not done    | SPC, quality control, statistical process control, Cpk, variation                 |

---

## 6. App Readiness

| Item                                  | Status                | Notes                                                               |
| ------------------------------------- | --------------------- | ------------------------------------------------------------------- |
| EasyAuth login works                  | ✅ Done               | `apps/azure/src/auth/easyAuth.ts` — tested locally with mock        |
| OneDrive save/load works              | ✅ Done               | `apps/azure/src/services/storage.ts` — Graph API via EasyAuth token |
| All chart types render                | ✅ Done               | I-Chart, Boxplot, Pareto, Capability, Performance charts            |
| Performance Mode works                | ✅ Done               | Multi-channel Cpk analysis                                          |
| CSV/Excel file upload works           | ✅ Done               | Parser in `@variscout/core`                                         |
| CSV export works                      | ✅ Done               | `downloadCSV` in `@variscout/core`                                  |
| Theme switching works                 | ✅ Done               | Light/dark/system via ThemeContext                                  |
| Sample datasets load                  | ✅ Done               | Via `@variscout/data` package                                       |
| Manual data entry works               | ✅ Done               | ManualEntryBase from `@variscout/ui`                                |
| Production build succeeds             | ✅ Done               | `pnpm --filter @variscout/azure-app build`                          |
| No console errors in production build | ⬜ Needs verification | Run build and check browser console                                 |
| `npm audit` clean                     | ⬜ Needs verification | No high/critical vulnerabilities in production dependencies         |
| CSP headers verified                  | ⬜ Needs verification | Content Security Policy appropriate for SPA + Graph API calls       |

---

## 7. Deployment Validation

| Item                                      | Status      | Notes                                              |
| ----------------------------------------- | ----------- | -------------------------------------------------- |
| Deploy ARM template to fresh subscription | ⬜ Not done | End-to-end test in clean Azure environment         |
| App loads after deployment                | ⬜ Not done | Verify `WEBSITE_RUN_FROM_PACKAGE` serves the app   |
| EasyAuth redirects to Azure AD login      | ⬜ Not done | Verify unauthenticated → login flow                |
| Post-login app is fully functional        | ⬜ Not done | Upload data, view charts, save to OneDrive         |
| OneDrive sync works post-deployment       | ⬜ Not done | Save analysis, close, reopen, verify data persists |
| createUiDefinition renders in portal      | ⬜ Not done | Test via sandbox blade                             |
| Deployment completes in <10 minutes       | ⬜ Not done | Microsoft may flag slow deployments                |

---

## 8. Post-Submission

| Item                  | Timeline  | Notes                                                              |
| --------------------- | --------- | ------------------------------------------------------------------ |
| Automated validation  | Day 1–2   | arm-ttk, CUID injection, package structure, JSON schema            |
| Content review        | Day 2–5   | Listing text, pricing, policies, screenshots (manual)              |
| Security scan         | Day 3–7   | Malware scan, network monitoring, dependency vulnerabilities       |
| Functionality test    | Day 5–10  | Microsoft deploys via marketplace flow, verifies app loads + works |
| Go-live (if approved) | Day 10–14 | Offer visible in Azure Marketplace                                 |

### Common Rejection Fixes

| Issue                             | Fix                                                     |
| --------------------------------- | ------------------------------------------------------- |
| Invalid ARM template              | Run `arm-ttk` validation, fix all warnings              |
| `apiVersion` too old              | Must be ≤24 months old; currently `2025-01-01`          |
| Hardcoded URIs in template        | Use parameters with defaults (done for `packageUrl`)    |
| CUID tracking missing             | Auto-injected by Partner Center — no manual action      |
| Invalid createUiDefinition        | Test in sandbox, ensure all controls render             |
| Missing/broken privacy policy URL | Verify HTTPS URL returns 200                            |
| Screenshot quality too low        | Minimum 1280×720, PNG format, no browser chrome         |
| Description too short or vague    | Expand feature descriptions, add use cases              |
| Support contact incomplete        | Add email and response-time commitment (24h)            |
| npm vulnerabilities               | Run `npm audit` and resolve high/critical before submit |

---

## Quick Reference

```bash
# Validate ARM template (requires arm-ttk)
Test-AzTemplate -TemplatePath infra/mainTemplate.json

# Test createUiDefinition in Azure portal sandbox
# https://portal.azure.com/#blade/Microsoft_Azure_CreateUIDef/SandboxBlade

# Build Azure app for production
pnpm --filter @variscout/azure-app build

# Create deployment package
cd infra && zip variscout-managed-app.zip mainTemplate.json createUiDefinition.json

# Run all tests before submission
pnpm test
```

---

## See Also

- [Certification Guide](certification-guide.md) — what Microsoft evaluates during review (3-layer breakdown)
- [Marketplace Guide](marketplace.md) — offer type, pricing, listing content
- [ARM Template](arm-template.md) — full template documentation
- [Authentication](authentication.md) — EasyAuth setup and configuration
- [OneDrive Sync](onedrive-sync.md) — storage integration details
- [ADR-007](../../07-decisions/adr-007-azure-marketplace-distribution.md) — distribution strategy decision
