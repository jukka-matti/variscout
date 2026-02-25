# Regression Analysis

Regression is VariScout's tool for exploring relationships between continuous variables.

---

## Purpose

_"Is there a relationship between X and Y?"_

Regression answers:

- Does X predict Y?
- How strong is the relationship?
- What's the direction (positive/negative)?

---

## Key Metrics

| Metric      | Description                            |
| ----------- | -------------------------------------- |
| R²          | Proportion of variance explained (0-1) |
| Adjusted R² | R² adjusted for number of predictors   |
| Slope       | Change in Y per unit X                 |
| Intercept   | Y value when X = 0                     |
| p-value     | Significance of relationship           |

---

## Interpretation Guide

| R² Value  | Interpretation |
| --------- | -------------- |
| 0.90-1.00 | Very strong    |
| 0.70-0.89 | Strong         |
| 0.50-0.69 | Moderate       |
| 0.30-0.49 | Weak           |
| <0.30     | Very weak      |

---

## Use in VariScout

!!! note
Regression in VariScout serves as a **first step** to visually check if correlation exists. It answers "is there a relationship?" before investing in deeper predictive modeling.

For most variation analysis, the Four Lenses (I-Chart, Boxplot, Pareto, Capability) are sufficient.

---

## Multiple Regression

When using multiple predictors:

| Metric      | Purpose                                  |
| ----------- | ---------------------------------------- |
| Adjusted R² | Compare models with different predictors |
| VIF         | Check for multicollinearity              |
| p-values    | Significance of each predictor           |

> **Design principle — Adjusted R², not R²**: In multi-predictor models, always evaluate model quality using Adjusted R². Raw R² increases mechanically with every added predictor, even noise. Adjusted R² penalizes unnecessary complexity and only increases when a new factor genuinely improves the model. Simple (single-predictor) regression shows raw R² since both metrics are equivalent with one predictor.

### When to Use Multiple Regression

Use multiple regression when:

- You have **multiple potential predictors** (X variables)
- You want to understand **which factors matter most**
- You need to **control for confounding variables**
- You're building a **predictive model**

### VIF (Variance Inflation Factor)

VIF detects **multicollinearity** - when predictors are correlated with each other.

| VIF Value | Interpretation | Action                      |
| --------- | -------------- | --------------------------- |
| 1         | No correlation | Ideal                       |
| 1-5       | Moderate       | Usually acceptable          |
| 5-10      | High           | Investigate                 |
| >10       | Severe         | Remove predictor or combine |

**Why multicollinearity matters:**

- Inflates coefficient standard errors
- Makes individual predictor effects unreliable
- Model still predicts well, but interpretation is compromised

### Interpreting Coefficients

| Element        | Meaning                                                    |
| -------------- | ---------------------------------------------------------- |
| Coefficient    | Change in Y per unit change in X (holding others constant) |
| Standard Error | Uncertainty in coefficient estimate                        |
| t-statistic    | Coefficient / Standard Error                               |
| p-value        | Probability of seeing this t if true effect is zero        |

### Model Selection Tips

1. **Start simple** - Add predictors one at a time
2. **Check Adjusted R²** - Does adding a predictor improve it?
3. **Monitor VIF** - Remove highly correlated predictors
4. **Validate** - Test on held-out data if possible

---

## Interaction Effects

Interactions occur when one factor's effect **depends on another factor's level**.

_Example: "Machine C is only problematic on Night shift"_

### Why Check for Interactions?

Sequential drill-down (ANOVA) captures **main effects** only. If factors interact:

- Main effects may underestimate total explained variation
- The combination matters more than individual factors
- Action should target the specific combination, not factors separately

### Enabling Interactions in VariScout

1. Switch to **Advanced (GLM)** mode in Regression Panel
2. Select categorical predictors (factors from drill-down)
3. Toggle **"Include interactions"** checkbox
4. Review the ANOVA table for significant interaction terms

### Coming from Investigation Mindmap

The Investigation Mindmap provides two direct bridges to the Regression Panel:

- **ConclusionPanel** (bottom of mindmap): When 2+ factors are drilled, the "Refine in Regression" button navigates to the Regression Panel with all investigated factors pre-populated as predictors.
- **EdgeTooltip** (Interaction mode): Clicking an interaction edge shows delta-R², p-value, and standardized beta. The "Model in Regression" button navigates to the Regression Panel with that specific factor pair pre-populated.

Both buttons pre-fill the Regression Panel's predictor selection, so the analyst can immediately run the model without manual configuration.

### Project in What-If

When working in Advanced (GLM) mode, a **"Project in What-If →"** button bridges the regression model to the What-If Simulator for process improvement projections.

**When it appears:**

| Model State                                | Button       | Message                                          |
| ------------------------------------------ | ------------ | ------------------------------------------------ |
| All terms significant (p < 0.05)           | Green button | "Model is well-specified"                        |
| Some terms non-significant, Adj. R² ≥ 0.30 | Amber button | "Model available but some terms not significant" |
| Adj. R² < 0.30                             | No button    | Model too weak for reliable projections          |

**What it does:** Passes the complete regression model (coefficients, terms, intercept) to the What-If page, where the Model-Driven Simulator lets you adjust factor levels and see projected mean shifts, Cpk changes, and yield impact.

**Low-fit warning:** When Adj. R² < 0.50, the Model-Driven Simulator header displays an amber warning: "Low model fit — projections are approximate".

### Interpreting Interaction Terms

| Term              | Meaning                                  |
| ----------------- | ---------------------------------------- |
| `Shift*Machine`   | Effect of Shift depends on Machine level |
| p-value < 0.05    | Significant interaction exists           |
| Large coefficient | Strong interaction effect                |

---

---

## Technical Reference

VariScout's implementation:

```typescript
// From @variscout/core
import { calculateRegression, calculateMultipleRegression } from '@variscout/core';

// Simple regression
const result = calculateRegression(data, 'X', 'Y');

// Multiple regression with interactions
const multiResult = calculateMultipleRegression(data, ['X1', 'X2'], 'Y', {
  includeInteractions: true,
});
```

**Test coverage:** See `packages/core/src/__tests__/stats.test.ts` for regression tests.

---

## See Also

- [Glossary: R²](../../glossary.md#r2)
- [Glossary: VIF](../../glossary.md#vif)
- [Chart Design](../../06-design-system/charts/scatter.md)
- [Drill-Down: When to Check for Interactions](../navigation/drill-down.md#when-to-check-for-interactions)
- [Boxplot](boxplot.md) - Factor comparison with ANOVA
- [Case: Avocado](../../04-cases/avocado/index.md) - Regression use case
