---
title: 'Flow 10: Azure App — Admin Operations'
---

# Flow 10: Azure App — Admin Operations

> Admin Aino manages the VariScout deployment after initial setup — health monitoring, troubleshooting, and plan changes.
>
> **Priority:** Medium — operational hygiene (reduces support burden, improves admin confidence)
>
> See also: [Journeys Overview](../index.md) | [AI Setup](azure-ai-setup.md) | [Team Collaboration](azure-team-collaboration.md)

---

## Persona: Admin Aino

| Attribute         | Detail                                                            |
| ----------------- | ----------------------------------------------------------------- |
| **Role**          | IT Admin / Azure Platform Engineer                                |
| **Goal**          | Ensure VariScout is healthy, troubleshoot issues, manage upgrades |
| **Knowledge**     | Azure Portal, Entra ID, App Registrations, RBAC, Teams Admin      |
| **Pain points**   | No health visibility in-app, unclear app-vs-Azure responsibility  |
| **Entry point**   | In-app admin hub (shield icon) or Azure Portal                    |
| **Decision mode** | Diagnostic — needs evidence before taking action                  |

### What Aino is thinking:

- "Someone reported OneDrive sync is broken — where do I check?"
- "We want to upgrade to Team AI — what changes?"
- "Is the AI endpoint still working after the weekend?"
- "The new hire can't access the app — what's missing?"

---

## Journey Flow

### Mermaid Flowchart

```mermaid
flowchart TD
    A{What does Aino need?}
    A -->|Health check| B[Open Admin Hub → Status tab]
    A -->|Troubleshoot| C[Open Admin Hub → Troubleshooting tab]
    A -->|Plan change| D[Open Admin Hub → Plan & Features tab]
    A -->|Integration setup| E[Open Admin Hub → Teams / KB tab]

    B --> F[Run health checks]
    F --> G{All green?}
    G -->|Yes| H[Confidence: deployment is healthy]
    G -->|No| I[Follow diagnostic steps]
    I --> J[Open Azure Portal → relevant blade]
    J --> K[Fix issue]
    K --> F

    C --> L[Find matching issue]
    L --> M[Run diagnostic check]
    M --> N{Issue identified?}
    N -->|Yes| O[Follow fix steps → Azure Portal]
    N -->|No| P[Escalate with diagnostic output]

    D --> Q[Review current plan vs feature matrix]
    Q --> R{Upgrade needed?}
    R -->|Yes| S[Azure Marketplace → change plan]
    R -->|No| T[No action needed]

    E --> U[Configure integration]
    U --> V[Verify via Status tab]
```

### Admin Operations Journey

```mermaid
journey
    title Admin Operations (Day 2+)
    section Post-Deploy Verify
      Open Admin Hub: 5: Aino
      Run all health checks: 4: Aino
      Verify green status: 5: Aino
    section Troubleshoot
      Receive support ticket: 3: Aino
      Find issue in Troubleshooting tab: 4: Aino
      Run diagnostic check: 4: Aino
      Fix in Azure Portal: 4: Aino
    section Plan Change
      Review Plan & Features: 5: Aino
      Compare current vs target plan: 5: Aino
      Upgrade via Azure Marketplace: 4: Aino
    section Ongoing
      Periodic health check: 4: Aino
      Monitor Azure cost: 3: Aino
```

---

## Step-by-Step

### 1. Post-Deployment Verification

After the ARM template deploys and the app is live, Aino verifies that all integrations are working.

**In-app (Admin Hub → Status tab):**

| Check                | Method                | What it proves                               |
| -------------------- | --------------------- | -------------------------------------------- |
| Authentication       | `GET /.auth/me`       | EasyAuth configured, user has valid session  |
| Graph API — Profile  | `GET /me`             | User.Read permission granted                 |
| Graph API — Files    | `GET /me/drive`       | Files.ReadWrite.All permission (Team plan)   |
| Graph API — Channels | `GET /me/joinedTeams` | Channel.ReadBasic.All permission (Team plan) |
| AI Endpoint          | `GET {endpoint}`      | AI Services reachable (Team AI plan)         |
| AI Search            | Test query            | Knowledge Base connectivity (Team AI plan)   |

Each check shows: green (pass), red (fail with error message), or grey (not applicable for current plan).

**Per-user delegation caveat:** AI Search and Graph API checks use the current user's delegated token. A successful check proves _this admin's_ access — another user with different SharePoint permissions or Conditional Access policies may get different results.

**What cannot be checked from the browser:**

| Item                 | Why                                        | Where to check instead                                              |
| -------------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| Client secret expiry | Server-side, no browser API                | Azure Portal → Entra ID → App Registration → Certificates & secrets |
| App Service health   | Circular — if app is down, check can't run | Azure Portal → App Service → Health check                           |
| Resource costs       | Requires Azure Management API              | Azure Portal → Cost Management                                      |
| Other users' access  | Delegated token = current user only        | Azure Portal → Entra ID → Enterprise Applications → Users           |

For these, the Status tab shows an **"Open in Azure Portal →"** deep link to the relevant blade.

### 2. Ongoing Health Monitoring

Aino periodically checks the Status tab to ensure integrations remain healthy. Common triggers:

- After Azure maintenance windows
- After App Registration changes (secret rotation, permission updates)
- After plan upgrades (new integrations become available)
- When users report issues

### 3. Troubleshooting Common Issues

The Troubleshooting tab provides a structured diagnostic flow for common support tickets:

