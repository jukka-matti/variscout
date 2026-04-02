---
title: 'ADR-058: Deployment Lifecycle & Self-Service Update System'
audience: [developer, architect]
category: architecture
status: stable
---

# ADR-058: Deployment Lifecycle & Self-Service Update System

**Status:** Accepted
**Date:** 2026-04-02

## Context

VariScout is deployed into each customer's own Azure subscription via Azure Marketplace as a Managed Application. Three problems exist:

1. **Broken staging pipeline** — Bicep provisions B1 (Basic) tier but CI/CD attempts slot-swap deployment (requires S1 Standard). Staging slot was never provisioned.
2. **No release pipeline** — no mechanism to publish tested builds to the blob storage URL that customer deployments reference via `WEBSITE_RUN_FROM_PACKAGE`.
3. **No customer update story** — once deployed, customers have no way to receive new versions.

Manufacturing customers range from SMEs without IT departments to enterprises with formal Change Advisory Boards. Auto-updates are inappropriate for regulated environments (ISO 9001, IATF 16949) where software changes can trigger revalidation. App code updates do NOT require Marketplace re-certification — only ARM template changes do.

## Decision

### 1. Separate staging and release pipelines

- **Staging** (`deploy-staging.yml`): simplified direct deploy to B1 App Service (no slots). Cheap, sufficient for dev/test. Triggered on push to `main`.
- **Release** (`release.yml`): new tag-triggered workflow (`v*`). Builds, tests, uploads versioned ZIP to Azure Blob Storage with SHA-256 checksum, updates a public `manifest.json`. Creates GitHub Release.
- **Delete** `deploy-azure-production.yml` — no longer needed. Tagging = releasing.

### 2. Upgrade customer infrastructure to S1 with staging slot

- App Service Plan SKU B1 → S1 in Bicep (enables deployment slots)
- Add `Microsoft.Web/sites/slots` resource for staging slot
- Add `VARISCOUT_VERSION` app setting for version tracking
- Grant Function App's Managed Identity `Website Contributor` role on App Service (scoped, not resource-group-wide)

### 3. Self-service in-app updates via Update Handler Function

Two new endpoints on the existing Function App:

- `GET /api/version` — merges local version with remote manifest, returns update availability
- `POST /api/update` — orchestrates: fetch ZIP → verify checksum → zip deploy to staging slot → health check → swap → health check → update version setting

In-app experience:

- `useUpdateCheck` hook checks version on startup
- `UpdateBanner` shows "Update available" with release notes link
- Security updates get prominent amber banner
- One-click update with progress feedback and automatic rollback on failure
- `VARISCOUT_AUTO_UPDATE` app setting: `"prompt"` (default) or `"disabled"` (IT-managed)

### 4. Versioned blob storage for release artifacts

- Storage account in publisher subscription with `releases/` container
- `manifest.json` is public read; ZIPs are private with SAS tokens embedded in manifest
- Long-lived read-only SAS tokens (2 years), regenerated per release
- Lifecycle management: retain last 10 versions

## Consequences

### Positive

- CI/CD pipeline works immediately (staging direct-deploy unblocks development)
- Customer-initiated updates fit manufacturing change control culture
- No IT department required — quality manager clicks "Update now" in the app
- Zero-downtime updates via slot swap in customer deployments
- Versioned, immutable artifacts with SHA-256 integrity verification
- Automatic rollback protects against bad deployments
- IT departments can disable in-app updates and manage via Portal/CLI

### Negative

- Customer App Service cost increases ~EUR 50/month (B1 → S1) — justified at EUR 79-199/month pricing
- ARM template changes require Marketplace re-certification (~3-5 business days)
- New Azure Function code to maintain (update/version endpoints)
- SAS token management adds operational complexity (mitigated by 2-year expiry + per-release regeneration)

### Risks

- Storage account key rotation invalidates all SAS tokens — must republish manifest
- Update Handler has elevated permissions (Website Contributor) — mitigated by resource-scoped RBAC
- Existing customer deployments unaffected by Bicep changes — they must redeploy to get S1 + staging slot

## Implementation

See design spec: `docs/superpowers/specs/2026-04-02-deployment-lifecycle-design.md`
