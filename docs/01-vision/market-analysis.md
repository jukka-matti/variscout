# Market Analysis & TAM Estimate

_Last updated: February 2026_

VariScout plays in the intersection of **SPC software**, **Lean Six Sigma training tools**, and **lightweight quality analytics**.

---

## Market Context

| Market                      | Size (2025) | CAGR  | Source                   |
| --------------------------- | ----------- | ----- | ------------------------ |
| SPC Software (global)       | ~$1.05B     | ~12%  | Verified Market Research |
| Quality Management Software | ~$12B       | ~10%  | Grand View Research      |
| Lean Six Sigma Services     | ~$6.8B      | ~8.7% | VMR                      |

---

## TAM: Three Addressable Layers

### Layer 1 — SPC Software Replacement (Primary)

**Who:** Manufacturing companies currently using Minitab, InfinityQS, PQ Systems, or Excel for SPC.

VariScout doesn't compete with the full Minitab suite (DOE, hypothesis testing, predictive). It competes for the **"I just need to see my variation"** segment — quality engineers who use 20% of Minitab's features but pay 100% of the price.

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

**Who:** Quality professionals who live in Excel and want SPC without leaving it.

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
│  Layer 1: SPC Replacement        €90–160M/year         │
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
- **SMBs with 5–200 employees** — sweet spot for €150/month flat pricing
- **Manufacturing, food, pharma** — core verticals with SPC need

### SOM (Serviceable Obtainable Market): €100K–1M/year

Near-term realistic capture (solo founder, no sales team):

| Milestone         | Customers | ARR   | Timeline |
| ----------------- | --------- | ----- | -------- |
| Ramen profitable  | 50        | €90K  | Year 1   |
| Sustainable indie | 200       | €360K | Year 2   |
| Growth mode       | 500       | €900K | Year 3   |

---

## Competitive Positioning

| Segment         | Incumbent                    | VariScout Advantage                    | VariScout Weakness      |
| --------------- | ---------------------------- | -------------------------------------- | ----------------------- |
| Full SPC suites | Minitab (~$1,800/user/yr)    | 10× cheaper for teams, zero install    | Fewer statistical tests |
| Enterprise QMS  | InfinityQS ($50–100/user/mo) | No implementation cost, instant deploy | No MES/ERP integration  |
| Excel SPC       | PQ Systems ($595 perpetual)  | Free Add-in, modern UX                 | Less mature             |
| Free tools      | R, Python, Sheets            | No coding required, guided workflows   | Less flexible           |
| Training tools  | Minitab academic licenses    | Free PWA, browser-based                | Less brand recognition  |

### Pricing Comparison

| Product    | Model                  | Price                | VariScout Equivalent          |
| ---------- | ---------------------- | -------------------- | ----------------------------- |
| Minitab    | Per-user, annual       | ~€135–155/user/month | €150/month unlimited users    |
| InfinityQS | Per-user, subscription | €50–100/user/month   | €150/month unlimited users    |
| PQ Systems | Perpetual license      | ~€595 one-time       | Free Excel + €150/month Azure |
| VariScout  | Per-deployment         | €150/month all users | —                             |

> **Key insight:** VariScout is Minitab-priced per seat, but unlimited users. A team of 3+ saves money vs Minitab immediately. For a team of 10, it's 10× cheaper.

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

> VariScout's TAM is **real but niche** (~€100–200M). The product sits in a genuine gap between expensive enterprise SPC suites and DIY spreadsheet/coding approaches. The €150/month flat pricing makes the math work — **200 customers = €360K ARR**, a strong indie SaaS outcome.
>
> The biggest variable isn't market size — it's **distribution**. Azure Marketplace reach and the free-to-paid funnel (Excel Add-in → Azure App) will determine whether VariScout captures 50 or 5,000 customers.

---

## See Also

- [Product Overview](product-overview.md) — What we built and why
- [Philosophy](philosophy.md) — EDA for process improvement
- [Products & Pricing](../08-products/index.md) — Distribution strategy
- [ADR-007](../07-decisions/adr-007-azure-marketplace-distribution.md) — Azure Marketplace decision
