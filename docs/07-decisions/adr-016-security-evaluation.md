# ADR-016 Security Evaluation: Teams Integration

**Status**: Draft

**Date**: 2026-02-27

**Related**: [ADR-016](adr-016-teams-integration.md) (Teams Integration), [ADR-007](adr-007-azure-marketplace-distribution.md) (Marketplace Distribution), [ADR-015](adr-015-investigation-board.md) (Investigation Board)

**Scope**: Security evaluation of the proposed Teams integration design from three external perspectives: Microsoft certification, enterprise IT procurement, and a Finnish manufacturer buyer.

---

## 1. Executive Summary

VariScout is a client-side statistical process control tool deployed as an Azure Managed Application to the customer's own tenant. There is no publisher-operated backend — all statistical computation runs in the browser, data is stored in the customer's OneDrive/IndexedDB, and the publisher has zero access to customer resources. ADR-016 proposes adding Microsoft Teams integration, which escalates Graph API permissions from `User.Read` + `Files.ReadWrite` to include `Files.ReadWrite.All` and `Channel.ReadBasic.All`, adds a ~50-line Azure Function for OBO token exchange, and introduces photo uploads to channel SharePoint storage.

### Key Security Claims

| #   | Claim                                                | Evidence                                                                                                   | File Reference                                                                         |
| --- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | Publisher has zero access to customer resources      | `publisherManagement` disabled in ARM template, immutable after publishing                                 | `infra/mainTemplate.json` (no publisher authorization block)                           |
| 2   | Data never leaves the customer's Azure tenant        | Graph API calls go to `graph.microsoft.com/v1.0/me/drive/` — customer's own OneDrive/SharePoint            | `apps/azure/src/services/storage.ts:104,108`                                           |
| 3   | Authentication is platform-managed, not custom       | EasyAuth (`authsettingsV2`) handles all auth; app code only reads `/.auth/me`                              | `infra/mainTemplate.json:93-127`, `apps/azure/src/auth/easyAuth.ts`                    |
| 4   | Secrets use ARM `secureString`, CI uses OIDC         | `clientSecret` parameter is `secureString`; GitHub Actions uses federated identity (no stored credentials) | `infra/mainTemplate.json:31-35`, `.github/workflows/deploy-azure-staging.yml:13,46-49` |
| 5   | Storage model is strictly additive (no DELETE calls) | `storage.ts` contains only `PUT` (save) and `GET` (load/list) Graph API calls; no `DELETE` endpoint        | `apps/azure/src/services/storage.ts:172-264`                                           |

### Verdict by Perspective

- **Microsoft**: Should pass certification. Scope escalation is a standard pattern for Teams apps; requires clear justification during review.
- **Enterprise IT**: Strong data sovereignty story. Gaps in security headers and incident response process should be closed before marketplace submission.
- **Finnish manufacturer**: Likely to approve with a clear admin consent guide and Finnish-language privacy notice. Data-stays-in-your-tenant is the decisive factor.

---

## 2. Security Baseline (Pre-Teams)

What's already in place, verified against the codebase:

| Area              | Detail                                                                       | Reference                                                                             |
| ----------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Authentication    | EasyAuth platform-managed (Azure AD), `User.Read` + `Files.ReadWrite` scopes | `infra/mainTemplate.json:96-125`, `apps/azure/src/auth/easyAuth.ts`                   |
| Transport         | HTTPS-only (`httpsOnly: true`), TLS 1.2+ (`minTlsVersion: "1.2"`)            | `infra/mainTemplate.json:70,88`                                                       |
| FTP               | Disabled (`ftpsState: "Disabled"`)                                           | `infra/mainTemplate.json:89`                                                          |
| Secrets in ARM    | `clientSecret` uses `secureString` parameter type                            | `infra/mainTemplate.json:31-35`                                                       |
| CI/CD credentials | OIDC federated identity — no stored secrets for Azure login                  | `.github/workflows/deploy-azure-staging.yml:13,46-49`                                 |
| Data sovereignty  | Deployed to customer's managed RG; publisher has zero access                 | `infra/mainTemplate.json` (no publisher authorization)                                |
| Client storage    | IndexedDB via Dexie (browser sandbox), offline-first with cloud sync         | `apps/azure/src/services/storage.ts`                                                  |
| Token management  | Proactive refresh (5-minute window), error classification with retry backoff | `apps/azure/src/auth/easyAuth.ts:96-134`, `apps/azure/src/services/storage.ts:70-100` |
| Health endpoint   | Excluded from auth (`excludedPaths: ["/health"]`) — no data exposure         | `infra/mainTemplate.json:106`                                                         |
| Telemetry         | None — no analytics, no tracking, no outbound calls except Graph API         | Entire codebase                                                                       |

