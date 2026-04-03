---
title: 'Security Whitepaper'
audience: [procurement, infosec]
category: compliance
status: stable
date: 2026-04-03
---

# VariScout Security Whitepaper

For IT procurement and InfoSec teams evaluating VariScout.

**Version:** 1.0 | **Date:** April 2026 | **Classification:** Public

---

## Executive Summary

VariScout is a quality investigation tool deployed as an **Azure Managed Application** into the customer's own Azure subscription. Unlike traditional SaaS tools that share infrastructure across customers, every VariScout deployment is an isolated instance with zero shared infrastructure, no publisher access to customer resources, and browser-only data processing. All data — measurement values, investigation findings, and improvement records — stays within the customer's Azure tenant. When AI features are enabled, only computed summary statistics (never raw measurement values) are sent to Azure OpenAI services running within the customer's own subscription.

---

## 1. Architecture Overview

### Deployment Model

VariScout is deployed through the **Azure Marketplace** as a Managed Application. The deployment creates dedicated Azure resources within the customer's own subscription and resource group:

```
┌─────────────────────────────────────────────────┐
│  Customer's Azure Subscription                  │
│  Customer's Resource Group                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  App Service          Static SPA + Express      │
│  App Service Plan     Standard tier compute     │
│  Key Vault            Secrets (RBAC access)     │
│  Application Insights Telemetry (no PII)        │
│                                                 │
│  ── Standard Plan includes above ──             │
│                                                 │
│  Azure AI Foundry     AI models (optional)      │
│  Storage Account      Blob Storage (Team only)  │
│  Azure AI Search      Knowledge Base (Team only)│
│                                                 │
└─────────────────────────────────────────────────┘
```

### No Shared Infrastructure

| Aspect | Traditional Multi-Tenant SaaS | VariScout |
|---|---|---|
| Compute | Shared application servers | Customer's own App Service |
| Database | Shared database, row-level isolation | No database; browser IndexedDB or customer's Blob Storage |
| AI Services | Shared AI endpoint | Customer's own Azure OpenAI resource |
| Secrets | Vendor's key management | Customer's own Key Vault |
| Monitoring | Vendor's telemetry | Customer's own Application Insights |

### No Publisher Access

The ARM template does not include `publisherManagement` authorization. After deployment, the publisher (VariScout) has **zero access** to the customer's resources. The customer's IT team retains full control via standard Azure Portal and RBAC management.

### No Backend API

The Standard plan serves a static Single Page Application (SPA) via `WEBSITE_RUN_FROM_PACKAGE`. There is no server-side code execution, no API endpoints, and no database connections. All data processing — statistical calculations, chart rendering, data parsing — happens entirely in the user's browser.

The Team plan adds a minimal Express server with a single endpoint (`/api/storage-token`) for generating time-limited SAS tokens for Azure Blob Storage access. This endpoint validates the user's Entra ID session before issuing tokens.

---

## 2. Authentication & Authorization

### Azure AD via EasyAuth

VariScout uses **App Service Authentication (EasyAuth)** — a platform-level authentication feature managed by Azure. The application contains zero authentication code:

- **Platform-managed:** Azure handles the entire login flow before requests reach the application
- **Automatic redirect:** Unauthenticated users are redirected to Azure AD sign-in
- **Token store:** Session tokens are stored and managed by the platform
- **Periodic refresh:** Background token refresh every 45 minutes prevents session expiry

### Permission Scopes

**Both tiers require zero admin consent:**

| Permission | Type | Admin Consent | Purpose | Tier |
|---|---|---|---|---|
| `User.Read` | Delegated | **No** | Get user profile (name, email) | All |
| `People.Read` | Delegated | **No** | People picker for action assignment | Team |

Users grant consent on first login. No IT administrator action is required.

**Previous architecture context:** An earlier design (ADR-016) required 5 admin-consent Graph API scopes including `Files.ReadWrite.All` and `ChannelMessage.Send`. These were all removed in the web-first architecture redesign (ADR-059). Team-tier collaboration now uses Azure Blob Storage with Azure RBAC instead of Microsoft Graph API.

### AI Authentication (When Enabled)

When AI features are deployed, EasyAuth additionally requests the `https://cognitiveservices.azure.com/.default` scope. Users require the **Cognitive Services User** RBAC role on the Azure AI Services resource. No API keys are stored in client code — all AI authentication uses bearer tokens from the EasyAuth session.

### Optional Admin Role Gating

IT administrators can optionally restrict access to the Admin Hub by configuring a `VariScout.Admin` App Role in Entra ID. By default, all authenticated users can access all features.

---

## 3. Data Residency & Storage

### Standard Plan: Browser-Only

