---
title: 'Market Analysis & TAM Estimate'
audience: [business, analyst]
category: methodology
status: stable
last-reviewed: 2026-05-16
related: [adr-082, product-overview, positioning, pricing, feature-parity]
---

# Market Analysis & TAM Estimate

_Pricing assumptions revised 2026-05-16 (€120 single SKU) per [wedge spec](../superpowers/specs/2026-05-16-wedge-architecture-design.md) + [ADR-082](../07-decisions/adr-082-wedge-architecture.md). Underlying market sizing and TAM math is conservative-preserved from the prior analysis; only ICP scope and the price-per-account assumptions update._

VariScout plays in the intersection of **quality analytics software**, **Lean Six Sigma training tools**, and **process improvement workflows**.

V1 narrows the ICP to a **single persona — the Improvement Specialist** — sold via a single €120/month Azure-tenant-wide SKU. The legacy four-segment market analysis (quality engineer, training, Excel-funnel, enterprise process-ownership) is preserved below as the target market for **VariScout Process**, the future enterprise product.

---

## Market Context

| Market                      | Size (2025) | CAGR  | Source                   |
| --------------------------- | ----------- | ----- | ------------------------ |
| SPC Software (global)       | ~$1.05B     | ~12%  | Verified Market Research |
| Quality Management Software | ~$12B       | ~10%  | Grand View Research      |
| Lean Six Sigma Services     | ~$6.8B      | ~8.7% | VMR                      |

---

## V1 ICP — Improvement Specialist

The Specialist is a quality engineer, Lean practitioner, Six Sigma belt (Green / Black / MBB), CI engineer, or process analyst whose job is to _find and reduce variation in process data, then verify the fix worked_. They run projects, invite their team, and produce a Sponsor-signoff-ready report.

**Where they live:** SMB and mid-market manufacturing, food, pharma, medical device, and discrete-process services. Companies large enough to have a dedicated improvement specialist (or a belt-trained operations manager wearing the hat) but not large enough to run a formal Operational Excellence office with vendor procurement cycles. Sweet spot: **20–500 employees per site, 1–5 specialists per company**.

**Where they buy:** Azure Marketplace (Managed Application). The buyer's Azure tenant is the unit of distribution; project membership ACLs handle in-org scoping.

**Why €120 is the right number:** above the retired €79 Standard and €199 Team midpoint, reflecting full DMAIC arc value. €120/month = €1,440/year clears the typical €1,000 SME purchasing threshold comfortably while remaining well below per-seat alternatives for any team of 2+. Honors ADR-033's H6 hypothesis ("per-deployment beats per-seat") — €120 is per-deployment, unlimited org users, unlimited projects.

---

## TAM: V1

### Layer 1 — Structured Process Investigation (Primary, sole V1 layer)

**Who:** Organizations with improvement specialists using Minitab, InfinityQS, PQ Systems, or Excel for variation analysis and process improvement.

VariScout occupies a distinct category from the full Minitab suite (DOE, hypothesis testing, predictive). It serves the **"I need to investigate my process and fix it"** segment — improvement specialists running projects, not statisticians running batch tests. The reference market is "SPC Software" (~$1.05B) in industry reports; VariScout targets the variation-investigation slice with a question-driven methodology that no competitor offers.

| Assumption                    | Value              | Rationale                          |
| ----------------------------- | ------------------ | ---------------------------------- |
| Global SPC software market    | $1.05B             | Market reports 2025                |
| VariScout's addressable slice | ~10–15%            | Lightweight/EDA segment only       |
| Estimated deployment sites    | ~50K–100K          | Manufacturing plants, food, pharma |
| **TAM (V1)**                  | **~€90–160M/year** | At ~€1,440/year per site (€120/mo) |

TAM-per-site math is conservative-preserved from the prior estimate (€1,800/year per site) — the unit-price drop from ~€1,800 to ~€1,188 narrows per-account TAM modestly, while broader site coverage at lower price expands the addressable count. Net range stays inside €90–160M.

---

## SAM → SOM Narrowing (V1)

### SAM (Serviceable Addressable Market): €10–30M/year

Narrowed by:

- **Microsoft ecosystem only** — Azure Marketplace Managed Application distribution
- **English/EU markets first** — initial language and compliance reach
- **SMBs with 20–500 employees** — sweet spot for €120/month tenant-wide flat pricing
- **Manufacturing, food, pharma, med-device** — core verticals with variation analysis need
- **Single-org Azure tenants** — cross-AD-tenant collaboration is out of V1 scope (Azure AD guest accounts handle the edge case)

### SOM (Serviceable Obtainable Market): €100K–1M/year

Near-term realistic capture (solo founder, no sales team):

