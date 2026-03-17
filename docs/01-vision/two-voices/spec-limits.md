---
title: 'Voice of the Customer: Specification Limits'
---

# Voice of the Customer: Specification Limits

---

## Visualization

```
USL ━━━━━━━━━━━━━━━━━━━━━━━━━    Upper Specification Limit
                                  "Maximum acceptable"


      █████████████████████
     ███████████████████████      Distribution of
    █████████████████████████     process output
   ███████████████████████████


LSL ━━━━━━━━━━━━━━━━━━━━━━━━━    Lower Specification Limit
                                  "Minimum acceptable"
```

---

## What Specification Limits Tell You

| Question                 | Answer                                                  |
| ------------------------ | ------------------------------------------------------- |
| Where do they come from? | **Customer requirements** (contracts, standards, needs) |
| What do they represent?  | The boundary between acceptable and unacceptable        |
| Who sets them?           | The customer — based on their needs                     |
| Can you change them?     | Only by negotiating with the customer                   |

---

## The Voice of the Customer Says:

> "I don't care how your process works. I need the output to be between these limits. Anything outside is unacceptable to me."

---

## Specification Limits Are NOT:

- ❌ Calculated from your data
- ❌ Related to your process capability
- ❌ Indicators of process stability
- ❌ Something you can change unilaterally

---

## Specification Limits ARE:

- ✅ Defined by customer requirements
- ✅ The customer speaking for themselves
- ✅ Accept/reject boundaries
- ✅ External to your process
- ✅ Fixed unless customer agrees to change

---

## The ITC Coffee Example

In coffee quality control, the two voices are especially clear:

### Voice of the Customer (Buyer)

| Attribute   | Specification           |
| ----------- | ----------------------- |
| Moisture    | 10-12%                  |
| Screen Size | Min 80% above Screen 15 |
| Defects     | Max 5 per 300g          |
| Cup Score   | Min 80 points           |

> "I will pay premium price only if coffee meets these specifications."

### Voice of the Process (Wet Mill)

| Attribute   | What Process Produces |
| ----------- | --------------------- |
| Moisture    | x̄ = 11.2%, σ = 0.8%   |
| Screen Size | x̄ = 76% above 15      |
| Defects     | x̄ = 8.3 per 300g      |
| Cup Score   | x̄ = 78.5 points       |

> "Given current fermentation, drying, and sorting — this is what I produce."

### The Gap

| Attribute   | Customer Wants | Process Delivers | Gap            |
| ----------- | -------------- | ---------------- | -------------- |
| Moisture    | 10-12%         | 11.2% ± 0.8%     | ✅ Capable     |
| Screen Size | >80%           | 76%              | ❌ Not capable |
| Defects     | <5             | 8.3              | ❌ Not capable |
| Cup Score   | >80            | 78.5             | ❌ Not capable |

### The Action

Don't just "try harder" on sorting. The **process** produces this output naturally. Change requires:

- Better cherry selection (FLOW)
- Improved fermentation timing (CHANGE)
- Enhanced drying protocols (CHANGE)
- Investment in sorting equipment (process change)

---

## See Also

- [Two Voices Overview](index.md)
- [Control Limits](control-limits.md) — Voice of the process
- [Four Scenarios](scenarios.md) — When voices align (or don't)
