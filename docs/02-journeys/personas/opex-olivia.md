---
tier: living
purpose: design
title: 'OpEx Olivia'
audience: human
category: workflow
status: named-future
layer: L2
last-reviewed: 2026-05-18
---

# OpEx Olivia

> **Legacy V0 persona** — named-future for **VariScout Process** (future enterprise tier). V1 wedge uses 3 in-project personas (Lead / Member / Sponsor); see [`personas/`](.). Retained as historical reference.

| Attribute         | Detail                                             |
| ----------------- | -------------------------------------------------- |
| **Role**          | OpEx Manager                                       |
| **Goal**          | Find tools for team                                |
| **Knowledge**     | Strategic, evaluates ROI                           |
| **Pain points**   | Budget constraints, IT approval, change management |
| **Decision mode** | Needs security docs, deployment guide, pricing     |

---

## What Olivia is thinking

- "My team needs better analysis tools"
- "Can I justify the cost vs Minitab?"
- "What's the IT/security story?"
- "How hard is deployment?"

---

## 4-Phase Journey

```mermaid
journey
    title OpEx Olivia's Journey
    section Awareness
      Receive colleague referral: 4: Olivia
      Visit homepage: 4: Olivia
    section Evaluation
      Explore methodology: 5: Olivia
      Review enterprise page: 4: Olivia
    section Validation
      Check security docs: 3: Olivia
      Review pricing: 4: Olivia
    section Decision
      Self-serve purchase: 5: Olivia
      OR request consultant help: 4: Olivia
```

---

## Entry Points

| Source              | Arrives Via         | Lands On      |
| ------------------- | ------------------- | ------------- |
| Colleague referral  | Direct link         | / or /pricing |
| Conference          | QR code / card      | /             |
| LinkedIn            | Company page / post | / or /pricing |
| Team member request | "Check this out"    | /pricing      |

---

## Journey Flow

```
┌─────────────────┐
│ Referral from   │
│ colleague or    │
│ conference      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ / (Homepage)    │
│                 │
│ Quick scan:     │
│ "What is this?" │
│ "Who is it for?"│
└────────┬────────┘
         │
    ┌────┴────────────┐
    │                 │
    ▼                 ▼
┌────────────┐  ┌────────────┐
│ /journey   │  │ /pricing   │
│            │  │            │
│ See the    │  │ Jump to    │
│ methodology│  │ enterprise │
└─────┬──────┘  └─────┬──────┘
      │               │
      ▼               │
┌────────────┐        │
│ "I get it" │        │
│ Now eval   │────────┘
│ for team   │
└─────┬──────┘
      │
      ▼
┌─────────────────┐
│ /product/       │
│ enterprise      │
│                 │
│ Features        │
│ Security docs   │
│ Deployment guide│
│ Pricing         │
└────────┬────────┘
      │
 ┌────┴────────────────┐
 │                     │
 ▼                     ▼
┌────────────────┐  ┌─────────────────┐
│ SUBSCRIBE      │  │ NEED HELP?      │
│                │  │                 │
│ Azure          │  │ Your existing   │
│ Marketplace    │  │ consultants     │
│ Managed App    │  │ can assist      │
│ deploys auto   │  │                 │
└────────────────┘  └─────────────────┘
```

---

## Information Olivia Needs

| Question                    | Answer Location          |
| --------------------------- | ------------------------ |
| What does it do?            | /journey, /tools         |
| Is it secure?               | /product/enterprise      |
| Where's my data?            | /product/enterprise      |
| How much does it cost?      | /pricing                 |
| How do I deploy?            | /getting-started         |
| Who supports it?            | /support                 |
| Can I try it first?         | /app (free, permanently) |
| What training is available? | Training links           |

---

## Enterprise Page Requirements

The /product/enterprise page must answer:

### 1. Security & Compliance

- Where is data stored? → "Your Azure tenant, your data"
- SSO support? → Azure AD / Microsoft Entra ID
- Compliance? → SOC 2 considerations, GDPR
- Audit logs? → Azure native logging

### 2. Deployment

- How to deploy? → Azure Marketplace Managed Application
- Time to deploy? → Minutes (Managed Application)
- Who deploys? → Azure Marketplace handles it
- Updates? → Automatic via Azure

### 3. Pricing

- Azure App: €120/month per tenant — all analysis features, CoScout AI, Blob Storage sync, project membership, Knowledge Catalyst
- PWA: free — analysis + training, session-only
- Unlimited users in your tenant, no per-user fees

### 4. Support

- Documentation-first
- Community support (free / PWA)
- Email support (Azure App)
- "Your existing LSS/IT consultants can assist"

---

## Success Metrics

| Metric                       | Target |
| ---------------------------- | ------ |
| Homepage → Enterprise page   | Track  |
| Enterprise page → Deployment | >5%    |
| Enterprise page → Contact    | >2%    |
| Marketplace subscriptions    | Track  |

---

## Related Flows

- [Enterprise Flow](../flows/enterprise.md) — Olivia's primary flow
