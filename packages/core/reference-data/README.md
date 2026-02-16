# NIST StRD Reference Data

CSV files extracted from NIST Statistical Reference Datasets (StRD) for independent cross-validation in Minitab, Excel, or any statistics package.

These files are **not imported by the test suite** — test data is inline in `src/__tests__/reference-validation.test.ts` for zero-dependency execution. The CSVs exist so that anyone can independently verify VariScout's results against a third-party tool.

---

## How to Cross-Validate

Run the same NIST dataset through VariScout and Minitab (or another tool), then compare results against the certified values in the tables below.

### Loading data into VariScout

**Azure App (upload):** Open editor > Upload File > select the CSV > columns auto-detect > Analyze.

**PWA (paste):** Open the CSV in Excel / Numbers / Google Sheets > select the data columns (with header row) > copy > open VariScout PWA > "Paste from Excel" > define column names to match the headers below > paste > Analyze.

### Where to find results

| Analysis type                            | VariScout location                                       |
| ---------------------------------------- | -------------------------------------------------------- |
| Mean, Std Dev                            | Stats panel (right side of I-Chart view)                 |
| ANOVA (F, p, eta-squared)                | ANOVA results section below the Boxplot chart            |
| Regression (slope, intercept, R-squared) | Regression tab > select predictor column > results panel |

---

## Datasets

### nist-numacc1.csv

|                |                                                        |
| -------------- | ------------------------------------------------------ |
| **Source**     | https://www.itl.nist.gov/div898/strd/univ/numacc1.html |
| **Difficulty** | Lower                                                  |
| **Rows**       | 3                                                      |
| **Columns**    | Value                                                  |
| **Tests**      | Precision with large offset (values near 10,000,002)   |

**Certified values:**

| Statistic | Certified Value |
| --------- | --------------- |
| Mean      | 10000002.0      |
| Std Dev   | 1.0             |

**Minitab:** Stat > Basic Statistics > Display Descriptive Statistics. Select `Value`. Compare Mean and StDev.

**VariScout:** Column setup: Outcome = "Value", no factors. Read Mean and Std Dev from the Stats panel.

**Comparison worksheet:**

| Statistic | NIST Certified | VariScout | Minitab |
| --------- | -------------- | --------- | ------- |
| Mean      | 10000002.0     |           |         |
| Std Dev   | 1.0            |           |         |

---

### nist-numacc4.csv

|                |                                                        |
| -------------- | ------------------------------------------------------ |
| **Source**     | https://www.itl.nist.gov/div898/strd/univ/numacc4.html |
| **Difficulty** | Higher                                                 |
| **Rows**       | 1001                                                   |
| **Columns**    | Value                                                  |
| **Tests**      | Catastrophic cancellation in naive variance algorithms |

**Data pattern:** 1 x 10000000.2, 500 x 10000000.1, 500 x 10000000.3

**Certified values:**

| Statistic | Certified Value |
| --------- | --------------- |
| Mean      | 10000000.2      |
| Std Dev   | 0.1             |

**Minitab:** Stat > Basic Statistics > Display Descriptive Statistics. Select `Value`. Compare Mean and StDev. A naive two-pass algorithm will fail catastrophically on this dataset.

**VariScout:** Column setup: Outcome = "Value", no factors. Read Mean and Std Dev from the Stats panel.

**Comparison worksheet:**

| Statistic | NIST Certified | VariScout | Minitab |
| --------- | -------------- | --------- | ------- |
| Mean      | 10000000.2     |           |         |
| Std Dev   | 0.1            |           |         |

---

### nist-sirstv.csv

|                |                                                        |
| -------------- | ------------------------------------------------------ |
| **Source**     | https://www.itl.nist.gov/div898/strd/anova/SiRstv.html |
| **Difficulty** | Average                                                |
| **Rows**       | 25 (5 instruments x 5 observations)                    |
| **Columns**    | Resistivity, Instrument                                |
| **Tests**      | One-way ANOVA F-statistic, eta-squared, residual SD    |

**Certified values:**

| Statistic        | Certified Value   |
| ---------------- | ----------------- |
| F-statistic      | 1.18046237440255  |
| df (between)     | 4                 |
| df (within)      | 20                |
| R² (eta-squared) | 0.190999039051129 |
| Residual Std Dev | 0.104076068334656 |

**Minitab:** Stat > ANOVA > One-Way. Response: `Resistivity`, Factor: `Instrument`. Compare F-value, p-value, and SS values. The result should **not** be significant (p > 0.05).

**VariScout:** Column setup: Outcome = "Resistivity", Factor = "Instrument". Switch to Boxplot view. Read F-statistic, p-value, and eta-squared from the ANOVA results section below the chart.

**Comparison worksheet:**