### Known Gaps

| Gap                              | Severity | Detail                                                                                                           |
| -------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| No Content Security Policy (CSP) | Medium   | `server.js` sets no CSP header; XSS protection relies on React's built-in escaping only                          |
| No security headers              | Medium   | No `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, or `Referrer-Policy` in `server.js` |
| No Key Vault integration         | Low      | `clientSecret` stored as App Service app setting (encrypted at rest by platform, but not in Key Vault)           |
| No managed identity              | Low      | App Service uses client secret for auth, not managed identity                                                    |
| No SECURITY.md                   | Medium   | No vulnerability disclosure policy, no security contact                                                          |
| IndexedDB unencrypted            | Low      | Browser-managed encryption; data at rest not application-encrypted (standard for web apps)                       |
| No `pnpm audit` in CI            | Medium   | Dependency vulnerabilities not automatically caught in pipeline                                                  |
| No SBOM generation               | Low      | No Software Bill of Materials for supply chain transparency                                                      |

---

## 3. Teams Integration Security Delta

What ADR-016 adds to the attack surface:

### New Permission Scopes

| Scope                   | Type      | Consent   | Current | With Teams |
| ----------------------- | --------- | --------- | ------- | ---------- |
| `User.Read`             | Delegated | User      | Yes     | Yes        |
| `Files.ReadWrite`       | Delegated | User      | Yes     | Yes        |
| `Files.ReadWrite.All`   | Delegated | **Admin** | No      | **Yes**    |
| `Channel.ReadBasic.All` | Delegated | **Admin** | No      | **Yes**    |

`Files.ReadWrite.All` (delegated) does NOT grant access to all files in the organization. It allows the app to access files the signed-in user already has access to. The "All" means "all file locations" (OneDrive + SharePoint), not "all users' files." Per-channel scoping is enforced by Teams membership — the natural access control.

### New Runtime Dependency

`@microsoft/teams-js` (~40KB gzipped) — maintained by Microsoft, published on npm. Single purpose: detect Teams context and enable SSO. No server-side component.

### New Infrastructure (Phase 6)

Azure Function for On-Behalf-Of (OBO) token exchange:

- ~50 lines, stateless, single-purpose
- Exchanges Teams SSO token for Graph API access token
- Deployed via ARM template alongside App Service
- Fallback: EasyAuth redirect if OBO exchange fails

### New Data Flows

| Flow                  | Direction  | Data                   | Storage Location                            |
| --------------------- | ---------- | ---------------------- | ------------------------------------------- |
| Channel project files | Read/Write | `.vrs` JSON files      | Channel SharePoint document library         |
| Photo upload          | Write-only | JPEG images            | Channel SharePoint (`Photos/{analysisId}/`) |
| Photo thumbnails      | Embedded   | ~50KB base64 per photo | Inside `.vrs` file (for cross-user preview) |
| Channel listing       | Read-only  | Channel names + IDs    | Not stored (runtime only)                   |

### New Client-Side Processing

- Two-layer EXIF/GPS metadata stripping before upload: canvas re-encode + explicit byte-level `stripExifFromBlob` (removes all APP1 markers from JPEG binary)
- Base64 thumbnail generation (~50KB per photo)
- Optimistic merge for concurrent `.vrs` edits (conflict detection via `eTag`)

### Strongest Security Property

**Additive-only storage model**: No `DELETE` calls to Graph API. Conflicts create copies (`"(conflict copy).vrs"`). Photos are immutable once uploaded. This is auditable — IT admins can verify the app contains no `DELETE /drive/items/{id}` calls.

---

## 4. Perspective: Microsoft

### 4.1 Marketplace Certification Impact

ADR-016 does not change the Managed Application certification flow documented in [`certification-guide.md`](../08-products/azure/certification-guide.md). The Standard plan ships first (no new scopes, no Teams). The Team plan adds:

| Certification Layer            | Impact   | Assessment                                                  |
| ------------------------------ | -------- | ----------------------------------------------------------- |
| Layer 1: Publisher eligibility | None     | Same publisher account                                      |
| Layer 2: Content validation    | Minor    | Updated listing text, new screenshots for Teams features    |
| Layer 3: Technical validation  | Moderate | New ARM resources (Azure Function), scope escalation review |

The Azure Function adds a new ARM resource (`Microsoft.Web/sites` with Functions runtime) to `mainTemplate.json`. This is a standard pattern and should pass arm-ttk validation.

### 4.2 Teams App Store (If Submitted)

If VariScout is submitted to the Teams App Store (separate from Azure Marketplace):

| Requirement               | Status    | Notes                                                        |
| ------------------------- | --------- | ------------------------------------------------------------ |
| Publisher Verification    | Required  | Verify Entra ID (RDMAIC Oy) via Partner Center               |
| Publisher Attestation     | Required  | Self-reported security practices questionnaire               |
| M365 App Certification    | Optional  | Paid, SOC 2 equivalent — consider for enterprise credibility |
| SSO requirement           | Satisfied | OBO flow provides silent SSO in Teams context                |
| Permissions justification | Required  | Each Graph scope must have documented business justification |

Publisher Verification is a one-time process (~2 weeks) linking the Entra ID tenant to the Partner Center account. This is a prerequisite for any Teams app published to the store.

### 4.3 Graph API Permission Review

Microsoft reviews Graph API permission requests during Teams App Store certification. Key justifications:

| Scope                   | Justification                                                                       | Why Not Narrower?                                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Files.ReadWrite.All`   | Read/write `.vrs` project files and photos in channel SharePoint document libraries | `Files.ReadWrite` only covers personal OneDrive; channel SharePoint requires `.All`. `Sites.ReadWrite.All` would be broader (includes all SharePoint sites). |
| `Channel.ReadBasic.All` | List channels the user belongs to for storage location selection                    | Minimum scope for channel enumeration. Does not read channel messages.                                                                                       |