| Issue                            | Diagnostic                                                                          | Fix Location                                      |
| -------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------- |
| "Users can't sign in"            | Check EasyAuth config — does `/.auth/me` return a token?                            | Azure Portal → App Service → Authentication       |
| "OneDrive sync not working"      | Test Graph API Files scope — does `/me/drive` return?                               | Azure Portal → App Registration → API Permissions |
| "CoScout not responding"         | Test AI endpoint connectivity — is the endpoint reachable?                          | Azure Portal → AI Services → Keys and Endpoint    |
| "Knowledge Base empty"           | Test AI Search query + verify SharePoint folder path                                | Azure Portal → AI Search → Indexes                |
| "Teams tab not showing"          | Check manifest app ID matches App Registration                                      | Teams Admin Center → Manage apps                  |
| "New user can't access"          | User not assigned to Enterprise Application                                         | Azure Portal → Entra ID → Enterprise Applications |
| "AI responses are slow"          | Check AI model deployment — throttling or cold start?                               | Azure Portal → AI Services → Model deployments    |
| "KB works for me but not others" | Conditional Access policies may block SharePoint access for certain users/locations | Azure Portal → Entra ID → Conditional Access      |

Each row provides:

1. Issue description (searchable)
2. **"Run Check"** button — executes the browser-based diagnostic
3. Result with pass/fail and error details
4. **"Fix in Azure Portal →"** deep link to the relevant blade

### 4. Plan Changes and Feature Activation

The Plan & Features tab shows the current plan and what each tier unlocks:

| Feature                        | Standard | Team | Team AI |
| ------------------------------ | -------- | ---- | ------- |
| Analysis & charts              | ✓        | ✓    | ✓       |
| Findings & investigation       | ✓        | ✓    | ✓       |
| Local file storage (IndexedDB) | ✓        | ✓    | ✓       |
| OneDrive sync                  | —        | ✓    | ✓       |
| Teams integration              | —        | ✓    | ✓       |
| SharePoint file picker         | —        | ✓    | ✓       |
| AI narration & insights        | —        | —    | ✓       |
| CoScout assistant              | —        | —    | ✓       |
| Knowledge Base                 | —        | —    | ✓       |

Current plan is highlighted. Upgrade links point to Azure Marketplace subscription management.

After a plan upgrade:

1. Update `VITE_VARISCOUT_PLAN` in App Service configuration
2. Redeploy ARM template if new resources are needed (e.g., AI Services for Team AI)
3. Verify new features via Status tab health checks

### 5. Integration Lifecycle

**Teams manifest updates:**

- Regenerate manifest when App Registration client ID changes
- Upload new `.zip` to Teams Admin Center
- Existing tab installations auto-update

**Knowledge Base folder changes:**

- Update SharePoint folder path in Admin Hub → Knowledge Base tab
- Run AI Search indexer to pick up new folder
- Verify via health check

---

## What Aino Does NOT Do In-App

VariScout has no backend. These responsibilities stay in Azure Portal:

| Responsibility          | Tool                                                 |
| ----------------------- | ---------------------------------------------------- |
| User provisioning       | Entra ID → Enterprise Applications                   |
| RBAC role assignment    | Azure Portal → IAM                                   |
| Cost management         | Azure Cost Management                                |
| Audit logging           | Azure App Service → Diagnostic logs                  |
| Scaling                 | Azure Portal → App Service → Scale up/out            |
| Availability monitoring | Azure Monitor → Availability tests                   |
| Secret rotation         | Entra ID → App Registration → Certificates & secrets |
| Billing                 | Azure Marketplace → Subscriptions                    |

The admin hub provides deep links to each of these blades so Aino doesn't have to navigate manually.

---

## Admin Role Gating

The Admin Hub uses **soft gating** via Entra ID App Roles:

| Scenario                                         | Behavior                                    |
| ------------------------------------------------ | ------------------------------------------- |
| No App Roles configured (default)                | All authenticated users see the Shield icon |
| App Roles configured, user has `VariScout.Admin` | Shield icon visible                         |
| App Roles configured, user lacks admin role      | Shield icon hidden                          |

This is backward compatible — existing deployments work without any changes. To restrict access:

1. Define a `VariScout.Admin` App Role in the App Registration
2. Assign admin users to the role in Entra ID → Enterprise Applications
3. The role appears as a `roles` claim in `/.auth/me`

The Status tab shows the current gating mode so Aino can see whether access is open or restricted.

See [Authentication — App Roles](../../08-products/azure/authentication.md#admin-role-gating-app-roles) for setup instructions.

---

## Success Metrics

| Metric                                         | Target |
| ---------------------------------------------- | ------ |
| Post-deploy verification completion rate       | > 90%  |
| Support tickets resolved via Troubleshooting   | Track  |
| Admin Hub visits per month                     | Track  |
| Health check failure → Azure Portal click rate | Track  |
| Time from issue report to diagnosis            | Track  |

---

## See Also

- [Admin Aino](../personas/admin-aino.md) — the IT Admin persona
- [Flow 8: Team Collaboration](azure-team-collaboration.md) — initial deployment and team setup
- [Flow 9: AI Setup](azure-ai-setup.md) — AI resource provisioning
- [ARM Template](../../08-products/azure/arm-template.md) — deployment resources
- [Authentication](../../08-products/azure/authentication.md) — EasyAuth configuration
- [Admin Experience Design](../../superpowers/specs/2026-03-19-admin-experience-design.md) — UI design spec
