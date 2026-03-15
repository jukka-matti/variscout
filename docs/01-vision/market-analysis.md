# Market Analysis & TAM Estimate

_Last updated: February 2026_

VariScout plays in the intersection of **quality analytics software**, **Lean Six Sigma training tools**, and **process improvement workflows**.

---

## Market Context

| Market                      | Size (2025) | CAGR  | Source                   |
| --------------------------- | ----------- | ----- | ------------------------ |
| SPC Software (global)       | ~$1.05B     | ~12%  | Verified Market Research |
| Quality Management Software | ~$12B       | ~10%  | Grand View Research      |
| Lean Six Sigma Services     | ~$6.8B      | ~8.7% | VMR                      |

---

## TAM: Three Addressable Layers

### Layer 1 — Lightweight Quality Analytics (Primary)

**Who:** Manufacturing companies currently using Minitab, InfinityQS, PQ Systems, or Excel for variation analysis.

VariScout doesn't compete with the full Minitab suite (DOE, hypothesis testing, predictive). It competes for the **"I just need to see my variation"** segment — quality engineers who use 20% of Minitab's features but pay 100% of the price. The reference market is "SPC Software" (~$1.05B) in industry reports, but VariScout targets the variation investigation slice, not the full SPC category.

| Assumption                    | Value              | Rationale                          |
| ----------------------------- | ------------------ | ---------------------------------- |
| Global SPC software market    | $1.05B             | Market reports 2025                |
| VariScout's addressable slice | ~10–15%            | Lightweight/EDA segment only       |
| Estimated deployment sites    | ~50K–100K          | Manufacturing plants, food, pharma |
| **TAM (Layer 1)**             | **~€90–160M/year** | At €1,800/year per site            |

### Layer 2 — LSS Training Funnel (Secondary)

**Who:** Lean Six Sigma training providers, universities, and corporate training programs needing a free/cheap Minitab alternative for Green Belt courses.

| Assumption                      | Value            | Rationale                         |
| ------------------------------- | ---------------- | --------------------------------- |
| LSS certified professionals     | ~3–5M worldwide  | MSI estimates                     |
| New Green Belts trained/year    | ~200K–500K       | Based on training market growth   |
| Training programs needing tools | ~5,000–10,000    | Universities + corporate programs |
| Convert to paid after training  | ~10–20%          | Most use the free PWA             |
| **TAM (Layer 2)**               | **~€5–15M/year** | Corporate upgrades to Azure App   |

!!! note
Most training revenue comes from the **free PWA** driving awareness, not direct sales. The TAM here flows from corporate training departments that upgrade to Azure App for internal use after discovering VariScout through training.

### Layer 3 — Excel-Native Quality Analytics (Tertiary)

**Who:** Quality professionals who live in Excel and want variation analysis without leaving it. [Shelved — Excel Add-in removed Feb 2026]

| Assumption                        | Value             | Rationale                    |
| --------------------------------- | ----------------- | ---------------------------- |
| Microsoft 365 business users      | ~400M             | Microsoft reports            |
| Users doing quality work in Excel | ~2–5M             | Rough estimate               |
| Install a free Add-in             | ~5–10%            | AppSource discovery rate     |
| Convert Add-in → Azure App        | ~1–3%             | Typical free-to-paid funnel  |
| **TAM (Layer 3)**                 | **~€10–25M/year** | Via Excel → Azure App funnel |

---

## TAM Summary

```
┌────────────────────────────────────────────────────────┐
│                 TOTAL ADDRESSABLE MARKET                │
│                                                        │
│  Layer 1: Quality Analytics       €90–160M/year         │
│  Layer 2: LSS Training Funnel    €5–15M/year           │
│  Layer 3: Excel Funnel           €10–25M/year          │
│  ─────────────────────────────────────                  │
│  TOTAL TAM                       €105–200M/year        │
│                                                        │
│  SAM (Serviceable)               €10–30M/year          │
│  SOM (Obtainable, Year 1-3)      €0.1–1M/year          │
└────────────────────────────────────────────────────────┘
```

---

## SAM → SOM Narrowing

### SAM (Serviceable Addressable Market): €10–30M/year

Narrowed by:

- **Microsoft ecosystem only** — Azure Marketplace + AppSource
- **English/EU markets first** — initial language and compliance reach
- **SMBs with 5–200 employees** — sweet spot for from-€99/month flat pricing
- **Manufacturing, food, pharma** — core verticals with variation analysis need

### SOM (Serviceable Obtainable Market): €100K–1M/year

Near-term realistic capture (solo founder, no sales team):