**Why delegated, not application**: Application permissions would allow access without a signed-in user — inappropriate for an interactive analysis tool. Delegated permissions are scoped to the signed-in user's own access.

**No-delete commitment**: `Files.ReadWrite.All` technically includes delete capability, but VariScout never exercises it. Microsoft cannot enforce this at the scope level (no write-without-delete scope exists), but the app's codebase is auditable. The storage model is documented as strictly additive in ADR-016.

### 4.4 Microsoft Security Baseline Assessment

| Area       | Rating | Detail                                                                                                                                 |
| ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Identity   | GREEN  | EasyAuth (platform-managed) + OBO flow (standard Microsoft pattern)                                                                    |
| Data       | GREEN  | Customer tenant isolation, publisher zero access, delegated-only permissions                                                           |
| Network    | AMBER  | No VNet integration, no WAF. Acceptable for SPA — no server-side data processing to protect. App Service has built-in DDoS protection. |
| Monitoring | AMBER  | No App Insights by default. Customer can add it to their managed RG. Recommend documenting how in admin guide.                         |
| Secrets    | GREEN  | ARM `secureString` for client secret; OIDC for CI/CD (no stored credentials)                                                           |
| Transport  | GREEN  | HTTPS-only, TLS 1.2+, FTP disabled                                                                                                     |

---

## 5. Perspective: Enterprise IT & Procurement

### 5.1 Security Questionnaire Answers

Common security questionnaire sections mapped to VariScout's architecture:

| Question Area                                   | Answer Pattern                                                                                                                                                                                           |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Where is data stored?**                       | In your own Azure tenant (OneDrive/SharePoint/IndexedDB). The publisher has zero access to your resources. We are not a sub-processor — your data never transits our systems.                            |
| **What data do you collect?**                   | None. No telemetry, no analytics, no usage tracking. The app makes no outbound calls except to Microsoft Graph API (your own tenant).                                                                    |
| **How is data encrypted?**                      | In transit: TLS 1.2+ (HTTPS-only). At rest: Azure Storage encryption (platform-managed, your tenant). IndexedDB: browser-managed encryption.                                                             |
| **What is your authentication model?**          | Azure AD via EasyAuth (platform-managed by App Service). No custom auth code, no password storage, no session tokens in cookies.                                                                         |
| **Do you have access to our data?**             | No. Publisher management is disabled in the Managed Application. This setting is immutable after marketplace publication.                                                                                |
| **What permissions does the app require?**      | Standard plan: `User.Read`, `Files.ReadWrite` (personal OneDrive). Team plan adds: `Files.ReadWrite.All` (delegated, admin consent — for channel SharePoint), `Channel.ReadBasic.All` (channel listing). |
| **Do you have a SOC 2 report?**                 | No formal audit. Architecture makes many SOC 2 controls not applicable (no multi-tenant backend, no data processing, no access to customer data).                                                        |
| **How do you handle incidents?**                | Gap — no formal incident response process. See hardening checklist (Section 8).                                                                                                                          |
| **What is your dependency management process?** | Gap — no automated `pnpm audit` in CI pipeline. See hardening checklist.                                                                                                                                 |

### 5.2 Compliance Posture

| Framework        | Assessment                                                                                                                                                                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SOC 2**        | Architecture is inherently strong (no multi-tenant infrastructure to audit). No formal SOC 2 report — expensive for a small publisher and less meaningful when the publisher has no access to customer data. Consider Publisher Attestation (Teams App Store) as a lighter-weight alternative. |
| **ISO 27001**    | Many controls are N/A (no backend infrastructure, no data centers, no HR security for backend operators). The relevant controls (access management, cryptography, supplier relationships) are satisfied by the Azure platform.                                                                 |
| **GDPR Art. 28** | VariScout is NOT a data processor. It is software deployed to the customer's own tenant — analogous to installing an application on your own server. No Data Processing Agreement (DPA) is legally required, though a DPA template may reduce procurement friction.                            |
| **Zero Trust**   | Verify explicitly: Entra ID authentication on every request (EasyAuth). Least privilege: delegated permissions only, scoped to signed-in user. Assume breach: no server state to compromise, no stored credentials in the app.                                                                 |

### 5.3 Supply Chain & Incident Response

**Runtime dependencies** (direct, across all packages):

| Category                  | Count   | Examples                                         |
| ------------------------- | ------- | ------------------------------------------------ |
| Microsoft/Visx (charting) | 9       | `@visx/axis`, `@visx/scale`, `@visx/shape`, etc. |
| D3 ecosystem              | 2       | `d3-array`, `d3`                                 |
| Data handling             | 3       | `papaparse`, `exceljs`, `dexie`                  |
| React ecosystem           | 3       | `react`, `react-dom`, `lucide-react`             |
| Utilities                 | 3       | `html-to-image`, `jszip`, `tailwindcss-animate`  |
| **Total direct runtime**  | **~20** | No backend dependencies                          |

Teams integration adds 1 dependency: `@microsoft/teams-js` (Microsoft-maintained).

**Gaps:**

| Gap                   | Impact                    | Recommendation                                                 |
| --------------------- | ------------------------- | -------------------------------------------------------------- |
| No SBOM               | Supply chain transparency | Generate CycloneDX SBOM in CI, include in release artifacts    |
| No `pnpm audit` in CI | Vulnerability detection   | Add `pnpm audit --audit-level=high` step to deploy workflow    |
| No SECURITY.md        | Vulnerability disclosure  | Create SECURITY.md with disclosure policy and security contact |
| No security@ contact  | Incident communication    | Establish security@variscout.com before marketplace submission |

---

## 6. Perspective: Finnish Manufacturer

### 6.1 Who Is This Buyer?

A €5M revenue Finnish manufacturer with ~200 employees. They have M365 E3 or E5 licenses, Entra ID for identity, and 1–3 IT staff who manage network, endpoints, M365, and security. The quality manager found VariScout through the free PWA and wants the team version. €99–299/month is a real budget line item that goes through procurement.

### 6.2 The Admin Consent Conversation

The quality manager asks IT to approve the app. Here's what happens:

**Standard plan (€99/month)**: No admin consent needed. `User.Read` and `Files.ReadWrite` are user-consentable. IT may still want to review the app registration, but there's no blocker.

**Team plan (€299/month)**: IT admin must grant tenant-wide consent for `Files.ReadWrite.All`. The admin sees a consent screen listing the permission. What they need to understand:

- **"Access files that user has access to"** — the app cannot access files the user couldn't already access. It's _delegated_, not _application_.
- **"All" means all locations** — OneDrive + SharePoint, not "all users' files."
- **No delete in practice** — the app only creates and updates files. The codebase contains no DELETE calls. IT can verify this.
- **Conditional Access applies** — existing policies (managed devices, MFA, geographic restrictions) are enforced on VariScout like any other Entra ID app.

**Recommendation**: Create a one-page "IT Admin Guide" with the consent screen explained in plain language. Include a screenshot of the exact consent dialog. Provide it in Finnish and English.

### 6.3 Data Sensitivity

Quality data can be commercially sensitive:

| Data Type                                     | Sensitivity                                 | Mitigation                                                                                                 |
| --------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Process parameters (fill weights, tolerances) | Trade secrets                               | Data stays in company's own tenant. Publisher has zero access.                                             |
| Specification limits (USL/LSL)                | Competitive intelligence                    | Stored in `.vrs` files in company's own OneDrive/SharePoint                                                |
| Shop floor photos                             | May show equipment, products, personnel     | EXIF/GPS stripping before upload. Photos stored in channel SharePoint — subject to company's DLP policies. |
| Base64 photo thumbnails in `.vrs`             | Low-res previews visible to channel members | Subject to SharePoint access control + company's DLP policies                                              |
| Analysis findings and comments                | Investigation notes, potentially sensitive  | Author + timestamp audit trail. Stored in company's own tenant.                                            |

**Key message**: VariScout does not introduce a new data sovereignty risk. The data was already in the company's M365 tenant (or would be, in spreadsheets and emails). VariScout structures it in a purpose-built format within the same tenant boundary.

### 6.4 Shop Floor Reality

| Concern                               | How VariScout Addresses It                                                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Shared/BYOD devices on the shop floor | Entra ID authentication on every session. No persistent local credentials. Conditional Access can restrict to managed devices. |
| Poor factory WiFi                     | Offline-first: IndexedDB saves locally, syncs when connected. Sync queue with exponential backoff.                             |
| Teams mobile sidebar                  | One-tap access from Teams app. HTML5 camera capture (no native app install).                                                   |
| Multiple operators using one terminal | Each operator signs in with their own Entra ID. Author field on findings provides clear attribution.                           |
| Language                              | App UI in English. Quality terminology (Cpk, SPC) is international. Privacy notice should be in Finnish (GDPR good practice).  |

### 6.5 Trust Decision

**What makes them say YES:**

- Data stays in their own Azure tenant — verifiable by IT admin
- Microsoft billing (shows up on existing Azure invoice, procurement-friendly)
- Standard Entra ID authentication — no new identity system
- Clear admin consent guide in Finnish
- Free PWA trial first — they've already used the methodology
- Publisher has zero access — immutable setting, verifiable in Azure portal
- Conditional Access and DLP policies apply normally

**What makes them say NO:**

- Unclear permission justification (why does a chart tool need `Files.ReadWrite.All`?)
- No incident response contact or process
- No Finnish-language privacy notice
- No evaluation/trial period for the paid plan
- Unknown publisher (RDMAIC Oy) with no track record
- No reference customers in Finnish manufacturing

**Recommendation**: Address the "NO" factors before launching the Team plan. A 30-day free trial in Azure Marketplace removes the biggest purchase friction for new customers.

### 6.6 Finnish/EU Regulatory Context

| Regulation         | Applicability                                                                                                                                                                                                                                       | Notes                                                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **GDPR**           | VariScout is NOT a data processor (Art. 28). It is software deployed to the customer's own tenant. The customer is the data controller; VariScout is a software tool, not a service that processes personal data on behalf of the customer.         | A DPA template reduces procurement friction even though it's technically unnecessary.                                         |
| **NIS2**           | Likely N/A for a €5M, 200-person manufacturer unless they're in a critical sector (energy, transport, health, water, digital infrastructure, food).                                                                                                 | If the customer is in scope, VariScout's architecture (no backend, customer-controlled) minimizes supply chain risk concerns. |
| **EU AI Act**      | N/A — VariScout performs statistical calculations, not AI inference. No machine learning models, no automated decision-making.                                                                                                                      | Clear differentiation if asked.                                                                                               |
| **21 CFR Part 11** | If the customer is in pharma/medical devices: author field + timestamp + photo immutability provides a foundation for electronic records compliance. Not a formal Part 11 validation — customer would need to validate in their own quality system. | Consider a compliance alignment statement for regulated industries.                                                           |

