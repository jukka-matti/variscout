# M5-W1: Capability (Cp/Cpk) - 3-Way AI Comparison

**Month:** 5 (Complete GB Toolkit)  
**Week:** 1 (Week 17 overall)  
**Theme:** 3-Way AI Comparison  
**Tool Focus:** Process Capability (Cp/Cpk)  
**The Question:** "Does my process meet spec?"

---

## Format: 3-Way Comparison

| Method                    | Description                   |
| ------------------------- | ----------------------------- |
| **Copilot**               | Chat-based AI in Edge/Windows |
| **Copilot Analyst Agent** | Autonomous data analyst agent |
| **VaRiScout**             | Visual exploration tool       |

Same data. Same specs. Same question. Three approaches.

---

## Video: "Can AI Assess Process Capability?"

### Duration

10-12 minutes

### Structure

**Opening Hook (30 sec)**

- "Your customer wants Cpk > 1.33"
- "Can AI tell you if you meet it?"
- "I tested three approaches"

**Teaching: What is Capability? (2-3 min)**

- Voice of the Process (what you produce)
- Voice of the Customer (what they want)
- Cp: Could you meet spec? (potential)
- Cpk: Do you meet spec? (actual, accounts for centering)
- The 1.33 benchmark and why

**Round 1: Copilot (2-3 min)**

- Paste data, add specs
- Prompt: "Calculate Cp and Cpk for this data with USL=X and LSL=Y"
- Show response
- What you get: numbers, maybe explanation
- What's missing: visual context, histogram, immediate insight

**Round 2: Copilot Analyst Agent (2-3 min)**

- Give it the dataset
- Let it analyze autonomously
- Show what it produces
- Evaluation: Does it know to calculate capability? Does it ask for specs?

**Round 3: VaRiScout (2-3 min)**

- Upload data
- Enter specs (USL, LSL, Target)
- Instant: Histogram with spec lines + Cp/Cpk + color coding
- The visual: See WHERE you are relative to specs
- Toggle to probability plot: Is data normal? (Cpk assumes normality)

**The Verdict (1-2 min)**

- Copilot: Good at calculation, needs prompting
- Analyst Agent: May or may not think of capability
- VaRiScout: Shows the story, not just the number
- For GB training: Understanding > Getting a number

**Close (30 sec)**

- "Capability isn't just a number"
- "It's seeing where your process sits relative to customer needs"
- CTA

---

## Teaching Points: Capability

### What Cp Tells You

- Process spread vs. spec spread
- Cp = (USL - LSL) / 6σ
- "Could you fit within specs if perfectly centered?"

### What Cpk Tells You

- Actual capability accounting for centering
- Cpk = min[(USL - μ) / 3σ, (μ - LSL) / 3σ]
- "Do you actually meet specs?"

### The Benchmarks

| Cpk        | Meaning                               |
| ---------- | ------------------------------------- |
| < 1.0      | Not capable (significant out-of-spec) |
| 1.0 - 1.33 | Marginal (barely meeting)             |
| ≥ 1.33     | Capable (industry standard)           |
| ≥ 1.67     | Excellent                             |

### The Visual Insight

- Histogram shows the spread
- Spec lines show the boundaries
- You SEE how much margin you have
- The number confirms what you see

---

## Clips to Cut

### Clip 1: "The Question" (30 sec)

- "Your customer wants Cpk > 1.33"
- "Can AI tell you if you meet it?"
- Set up the 3-way test

### Clip 2: "Copilot's Answer" (45 sec)

- Show the calculation
- "Good answer, but..."
- What's missing: the visual context

### Clip 3: "VaRiScout's Answer" (45 sec)

- Histogram with specs
- Cp/Cpk with color coding
- "Now I can SEE where I am"

### Clip 4: "The Difference" (30 sec)

- Number vs. understanding
- Calculation vs. insight
- "Which builds capability?"

---

## LinkedIn Posts

### Post 1: The Test (Monday)

```
"Does my process meet spec?"

I asked three AI tools to calculate Cp and Cpk.

Round 1: Copilot
→ Good calculation, correct answer
→ But just a number

Round 2: Copilot Analyst Agent
→ Analyzed the data autonomously
→ May or may not think to calculate capability

Round 3: VaRiScout
→ Histogram with spec lines
→ Cp/Cpk with color coding
→ I can SEE where my process sits

The number is the same.
The understanding is not.

Full comparison: [link]

#ProcessCapability #AI #QualityManagement
```

### Post 2: Teaching Capability (Wednesday)

```
Process Capability in 60 seconds:

**Cp** = Could you fit within specs?
(If perfectly centered)

**Cpk** = Do you actually fit?
(Accounting for where you're centered)

The benchmarks:
→ < 1.0: Not capable
→ 1.0-1.33: Marginal
→ ≥ 1.33: Industry standard
→ ≥ 1.67: Excellent

But here's what matters:

The NUMBER tells you pass/fail.
The HISTOGRAM tells you WHY.

See where your process sits.
Then the number makes sense.

#Cpk #ProcessCapability #SixSigma
```

### Post 3: The Verdict (Friday)

```
3-way capability analysis comparison:

**Copilot**: Calculates correctly. Needs you to ask.

**Copilot Analyst**: May analyze capability. May not. Depends on how it interprets your data.

**VaRiScout**: Shows histogram + specs + Cp/Cpk instantly. Color-coded. Visual.

All three can give you the number.

Only one shows you the story.

For Green Belt training, I want students who UNDERSTAND capability.

Not students who can get an AI to calculate it.

[link]

#AIvsHuman #ProcessCapability #GreenBeltTraining
```

---

## Sample Data for Demo

Use a dataset that:

- Has ~50-100 measurements
- Has clear spec limits (USL, LSL)
- Shows a specific capability challenge (e.g., Cpk = 1.1 - marginal)
- Ideally slightly off-center (so Cp ≠ Cpk)

---

## Production Checklist

- [ ] Sample data with specs prepared
- [ ] Copilot prompts tested
- [ ] Copilot Analyst tested with same data
- [ ] VaRiScout demo ready
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
