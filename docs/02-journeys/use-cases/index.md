# Use Cases

Strategic use cases grounded in VariScout's actual capabilities. Each describes a specific problem that brings searchers to VariScout, the analysis journey they take, and website content opportunities.

These use cases complement the [personas](../personas/) (who finds VariScout) by describing **what problems bring them in**.

---

## SEO Scoring

Each use case is scored across five dimensions (1-5 scale):

- **Volume** — Monthly search volume for primary keywords
- **Intent** — How likely the searcher is to need a tool (not just information)
- **Competition** — Inverse: lower competition = higher score opportunity
- **Content Fit** — How well VariScout's features solve the stated problem
- **Keyword Cluster** — Breadth of related queries that can be targeted

| Pick | Use Case                                              | Volume | Intent | Comp. | Fit | Cluster | **Score** | Industry              |
| ---- | ----------------------------------------------------- | ------ | ------ | ----- | --- | ------- | --------- | --------------------- |
| 1    | [Supplier Performance](supplier-performance.md)       | 5      | 5      | 4     | 5   | 5       | **24**    | Supply Chain          |
| 2    | [University SPC](university-spc.md)                   | 5      | 5      | 4     | 5   | 5       | **24**    | Education             |
| 3    | [Assembly Bottleneck](bottleneck-analysis.md)         | 4      | 4      | 4     | 5   | 5       | **22**    | Manufacturing         |
| 4    | [Supplier PPAP](supplier-ppap.md)                     | 4      | 5      | 3     | 5   | 5       | **22**    | Automotive            |
| 5    | [COPQ Drill-Down](copq-drilldown.md)                  | 4      | 5      | 3     | 5   | 4       | **21**    | Cross-industry        |
| 6    | [Customer Complaint](complaint-investigation.md)      | 4      | 4      | 4     | 5   | 4       | **21**    | Cross-industry        |
| 7    | [Patient Wait Time](patient-wait-time.md)             | 4      | 3      | 3     | 4   | 4       | **18**    | Healthcare            |
| 8    | [Call Center Performance](call-center-performance.md) | 4      | 3      | 4     | 3   | 4       | **18**    | Service Ops           |
| 9    | [On-Time Delivery](on-time-delivery.md)               | 3      | 3      | 3     | 3   | 3       | **15**    | Logistics             |
| 10   | [Pharma OOS](pharma-oos.md)                           | 3      | 5      | 3     | 4   | 4       | **19**    | Pharma                |
| 11   | [Consultant Delivery](consultant-delivery.md)         | 3      | 4      | 2     | 5   | 3       | **17**    | Professional Services |
| 12   | [Batch Consistency](batch-consistency.md)             | 3      | 4      | 3     | 4   | 4       | **18**    | Food / Chemical       |
| 13   | [Lead Time Variation](lead-time-variation.md)         | 4      | 4      | 3     | 4   | 4       | **19**    | Supply Chain          |

---

## Theme Groupings

### Drill-Down Reveals Hidden Structure

Use cases where averages mislead and stratification exposes the real story.

| Use Case                                              | The Misleading Average             | What Drill-Down Reveals                                       |
| ----------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------- |
| [Supplier Performance](supplier-performance.md)       | "All suppliers meet spec"          | Supplier C fails dimension B; 80% of rejects from 2 suppliers |
| [COPQ Drill-Down](copq-drilldown.md)                  | "Scrap is 3% overall"              | Product X + Line 2 + Night shift = 52% of total COPQ          |
| [Batch Consistency](batch-consistency.md)             | "Same recipe, same result"         | Vessel 2 + Supplier B raw material = poor batches             |
| [Call Center Performance](call-center-performance.md) | "Average handle time meets target" | Agent C + Issue Type 3 = specific training gap                |

### The Aggregation Trap

Use cases where the overall metric hides critical variation.

| Use Case                                      | The Aggregated Metric                | What's Hidden                                                        |
| --------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| [Assembly Bottleneck](bottleneck-analysis.md) | "Station 3 has highest average time" | Station 2 has 3x the variation — unpredictability is the bottleneck  |
| [Patient Wait Time](patient-wait-time.md)     | "Average wait: 45 minutes"           | Night shift: 95% utilization, 2-hour waits hidden by daytime lulls   |
| [Lead Time Variation](lead-time-variation.md) | "Average lead time: 5 days"          | Supplier X fine for small orders, wildly inconsistent for large ones |

### Multi-Channel Capability

Use cases that leverage Performance Mode to compare parallel processes.