---

## 7. Consolidated Risk Matrix

| #   | Area                                   | Microsoft | Enterprise IT | Finnish Mfr | Severity | Mitigation                                                                                                                                                                                              | Timeline          |
| --- | -------------------------------------- | --------- | ------------- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| 1   | Missing CSP header                     | AMBER     | AMBER         | LOW         | Medium   | Add `Content-Security-Policy` to `server.js` responses. Allow `self`, Graph API, and blob: for chart exports.                                                                                           | Before submission |
| 2   | Missing security headers               | AMBER     | AMBER         | LOW         | Medium   | Add `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` to `server.js`.                                         | Before submission |
| 3   | `Files.ReadWrite.All` scope            | GREEN     | AMBER         | AMBER       | Medium   | Document justification (channel SharePoint requires `.All`). Create admin consent guide with consent screen screenshot. Explain delegated vs application.                                               | Before Team plan  |
| 4   | IndexedDB unencrypted                  | GREEN     | LOW           | LOW         | Low      | Standard for web apps. Browser manages storage isolation. Document in security FAQ.                                                                                                                     | Ongoing           |
| 5   | No Key Vault for client secret         | LOW       | AMBER         | LOW         | Low      | App setting is encrypted at rest by App Service platform. Key Vault is a best practice but not required. Document as optional hardening step for security-conscious customers.                          | Ongoing           |
| 6   | EXIF/GPS stripping                     | GREEN     | GREEN         | GREEN       | Medium   | Done. Two-layer approach: canvas re-encode + byte-level `stripExifFromBlob` that parses JPEG binary and removes all APP1 markers. 23 unit tests verify GPS, camera model, and orientation are stripped. | Done              |
| 7   | OBO Azure Function                     | GREEN     | AMBER         | LOW         | Low      | ~50 lines, stateless, single-purpose. Standard Microsoft pattern. Include in ARM template. Ensure function has no storage bindings, no persistent state.                                                | Before Team plan  |
| 8   | No incident response process           | AMBER     | RED           | AMBER       | High     | Create SECURITY.md with disclosure policy. Establish security@variscout.com. Define response timeline (acknowledge <48h, triage <7 days).                                                               | Before submission |
| 9   | No SBOM                                | LOW       | AMBER         | LOW         | Low      | Generate CycloneDX SBOM in CI pipeline. Include in release artifacts.                                                                                                                                   | Before submission |
| 10  | No `pnpm audit` in CI                  | AMBER     | AMBER         | LOW         | Medium   | Add `pnpm audit --audit-level=high` to deploy workflow. Fail the build on high/critical vulnerabilities.                                                                                                | Before submission |
| 11  | No admin consent documentation         | GREEN     | AMBER         | RED         | High     | Create one-page admin guide with consent screen screenshot. Translate to Finnish. Include in onboarding materials.                                                                                      | Before Team plan  |
| 12  | Conflict resolution (concurrent edits) | GREEN     | LOW           | AMBER       | Medium   | Optimistic merge for additive operations. Unresolvable conflicts create copies (zero data loss). Document behavior in user guide.                                                                       | Before Team plan  |

---

## 8. Pre-Submission Hardening Checklist

### Tier 1: Before Marketplace Submission (Standard Plan)

These items should be completed before submitting the Standard plan to Azure Marketplace:

- [ ] **Security headers in `server.js`** — Add CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- [ ] **SECURITY.md** — Vulnerability disclosure policy with security@ contact and response timeline
- [ ] **`pnpm audit` in CI** — Add to `.github/workflows/deploy-azure-staging.yml`, fail on high/critical
- [ ] **security@variscout.com** — Establish email address and forwarding
- [ ] **Dependency review** — Run `pnpm audit`, resolve any high/critical findings
- [ ] **No console errors in production build** — Verify browser console is clean (submission-checklist.md item)
- [ ] **CSP headers verified** — Confirm SPA + Graph API calls work with CSP policy (submission-checklist.md item)

### Tier 2: Before Team Plan Launch

These items are required for the Teams-integrated Team plan:

- [ ] **Admin consent guide** — One-page document explaining each permission scope in plain language. Finnish + English.
- [ ] **Publisher Verification** — Complete Entra ID verification for RDMAIC Oy via Partner Center (~2 weeks)
- [ ] **DPA template** — Draft Data Processing Agreement template even though technically unnecessary (reduces procurement friction)
- [ ] **Finnish privacy notice** — Translate privacy policy to Finnish (GDPR good practice)
- [x] **EXIF stripping implementation** — Two-layer: canvas re-encode + byte-level `stripExifFromBlob` (APP1 marker removal). 23 unit tests verify GPS, camera model, and orientation stripped.
- [ ] **Photo immutability enforcement** — Verify no update/delete paths for uploaded photos in storage layer
- [ ] **OBO function security review** — Verify stateless, no storage bindings, minimal permissions
- [ ] **Conflict resolution testing** — Test concurrent edit scenarios, verify conflict copy creation
- [ ] **SBOM generation** — CycloneDX SBOM in CI, included in release artifacts
- [ ] **Publisher Attestation** — Complete self-reported security practices for Teams App Store

### Tier 3: Ongoing

- [ ] **Monthly dependency audit** — `pnpm audit` on a schedule, triage and patch
- [ ] **Annual security review** — Re-evaluate this document against current codebase and threat landscape
- [ ] **Permission scope review** — Verify no scope creep in ARM template or EasyAuth configuration
- [ ] **Customer feedback loop** — Track security-related questions from buyers, update FAQ and admin guide

---

## Appendices

### A. Permission Scope Reference

Complete Graph API permissions used by VariScout, current and proposed:

| Scope                   | Type           | Consent   | Plan | Justification                                                                                                          |
| ----------------------- | -------------- | --------- | ---- | ---------------------------------------------------------------------------------------------------------------------- |
| `openid`                | OpenID Connect | User      | Both | Standard OIDC — authentication                                                                                         |
| `profile`               | OpenID Connect | User      | Both | Display name for author field                                                                                          |
| `email`                 | OpenID Connect | User      | Both | User identification                                                                                                    |
| `User.Read`             | Delegated      | User      | Both | Read signed-in user's profile                                                                                          |
| `Files.ReadWrite`       | Delegated      | User      | Both | Read/write to user's personal OneDrive (`/me/drive/`)                                                                  |
| `Files.ReadWrite.All`   | Delegated      | **Admin** | Team | Read/write to channel SharePoint document libraries. Required because `Files.ReadWrite` only covers personal OneDrive. |
| `Channel.ReadBasic.All` | Delegated      | **Admin** | Team | List channels the user belongs to (for storage location picker). Does NOT read channel messages.                       |

**Not requested (and why):**

| Scope                               | Why Not                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `Sites.ReadWrite.All`               | Broader than needed. `Files.ReadWrite.All` with delegated consent is sufficient for channel file access.     |
| `Files.ReadWrite.All` (Application) | Application permissions bypass user context. VariScout is an interactive tool — always has a signed-in user. |
| `ChannelMessage.Read.All`           | VariScout does not read Teams messages. It only stores files in channel document libraries.                  |
| `Mail.Read` / `Mail.Send`           | No email functionality.                                                                                      |

### B. Data Flow Diagrams

#### Standard Plan (Browser Mode)

```
┌─────────────────────────────────────────────────────────┐
│  Customer's Browser                                     │
│  ┌────────────────────────────────────────────┐        │
│  │  VariScout SPA                             │        │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────┐  │        │
│  │  │ Analysis │  │  Charts  │  │ Findings│  │        │
│  │  │  Engine  │  │  (Visx)  │  │   Log   │  │        │
│  │  └────┬─────┘  └──────────┘  └─────────┘  │        │
│  │       │                                     │        │
│  │  ┌────▼─────────────────────────────────┐  │        │
│  │  │     IndexedDB (Dexie)                │  │        │
│  │  │     Local .vrs project storage       │  │        │
│  │  └────┬─────────────────────────────────┘  │        │
│  └───────┼────────────────────────────────────┘        │
│          │ Graph API (Files.ReadWrite)                  │
│          ▼                                              │
│  ┌───────────────────────────────────┐                 │
│  │  Customer's OneDrive              │                 │
│  │  /VariScout/Projects/*.vrs        │                 │
│  └───────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────┘
       ▲ EasyAuth (User.Read)
       │
┌──────┴──────────┐
│  Azure AD       │
│  (Customer's    │
│   Entra ID)     │
└─────────────────┘
```