All data is stored in the browser's **IndexedDB**. No data is transmitted to any cloud service, no data leaves the user's machine, and no server-side storage exists. Users can export projects as JSON files for local backup.

### Team Plan: Customer's Blob Storage

Team plan projects are stored in **Azure Blob Storage** within the customer's own resource group:

```
Storage Account: variscout{uniquestring}
└── Container: variscout-projects
    ├── {projectId}/analysis.json      (100KB–5MB)
    ├── {projectId}/metadata.json      (<1KB)
    ├── {projectId}/knowledge-index.json (1MB–20MB)
    ├── {projectId}/photos/            (EXIF/GPS-stripped)
    ├── {projectId}/documents/         (reference docs)
    └── {projectId}/investigation/     (investigation artifacts)
```

### Browser-to-Storage Authentication

The browser never receives storage credentials. Instead:

1. Browser requests a SAS token from `/api/storage-token`
2. The endpoint validates the user's Entra ID session (EasyAuth)
3. The App Service's managed identity (with `Storage Blob Data Contributor` RBAC role) generates a container-scoped SAS token
4. The browser uses the SAS token for direct Blob Storage access

| SAS Token Control | Detail |
|---|---|
| Container-scoped | Access limited to `variscout-projects` container only |
| Time-limited | 1-hour expiry, regenerated on demand |
| Entra ID gated | Requires valid EasyAuth session |
| No delete permission | Read + Write only |
| Azure RBAC | Customer IT manages access via standard role assignments |

### Data Sovereignty

All data resides in the **Azure region selected by the customer** during deployment. No data passes through publisher infrastructure at any point, for any reason.

---

## 4. Encryption

### In Transit

| Control | Configuration |
|---|---|
| HTTPS enforced | `httpsOnly: true` in ARM template |
| Minimum TLS version | `minTlsVersion: "1.2"` on App Service |
| Blob Storage | All traffic over TLS |

### At Rest

| Component | Encryption |
|---|---|
| Blob Storage | Azure-managed Server-Side Encryption (SSE) |
| IndexedDB (Standard plan) | Browser-managed encryption |
| Key Vault | Azure-managed encryption with RBAC authorization |

### Secret Management

All sensitive values are stored in **Azure Key Vault** with RBAC-based access control:

- The App Service accesses Key Vault via its **system-assigned managed identity**
- No secrets are stored in environment variables or application code
- The `clientSecret` parameter is marked as `@secure()` in the Bicep template
- Key Vault has **soft-delete enabled** with 90-day retention, preventing accidental permanent loss

---

## 5. AI Data Handling

### Deterministic-First Architecture

VariScout's core principle is **"deterministic first, AI enhances."** The statistical engine computes all results — means, standard deviations, control limits, Cpk, ANOVA, eta-squared. AI components (NarrativeBar, ChartInsightChip, CoScout) explain and contextualize these pre-computed results. AI never generates statistical values or makes autonomous decisions.

### Stats-Only Payloads

The `buildAIContext()` function transforms raw measurement data into summary statistics before any AI interaction. **Raw measurement values are never sent to AI services.**

| Data Category | Sent to AI? | What Is Sent |
|---|---|---|
| Raw measurements | **Never** | Only summary statistics (mean, stdDev, Cpk, etc.) |
| Factor names & categories | Yes | Column headers (e.g., "Machine", "Shift") and category values (e.g., "Machine A", "Morning") |
| Analyst-written text | Yes | Finding descriptions, hypotheses, process descriptions — deliberately authored by the authenticated user |
| Photos | **Never** | Stored in Blob Storage only |
| User credentials | **Never** | Authentication handled by EasyAuth platform |
| Conversation history | Session-only | Last 10 messages; no persistence across sessions |
| Knowledge Base snippets | Yes (Team plan) | Maximum 400 characters per document snippet |

### AI Infrastructure

- Azure OpenAI resources are deployed **per-customer** in the customer's own subscription
- No shared AI endpoint across customers
- **Content filter policy:** `Microsoft.DefaultV2` (filters hate, sexual, violence, self-harm, jailbreak content)
- **Rate limiting:** 30 TPM (nano model), 60 TPM (mini model) — Azure-enforced
- **No prompt persistence:** Messages with images sent with `store: false`

### AI Telemetry

Only non-PII metadata is recorded to Application Insights:

- Feature name (narration, insight, coscout)
- Model name and deployment identifier
- Latency (ms) and token counts
- Error type (if any)

**No prompt content, user text, or AI response content is sent to telemetry.**

---

## 6. Tenant Isolation

Every customer deployment is a fully isolated instance:

| Layer | Isolation Mechanism |
|---|---|
| Compute | Dedicated App Service per customer |
| Storage | Dedicated Storage Account per customer |
| AI | Dedicated Azure OpenAI resource per customer |
| Secrets | Dedicated Key Vault per customer |
| Identity | Customer's own Entra ID tenant |
| Monitoring | Dedicated Application Insights per customer |
| Network | No cross-customer network paths |