| Use Case                          | The Channels                        | Key Metric                                  |
| --------------------------------- | ----------------------------------- | ------------------------------------------- |
| [Supplier PPAP](supplier-ppap.md) | Critical characteristics / cavities | Cpk per characteristic, worst-first ranking |
| [Pharma OOS](pharma-oos.md)       | Batches / analysts / instruments    | Cpk vs acceptance criteria, Gage R&R        |

### Capability vs SLA

Use cases where process capability is measured against a service target.

| Use Case                                         | The SLA               | Capability Question                        |
| ------------------------------------------------ | --------------------- | ------------------------------------------ |
| [On-Time Delivery](on-time-delivery.md)          | Deliver within 3 days | Which carrier/route/product fails the SLA? |
| [Customer Complaint](complaint-investigation.md) | Product consistency   | What changed during the complaint period?  |

### Education & Adoption

Use cases focused on learning methodology and spreading tool adoption.

| Use Case                                      | Entry Point          | Conversion Path                               |
| --------------------------------------------- | -------------------- | --------------------------------------------- |
| [University SPC](university-spc.md)           | Course link / Google | Free PWA forever, case studies as assignments |
| [Consultant Delivery](consultant-delivery.md) | Client meeting demo  | Free PWA for client, Azure App for team       |

---

## Content Phasing

### Phase 1 — Core, Highest SEO Impact

| Use Case                                         | SEO Score | Priority Reason                                        |
| ------------------------------------------------ | --------- | ------------------------------------------------------ |
| [Supplier Performance](supplier-performance.md)  | 24        | Massive keyword cluster, growing supply chain interest |
| [University SPC](university-spc.md)              | 24        | Highest volume, direct PWA conversion                  |
| [Assembly Bottleneck](bottleneck-analysis.md)    | 22        | Cross-industry appeal, compelling narrative            |
| [Supplier PPAP](supplier-ppap.md)                | 22        | High-intent automotive, buyers know what they need     |
| [COPQ Drill-Down](copq-drilldown.md)             | 21        | High-value keyword, universal manufacturing pain       |
| [Customer Complaint](complaint-investigation.md) | 21        | Universal, every manufacturer searches this            |

### Phase 2 — Founder Stories & Services

| Use Case                                              | SEO Score | Priority Reason                                |
| ----------------------------------------------------- | --------- | ---------------------------------------------- |
| [Patient Wait Time](patient-wait-time.md)             | 18        | Founder hospital experience, authentic stories |
| [Call Center Performance](call-center-performance.md) | 18        | Founder call center experience, credibility    |
| [On-Time Delivery](on-time-delivery.md)               | 15        | Distinct logistics angle, OTD as universal KPI |

### Phase 3 — Niche & Multiplier

| Use Case                                      | SEO Score | Priority Reason                                                 |
| --------------------------------------------- | --------- | --------------------------------------------------------------- |
| [Pharma OOS](pharma-oos.md)                   | 19        | High intent, regulated industry                                 |
| [Consultant Delivery](consultant-delivery.md) | 17        | Multiplier effect — consultants bring VariScout to every client |
| [Batch Consistency](batch-consistency.md)     | 18        | Broad manufacturing / food appeal                               |
| [Lead Time Variation](lead-time-variation.md) | 19        | Growing supply chain interest                                   |

---

## Industry Coverage

| Industry              | Use Cases                                 | Count |
| --------------------- | ----------------------------------------- | ----- |
| Manufacturing         | Bottleneck, Batch Consistency             | 2     |
| Supply Chain          | Supplier Performance, Lead Time Variation | 2     |
| Automotive            | Supplier PPAP                             | 1     |
| Pharma                | Pharma OOS                                | 1     |
| Education             | University SPC                            | 1     |
| Food / Chemical       | Batch Consistency                         | 1     |
| Healthcare            | Patient Wait Time                         | 1     |
| Service Operations    | Call Center Performance                   | 1     |
| Logistics             | On-Time Delivery                          | 1     |
| Professional Services | Consultant Delivery                       | 1     |
| Cross-industry        | COPQ, Customer Complaint                  | 2     |

---

## Relationship to Personas

These use cases describe **problems**; [personas](../personas/) describe **people**. They work together:

| Persona         | Most Likely Use Cases                                     |
| --------------- | --------------------------------------------------------- |
| Green Belt Gary | Supplier Performance, COPQ, Bottleneck, Batch Consistency |
| Curious Carlos  | Bottleneck, Customer Complaint, Lead Time                 |
| Student Sara    | University SPC                                            |
| Trainer Tina    | University SPC, Consultant Delivery                       |
| OpEx Olivia     | COPQ, Supplier PPAP, Multi-site (future)                  |
| Evaluator Erik  | Supplier Performance, Patient Wait Time, Call Center      |
