---
title: 'ADR-063: Trust & Compliance Roadmap'
audience: [business, architect]
category: compliance
status: accepted
---

# ADR-063: Trust & Compliance Roadmap

## Status

Accepted — 2026-04-03

**Related:** ADR-021 (Security Evaluation), ADR-059 (Web-First Architecture), ADR-007 (Azure Marketplace Distribution)

---

## Context

Corporate buyers in manufacturing and automotive typically require ISO 27001 or SOC 2 certification before procurement approval. Their vendor risk assessment process expects documented security artifacts that InfoSec teams can file and reference.

VariScout's customer-tenant deployment model (Azure Managed Application, per ADR-007 and ADR-059) provides architectural security guarantees that are equivalent to or stronger than most certified multi-tenant SaaS tools:

- **Zero shared infrastructure** — every customer gets their own App Service, Storage Account, AI Services, and Key Vault, deployed into their own Azure subscription
- **No publisher access** — the ARM template does not include `publisherManagement` authorization; the publisher has zero access to customer resources after deployment
- **No backend API** — Standard plan serves a static SPA via `WEBSITE_RUN_FROM_PACKAGE`; all data processing happens in the browser
- **Zero admin consent** — both tiers require only `User.Read` (user-consent), reduced from 5 admin-consent Graph API scopes in the previous architecture (ADR-059)
- **Browser-only data** — Standard plan stores data exclusively in browser IndexedDB; Team plan adds Azure Blob Storage within the customer's own resource group

However, formal certification requires significant investment (EUR 30-50K for SOC 2 Type II, EUR 50-80K for ISO 27001) plus ongoing annual audit costs. At the current revenue stage, this investment is premature. The gap is not in security posture but in documentation and brand recognition — InfoSec teams need artifacts they can file in their vendor risk assessment.

### ISO 27001 Shared Responsibility

Unlike traditional SaaS where the vendor hosts data on shared infrastructure, VariScout deploys entirely into the customer's own Azure tenant. This fundamentally changes the ISO 27001 control ownership:

