# M5-W4: Regression - 3-Way AI Comparison

**Month:** 5 (Complete GB Toolkit)  
**Week:** 4 (Week 20 overall)  
**Theme:** 3-Way AI Comparison  
**Tool Focus:** Simple Linear Regression  
**The Question:** "What's the relationship between X and Y?"

---

## Format: 3-Way Comparison

| Method                    | Description                   |
| ------------------------- | ----------------------------- |
| **Copilot**               | Chat-based AI in Edge/Windows |
| **Copilot Analyst Agent** | Autonomous data analyst agent |
| **VaRiScout**             | Visual exploration tool       |

Same X/Y data. Same question. Three approaches.

---

## Video: "Can AI Find the Relationship?"

### Duration

10-12 minutes

### Structure

**Opening Hook (30 sec)**

- "Temperature goes up... what happens to yield?"
- "Finding the relationship between X and Y"
- "I tested three approaches"

**Teaching: What is Regression? (2-3 min)**

- The question: "Does X affect Y? How much?"
- Simple linear regression: Y = a + bX
- The slope: For each unit of X, Y changes by...
- R²: How much of Y's variation is explained by X?
- The residuals: What's left unexplained?

**Round 1: Copilot (2-3 min)**

- Provide X/Y data
- Prompt: "Fit a linear regression model"
- What it does: Calculates slope, intercept, R²
- Good at: The math
- Challenge: Interpreting for your context

**Round 2: Copilot Analyst Agent (2-3 min)**

- Give it the dataset
- Let it analyze
- Does it suggest regression? Or just correlation?
- Show its output and interpretation

**Round 3: VaRiScout (2-3 min)**

- Upload data, select X and Y
- Scatter plot with fitted line
- See the relationship visually
- R² and equation displayed
- Click points: Which ones are outliers? What's special about them?
- Linked to other charts: Filter by factor → does relationship change?

**The Key Insight (2 min)**

- All three can calculate the regression
- But the VISUAL shows you:
  - Is the relationship actually linear?
  - Are there outliers affecting the fit?
  - Does the relationship hold across all groups?
- Clicking to investigate outliers
- Filtering by factor: "Is the relationship the same for Shift A and Shift B?"

**The Verdict (1 min)**

- AI: Good at calculation
- VaRiScout: Good at exploration and understanding
- For GB: Need to SEE if assumptions hold
- The scatter plot is essential, not optional

**Close (30 sec)**

- "The equation is easy. The insight is in the pattern."
- CTA

---

## Teaching Points: Regression

### What Regression Tells You

- **Slope (b)**: For each unit increase in X, Y changes by b
- **Intercept (a)**: Value of Y when X = 0
- **R²**: Proportion of Y's variation explained by X
- **p-value**: Is the relationship statistically significant?

### Reading R²

| R²        | Interpretation        |
| --------- | --------------------- |
| 0.0 - 0.3 | Weak relationship     |
| 0.3 - 0.7 | Moderate relationship |
| 0.7 - 1.0 | Strong relationship   |

### What the Scatter Plot Shows

- Is the relationship actually linear? (or curved?)
- Are there outliers pulling the line?
- Is there constant variance? (or funnel shape?)
- Are there clusters? (different groups behaving differently?)

### The Linked Insight

- Filter by Machine → Does relationship hold for all machines?
- Filter by Shift → Is slope the same for all shifts?
- This is where visual exploration wins

---

## Clips to Cut

### Clip 1: "The Question" (30 sec)

- "Temperature goes up... yield goes..."
- "Finding the relationship"
- Set up the 3-way test

### Clip 2: "The Calculation" (45 sec)

- AI gives you: Y = 2.3 + 0.45X, R² = 0.67
- "Good. But is the relationship really linear?"
- "Are there outliers?"

### Clip 3: "The Scatter Plot" (60 sec)

- VaRiScout scatter with fitted line
- See the pattern
- Click outlier: "What's special about this point?"
- Filter by factor: "Does relationship hold?"

### Clip 4: "Beyond the Equation" (30 sec)

