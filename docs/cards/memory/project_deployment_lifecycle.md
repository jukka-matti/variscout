---
title: 'Deployment Lifecycle'
description: 'ADR-058 — two-phase deployment lifecycle with release pipeline and customer self-service updates'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 116a0b3b06c150c4
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_deployment_lifecycle.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

ADR-058: Deployment Lifecycle & Self-Service Update System (Phase 1 delivered Apr 2026)

**Why:** CI/CD was broken (B1 tier can't do slot swap), no release pipeline to customers, no customer update story.

**How to apply:**
- **Phase 1 (delivered):** Staging direct-deploy to B1 (no slots), tag-triggered release pipeline publishes versioned ZIPs to Azure Blob Storage + manifest.json + GitHub Releases
- **Phase 2 (planned):** Customer Bicep upgraded to S1 with staging slot, Update Handler Function for in-app self-service updates, UpdateBanner component
- Staging workflow: `.github/workflows/deploy-azure-staging.yml` (push to main)
- Release workflow: `.github/workflows/release.yml` (tag v*)
- Production slot-swap workflow deleted (replaced by release pipeline)
- Release storage: `variscoutrelease` blob storage in Perus-RDMAIC subscription
- Customer update model: customer-initiated (manufacturing change control), not auto-update
- Design spec: `docs/superpowers/specs/2026-04-02-deployment-lifecycle-design.md`

**Known issue (Apr 2 2026):** Staging deploy fails — `Microsoft.Web/Sites/Slots` resource `variscout-staging/staging` doesn't exist. The slot was either deleted or never provisioned. Build succeeds but deploy-to-slot step fails. Fix: recreate staging slot in Azure Portal or update workflow to match current infra.
