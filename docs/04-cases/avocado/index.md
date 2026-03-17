---
title: 'Avocado Coating Case'
---

# Avocado Coating Case

> **Status: Future** — This case requires regression analysis, which is deferred to Phase 2 (see [ADR-014](../../07-decisions/adr-014-regression-deferral.md)). The data and teaching brief are ready for when regression is implemented.

**Location:** Post-harvest processing facility
**Context:** Process parameter optimization, agricultural quality
**Campaign Week:** 12 (Phase 3 - AI Comparison)
**Website:** /cases/avocado

---

## Overview

A research-based case demonstrating regression analysis for process optimization.

**Analysis module:** Regression Analysis — Coating amount vs. shelf life and weight loss

---

## The Story

### Part 1: "Finding the Optimal Coating Level"

**The setup:**
Avocados are coated with wax to extend shelf life and reduce moisture loss. More coating should help... but does it? And is there an optimal level?

**The analysis:**
Regression shows a clear positive relationship between coating amount and shelf life (R² ~ 0.72). But at higher coating levels, returns diminish and over-coating risks emerge.

**The insights:**

- Coating amount explains ~72% of shelf life variation
- Optimal range appears to be 1.5-2.5 ml/kg
- Dip method gives +1.5 days vs. Spray method
- Carnauba has lower optimal point than Polyethylene

---

## Teaching Points

| Concept                | What VaRiScout Shows                                     |
| ---------------------- | -------------------------------------------------------- |
| Basic regression       | Slope interpretation: each ml/kg adds ~3 days shelf life |
| R² interpretation      | 72% of variation explained by coating amount             |
| Prediction             | At 1.5 ml/kg, expect ~14 days shelf life                 |
| Categorical predictors | Process (Spray/Dip) and Material as factors              |
| Trade-off analysis     | Shelf life vs. weight loss optimization                  |

---

## Datasets

### 1. Coating Regression Data (`coating-regression.csv`)

| Column          | Type    | Description                      |
| --------------- | ------- | -------------------------------- |
| Sample_ID       | Integer | 1-120                            |
| Coating_ml_kg   | Float   | Coating amount (0.5 - 3.0 ml/kg) |
| Process         | Factor  | Spray, Dip                       |
| Material        | Factor  | Carnauba, Polyethylene           |
| Shelf_Life_Days | Float   | Days to unacceptable quality     |
| Weight_Loss_Pct | Float   | Percentage weight loss at day 14 |

**Study design:**

- 4 combinations × 6 coating levels × 5 replicates = 120 observations
- Linear relationship: ~3-4 days per ml/kg increase
- Plateau/decline above 2.5 ml/kg (over-coating effect)

**Built-in patterns:**

- Dip method: +1.5 days vs. Spray
- Carnauba: Better weight retention, lower optimal point
- Polyethylene: Longer shelf life, higher optimal point

---

## Industry Context

### How Coating is Applied

**Standard application rate:** ~0.4 ml wax per 250g fruit (~1.6 ml/kg)

**Application methods:**

1. **Spray:** Traversing nozzle, horse-hair brushes to spread
2. **Dip:** Full submersion, more even coverage, uses more wax
3. **Manual:** Small operations, higher variation

### Coating Effects (Research-Based)

| Outcome               | Effect of Coating         | Evidence                    |
| --------------------- | ------------------------- | --------------------------- |
| Weight loss reduction | 30-58% vs. uncoated       | Aguirre et al., 2017        |
| Shelf life extension  | +8-21 days (refrigerated) | Multiple studies            |
| Firmness retention    | Up to 50% better          | Aguilar-Mendez et al., 2008 |

### Over-Coating Risks

| Issue         | Cause                           | Symptom             |
| ------------- | ------------------------------- | ------------------- |
| Off-flavors   | Blocked gas exchange            | Fermentation        |
| Wax whitening | Excessive coating + temp change | White deposits      |
| Anaerobiosis  | Too thick barrier               | Quality degradation |

**Key finding:** Optimal coating exists — more is NOT always better.

---

## Key Visuals

1. **Scatter Plot** - Coating amount vs. shelf life with regression line
2. **Multiple Regression Lines** - By Process (Spray vs. Dip)
3. **Residual Plot** - Checking regression assumptions

---

## VaRiScout Demo Flow

### Module 1: Regression Analysis

1. Load `coating-regression.csv`
2. Create scatter plot: Coating_ml_kg (X) vs. Shelf_Life_Days (Y)
3. Fit regression line
4. View R² (~0.72) and equation
5. Add Process as factor → see two parallel lines
6. Identify optimal range: 1.5-2.5 ml/kg

---

## The Key Insight

**Regression finding:** Coating amount strongly predicts shelf life (R² = 0.72), but 28% remains unexplained — factors like application method, environmental conditions, and fruit variability all contribute.

**Business decision:** Standardize application technique and control environmental factors, then re-run regression for tighter predictions.

---

## Core Message

_"The equation is easy. The insight is in the pattern."_

---

## AI Comparison (Week 12)

This case is featured in the AI comparison video:

| Tool          | What It Does                        | What It Misses                                         |
| ------------- | ----------------------------------- | ------------------------------------------------------ |
| Copilot       | Calculates regression equation      | May not suggest checking assumptions                   |
| Analyst Agent | Fits model, provides interpretation | May miss non-linearity at high coating                 |
| VaRiScout     | Shows relationship visually         | Clicking outliers → "What's special about this point?" |

**The visual advantage:**

- See if relationship is actually linear
- Identify outliers affecting the fit
- Filter by factor: "Does relationship hold for all groups?"

---

## References

- Aguirre-Joya, J.A. et al. (2017). Effects of coating on avocado quality. _Food Packaging and Shelf Life_
- Blakey, R.J. (2012). Avocado post-harvest operations. University of KwaZulu-Natal.
- Maftoonazad, N. & Ramaswamy, H.S. (2005). Postharvest shelf-life extension of avocados. _LWT_
- Tesfay, S.Z. et al. (2017). Carboxymethyl cellulose coating. _South African Journal of Botany_

---

_Case developed for VaRiScout Lite demonstration_
_Target audience: Lean Six Sigma Green Belt trainees_
