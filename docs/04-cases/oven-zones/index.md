# Multi-Zone Oven Temperature Control Case Study

**Difficulty:** Intermediate
**Category:** Process Control / Manufacturing
**Dataset Size:** 100 measurements × 8 temperature zones
**Analysis Type:** Performance Mode (Multi-Channel Capability Analysis)

## Scenario

You're a process engineer at an industrial bakery analyzing an 8-zone continuous baking oven. The oven has a temperature profile designed to gradually heat products from 180°C to a peak of 230°C, then cool them back to 180°C for exit.

Recent quality issues suggest temperature control problems in some zones. Your task: identify which zones need maintenance and prioritize repairs.

## Temperature Profile (Target)

```
Zone 1 (Entry):  180°C ±10°C
Zone 2:          200°C ±10°C
Zone 3:          220°C ±10°C  ← Problem Area
Zone 4 (Peak):   230°C ±10°C
Zone 5 (Peak):   230°C ±10°C
Zone 6:          220°C ±10°C  ← Problem Area
Zone 7:          200°C ±10°C
Zone 8 (Exit):   180°C ±10°C
```

## Dataset Structure

### Measurements

- **100 observations** from continuous production
- **8 temperature zones** (Z1_Entry, Z2, Z3, Z4_Peak, Z5_Peak, Z6, Z7, Z8_Exit)
- Temperature measured in °C with 0.01°C precision

### Factors

- **Product_Type:** Digestive (40%), Shortbread (35%), Oat (25%)
- **Line_Speed:** Fast (30%), Normal (50%), Slow (20%)
- **Time_of_Day:** Morning (40%), Afternoon (35%), Night (25%)

## Learning Objectives

### Primary Objectives

1. **Use Pareto analysis** to identify worst-performing zones
2. **Distinguish Cp vs Cpk issues** (variance vs centering problems)
3. **Apply the Pareto Principle** (80/20 rule in maintenance prioritization)
4. **Understand Cpk target values** (industry-specific minimum requirements)

### Secondary Objectives

5. **Multi-factor drill-down** to verify issues are systematic, not product-dependent
6. **Root cause classification** (equipment issues vs operational issues)
7. **Maintenance prioritization** based on impact and severity

## Analysis Walkthrough

### Step 1: Load Data & Enter Performance Mode

1. Click **"Load Sample"** → Select **"Multi-Zone Oven Temperature Control"**
2. VariScout auto-detects 8 measure columns and suggests **Performance Mode**
3. Accept Performance Mode to see all 8 zones analyzed simultaneously

**What to observe:**

- Performance Summary shows zone health distribution
- "Needs Attention" count highlights problem zones

### Step 2: Identify Problem Zones (Pareto Chart)

The **Pareto Chart** ranks zones by Cpk (worst first):

```
Zone 3:  Cpk ~0.89  (Critical - Red)
Zone 6:  Cpk ~1.07  (Warning - Amber)
Zone 4:  Cpk ~1.52  (Capable - Green)
Zone 7:  Cpk ~1.85  (Capable - Green)
...
```

**Key Insight:** Only 2 of 8 zones (25%) need attention, demonstrating the **Pareto Principle**:

- **Zone 3** is below Cpk = 1.0 (process not capable)
- **Zone 6** is below Cpk = 1.33 (barely capable)

### Step 3: Diagnose Root Causes (Capability Histograms)

Click on each problem zone to see its distribution:

#### Zone 3 Analysis

**Click "Z3" in Pareto chart**

- **Distribution:** Wide, bell-shaped, centered on target (220°C)
- **Cp:** ~1.48 (width could fit in spec if centered)
- **Cpk:** ~0.89 (actual process is not capable due to variance)
- **Root Cause:** **High variance issue** - likely faulty thermocouple causing erratic readings
- **Fix:** Replace thermocouple in Zone 3

#### Zone 6 Analysis

**Click "Z6" in Pareto chart**

- **Distribution:** Narrow, but left-shifted (~212°C instead of 220°C)
- **Mean:** 212°C (8°C below target)
- **Cp:** ~1.33 (width could fit if centered)
- **Cpk:** ~1.07 (centering offset reduces capability)
- **Root Cause:** **Centering issue** - likely burner fouling causing under-heating
- **Fix:** Clean burner in Zone 6 to restore proper heating