| ISO 27001 Annex A Domain     | Traditional SaaS      | VariScout                                              |
| ---------------------------- | --------------------- | ------------------------------------------------------ |
| A.8 Asset Management         | Vendor responsibility | **Customer-inherited** (customer's Azure subscription) |
| A.9 Access Control           | Vendor responsibility | **Customer-inherited** (Azure AD + RBAC)               |
| A.10 Cryptography            | Vendor responsibility | **Customer-inherited** (Azure-managed encryption)      |
| A.12 Operations Security     | Vendor responsibility | **Customer-inherited** (customer's Azure governance)   |
| A.13 Communications Security | Vendor responsibility | **Customer-inherited** (Azure networking)              |
| A.14 System Development      | Vendor responsibility | **Publisher responsibility** (secure SDLC)             |
| A.18 Compliance              | Shared                | **Publisher responsibility** (regulatory mapping)      |

The majority of Annex A controls are automatically covered by the customer's existing Azure governance. The publisher's scope is limited to secure development practices (A.14) and regulatory compliance documentation (A.18).

---

## Decision

Adopt a phased approach, prioritizing architectural trust signals and documentation over formal certification. Each phase has a clear trigger for the next.

### Phase 1 — Now (Documentation-Led Trust)

Create three trust artifacts that corporate IT can evaluate:

1. **Security Whitepaper** (`docs/08-products/azure/security-whitepaper.md`) — Comprehensive technical document for InfoSec teams covering architecture, authentication, data residency, encryption, AI data handling, tenant isolation, RBAC, and disaster recovery
2. **ISO 9001:2026 Alignment Guide** (`docs/08-products/iso-9001-alignment.md`) — Maps VariScout's closed-loop investigation model to ISO 9001:2026 clauses, positioning it as a tool that helps customers pass their quality audits
3. **Azure Marketplace Certification** — Microsoft's review process (ARM template validation, security scan, malware check) serves as a third-party trust signal

### Phase 2 — 10+ Corporate Customers

Conduct a **SOC 2 Type I self-assessment** using AICPA Trust Services Criteria mapped to existing controls. This documents VariScout's control environment at a point in time without the cost of a formal audit. The customer-tenant model means many controls are "not applicable" or "customer-inherited," significantly reducing scope.

### Phase 3 — Revenue Justifies EUR 30-50K

Commission a **SOC 2 Type II formal audit** with a licensed CPA firm. The 6-12 month observation period builds on the Phase 2 self-assessment. The narrow publisher scope (no customer data hosting, no shared infrastructure) means a focused and cost-effective audit.

### Phase 4 — If Customer Contracts Require

Pursue **ISO 27001 certification** with ISMS establishment and certification audit. The scope will be narrow since the customer-tenant model means most Annex A controls are customer-inherited. This phase is triggered only if specific enterprise contracts require ISO 27001 as a contractual prerequisite.

---

## Consequences

### Positive

- **Lower barrier to entry** — first corporate sales can proceed with documentation rather than waiting 12-18 months for formal certification
- **Faster time-to-market** — security whitepaper and ISO 9001 alignment guide can be created immediately
- **Reusable evidence** — documentation artifacts serve as evidence for future formal audits (Phase 2-4)
- **Architecturally superior** — customer-tenant deployment provides stronger isolation than most certified multi-tenant SaaS tools; the whitepaper makes this explicit
- **ISO 9001:2026 positioning** — alignment guide creates a new sales angle ("VariScout helps you pass your quality audits") that competitors with traditional SPC tools cannot match

### Negative

- **Hard requirements** — some procurement processes will hard-require an ISO 27001 checkbox, and those deals cannot close until Phase 4
- **Perception gap** — "no cert = not secure" perception despite superior architecture; the whitepaper must explicitly address this
- **Manual effort** — documents need versioning and updates with each significant architecture change

### Mitigations

- The security whitepaper explicitly positions the customer-tenant model as architecturally superior to certified shared-infrastructure tools
- Azure Marketplace certification provides Microsoft's review as an independent trust signal
- Phase triggers are tracked in quarterly business review to ensure timely progression

---

## Implementation

### Phase 1 Deliverables

| Document                      | Path                                                    | Audience                   |
| ----------------------------- | ------------------------------------------------------- | -------------------------- |
| Security Whitepaper           | `docs/08-products/azure/security-whitepaper.md`         | IT procurement, InfoSec    |
| ISO 9001:2026 Alignment Guide | `docs/08-products/iso-9001-alignment.md`                | Quality managers, auditors |
| This ADR                      | `docs/07-decisions/adr-062-trust-compliance-roadmap.md` | Internal stakeholders      |

### Versioning

The security whitepaper should be reviewed and updated when:

- Azure resource topology changes (new resources in ARM template)
- Permission scopes change (EasyAuth configuration)
- AI data handling changes (new context sent to AI)
- Storage architecture changes (new sync mechanisms)

### Phase Progression Tracking

Phase triggers are reviewed quarterly:

| Phase | Trigger                      | Metric                    |
| ----- | ---------------------------- | ------------------------- |
| 2     | 10+ corporate customers      | Customer count in CRM     |
| 3     | Revenue justifies EUR 30-50K | Monthly recurring revenue |
| 4     | Contract requires ISO 27001  | Deal pipeline analysis    |

---

## See Also

- [Security Whitepaper](../08-products/azure/security-whitepaper.md)
- [ISO 9001:2026 Alignment Guide](../08-products/iso-9001-alignment.md)
- [ADR-021: Security Evaluation](adr-021-security-evaluation.md)
- [ADR-059: Web-First Deployment Architecture](adr-059-web-first-deployment-architecture.md)
- [EU AI Act Mapping](../05-technical/architecture/eu-ai-act-mapping.md)
- [AI Safety Report](../08-products/azure/ai-safety-report.md)
