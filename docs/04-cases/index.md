# VaRiScout Lite Case Studies

## 12-Week Content Calendar

Case studies mapped to the marketing content calendar. Each case provides data, teaching materials, and video content for its scheduled week.

---

## Case Portfolio

| Week | Case              | Location             | Primary Analysis                          | Campaign Phase  |
| ---- | ----------------- | -------------------- | ----------------------------------------- | --------------- |
| 1-4  | **Bottleneck**    | ESTIEM training      | Process flow, I-Chart, Boxplot            | Phase 1: Launch |
| 5-8  | **Hospital Ward** | Healthcare           | Aggregation trap, time patterns           | Phase 2: Deepen |
| 9-12 | **Coffee**        | East Africa          | Factor comparison                         | Phase 3: Apply  |
| 9-12 | **Packaging**     | Africa manufacturing | Pareto, capability, process diagnosis     | Phase 3: Apply  |
| 12   | **Avocado**       | Post-harvest         | Regression (requires regression — future) | Phase 3: Apply  |

---

## Phase 1: Launch (Weeks 1-4)

### Bottleneck Case (`bottleneck/`)

**Week 1 Featured Case - Conversion Video**

A process with 5 steps. Step 3 was blamed for delays. The manager wanted to invest in Step 3 equipment. But when we actually see the data... Step 2 had 3x the variation.

| File        | Description                          |
| ----------- | ------------------------------------ |
| `README.md` | Case overview and teaching points    |
| `data.csv`  | 150 observations (5 steps × 30 each) |

**Key insight:** "What's hiding in YOUR process?"

**Website:** `/cases/bottleneck`

---

## Phase 2: Deepen (Weeks 5-8)

### Hospital Ward Case (`hospital-ward/`)

**Week 5 Featured Case - Aggregation Trap**

The dashboard showed 75% average occupancy. Everything looked fine. But hidden in the hourly data: 95% crisis at night, 50% waste in the afternoon.

| File        | Description                           |
| ----------- | ------------------------------------- |
| `README.md` | Case overview and teaching points     |
| `data.csv`  | 672 observations (28 days × 24 hours) |

**Key insight:** "What your daily average hides"

**Website:** `/cases/hospital-ward`

---

## Phase 3: Apply (Weeks 9-12)

### Coffee Case (`coffee/`)

**Week 9-11 Featured Case - Africa Context**

Drying Bed C consistently fails export spec. Is it the bed, the operator, or the measurement? VaRiScout reveals the pattern in 30 seconds.

| File                  | Description                                  |
| --------------------- | -------------------------------------------- |
| `README.md`           | Case overview and teaching points            |
| `washing-station.csv` | 30 batches with moisture % and defect counts |

**Teaching points:**

- Factor comparison (Boxplot by drying bed)
- Spec limits in context (I-Chart)

**Website:** `/cases/coffee`

### Packaging Case (`packaging/`)

**Week 9-11 Featured Case - Africa Context**

Night shift is systematically underfilling. Is it the operators, the equipment, or the measurement? Two datasets tell the complete story.

| File              | Description                                         |
| ----------------- | --------------------------------------------------- |
| `README.md`       | Case overview covering defects and process analysis |
| `defects.csv`     | Daily defect tracking by product and type           |
| `fillweights.csv` | 120 fill weight measurements by shift               |

**Teaching points:**

- Pareto prioritization (defect types)
- Process diagnosis (connecting defects to measurements)

**Website:** `/cases/packaging`

### Avocado Case (`avocado/`)

**Week 12 Featured Case - AI Comparison**

Regression shows coating amount predicts shelf life (R² ~ 0.72). What factors explain the remaining variation?

| File                     | Description                                        |
| ------------------------ | -------------------------------------------------- |
| `README.md`              | Case overview covering regression analysis         |
| `coating-regression.csv` | 120 observations with coating, process, shelf life |

**Teaching points:**

- Regression interpretation (slope, R², prediction)
- Categorical factors (Spray vs. Dip, Carnauba vs. Polyethylene)

**Website:** `/cases/avocado`

---

## Additional Cases (Future Use)

### Oven Zones (`oven-zones/`)

_Not currently in 12-week calendar. Kept for future content._

Multi-zone oven temperature analysis for Performance Mode demonstrations.

| File        | Description   |
| ----------- | ------------- |
| `README.md` | Case overview |

### Machine Utilization (`machine-utilization/`)

_Not currently in 12-week calendar. Kept for future content._

Packaging machine stoppage analysis. Production manager requests €180,000 for second machine. Data reveals it's not capacity—it's workflow.

| File                      | Description            |
| ------------------------- | ---------------------- |
| `README.md`               | Case overview          |
| `week2_enhanced.csv`      | Enhanced stoppage data |
| `week2_pareto_counts.csv` | Pareto count data      |

---

## Folder Structure

```
docs/cases/
├── README.md              # This file
├── bottleneck/            # Week 1 - ESTIEM/Conversion
│   ├── README.md
│   └── data.csv
├── hospital-ward/         # Week 5 - Aggregation
│   ├── README.md
│   └── data.csv
├── coffee/                # Week 9 - Africa
│   ├── README.md
│   └── washing-station.csv
├── packaging/             # Week 9 - Africa
│   ├── README.md
│   ├── defects.csv
│   └── fillweights.csv
├── avocado/               # Week 12 - Regression
│   ├── README.md
│   └── coating-regression.csv
├── oven-zones/           # Future use
│   └── README.md
└── machine-utilization/   # Future use
    ├── README.md
    └── *.csv
```

---

## Website URL Mapping

| Case          | Website URL            | Source                      |
| ------------- | ---------------------- | --------------------------- |
| Bottleneck    | `/cases/bottleneck`    | `docs/cases/bottleneck/`    |
| Hospital Ward | `/cases/hospital-ward` | `docs/cases/hospital-ward/` |
| Coffee        | `/cases/coffee`        | `docs/cases/coffee/`        |
| Packaging     | `/cases/packaging`     | `docs/cases/packaging/`     |
| Avocado       | `/cases/avocado`       | `docs/cases/avocado/`       |

---

## AI Comparison Videos (Week 4, 8, 12)

> **Note:** The Week 12 Avocado comparison depends on the regression module, which is deferred to Phase 2 (see [ADR-014](../07-decisions/adr-014-regression-deferral.md)).

Every 4th week features a 3-way comparison:

| Week | Case          | Video Title                                            |
| ---- | ------------- | ------------------------------------------------------ |
| 4    | Bottleneck    | "VaRiScout vs Copilot Analyst: Finding the Bottleneck" |
| 8    | Hospital Ward | "Can AI Find Hidden Patterns?"                         |
| 12   | Avocado       | "Can AI Find the Relationship?"                        |

---

_Case studies developed for VaRiScout Lite demonstration_
_Target audience: Lean Six Sigma Green Belt trainees_