### Step 4: Adjust Cpk Target (Industry Standards)

**In Performance Dashboard → Adjust "Target Cpk" input**

Try different industry standards to see how requirements change:

#### Automotive (Default): Cpk = 1.33

- Zone 3: Below target (Cpk ~0.89) ⚠️
- Zone 6: Below target (Cpk ~1.07) ⚠️
- Standard industrial minimum for automotive

#### Aerospace (Strict): Cpk = 2.0

- Zones 3, 6, 4, 7: Below target
- Demonstrates higher standards for critical applications
- Only highest-performing zones meet requirement

#### Consumer Goods (Lenient): Cpk = 1.0

- Only Zone 3 below target (Cpk ~0.89)
- Shows more tolerant standards for non-critical products
- Zone 6 now considered acceptable

**Teaching Point:** Same data, different target - organizational standards drive what counts as "capable"!

### Step 5: Verify Systematic Issues (Drill-Down)

**Add Filter: Product_Type = "Digestive"**

**Observation:** Z3 and Z6 issues **persist** across all product types

- η² (eta-squared) contribution from Product_Type is minimal (~2-3%)
- Confirms issues are **equipment problems**, not product-dependent

**Try filtering by Line_Speed and Time_of_Day** - issues remain consistent.

**Conclusion:** Problems are systematic equipment failures requiring maintenance, not operational adjustments.

## Expected Insights

### Insight 1: Zone 3 - Variance Problem

**Finding:** Zone 3 has critical Cpk (~0.89) due to excessive temperature variance
**Evidence:**

- Cp = 1.48 (process width could fit in spec)
- Cpk = 0.89 (actual centering and variance cause failures)
- Wide distribution (stdDev ~4.5°C vs target ~2.0°C)

**Root Cause:** Faulty thermocouple causing erratic temperature readings
**Recommendation:** Replace thermocouple sensor in Zone 3
**Impact:** High - this zone is producing out-of-spec product

### Insight 2: Zone 6 - Centering Problem

**Finding:** Zone 6 has warning-level Cpk (~1.07) due to 8°C offset below target
**Evidence:**

- Mean = 212°C (target = 220°C)
- Cp = 1.33 (distribution width is acceptable)
- Cpk = 1.07 (centering offset reduces capability)
- Left-shifted distribution

**Root Cause:** Burner fouling causing under-heating
**Recommendation:** Clean burner assembly and verify gas flow
**Impact:** Medium - process is barely capable, risk of future issues

### Insight 3: Pareto Principle Validation

**Finding:** 2 of 8 zones (25%) account for 100% of flagged issues
**Strategy:** Focus maintenance resources on these 2 zones rather than blanket maintenance
**Cost Savings:** Targeted repairs vs full oven shutdown
**Priority:** Fix Z3 first (critical), then Z6 (warning)

### Insight 4: Product-Independent Issues

**Finding:** η² contribution from Product_Type, Line_Speed, and Time_of_Day is minimal (<5% combined)
**Conclusion:** Issues are equipment failures, not operational or product-specific
**Action:** Maintenance team (not production team) responsible for resolution

## Key Concepts Demonstrated

### 1. Cp vs Cpk Distinction

| Metric    | Zone 3           | Zone 6      | Interpretation                          |
| --------- | ---------------- | ----------- | --------------------------------------- |
| **Cp**    | 1.48             | 1.33        | Process width relative to spec width    |
| **Cpk**   | 0.89             | 1.07        | Actual capability considering centering |
| **Issue** | Variance         | Centering   | Root cause type                         |
| **Fix**   | Reduce variation | Adjust mean | Corrective action                       |

### 2. Pareto Principle (80/20 Rule)

- **Traditional:** 80% of effects from 20% of causes
- **This case:** 100% of issues from 25% of zones (2 of 8)
- **Implication:** Targeted maintenance is more efficient than blanket maintenance

### 3. Cpk Target Values

Different industries have different minimum Cpk requirements:

- **Aerospace/Medical:** Cpk ≥ 2.0 for "capable" (near-zero defects)
- **Automotive:** Cpk ≥ 1.33 (industry standard, ~63 PPM defects)
- **Food/Consumer:** Cpk ≥ 1.0 may be acceptable (lower criticality)

