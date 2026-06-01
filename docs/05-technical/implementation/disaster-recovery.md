---
tier: living
purpose: system
title: Disaster Recovery
audience: human
category: architecture
status: active
related: [deployment, azure, infrastructure]
layer: L4
---

# Disaster Recovery

## Architecture Overview

VariScout is a **no-backend, offline-first** application. All statistical computation happens in the browser. This significantly reduces the DR surface area — there is no server-side database, no API state, and no data pipeline to recover.

| Component             | Location                           | DR Impact                                       |
| --------------------- | ---------------------------------- | ----------------------------------------------- |
| Application code      | Azure App Service (per customer)   | Redeployable from CI/CD                         |
| User data (PWA)       | Browser memory + user `.vrs` files | Client-side only; refresh loses unexported work |
| User data (Azure App) | IndexedDB + Blob Storage           | Blob Storage has native versioning              |
| AI services           | Azure OpenAI (per customer)        | Stateless, redeployable                         |
| Knowledge Catalyst    | Azure AI Search (Phase 2+)         | Reindexable from Blob Storage source            |
| Secrets               | Azure Key Vault (per customer)     | Soft-delete enabled (90-day retention)          |

## RTO/RPO Targets

| Scenario              | RTO       | RPO     | Notes                                              |
| --------------------- | --------- | ------- | -------------------------------------------------- |
| App Service failure   | < 5 min   | 0       | Deployment slot swap or redeployment               |
| Region outage         | < 2 hours | 0       | Redeploy Bicep to secondary region                 |
| Key compromise        | < 30 min  | N/A     | Key rotation procedure below                       |
| Data loss (PWA)       | N/A       | N/A     | Data is session-only — no server recovery possible |
| Data loss (Azure App) | < 1 hour  | ~15 min | Blob Storage versioning, last sync timestamp       |

## Recovery Procedures

### App Service Recovery

**Scenario**: Application is unresponsive or returning errors.

1. **Check health endpoint**: `curl https://<app-name>.azurewebsites.net/health`
2. **Restart App Service**: Azure Portal → App Service → Restart
3. **Rollback to previous deployment**:
   - If using deployment slots: `az webapp deployment slot swap --slot staging --target-slot production`
   - If no slots: redeploy previous commit via CI (`workflow_dispatch` with commit SHA)
4. **Full redeployment**: Push to `main` triggers staging deploy, then promote

### Region Failover

**Scenario**: Azure region outage affecting the customer's deployment.

1. The Bicep templates (`infra/main.bicep`) can deploy to any Azure region
2. Create a new resource group in the target region
3. Deploy using existing ARM template (`infra/mainTemplate.json`) with same parameters
4. Update DNS/custom domain to point to new App Service
5. Re-configure EasyAuth with same Azure AD App Registration (multi-region)
6. Knowledge Catalyst (Phase 2+): Reindex from Blob Storage source documents

**Note**: Customer data in IndexedDB is browser-local and moves with the user's browser. Blob Storage data is replicated by Microsoft across regions.

### Key Rotation

| Secret                 | Location     | Rotation Procedure                                                                                                                                                  |
| ---------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Azure AD Client Secret | Key Vault    | 1. Create new secret in Azure AD App Registration. 2. Update Key Vault secret. 3. Restart App Service.                                                              |
| Function Key           | Function App | 1. Regenerate in Azure Portal → Function App → App Keys. 2. Update `FUNCTION_KEY` in App Service app settings. 3. No code changes needed (key is server-side only). |
| AI API Key             | Key Vault    | 1. Regenerate in Azure OpenAI resource. 2. Update Key Vault secret. 3. Restart App Service.                                                                         |
| AI Search Key          | Key Vault    | 1. Regenerate in AI Search resource. 2. Update Key Vault secret. 3. Restart App Service.                                                                            |

**Key Vault soft-delete**: Enabled by default. Deleted secrets are recoverable for 90 days. This prevents accidental permanent loss during rotation.

### Data Recovery

**Azure App (IndexedDB + Blob Storage)**:

- Data stored in Azure local IndexedDB cache and Azure Blob Storage in the customer's resource group
- Blob Storage provides native versioning and soft-delete (configure in customer's Storage Account)
- Sync queue (`storage.ts`) tracks pending uploads
- Conflict resolution: ETag-based optimistic concurrency
- Recovery: clear IndexedDB, re-sync from Blob Storage
- Users can also export projects as `.vrs` files for local backup

**PWA (session + `.vrs` only)**:

- Data exists only in the user's browser memory unless explicitly exported
- No server-side backup exists by design (data sovereignty)
- Users can export snapshot `.vrs` files for local backup or transfer
- Refresh, tab close, or browser data loss discards unexported work

## Infrastructure as Code

All infrastructure is defined in Bicep (`infra/`) and compiled to ARM template (`infra/mainTemplate.json`). This means:

- **Reproducible**: Any deployment can be recreated from the template
- **Version-controlled**: Infrastructure changes are tracked in Git
- **Multi-region**: Same template deploys to any Azure region
- **Marketplace**: Customers deploy via Azure Marketplace using the ARM template

## Monitoring

- **App Insights**: Client-side telemetry via `@microsoft/applicationinsights-web` (per customer's own App Insights instance — connection string from ARM deployment). SDK loads as async chunk after first paint. Collects:
  - **Exceptions**: Unhandled errors from ErrorBoundary (`trackException`)
  - **Page views**: Auto-tracked route changes (`enableAutoRouteTracking`)
  - **API performance**: Fetch/AJAX latency and CORS correlation
  - **AI usage**: Custom events `AI.Call` (per-call: feature, model, duration, tokens) and `AI.Summary` (aggregate: total calls, success rate, p95 latency, total tokens). Flushed every 5 minutes.
  - **Not collected**: No PII, no analysis data, no user content, no data sent to publisher
  - **Suggested alerts**: Error rate > 5%, AI call failure rate > 10%, p95 latency > 10s
- **Health endpoint**: `GET /health` returns 200 when the app server is running
- **App Service diagnostics**: Azure Portal provides CPU, memory, HTTP error metrics
- **Blob Storage sync errors**: Classified by `SyncErrorCategory` (auth, network, throttle, server, not_found)

## Dependencies

| Dependency          | Impact if Unavailable       | Mitigation                                                |
| ------------------- | --------------------------- | --------------------------------------------------------- |
| Azure AD (EasyAuth) | Users cannot authenticate   | Wait for Microsoft recovery; no local fallback            |
| Azure Blob Storage  | Blob sync fails             | App works offline; sync resumes when available            |
| Azure OpenAI        | AI features unavailable     | App shows graceful degradation; analysis works without AI |
| Azure AI Search     | Knowledge Base search fails | Team features degrade; core analysis unaffected           |

## Testing DR Procedures

1. **Slot swap**: Test monthly by deploying to staging slot and swapping
2. **Key rotation**: Test quarterly by rotating a non-critical key
3. **Region deploy**: Test annually by deploying Bicep to a secondary region
4. **Offline resilience**: Test with browser DevTools Network → Offline mode