There is no multi-tenant database, no shared API gateway, no shared compute, and no data aggregation across customers. Each deployment is architecturally identical to a customer-built application running in their own Azure environment.

---

## 7. Network Security

| Control | Configuration |
|---|---|
| HTTPS enforcement | `httpsOnly: true` |
| FTP | Disabled (`ftpsState: "Disabled"`) |
| Management endpoints | None exposed |
| Health endpoint | `GET /health` (excluded from auth, exposes no data) |
| Inbound access | Gated through EasyAuth middleware |

### Outbound Connections

The application makes outbound connections only to:

| Destination | When | Purpose |
|---|---|---|
| Azure Blob Storage | Team plan, on save/load | Project data sync |
| Azure OpenAI | When AI features are used | Statistical summary explanation |
| Azure AI Search | Team plan, on KB search | Knowledge Base document search |

No connections are made to publisher-operated servers, third-party analytics, or external tracking services.

---

## 8. RBAC Model

### Managed Identity Roles

The App Service's system-assigned managed identity is granted the following roles, **scoped to specific resources** (not resource-group-wide):

| Role | Resource | Purpose |
|---|---|---|
| `Storage Blob Data Contributor` | Storage Account | Generate SAS tokens for browser access |
| `Cognitive Services User` | Azure AI Services | Access AI models via bearer token |
| `Key Vault Secrets User` | Key Vault | Read deployment secrets |

### Customer IT Controls

Customer IT retains full control over access management via standard Azure mechanisms:

- **User access:** Managed through Entra ID — add/remove users from the App Registration
- **Storage access:** Controlled via Azure RBAC role assignments on the Storage Account
- **AI access:** Controlled via Cognitive Services User role assignments
- **Admin gating:** Optional App Role (`VariScout.Admin`) for restricting Admin Hub access
- **Audit logs:** Standard Azure Activity Log and Entra ID Sign-in logs

---

## 9. Photo Evidence Security

Team plan users can capture photo evidence for findings (gemba observations). Photos undergo client-side security processing before upload:

| Processing Step | Detail |
|---|---|
| EXIF metadata removal | All EXIF tags stripped in the browser |
| GPS data removal | Location data removed before upload |
| Canvas re-encode | Image re-encoded via HTML Canvas (strips embedded metadata) |
| Size limitation | Resized if longest side exceeds 2048px |
| Storage | Uploaded to customer's Blob Storage at `{projectId}/photos/{findingId}/` |

Photos are never sent to AI services, never processed server-side, and never leave the customer's Azure tenant.

---

## 10. Disaster Recovery & Business Continuity

### Recovery Targets

| Scenario | RTO | RPO |
|---|---|---|
| App Service failure | < 5 minutes | 0 (stateless) |
| Region outage | < 2 hours | 0 (redeploy to new region) |
| Key compromise | < 30 minutes | N/A |
| Data loss (Standard) | N/A | N/A (browser-local, user responsibility) |
| Data loss (Team) | < 1 hour | ~15 minutes (last sync) |

### Stateless Architecture

The App Service is stateless — it serves a pre-built SPA package with no server-side state. Recovery is a redeployment:

- **App Service failure:** Restart via Azure Portal or redeploy from Marketplace
- **Region failover:** Deploy the same ARM template to a new region, update DNS
- **Package rollback:** Self-service update handler (ADR-058) with automatic rollback capability

### Data Protection

| Component | Protection |
|---|---|
| Standard plan (IndexedDB) | Browser-local; user can export as JSON |
| Team plan (Blob Storage) | Azure Storage SLA; geo-redundancy configurable by customer |
| Key Vault secrets | Soft-delete with 90-day recovery window |
| Application code | CI/CD history + deployment slots |

---

## 11. ISO 27001 Shared Responsibility Model

VariScout (the publisher) does not currently hold ISO 27001 certification. This section explains why the customer-tenant deployment model means the majority of ISO 27001 controls are inherently covered by the customer's existing Azure governance.

### Control Ownership