| Milestone         | Customers | ARR    | Timeline |
| ----------------- | --------- | ------ | -------- |
| Ramen profitable  | 50        | ~€60K  | Year 1   |
| Sustainable indie | 200       | ~€240K | Year 2   |
| Growth mode       | 500       | ~€600K | Year 3   |

ARR figures revised from the prior €79 baseline to reflect €120 single-SKU economics (no €199 Team upgrade lever in V1; the upgrade story lives with VariScout Process when it ships).

---

## Competitive Positioning (V1)

| Segment                 | Incumbent                    | VariScout V1 Advantage                   | VariScout V1 Weakness   |
| ----------------------- | ---------------------------- | ---------------------------------------- | ----------------------- |
| Full-suite SPC tools    | Minitab (~$1,800/user/yr)    | 10× cheaper for teams, zero install      | Fewer statistical tests |
| Enterprise QMS          | InfinityQS ($50–100/user/mo) | No implementation cost, instant deploy   | No MES/ERP integration  |
| Excel quality analytics | PQ Systems ($595 perpetual)  | Browser-based, modern UX, methodology    | Less mature             |
| Free tools              | R, Python, Sheets            | No coding required, guided workflows     | Less flexible           |
| Training tools          | Minitab academic licenses    | Free PWA, browser-based, methodology-led | Less brand recognition  |

### Pricing Comparison

| Product      | Model                  | Price                | VariScout V1 Equivalent                       |
| ------------ | ---------------------- | -------------------- | --------------------------------------------- |
| Minitab      | Per-user, annual       | ~€135–155/user/month | €120/month, unlimited org users (tenant-wide) |
| InfinityQS   | Per-user, subscription | €50–100/user/month   | €120/month, unlimited org users               |
| PQ Systems   | Perpetual license      | ~€595 one-time       | Free PWA + €120/month Azure                   |
| VariScout V1 | Per-Azure-tenant       | €120/month           | —                                             |

> **Key insight:** VariScout V1 is Minitab-priced per seat, but unlimited org users tenant-wide. A team of 3+ specialists saves money vs Minitab immediately. For a team of 10, it's 10× cheaper. Project membership ACLs scope individual project access without per-seat billing.

---

## AI Competitive Landscape

### Minitab AI (April 2025)

Minitab added AI that interprets existing statistics — "AI you can trust." AI never calculates, only explains. Privacy-first. VariScout's architecture aligns: deterministic-first, AI-explains (CoScout never overrides the stats engine).

**VariScout V1's differentiators vs Minitab AI:**

- **Closed-loop feedback:** VariScout's Finding system captures investigation outcomes with measured Cpk before/after. After 50+ resolved findings, AI has real organizational knowledge per project.
- **Project-scoped team knowledge:** Minitab is single-user desktop. VariScout V1's project membership model brings Members + Sponsor into the same project; Knowledge Catalyst surfaces resolved-finding patterns within and across the org's projects.
- **Unlimited org users:** Minitab is per-seat (~€135–155/user/month). VariScout V1 is per-Azure-tenant (€120/month, unlimited org users).

### ISO 9001:2026 + EU AI Act

- **ISO 9001:2026** (DIS approved, final publication Sept 2026): emphasizes digitalization and data-driven decisions. VariScout's measured investigation → action → verification workflow aligns directly.
- **EU AI Act** (high-risk obligations effective August 2, 2026): requires human oversight, transparency, risk management. VariScout's deterministic-first architecture is naturally compliant — "the statistical engine identified the pattern, AI explained it, both are auditable."
- **Marketing opportunity:** "AI you can audit" — measurement-backed knowledge vs subjective RPN scores.

---

## Key Risks (V1)

| Risk                                       | Impact                            | Mitigation                                                                                                            |
| ------------------------------------------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Azure Marketplace low discoverability      | SOM shrinks significantly         | Content marketing, direct outreach, PWA funnel                                                                        |
| Minitab launches investigation features    | TAM Layer 1 compresses            | Methodology depth, question-driven UX, Wall + Plans                                                                   |
| Cross-tenant collaboration demand          | ICP narrows further than expected | Azure AD guest accounts; revisit SaaS distribution if pipeline shows it                                               |
| €79→€120 migration churn (pre-V1, retired) | Revenue dip on transition         | Grandfathering window (see [V1 architecture spec §8.1](../superpowers/specs/2026-05-16-wedge-architecture-design.md)) |
| No €199 upgrade lever in V1                | Lower ARPU until Process ships    | VariScout Process becomes the enterprise expansion product when V1 validates                                          |

---

## Bottom Line (V1)