Adjusting the target value shows how the same data is interpreted differently based on organizational standards and industry requirements.

### 4. Multi-Factor Analysis

Drill-down by Product, Speed, and Shift confirms issues are:

- **Systematic:** Present across all conditions
- **Equipment-related:** Not operational or product-specific
- **Maintenance-focused:** Require mechanical fixes, not process tuning

## Teaching Guide (For Instructors)

### Session Structure (60 minutes)

#### Introduction (10 min)

- Present scenario: industrial baking oven with quality issues
- Explain temperature profile (entry → peak → exit)
- Frame question: "Which zones need maintenance?"

#### Analysis Phase 1: Identification (15 min)

- Load data and enter Performance Mode
- Use Pareto chart to identify Z3 and Z6
- Discuss "needs attention" count and Pareto ranking

#### Analysis Phase 2: Diagnosis (15 min)

- Click Z3 → diagnose variance issue (Cp vs Cpk)
- Click Z6 → diagnose centering issue (left-shifted distribution)
- Differentiate between variance and centering problems

#### Advanced Analysis: Verification (10 min)

- Drill down by Product_Type to verify systematic issues
- Check η² contribution (low = equipment problem)
- Confirm issues are not product/speed dependent

#### Discussion: Threshold Impact (10 min)

- Adjust thresholds to aerospace standards (1.5, 2.0, 2.5)
- Observe more zones flagged
- Discuss industry-specific standards and context

#### Conclusion: Actionable Recommendations (10 min)

- Prioritize repairs: Z3 (critical) before Z6 (warning)
- Explain Pareto principle in maintenance strategy
- Calculate cost/benefit of targeted vs blanket maintenance

### Discussion Questions

1. **Why is Zone 3's Cp higher than its Cpk?** (Variance issue vs centering)
2. **What would happen if we adjusted the Zone 6 mean by 8°C?** (Cpk would improve to ~1.8)
3. **Why doesn't Product_Type explain the variance?** (Equipment issue, not product-specific)
4. **Should we repair all zones or just Z3 and Z6?** (Pareto principle discussion)
5. **How do aerospace vs consumer goods standards change the analysis?** (Threshold customization)

### Common Student Mistakes

1. **Confusing Cp and Cpk** - Emphasize Cp = potential, Cpk = actual
2. **Blaming products** - Show low η² proves it's equipment, not products
3. **Over-maintenance** - Pareto principle: fix 2 zones, not all 8
4. **Ignoring context** - Thresholds depend on industry requirements

## Data Export

The raw data is available as CSV for external analysis:

```csv
Measurement_ID,Product_Type,Line_Speed,Time_of_Day,Z1_Entry,Z2,Z3,Z4_Peak,Z5_Peak,Z6,Z7,Z8_Exit
1,Digestive,Normal,Morning,180.23,200.45,221.34,230.12,229.87,212.45,200.23,180.11
...
```

Export from VariScout via **Settings → Export Analysis** for use in Minitab, JMP, or Excel.

## Related Case Studies

- **Sachets (Fill Weight Variability):** Another multi-channel capability analysis (discrete manufacturing)
- **Coffee Roaster (Temperature Control):** Single-channel temperature control with similar Cp/Cpk concepts
- **Bottleneck Analysis:** Demonstrates Pareto principle in a different context (throughput)

## Technical Notes

### Statistical Details

- **Tolerance:** ±10°C for all zones (2σ approach)
- **Sample Size:** n=100 per zone (adequate for capability analysis)
- **Distribution:** Normal (validated via probability plots)
- **Measurement System:** Assumed capable (no Gage R&R issues)

### Data Generation

Data generated using Box-Muller transform for normal distributions:

- Zone 3: mean=220°C, σ=4.5°C (high variance)
- Zone 6: mean=212°C, σ=2.5°C (centering offset)
- Other zones: σ=1.5-2.2°C (good control)

### Thresholds Used

- **Default (Automotive):** Critical < 1.0, Warning < 1.33, Capable < 1.67
- **Aerospace:** Critical < 1.5, Warning < 2.0, Capable < 2.5
- **Consumer Goods:** Critical < 0.67, Warning < 1.0, Capable < 1.33

---

**Case Study Author:** VariScout Development Team
**Version:** 1.0
**Last Updated:** February 2026
**License:** Educational use permitted with attribution