| ISO 27001 Annex A Domain | Control Owner | Rationale |
|---|---|---|
| A.5 Information Security Policies | Customer | Customer's Azure policies govern the deployment |
| A.6 Organization of Information Security | Customer | Customer's organizational structure applies |
| A.7 Human Resource Security | Shared | Publisher employees have zero access to customer data |
| A.8 Asset Management | Customer | All assets (App Service, Storage, AI) are customer-owned Azure resources |
| A.9 Access Control | Customer | Azure AD (Entra ID) + RBAC managed by customer IT |
| A.10 Cryptography | Customer | Azure-managed encryption in customer's subscription |
| A.11 Physical & Environmental Security | Customer | Azure datacenters in customer-selected region |
| A.12 Operations Security | Customer | Azure platform operations in customer's subscription |
| A.13 Communications Security | Customer | Azure networking in customer's subscription |
| A.14 System Acquisition, Development & Maintenance | **Publisher** | Secure SDLC, code review, dependency management |
| A.15 Supplier Relationships | Shared | Publisher manages Azure/Microsoft relationship; customer manages VariScout relationship |
| A.16 Information Security Incident Management | Customer | Customer's incident response for their Azure resources |
| A.17 Business Continuity | Customer | Customer controls backup, geo-redundancy, and DR for their Azure resources |
| A.18 Compliance | **Publisher** | Regulatory mapping (EU AI Act, ISO 9001:2026 alignment) |

### Publisher Security Practices (A.14)

VariScout's development practices include:

- **Automated security scanning:** ARM template validation via arm-ttk, dependency scanning
- **Code review:** All changes reviewed before merge
- **Secure build pipeline:** GitHub Actions CI/CD with artifact signing
- **Marketplace certification:** Microsoft reviews security, malware, and data exfiltration before listing
- **Content filtering:** Azure OpenAI content filter policy (`Microsoft.DefaultV2`) explicitly declared in ARM template

### Roadmap to Formal Certification

See [ADR-062: Trust & Compliance Roadmap](../../07-decisions/adr-062-trust-compliance-roadmap.md) for the phased approach to formal certification (SOC 2 Type I self-assessment, SOC 2 Type II audit, ISO 27001).

---

## 12. Compliance Posture

### EU AI Act

VariScout's AI features (NarrativeBar, ChartInsightChip, CoScout) are classified as **limited-risk** under the EU AI Act:

- **Article 50 transparency obligations** apply (not high-risk Annex III)
- CoScout is an AI-assisted professional tool that explains pre-computed statistics; the analyst makes all decisions
- AI-generated content is clearly labeled
- AI components can be disabled via Settings
- Full mapping documented in `docs/05-technical/architecture/eu-ai-act-mapping.md`

### ISO 9001:2026 Alignment

VariScout's closed-loop investigation model (detect, investigate, act, verify with measured Cpk outcomes) directly supports customer compliance with ISO 9001:2026 requirements. See the [ISO 9001:2026 Alignment Guide](../iso-9001-alignment.md) for clause-by-clause mapping.

### Azure Marketplace Certification

Microsoft's Marketplace certification process includes:

- ARM template schema validation
- Security posture review
- Malware scanning
- Network monitoring verification
- Data exfiltration checks
- API version freshness validation

This certification provides an independent third-party trust signal from Microsoft.

### Responsible AI

VariScout maintains a comprehensive Responsible AI Policy covering:

- Human oversight requirements (analyst confirms all AI suggestions)
- Fabrication prevention ("Never invent data or statistics" in all system prompts)
- Domain language grounding via VariScout glossary (~47 vocabulary terms)
- Automated prompt safety testing
- Graceful degradation (all features work without AI)

Full policy: `docs/05-technical/architecture/responsible-ai-policy.md`

---

## 13. Summary

| Security Area | VariScout Approach |
|---|---|
| **Deployment** | Customer's own Azure subscription; no shared infrastructure |
| **Publisher access** | Zero — no `publisherManagement` authorization |
| **Authentication** | Azure AD via EasyAuth; zero admin consent required |
| **Data residency** | Standard: browser only. Team: customer's Blob Storage |
| **Encryption** | TLS 1.2+ in transit; Azure-managed SSE at rest; Key Vault for secrets |
| **AI data handling** | Stats-only payloads; raw measurements never sent to AI |
| **Tenant isolation** | Per-customer deployment of all Azure resources |
| **Network** | HTTPS enforced; FTP disabled; no management endpoints |
| **RBAC** | Managed identity with resource-scoped roles |
| **Photo security** | EXIF/GPS stripped client-side before upload |
| **Disaster recovery** | Stateless architecture; < 5 min RTO |
| **Compliance** | EU AI Act limited-risk; ISO 9001:2026 alignment; Azure Marketplace certified |

---

## See Also

- [Authentication (EasyAuth)](authentication.md)
- [Blob Storage Sync](blob-storage-sync.md)
- [AI Safety Report](ai-safety-report.md)
- [EU AI Act Mapping](../../05-technical/architecture/eu-ai-act-mapping.md)
- [Responsible AI Policy](../../05-technical/architecture/responsible-ai-policy.md)
- [ADR-062: Trust & Compliance Roadmap](../../07-decisions/adr-062-trust-compliance-roadmap.md)
- [ISO 9001:2026 Alignment Guide](../iso-9001-alignment.md)
