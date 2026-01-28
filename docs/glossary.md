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

Cp compares the width of specification limits to 6 standard deviations of the process. Cp = (USL - LSL) / (6σ). Higher values mean the process has room to spare within specs. Does not account for centering.

**Related:** [Cpk](#cpk), [USL](#usl-upper-specification-limit), [LSL](#lsl-lower-specification-limit), [Std Dev](#std-dev)

### Cpk

Process Capability Index. Like Cp, but accounts for how well centered the process is.

Cpk considers both spread and centering. It takes the minimum of CPU and CPL. A Cpk much lower than Cp indicates the process mean is shifted toward one spec limit.

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

**Related:** [p-value](#p-value), [η² (Eta-squared)](#η²-eta-squared)

### p-value

Probability the observed difference happened by chance. p < 0.05 = statistically significant.

The p-value tests the null hypothesis that all group means are equal. Small p-values (typically < 0.05) provide evidence that at least one group mean differs from the others.

**Related:** [F-Statistic](#f-statistic), [η² (Eta-squared)](#η²-eta-squared)

### η² (Eta-squared)

Effect size showing how much variation is explained by the factor. Small < 0.06, medium 0.06-0.14, large > 0.14.

Eta-squared (η²) represents the proportion of total variance explained by the grouping factor. Unlike p-value, it indicates practical significance - how much the factor matters.

**Related:** [F-Statistic](#f-statistic), [p-value](#p-value)

---

## Regression Statistics

### R²

Coefficient of determination. Shows how much of Y's variation is explained by X. Closer to 1 = stronger.

R-squared ranges from 0 to 1. An R² of 0.80 means 80% of the variation in Y can be explained by the relationship with X. The remaining 20% is due to other factors or random variation.

**Related:** [Slope](#slope), [p-value](#p-value)

### Adjusted R²

A modified R² that adjusts for the number of predictors. Only increases if a new predictor improves the model more than expected by chance.

Unlike regular R², adjusted R² penalizes adding predictors that do not meaningfully improve the model. Use it to compare models with different numbers of predictors.

**Related:** [R²](#r²), [VIF](#vif)

### Slope

How much Y changes for each unit increase in X. Positive = Y increases with X.

The slope quantifies the rate of change in the relationship. A slope of 2.5 means Y increases by 2.5 units for every 1 unit increase in X.

**Related:** [R²](#r²), [Intercept](#intercept)

### Intercept

The predicted value of Y when X equals zero.

The y-intercept is where the regression line crosses the Y-axis. May not have practical meaning if X=0 is outside the range of observed data.

**Related:** [Slope](#slope), [R²](#r²)

### VIF

Variance Inflation Factor. Measures how much a coefficient variance is inflated due to correlation with other predictors.

VIF = 1 means no correlation with other predictors. VIF 1-5 is acceptable. VIF 5-10 indicates moderate multicollinearity. VIF > 10 suggests serious multicollinearity requiring action.

**Related:** [Adjusted R²](#adjusted-r²)

---

## Gage R&R Statistics

### %GRR

Total measurement system variation as percentage of study variation. <10% excellent, 10-30% marginal, >30% unacceptable.

Gage R&R (Repeatability & Reproducibility) assesses measurement system capability. It combines variation from the equipment (repeatability) and operators (reproducibility).

**Related:** [Repeatability](#repeatability), [Reproducibility](#reproducibility)

### Repeatability

Equipment variation. The variation when the same operator measures the same part multiple times.

Repeatability (EV) measures precision of the measurement equipment. High repeatability variation suggests the gage needs calibration or replacement.

**Related:** [%GRR](#grr), [Reproducibility](#reproducibility)

### Reproducibility

Operator variation. The variation when different operators measure the same parts.

Reproducibility (AV) measures consistency between operators. High reproducibility variation suggests a need for operator training or clearer measurement procedures.

**Related:** [%GRR](#grr), [Repeatability](#repeatability)

---

## Methodology

### Staged Analysis

Analysis approach that calculates separate control limits for distinct process phases (e.g., before/after improvement).

Staged analysis reveals improvements that combined data hides. Each stage gets its own mean and control limits calculated independently, letting you see shifts in both center and variation.

**Related:** [UCL](#ucl-upper-control-limit), [LCL](#lcl-lower-control-limit), [Mean](#mean), [Std Dev](#std-dev)

### Total SS Contribution

A category's share of total sum of squares. Captures both mean shift AND spread (within-group variation).

Unlike between-group SS which only measures mean differences, Total SS contribution shows a category's full impact on variation. A category with mean near overall mean but high spread now shows non-zero impact. Sum of all category contributions equals 100%.

**Related:** [η² (Eta-squared)](#η²-eta-squared), [Std Dev](#std-dev)

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