> VariScout V1's TAM is **real but niche** (~€100–200M). The product sits in a genuine gap between expensive per-seat SPC suites and DIY spreadsheet approaches. The €120/month tenant-wide flat pricing keeps the barrier low for SMBs while project membership ACLs scope team access without per-seat billing.
>
> The biggest variable isn't market size — it's **distribution**. Azure Marketplace reach and the free-to-paid funnel (PWA → Azure €120) will determine whether VariScout captures 50 or 5,000 customers.

---

## VariScout Process — future enterprise market

The four-segment market analysis below is **retained as the target market for VariScout Process**, the future enterprise product. It is not V1 ICP and is not addressed in V1 marketing. Mentioned only when customers ask about enterprise / process-ownership use cases.

### Process Layer A — Hub Portfolio Customers

**Who:** Enterprises with ongoing process ownership, multi-process portfolios, dedicated Operational Excellence offices. Buyers are VP Operations / Director Quality / Chief OpEx Officer.

| Assumption                                  | Value                              | Rationale                                                    |
| ------------------------------------------- | ---------------------------------- | ------------------------------------------------------------ |
| Large-enterprise sites (Fortune 5000-equiv) | ~50K–100K                          | Multi-site manufacturers + multi-facility service operations |
| Addressable portfolio share                 | ~20–30%                            | Companies with formal CI/OpEx programs                       |
| **TAM (Process Layer A)**                   | **TBD — separate product roadmap** | Pricing TBD                                                  |

### Process Layer B — LSS Training Funnel

**Who:** Lean Six Sigma training providers, universities, corporate training programs. Free PWA continues to serve this funnel for V1; the _paid_ training-to-org-upgrade motion is enterprise-shaped and migrates with VariScout Process.

| Assumption                      | Value            | Rationale                                                                 |
| ------------------------------- | ---------------- | ------------------------------------------------------------------------- |
| LSS certified professionals     | ~3–5M worldwide  | MSI estimates                                                             |
| New Green Belts trained/year    | ~200K–500K       | Based on training market growth                                           |
| Training programs needing tools | ~5,000–10,000    | Universities + corporate programs                                         |
| Convert to paid after training  | ~10–20%          | Most use the free PWA                                                     |
| **TAM (training funnel)**       | **~€5–15M/year** | V1 captures the funnel via the €120 SKU; enterprise training spend defers |

> The PWA continues to drive awareness for V1 specialist upgrades to the €120 plan; the enterprise / multi-org training procurement TAM is a Process expansion lever.

### Process Layer C — Excel-Native Quality Analytics (Shelved)

**Who:** Quality professionals who live in Excel. [Shelved — Excel Add-in removed Feb 2026.] The funnel arithmetic from the prior analysis is retained below for reference; not addressed in V1.

| Assumption                        | Value             | Rationale                       |
| --------------------------------- | ----------------- | ------------------------------- |
| Microsoft 365 business users      | ~400M             | Microsoft reports               |
| Users doing quality work in Excel | ~2–5M             | Rough estimate                  |
| Install a free Add-in             | ~5–10%            | AppSource discovery rate        |
| Convert Add-in → paid             | ~1–3%             | Typical free-to-paid funnel     |
| **TAM (Excel funnel)**            | **~€10–25M/year** | Reference only — Add-in shelved |

### Process Layer D — Multi-Persona Process Ownership

**Who:** Enterprises running the 4-persona model (Process Owner / Project Lead / SME / Frontline) with automated data pipelines and Hub-level cadence monitoring. This is the canonical VariScout Process audience. See [four-personas.md](variscout-process/four-personas.md) for the full design; V1 spec §3.5 documents the persona collapse.

| Aspect       | Value                                                              |
| ------------ | ------------------------------------------------------------------ |
| Audience     | Enterprises with formal CI/OpEx + process-ownership infrastructure |
| Distribution | TBD — separate product                                             |
| Pricing      | TBD                                                                |
| **TAM**      | **TBD — separate product roadmap**                                 |

VariScout Process is not announced in V1 marketing. The roadmap commitment exists; the go-to-market doesn't.

---

## See Also

- [Wedge architecture spec](../superpowers/specs/2026-05-16-wedge-architecture-design.md) — V1 canonical anatomy
- [ADR-082](../07-decisions/adr-082-wedge-architecture.md) — Wedge architecture decision (supersedes ADR-007 + ADR-033 in part)
- [Product Overview](product-overview.md) — What VariScout V1 does
- [Philosophy](philosophy.md) — EDA for process improvement
- [Feature Parity](../08-products/feature-parity.md) — PWA vs Azure (€120) capability matrix
- [ADR-007](../07-decisions/adr-007-azure-marketplace-distribution.md) — Azure Marketplace distribution (superseded in part by ADR-082)
- [ADR-033](../archive/adrs/adr-033-pricing-simplification.md) — Pricing simplification (superseded by ADR-082, archived 2026-05-17)
