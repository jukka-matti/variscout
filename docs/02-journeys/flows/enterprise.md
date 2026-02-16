# Flow 4: Enterprise Evaluator

> OpEx Olivia evaluates VaRiScout for her team via self-serve journey
>
> **Priority:** Medium - self-serve, documentation-first
>
> See also: [Journeys Overview](../index.md) for site architecture

---

## Persona: OpEx Olivia

| Attribute         | Detail                                             |
| ----------------- | -------------------------------------------------- |
| **Role**          | OpEx Manager                                       |
| **Goal**          | Find tools for team                                |
| **Knowledge**     | Strategic, evaluates ROI                           |
| **Pain points**   | Budget constraints, IT approval, change management |
| **Entry points**  | Referral from colleague, LinkedIn, conference      |
| **Decision mode** | Needs security docs, deployment guide, pricing     |

### What Olivia is thinking:

- "My team needs better analysis tools"
- "Can I justify the cost vs Minitab?"
- "What's the IT/security story?"
- "How hard is deployment?"

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

### Mermaid Flowchart

```mermaid
flowchart TD
    A[Referral from colleague<br/>or conference] --> B[Homepage<br/>What is this? Who is it for?]
    B --> C{Path Choice}
    C -->|Learn more| D[/journey<br/>See methodology]
    C -->|Direct| E[/pricing]
    D --> F[I get it - now eval for team]
    F --> E
    E --> G[/product/enterprise]
    G --> H{Evaluation Questions}
    H -->|SSO/Security?| I[Documentation]
    H -->|Data hosting?| J[Your Azure, your data]
    H -->|Deployment?| K[1-click ARM template]
    H -->|Need help?| L[Your consultants can assist]
    I --> M{Decision}
    J --> M
    K --> M
    L --> M
    M -->|Self-serve| N[Purchase online + Deploy]
    M -->|Assisted| O[Consultant deployment]
```

### Enterprise Evaluation Journey

```mermaid
journey
    title Enterprise Evaluator Journey
    section Awareness
      Colleague recommendation: 4: User
      Quick homepage scan: 4: User
    section Understanding
      Explore methodology: 4: User
      See value proposition: 5: User
    section Evaluation
      Check security docs: 4: User
      Review deployment: 4: User
      Compare pricing: 4: User
    section Decision
      IT/Procurement review: 3: User
      Budget approval: 3: User
    section Deployment
      Self-serve purchase: 5: User
      ARM template deploy: 5: User
```

### Self-Serve Model

```mermaid
flowchart LR
    A[Discover] --> B[Evaluate]
    B --> C[Purchase]
    C --> D[Deploy]
    D --> E[Use]

    A -.->|Website, referral| A
    B -.->|Free tier, docs| B
    C -.->|Azure Marketplace| C
    D -.->|ARM template| D
    E -.->|Docs + email| E
```

### ASCII Reference

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
│            │        │
│ Now eval   │        │
│ for team   │────────┘
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
      ▼
┌─────────────────┐
│ Questions:      │
│                 │
│ • SSO/Security? │ → Documentation
│ • Data hosting? │ → "Your Azure, your data"
│ • Deployment?   │ → 1-click ARM template
│ • Need help?    │ → Your LSS/IT consultants can assist
└────────┬────────┘
      │
 ┌────┴────────────────┐
 │                     │
 ▼                     ▼
┌────────────┐  ┌─────────────────┐
│ SELF-SERVE │  │ NEED HELP?      │
│            │  │                 │
│ Purchase   │  │ Your existing   │
│ online     │  │ consultants     │
│ Deploy     │  │ can deploy it   │
└────────────┘  └─────────────────┘
```

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

- €150/month flat — all features, unlimited users in your tenant
- No per-user fees, no hidden costs
- Single plan, transparent pricing

### 4. Support

- Documentation-first
- Email support (support@rdmaic.com)
- "Your existing LSS/IT consultants can assist"

---

## Self-Serve Enterprise Model

Key principle: **No sales calls required**

| Step           | How It Works                                                  |
| -------------- | ------------------------------------------------------------- |
| Discover       | Website, referral, content                                    |
| Evaluate       | PWA (free), documentation, case studies                       |
| Purchase       | Azure Marketplace (€150/month, all features, unlimited users) |
| Deploy         | Managed Application (automatic)                               |
| Support        | Documentation + email (support@rdmaic.com)                    |
| Implementation | Your existing consultants can help                            |

---

## CTAs on This Journey

| Location        | CTA Text                         | Destination         |
| --------------- | -------------------------------- | ------------------- |
| Homepage        | "For Teams" or "Enterprise"      | /product/enterprise |
| Journey page    | "Deploy for your team"           | /product/enterprise |
| Pricing page    | "Enterprise details"             | /product/enterprise |
| Enterprise page | "Deploy Now" (Marketplace link)  | Azure Marketplace   |
| Enterprise page | "Get Started" (deployment guide) | /getting-started    |

---

## Information Olivia Needs

| Question                    | Answer Location          |
| --------------------------- | ------------------------ |
| What does it do?            | /journey, /tools         |
| Is it secure?               | /product/enterprise      |
| Where's my data?            | /product/enterprise      |
| How much does it cost?      | /pricing                 |
| How do I deploy?            | /getting-started         |
| Who supports it?            | support@rdmaic.com       |
| Can I try it first?         | /app (free, permanently) |
| What training is available? | Link to RDMAIC training  |

---

## Evaluator Erik (Secondary)

IT/Procurement evaluator may also be involved:

| Erik's Questions           | Answer                            |
| -------------------------- | --------------------------------- |
| Security architecture?     | Azure-native, your tenant         |
| Data residency?            | Your choice of Azure region       |
| Authentication?            | Azure AD SSO                      |
| Compliance certifications? | Azure compliance + our docs       |
| SLA?                       | Azure SLA                         |
| Exit strategy?             | Export all data, standard formats |

---

## Mobile Considerations

- Enterprise page should work on mobile (conference scanning)
- Key info visible without deep scrolling
- Easy path to schedule demo or download docs
- QR codes on printed materials

---

## Success Metrics

| Metric                         | Target |
| ------------------------------ | ------ |
| Homepage → Enterprise page     | Track  |
| Enterprise page → Deployment   | >5%    |
| Enterprise page → Contact      | >2%    |
| ARM template downloads         | Track  |
| Time to purchase (first visit) | Track  |

---

## Gap: Enterprise Page Content Needed

Current gap identified:

The enterprise page needs:

- Full security documentation
- Deployment guide with screenshots
- Pricing calculator
- FAQ for IT/Procurement
- Customer logos / testimonials (when available)