#### Team Plan (Teams Mode)

```
┌──────────────────────────────────────────────────────────────┐
│  Teams WebView / Mobile                                      │
│  ┌────────────────────────────────────────────────┐         │
│  │  VariScout SPA + @microsoft/teams-js           │         │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │         │
│  │  │ Analysis │  │ Field    │  │ Photo        │ │         │
│  │  │  Engine  │  │ View     │  │ Capture      │ │         │
│  │  └────┬─────┘  └──────────┘  └──────┬───────┘ │         │
│  │       │                              │          │         │
│  │       │    ┌─────────────────────────┘          │         │
│  │       │    │ EXIF strip (canvas + byte-level)   │         │
│  │  ┌────▼────▼────────────────────────────────┐  │         │
│  │  │     IndexedDB (offline queue)            │  │         │
│  │  └────┬─────────────────────────────────────┘  │         │
│  └───────┼────────────────────────────────────────┘         │
│          │ Graph API (Files.ReadWrite.All)                   │
│          ▼                                                   │
│  ┌──────────────────────────────────────────┐               │
│  │  Customer's SharePoint / OneDrive        │               │
│  │  Channel Files/VariScout/Projects/*.vrs  │               │
│  │  Channel Files/VariScout/Photos/**/*.jpg │               │
│  └──────────────────────────────────────────┘               │
└──────────────────────────────────────────────────────────────┘
       ▲ Teams SSO → OBO (Azure Function)
       │
┌──────┴──────────┐     ┌──────────────────────┐
│  Azure AD       │     │  Azure Function       │
│  (Customer's    │◄────│  OBO token exchange   │
│   Entra ID)     │     │  (~50 lines,          │
└─────────────────┘     │   stateless)          │
                        └──────────────────────┘
```

#### Photo Capture Flow

```
Camera (HTML5)
    │
    ▼
Canvas re-encode + stripExifFromBlob ──── EXIF/GPS stripped (two layers)
    │
    ├── Base64 thumbnail (~50KB) → embedded in .vrs
    │
    └── Full-res JPEG → PUT to SharePoint
                          Channel Files/VariScout/Photos/{analysisId}/{findingId}/photo-001.jpg
                          │
                          └── Immutable (no update/delete API calls)
```

### C. GDPR Quick Reference

| GDPR Article                         | VariScout Response                                                                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Art. 5 (Principles)                  | Data minimization: only quality data the user explicitly inputs. Purpose limitation: statistical analysis only.                                     |
| Art. 6 (Lawful basis)                | Customer determines lawful basis. VariScout is a tool, not a controller or processor.                                                               |
| Art. 12–14 (Transparency)            | Privacy policy at variscout.com/legal/privacy describes the software's data handling.                                                               |
| Art. 17 (Right to erasure)           | Customer controls all data in their own tenant. Delete from OneDrive/SharePoint/IndexedDB at any time. Publisher has no access.                     |
| Art. 25 (Privacy by design)          | No telemetry, no tracking, offline-first, data in customer's tenant, publisher zero access.                                                         |
| Art. 28 (Processor)                  | NOT applicable. VariScout is deployed to the customer's own infrastructure. No data processing on behalf of the customer.                           |
| Art. 32 (Security)                   | TLS 1.2+, HTTPS-only, EasyAuth (platform-managed), Entra ID authentication.                                                                         |
| Art. 33–34 (Breach notification)     | Publisher has no access to customer data, so cannot experience a data breach involving customer data. Customer's own Azure tenant security applies. |
| Art. 44–49 (International transfers) | No transfers. Data stays in the customer's Azure region. Publisher has zero access.                                                                 |

---

## See Also

- [ADR-016: Teams Integration](adr-016-teams-integration.md) — the technical design being evaluated
- [ADR-007: Azure Marketplace Distribution](adr-007-azure-marketplace-distribution.md) — two-plan model (Standard + Team)
- [Certification Guide](../08-products/azure/certification-guide.md) — marketplace certification mechanics
- [Submission Checklist](../08-products/azure/submission-checklist.md) — submission readiness tracker
- [Authentication](../08-products/azure/authentication.md) — EasyAuth setup details
