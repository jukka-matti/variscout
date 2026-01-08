# VaRiScout Lite Case Studies

## 12-Week Content Calendar

Case studies mapped to the marketing content calendar. Each case provides data, teaching materials, and video content for its scheduled week.

---

## Case Portfolio

| Week | Case              | Location             | Primary Analysis                      | Campaign Phase  |
| ---- | ----------------- | -------------------- | ------------------------------------- | --------------- |
| 1-4  | **Bottleneck**    | ESTIEM training      | Process flow, I-Chart, Boxplot        | Phase 1: Launch |
| 5-8  | **Hospital Ward** | Healthcare           | Aggregation trap, time patterns       | Phase 2: Deepen |
| 9-12 | **Coffee**        | East Africa          | Factor comparison, Gage R&R           | Phase 3: Apply  |
| 9-12 | **Packaging**     | Africa manufacturing | Pareto, capability, process diagnosis | Phase 3: Apply  |
| 12   | **Avocado**       | Post-harvest         | Regression, Gage R&R                  | Phase 3: Apply  |

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
| `README.md`           | Merged overview covering process and MSA     |
| `washing-station.csv` | 30 batches with moisture % and defect counts |
| `moisture-grr.csv`    | 60 measurements for Gage R&R study           |

**Teaching points:**

- Factor comparison (Boxplot by drying bed)
- Spec limits in context (I-Chart)
- MSA validation (Gage R&R ~8%)

**Website:** `/cases/coffee`

### Packaging Case (`packaging/`)

**Week 9-11 Featured Case - Africa Context**

Night shift is systematically underfilling. Is it the operators, the equipment, or the measurement? Two datasets tell the complete story.

| File                 | Description                                        |
| -------------------- | -------------------------------------------------- |
| `README.md`          | Merged overview covering defects, process, and MSA |
| `defects.csv`        | Daily defect tracking by product and type          |
| `fillweights.csv`    | 120 fill weight measurements by shift              |
| `fillweight-grr.csv` | 90 measurements for Gage R&R study                 |

**Teaching points:**

- Pareto prioritization (defect types)
- Process diagnosis (connecting defects to measurements)
- MSA validation (Gage R&R ~12%)

**Website:** `/cases/packaging`

### Avocado Case (`avocado/`)

**Week 12 Featured Case - AI Comparison**

Regression shows coating amount predicts shelf life. But can operators apply coating consistently? The MSA reveals why 28% of variation is "unexplained."

| File                     | Description                                        |
| ------------------------ | -------------------------------------------------- |
| `README.md`              | Merged overview covering regression and MSA        |
| `coating-regression.csv` | 120 observations with coating, process, shelf life |
| `coating-grr.csv`        | 60 measurements for Gage R&R study                 |

**Teaching points:**

- Regression interpretation (slope, R², prediction)
- Categorical factors (Spray vs. Dip, Carnauba vs. Polyethylene)
- MSA connection (operator reproducibility ~22%)

**Website:** `/cases/avocado`

---

## Additional Cases (Future Use)

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
│   ├── washing-station.csv
│   └── moisture-grr.csv
├── packaging/             # Week 9 - Africa
│   ├── README.md
│   ├── defects.csv
│   ├── fillweights.csv
│   └── fillweight-grr.csv
├── avocado/               # Week 12 - Regression
│   ├── README.md
│   ├── coating-regression.csv
│   └── coating-grr.csv
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

## Teaching Flow: The MSA Question

Each case with measurements follows the pattern:

```
WEEK N: Analysis reveals a problem
         ↓
"Bed C has high moisture"
"Night shift underfills"
"More coating = longer shelf life"
         ↓
WEEK N+1: "But wait..."
         ↓
"Can we trust this measurement?"
         ↓
GAGE R&R STUDY
         ↓
┌─────────────────┬─────────────────┬─────────────────┐
│   %GRR < 10%    │  %GRR 10-30%    │   %GRR > 30%    │
│   EXCELLENT     │    MARGINAL     │  UNACCEPTABLE   │
├─────────────────┼─────────────────┼─────────────────┤
│ Measurement OK  │ Proceed with    │ STOP - fix the  │
│ Problem is real │ caution         │ measurement     │
│ Investigate     │                 │ system first    │
│ process         │                 │                 │
└─────────────────┴─────────────────┴─────────────────┘
```

---

## AI Comparison Videos (Week 4, 8, 12)

Every 4th week features a 3-way comparison:

| Week | Case          | Video Title                                            |
| ---- | ------------- | ------------------------------------------------------ |
| 4    | Bottleneck    | "VaRiScout vs Copilot Analyst: Finding the Bottleneck" |
| 8    | Hospital Ward | "Can AI Find Hidden Patterns?"                         |
| 12   | Avocado       | "Can AI Find the Relationship?" + "Can AI Assess MSA?" |

---

_Case studies developed for VaRiScout Lite demonstration_
_Target audience: Lean Six Sigma Green Belt trainees_
