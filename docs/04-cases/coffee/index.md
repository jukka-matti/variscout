# Coffee Washing Station Case

**Location:** East African coffee washing station
**Context:** Export quality control, agricultural processing
**Campaign Week:** 9 (Phase 3 - Africa)
**Website:** /cases/coffee

---

## Overview

A practical case demonstrating variation analysis with both continuous measurements and defect classification.

**Analysis module:** Moisture Analysis — Process variation by drying bed

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

---

## Teaching Points

| Concept                | What VaRiScout Shows                                             |
| ---------------------- | ---------------------------------------------------------------- |
| Factor comparison      | Boxplot instantly reveals Bed C is different                     |
| Spec limits in context | I-Chart shows _where_ failures occur, not just _that_ they occur |
| Two data types         | Continuous (moisture %) + Categorical (defect counts)            |
| Root cause direction   | Variation pattern points to equipment/location, not operator     |

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

---

## Key Visuals

1. **I-Chart** - Moisture % over batches with spec lines (10-12%)
2. **Boxplot** - Moisture % by Drying Bed (A, B, C) - the "aha" moment
3. **Pareto** - Defect counts showing Broken >> Floater >> Insect >> Full Black
4. **Linked filtering** - Click Bed C, see its defect profile vs others

---

## Industry Context

### How Coffee Moisture is Measured

**Capacitance moisture meters** are the industry standard:

- Common brands: Sinar, Lighttells MD-500, G-Won, Wile
- Cost: ~$300-500 for quality meters
- Used at washing stations, dry mills, and roasteries worldwide
- Published tolerance: ±0.5% moisture

## VaRiScout Demo Flow

### Module 1: Process Analysis

1. Load `washing-station.csv`
2. Create I-Chart with Moisture_pct, spec lines at 10-12%
3. Create Boxplot by Drying_Bed
4. Click Bed C → see instant filtering
5. Create Pareto of defect types

---

## Core Message

_"The variation pattern tells you where to look."_

---

## References

- ISO 6673: Green coffee — Determination of loss in mass at 105°C
- ISO 1447: Green coffee — Determination of moisture content
- Sucafina: "Consistency in Measuring Moisture Content"
- Perfect Daily Grind: "How to Measure Moisture in Parchment & Green Coffee Beans"

---

_Case developed for VaRiScout Lite demonstration_
_Target audience: Lean Six Sigma Green Belt trainees_
