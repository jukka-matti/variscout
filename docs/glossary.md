---
title: 'Glossary'
audience: [analyst, engineer]
category: learning
status: stable
---

# Glossary

Statistical and quality terms used across VariScout.

---

## Control Limits

### UCL (Upper Control Limit)

Upper Control Limit. Statistical boundary showing process behavior, set at mean + 3 standard deviations.

UCL represents the upper natural boundary of process variation. Points above UCL indicate special cause variation requiring investigation. Different from USL which is a customer requirement.

**Related:** [LCL](#lcl-lower-control-limit), [Mean](#mean), [Std Dev](#std-dev)

### LCL (Lower Control Limit)

Lower Control Limit. Statistical boundary showing process behavior, set at mean - 3 standard deviations.

LCL represents the lower natural boundary of process variation. Points below LCL indicate special cause variation requiring investigation. Different from LSL which is a customer requirement.

**Related:** [UCL](#ucl-upper-control-limit), [Mean](#mean), [Std Dev](#std-dev)

### USL (Upper Specification Limit)

Upper Specification Limit. Customer-defined maximum acceptable value for the product.

USL is the customer's voice - the maximum value they will accept. Products above USL are out of spec and rejected. Set by customer requirements, not process data.

**Related:** [LSL](#lsl-lower-specification-limit), [Target](#target), [Cp](#cp), [Cpk](#cpk)

### LSL (Lower Specification Limit)

Lower Specification Limit. Customer-defined minimum acceptable value for the product.

LSL is the customer's voice - the minimum value they will accept. Products below LSL are out of spec and rejected. Set by customer requirements, not process data.

**Related:** [USL](#usl-upper-specification-limit), [Target](#target), [Cp](#cp), [Cpk](#cpk)

### Target

The ideal or nominal value for the measurement, typically the midpoint between LSL and USL.

Target represents the ideal value customers want. Process centering is assessed by comparing the mean to the target.

**Related:** [USL](#usl-upper-specification-limit), [LSL](#lsl-lower-specification-limit), [Cpk](#cpk)

---

## Capability Metrics

### Cp

Process Capability. Measures how well your process fits within spec limits.

Cp compares the width of specification limits to 6σ_within of the process. Cp = (USL - LSL) / (6σ_within), where σ_within is estimated from the moving range (MR̄/d2). Higher values mean the process has room to spare within specs. Does not account for centering.

**Related:** [Cpk](#cpk), [USL](#usl-upper-specification-limit), [LSL](#lsl-lower-specification-limit), [Std Dev](#std-dev)

### Cpk

Process Capability Index. Like Cp, but accounts for how well centered the process is.

Cpk = min(CPU, CPL), where CPU = (USL - Mean) / 3σ_within and CPL = (Mean - LSL) / 3σ_within. σ_within is estimated from the moving range (MR̄/d2). A Cpk much lower than Cp indicates the process mean is shifted toward one spec limit.

**Related:** [Cp](#cp), [USL](#usl-upper-specification-limit), [LSL](#lsl-lower-specification-limit), [Mean](#mean)

### Pass Rate

Percentage of measurements within specification limits (between LSL and USL).

Pass Rate shows what proportion of products meet customer requirements. 100% means all products are in spec. Also known as yield or conformance rate.

**Related:** [USL](#usl-upper-specification-limit), [LSL](#lsl-lower-specification-limit), [Rejected](#rejected)

### Rejected

Percentage of measurements outside specification limits (above USL or below LSL).

Rejected rate is the inverse of pass rate. These are products that fail to meet customer requirements and must be scrapped, reworked, or conceded.

**Related:** [Pass Rate](#pass-rate), [USL](#usl-upper-specification-limit), [LSL](#lsl-lower-specification-limit)

---

## Basic Statistics

### Mean

Average value. Sum of all measurements divided by the count.

The arithmetic mean represents the center of the data distribution. Compare to target to assess centering. Also called X-bar in control charts.

**Related:** [Std Dev](#std-dev), [UCL](#ucl-upper-control-limit), [LCL](#lcl-lower-control-limit)

### Std Dev

Standard Deviation. Measures the spread or variability of measurements around the mean.

Standard deviation (σ) quantifies how much values vary from the average. Smaller values indicate more consistent processes. Used to calculate control limits and capability indices.

**Related:** [Mean](#mean), [Cp](#cp), [UCL](#ucl-upper-control-limit), [LCL](#lcl-lower-control-limit)

---

## ANOVA Statistics

### F-Statistic

Measures the ratio of between-group variance to within-group variance in ANOVA.

F-statistic compares variation between groups to variation within groups. Higher F values indicate larger differences between group means relative to variation within groups.

**Related:** [p-value](#p-value), [η² (Eta-squared)](#2-eta-squared)

### p-value

Probability the observed difference happened by chance. p < 0.05 = statistically significant.

The p-value tests the null hypothesis that all group means are equal. Small p-values (typically < 0.05) provide evidence that at least one group mean differs from the others.

**Related:** [F-Statistic](#f-statistic), [η² (Eta-squared)](#2-eta-squared)

### η² (Eta-squared)

Effect size showing how much variation is explained by the factor. Small < 0.06, medium 0.06-0.14, large > 0.14.

Eta-squared (η²) represents the proportion of total variance explained by the grouping factor. Unlike p-value, it indicates practical significance - how much the factor matters. In VariScout, η² is shown in the ANOVA results panel and used internally to suggest the next drill-down factor.

**Note:** The user-facing variation metric in filter chips, breadcrumbs, and the progress bar is **Total SS Contribution** (see below), not η².

**Related:** [F-Statistic](#f-statistic), [p-value](#p-value), [Total SS Contribution](#total-ss-contribution)

### Total SS Contribution

The percentage of total variation (Sum of Squares) that a specific category or filter selection accounts for. Unlike η² (which only captures between-group variation), Total SS Contribution captures both mean shift and within-group spread.

This is the primary user-facing metric in VariScout's drill-down workflow. Filter chips show each selection's Total SS Contribution, and the progress bar shows the cumulative scope — the product of contributions across drill levels.

**Related:** [η² (Eta-squared)](#2-eta-squared)

---

## Regression Statistics

### R²

Coefficient of determination. Shows how much of Y's variation is explained by X. Closer to 1 = stronger.

R-squared ranges from 0 to 1. An R² of 0.80 means 80% of the variation in Y can be explained by the relationship with X. The remaining 20% is due to other factors or random variation.

**Related:** [Slope](#slope), [p-value](#p-value)

### Adjusted R²

A modified R² that adjusts for the number of predictors. Only increases if a new predictor improves the model more than expected by chance.

Unlike regular R², adjusted R² penalizes adding predictors that do not meaningfully improve the model. Use it to compare models with different numbers of predictors.

**Related:** [R²](#r2), [VIF](#vif)

### Slope

How much Y changes for each unit increase in X. Positive = Y increases with X.

The slope quantifies the rate of change in the relationship. A slope of 2.5 means Y increases by 2.5 units for every 1 unit increase in X.

**Related:** [R²](#r2), [Intercept](#intercept)

### Intercept

The predicted value of Y when X equals zero.

The y-intercept is where the regression line crosses the Y-axis. May not have practical meaning if X=0 is outside the range of observed data.

**Related:** [Slope](#slope), [R²](#r2)

### VIF

Variance Inflation Factor. Measures how much a coefficient variance is inflated due to correlation with other predictors.

VIF = 1 means no correlation with other predictors. VIF 1-5 is acceptable. VIF 5-10 indicates moderate multicollinearity. VIF > 10 suggests serious multicollinearity requiring action.

**Related:** [Adjusted R²](#adjusted-r2)

---

## Methodology

### Staged Analysis

Analysis approach that calculates separate control limits for distinct process phases (e.g., before/after improvement).

Staged analysis reveals improvements that combined data hides. Each stage gets its own mean and control limits calculated independently, letting you see shifts in both center and variation.

**Related:** [UCL](#ucl-upper-control-limit), [LCL](#lcl-lower-control-limit), [Mean](#mean), [Std Dev](#std-dev)

### Total SS Contribution

A category's share of total sum of squares. Captures both mean shift AND spread (within-group variation).

Unlike between-group SS which only measures mean differences, Total SS contribution shows a category's full impact on variation. A category with mean near overall mean but high spread now shows non-zero impact. Sum of all category contributions equals 100%.

**Related:** [η² (Eta-squared)](#2-eta-squared), [Std Dev](#std-dev)

### Nelson Rules

Eight statistical tests for detecting non-random patterns (special causes) on control charts. Rule 1: any point beyond 3σ. Rule 2: nine consecutive points on the same side of the mean. Rules 3-8 detect trends, oscillations, and stratification patterns. Violations indicate special cause variation that should be investigated.

**Related:** [UCL](#ucl-upper-control-limit), [LCL](#lcl-lower-control-limit), [Mean](#mean)

### Special Cause

Variation from identifiable, assignable sources — as opposed to common cause variation which is inherent in the process. Special causes create non-random patterns detectable by control charts and Nelson Rules. Examples: tool wear, operator error, raw material batch change. Special causes should be investigated and eliminated.

**Related:** [Nelson Rules](#nelson-rules), [UCL](#ucl-upper-control-limit), [LCL](#lcl-lower-control-limit)

### Characteristic Type

Quality characteristic classification that affects how specification limits are interpreted.

**Nominal-is-best:** Target value exists, deviation in either direction is loss (e.g., fill weight). Both USL and LSL are defined.

**Smaller-is-better:** Zero is ideal, any positive value is undesirable (e.g., defects, cycle time). Only USL is defined.

**Larger-is-better:** Higher is always better (e.g., yield, strength). Only LSL is defined.

VariScout automatically infers the characteristic type from which specs are defined, but it can be overridden manually.

**Related:** [USL](#usl-upper-specification-limit), [LSL](#lsl-lower-specification-limit), [Target](#target)

### Probability Plot

Normal probability plot showing data points against expected normal percentiles. Points on the line indicate normal distribution.

A graphical method for assessing whether data follows a normal distribution. Uses Benard's Median Rank formula to calculate expected percentiles. If data is normal, points fall close to the fitted line.

**Related:** [Mean](#mean), [Std Dev](#std-dev), [Cp](#cp), [Cpk](#cpk)

---

_Generated from `packages/core/src/glossary/terms.ts`_