| Milestone         | Customers | ARR   | Timeline |
| ----------------- | --------- | ----- | -------- |
| Ramen profitable  | 50        | €90K  | Year 1   |
| Sustainable indie | 200       | €360K | Year 2   |
| Growth mode       | 500       | €900K | Year 3   |

---

## Competitive Positioning

| Segment                 | Incumbent                    | VariScout Advantage                    | VariScout Weakness      |
| ----------------------- | ---------------------------- | -------------------------------------- | ----------------------- |
| Full-suite SPC tools    | Minitab (~$1,800/user/yr)    | 10× cheaper for teams, zero install    | Fewer statistical tests |
| Enterprise QMS          | InfinityQS ($50–100/user/mo) | No implementation cost, instant deploy | No MES/ERP integration  |
| Excel quality analytics | PQ Systems ($595 perpetual)  | Free Add-in, modern UX                 | Less mature             |
| Free tools              | R, Python, Sheets            | No coding required, guided workflows   | Less flexible           |
| Training tools          | Minitab academic licenses    | Free PWA, browser-based                | Less brand recognition  |

### Pricing Comparison

| Product    | Model                  | Price                | VariScout Equivalent            |
| ---------- | ---------------------- | -------------------- | ------------------------------- |
| Minitab    | Per-user, annual       | ~€135–155/user/month | From €99/month unlimited users  |
| InfinityQS | Per-user, subscription | €50–100/user/month   | From €99/month unlimited users  |
| PQ Systems | Perpetual license      | ~€595 one-time       | Free PWA + from €99/month Azure |
| VariScout  | Per-deployment         | €99–299/month        | —                               |

> **Key insight:** VariScout is Minitab-priced per seat, but unlimited users. A team of 3+ saves money vs Minitab immediately. For a team of 10, it's 10× cheaper.

---

## AI Competitive Landscape

### Minitab AI (April 2025)

Minitab added AI that interprets existing statistics — "AI you can trust." AI never calculates, only explains. Privacy-first. VariScout's architecture aligns with this approach: deterministic-first, AI-explains.

**VariScout's differentiators vs Minitab AI:**

- **Closed-loop feedback:** VariScout's Finding system captures investigation outcomes with measured Cpk before/after. After 50+ resolved findings, AI has real organizational knowledge.
- **Team knowledge:** Minitab is single-user desktop. VariScout's Team plan connects findings across projects via Azure AI Search.
- **Unlimited users:** Minitab is per-seat (~€135-155/user/month). VariScout is per-deployment (from €99/month, unlimited users).

### ISO 9001:2026 + EU AI Act

- **ISO 9001:2026** (DIS approved, final publication Sept 2026): Emphasizes digitalization and data-driven decisions. VariScout's measured investigation → action → verification workflow aligns directly.
- **EU AI Act** (high-risk obligations effective August 2, 2026): Requires human oversight, transparency, risk management. VariScout's deterministic-first architecture is naturally compliant: "The statistical engine identified the pattern. AI explained it. Both are auditable."
- **Marketing opportunity:** "AI you can audit" — measurement-backed knowledge vs subjective RPN scores.

---

## Key Risks

| Risk                                  | Impact                    | Mitigation                          |
| ------------------------------------- | ------------------------- | ----------------------------------- |
| Azure Marketplace low discoverability | SOM shrinks significantly | Content marketing, direct outreach  |
| Minitab launches lightweight tier     | TAM Layer 1 compresses    | Speed to market, UX differentiation |
| Buyers expect per-user pricing        | Lose enterprise deals     | Consider metered add-on later       |
| Free tools (R/Python) good enough     | Training TAM shrinks      | Focus on non-technical users        |

---

## Bottom Line

> VariScout's TAM is **real but niche** (~€100–200M). The product sits in a genuine gap between expensive SPC suites (used at 20% capacity) and DIY spreadsheet approaches. The from-€99/month flat pricing (three plans: Standard €99, Team €199, Team AI €279) keeps the barrier low for individuals while capturing collaboration value from teams.
>
> The biggest variable isn't market size — it's **distribution**. Azure Marketplace reach and the free-to-paid funnel (PWA → Azure App) will determine whether VariScout captures 50 or 5,000 customers.

---

## See Also

- [Product Overview](product-overview.md) — What we built and why
- [Philosophy](philosophy.md) — EDA for process improvement
- [Products & Pricing](../08-products/index.md) — Distribution strategy
- [ADR-007](../07-decisions/adr-007-azure-marketplace-distribution.md) — Azure Marketplace decision