- Equation is easy
- Understanding is hard
- The scatter plot is essential
- "Don't trust a regression you haven't seen"

---

## LinkedIn Posts

### Post 1: The Test (Monday)

```
"What's the relationship between temperature and yield?"

I tested three approaches:

**Copilot**: Y = 2.3 + 0.45X, R² = 0.67
→ Correct calculation. Clean equation.

**Analyst Agent**: Identified correlation, fitted model
→ Good output. Suggested the relationship is moderate.

**VaRiScout**: Scatter plot + fitted line + linked filtering
→ I can SEE the relationship
→ I can CLICK the outliers
→ I can FILTER by shift: "Is it the same for everyone?"

The equation is the same.
The understanding is not.

Full comparison: [link]

#Regression #DataAnalysis #ProcessImprovement
```

### Post 2: Teaching Regression (Wednesday)

```
Simple regression in 60 seconds:

**The question:** Does X affect Y? How much?

**The equation:** Y = a + bX
→ b (slope): For each unit of X, Y changes by b
→ a (intercept): Y when X = 0

**R²:** How much of Y's variation is explained by X?
→ 0.7+ = strong relationship
→ 0.3-0.7 = moderate
→ <0.3 = weak

**But here's what matters:**

The equation is easy to calculate.
The SCATTER PLOT tells you if you should trust it.

→ Is it actually linear?
→ Are outliers pulling the line?
→ Is the relationship the same for all groups?

Never trust a regression you haven't seen.

#Statistics #Regression #DataLiteracy
```

### Post 3: The Verdict (Friday)

```
Regression analysis comparison:

All three approaches gave me:
Y = 2.3 + 0.45X, R² = 0.67

Same equation. Same R².

But only the scatter plot showed me:
- One outlier pulling the line (click it - it's from a maintenance day)
- The relationship is weaker for Night Shift
- Two points at X=45 that don't follow the pattern

The equation is the answer.
The scatter plot is the understanding.

For Green Belt training, I want students who ask:
"Is this relationship real? Does it hold for everyone?"

Not just: "What's the equation?"

[link]

#DataVisualization #Regression #GreenBeltTraining
```

---

## Case Reference

**Use the Avocado Coating Regression dataset:** `docs/cases/avocado-regression/`

This dataset provides:

- Coating amount (ml/kg) as X variable
- Shelf life (days) as Y variable
- ~80 data points
- Clear positive linear relationship
- Process factor (Spray vs. Dip) for group comparison
- Real agricultural context with business relevance

**Story connection:**

- "Finding the optimal coating level for maximum shelf life"
- Real decision: How much coating is enough? Is more always better?
- Week 19 (Gage R&R) verified measurement system
- Week 20 uses same case for optimization

**Key teaching moments:**

- R² interpretation: "72% of shelf life variation explained by coating amount"
- Prediction: "At 1.5 ml/kg, expect ~14 days shelf life"
- Process comparison: "Does the relationship differ for Spray vs. Dip?"
- Diminishing returns: "More coating doesn't always help" (Week 2 curved relationship)

**Alternative data:** `avocado_coating_weightloss.csv`

- X: Coating amount
- Y: Weight loss (%)
- Shows diminishing returns / curved relationship
- Good for teaching "not everything is linear"

**Website reference:** /cases/avocado-coating

---

## Alternative Sample Data

If creating custom data, design X/Y data with:

- Clear linear relationship
- One or two obvious outliers
- A factor column (e.g., Shift) where relationship differs slightly
- ~50-100 points

The story: Temperature (X) vs. Yield (Y), with Shift as factor

---

## Production Checklist

- [ ] X/Y sample data prepared
- [ ] Copilot prompts tested
- [ ] Copilot Analyst tested
- [ ] VaRiScout regression/scatter demo ready
- [ ] Video recorded
- [ ] Video edited
- [ ] Clips cut
- [ ] Blog written
- [ ] LinkedIn posts written
- [ ] All content scheduled

---

## Status

| Item          | Status |
| ------------- | ------ |
| **Published** | ⬜     |
