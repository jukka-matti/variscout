# Coffee Washing Station Case

**Location:** East African coffee washing station
**Context:** Export quality control, agricultural processing
**Campaign Week:** 9 (Phase 3 - Africa)
**Website:** /cases/coffee

---

## Overview

A practical case demonstrating variation analysis with both continuous measurements and defect classification, plus measurement system validation.

This case has two analysis modules:

1. **Moisture Analysis:** Process variation by drying bed
2. **Gage R&R:** Measurement system validation for moisture meters

---

## The Story

### Part 1: "Why Does Bed C Keep Failing Export Spec?"

**The setup:**
A coffee washing station has three drying beds (A, B, C). Export grade requires 10-12% moisture content. Quality reports show "some batches fail spec" but don't reveal the pattern.

**The reveal:**
VaRiScout instantly shows Bed C is the problem - consistently running 12-14% moisture while A and B are stable within spec. The Pareto chart shows Bed C also has higher defect counts.

**The insight:**
Before VaRiScout: "We have a moisture problem"
After VaRiScout: "Bed C has a moisture problem - check airflow, shade, or drainage"

### Part 2: "Can We Trust the Moisture Reading?"

**The question:**
Before investigating Bed C's airflow, drainage, or shade... can we trust our moisture readings? Do different operators get the same reading on the same sample?

**The answer:**
A Gage R&R study validates the moisture meter. With %GRR around 8%, the 2% difference between Bed C (~13%) and Beds A/B (~11%) is real, not measurement error.

---

## Teaching Points

| Concept                | What VaRiScout Shows                                             |
| ---------------------- | ---------------------------------------------------------------- |
| Factor comparison      | Boxplot instantly reveals Bed C is different                     |
| Spec limits in context | I-Chart shows _where_ failures occur, not just _that_ they occur |
| Two data types         | Continuous (moisture %) + Categorical (defect counts)            |
| Root cause direction   | Variation pattern points to equipment/location, not operator     |
| MSA validation         | Verify measurement system before blaming process                 |

---

## Datasets

### 1. Washing Station Data (`washing-station.csv`)

| Column        | Type       | Description                          |
| ------------- | ---------- | ------------------------------------ |
| Batch_ID      | ID         | 1-30                                 |
| Drying_Bed    | Factor     | A, B, C (10 each)                    |
| Moisture_pct  | Continuous | Target 10-12%, Bed C runs 12.4-14.1% |
| Full_Black    | Count      | Rare defect (0-2)                    |
| Insect_Damage | Count      | Low frequency (0-3)                  |
| Floater       | Count      | Moderate (0-5)                       |
| Broken        | Count      | Most common (2-9)                    |

**Built-in patterns:**

- Bed A: Mean ~11.0%, all in spec
- Bed B: Mean ~11.4%, all in spec
- Bed C: Mean ~13.2%, all OUT of spec
- Defect counts correlate with moisture (Bed C higher)

### 2. Moisture Gage R&R Data (`moisture-grr.csv`)

| Column       | Type    | Description                        |
| ------------ | ------- | ---------------------------------- |
| Part         | Integer | Sample ID (1-10)                   |
| Operator     | String  | Operator name (Anna, Ben, Charles) |
| Trial        | Integer | Trial number (1, 2)                |
| Moisture_pct | Float   | Moisture reading (%)               |

**Study design:**

- 10 parts spanning moisture range (9.8% - 13.5%)
- 3 operators × 2 trials = 60 measurements
- Expected %GRR: ~8% (Excellent)

---

## Key Visuals

1. **I-Chart** - Moisture % over batches with spec lines (10-12%)
2. **Boxplot** - Moisture % by Drying Bed (A, B, C) - the "aha" moment
3. **Pareto** - Defect counts showing Broken >> Floater >> Insect >> Full Black
4. **Linked filtering** - Click Bed C, see its defect profile vs others
5. **Gage R&R Chart** - Variance breakdown and operator comparison

---

## Industry Context

### How Coffee Moisture is Measured

**Capacitance moisture meters** are the industry standard:

- Common brands: Sinar, Lighttells MD-500, G-Won, Wile
- Cost: ~$300-500 for quality meters
- Used at washing stations, dry mills, and roasteries worldwide
- Published tolerance: ±0.5% moisture

### Why MSA Matters

Known industry issues:

- "Erratic readings between devices"
- Packing density variation from operator technique
- Temperature sensitivity
- Calibration drift

> "If your measurements aren't consistent with your suppliers, you may have inconsistencies with contract standards."
> — Sucafina industry report

---

## VaRiScout Demo Flow

### Module 1: Process Analysis

1. Load `washing-station.csv`
2. Create I-Chart with Moisture_pct, spec lines at 10-12%
3. Create Boxplot by Drying_Bed
4. Click Bed C → see instant filtering
5. Create Pareto of defect types

### Module 2: Gage R&R

1. Load `moisture-grr.csv`
2. Configure: Part column, Operator column, Measurement column
3. View variance breakdown (~88% part-to-part, ~7% repeatability, ~5% reproducibility)
4. Verdict: %GRR = 8.2% → Excellent

**Key message:** "The moisture meter is reliable. The variation we see between drying beds is real process variation, not measurement error."

---

## Core Message

_"The variation pattern tells you where to look."_

_"Before you blame the process, make sure you can measure it."_

---

## References

- ISO 6673: Green coffee — Determination of loss in mass at 105°C
- ISO 1447: Green coffee — Determination of moisture content
- Sucafina: "Consistency in Measuring Moisture Content"
- Perfect Daily Grind: "How to Measure Moisture in Parchment & Green Coffee Beans"

---

_Case developed for VaRiScout Lite demonstration_
_Target audience: Lean Six Sigma Green Belt trainees_