| Statistic        | NIST Certified    | VariScout | Minitab |
| ---------------- | ----------------- | --------- | ------- |
| F-statistic      | 1.18046237440255  |           |         |
| df (between)     | 4                 |           |         |
| df (within)      | 20                |           |         |
| eta-squared      | 0.190999039051129 |           |         |
| Residual Std Dev | 0.104076068334656 |           |         |

---

### nist-norris.csv

|                |                                                            |
| -------------- | ---------------------------------------------------------- |
| **Source**     | https://www.itl.nist.gov/div898/strd/lls/data/Norris.shtml |
| **Difficulty** | Lower                                                      |
| **Rows**       | 36                                                         |
| **Columns**    | x, y                                                       |
| **Tests**      | Simple linear regression coefficients and R²               |

**Certified values:**

| Statistic        | Certified Value    |
| ---------------- | ------------------ |
| Intercept (B0)   | -0.262323073774029 |
| Slope (B1)       | 1.00211681802045   |
| R²               | 0.999993745883712  |
| Residual Std Dev | 0.884796396144373  |

**Minitab:** Stat > Regression > Regression > Fit Regression Model. Response: `y`, Predictor: `x`. Compare coefficients, R-sq, and S (residual standard deviation).

**VariScout:** Column setup: Outcome = "y", Factor = "x". Switch to the Regression tab, select predictor "x". Read Intercept, Slope, and R-squared from the regression results panel.

**VariScout tolerance:** 10 decimal places for slope, intercept, and R² (well-conditioned OLS).

**Comparison worksheet:**

| Statistic        | NIST Certified     | VariScout | Minitab |
| ---------------- | ------------------ | --------- | ------- |
| Intercept (B0)   | -0.262323073774029 |           |         |
| Slope (B1)       | 1.00211681802045   |           |         |
| R²               | 0.999993745883712  |           |         |
| Residual Std Dev | 0.884796396144373  |           |         |

---

### nist-pontius.csv

|                |                                                             |
| -------------- | ----------------------------------------------------------- |
| **Source**     | https://www.itl.nist.gov/div898/strd/lls/data/Pontius.shtml |
| **Difficulty** | Average                                                     |
| **Rows**       | 40 (20 loads x 2 replicates)                                |
| **Columns**    | Load, Deflection                                            |
| **Tests**      | Quadratic regression R² with large x values                 |

**Certified values (quadratic model: y = B0 + B1*x + B2*x²):**

| Statistic        | Certified Value        |
| ---------------- | ---------------------- |
| B0 (intercept)   | 0.673565789473684E-03  |
| B1 (linear)      | 0.732059160401003E-06  |
| B2 (quadratic)   | -0.316081871345029E-14 |
| R²               | 0.999999900178537      |
| Residual Std Dev | 0.205177424076185E-03  |

**Minitab:** Stat > Regression > Regression > Fit Regression Model. Response: `Deflection`, Predictor: `Load`. Add `Load*Load` as a quadratic term. Compare R-sq and coefficients.

**VariScout:** Column setup: Outcome = "Deflection", Factor = "Load". Switch to the Regression tab, select predictor "Load". Read R-squared from the regression results panel. Note: VariScout fits a linear model (not quadratic), so the R-squared will differ from the certified quadratic R² value.

**VariScout tolerance:** 6 decimal places for R² (numerical conditioning with x values up to 3,000,000).

**Comparison worksheet:**

| Statistic      | NIST Certified (quadratic) | VariScout (linear) | Minitab |
| -------------- | -------------------------- | ------------------ | ------- |
| R²             | 0.999999900178537          |                    |         |
| Slope (B1)     | 0.732059160401003E-06      |                    |         |
| Intercept (B0) | 0.673565789473684E-03      |                    |         |

---

## VariScout Test Tolerances

| Section            | What                                  | Tolerance           | Notes                       |
| ------------------ | ------------------------------------- | ------------------- | --------------------------- |
| Normal quantile    | normalQuantile vs R qnorm()           | 8 decimal places    | Acklam's algorithm          |
| NumAcc1            | mean, stdDev                          | 9 decimal places    | Well-conditioned            |
| NumAcc4            | mean                                  | 7 decimal places    | Large-offset stress test    |
| NumAcc4            | stdDev                                | 8 decimal places    | Welford's algorithm         |
| SiRstv ANOVA       | F-statistic, eta-squared, residual SD | 6 decimal places    | Standard conditioning       |
| Norris regression  | slope, intercept, R²                  | 10 decimal places   | Well-conditioned OLS        |
| Pontius regression | quadratic R²                          | 6 decimal places    | Large x values (10^6)       |
| Boxplot quantiles  | Q1, median, Q3                        | 10 decimal places   | R type=7 interpolation      |
| Matrix inverse     | A x A^-1 = I                          | 6-10 decimal places | Depends on condition number |
