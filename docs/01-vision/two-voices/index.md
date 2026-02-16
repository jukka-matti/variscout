# Two Voices: Control Limits vs Specification Limits

> A VariScout educational resource based on ITC Quality Control principles

---

## The Two Voices

Every process has two voices speaking at the same time:

| Voice                     | What It Says                      | Expressed As                   |
| ------------------------- | --------------------------------- | ------------------------------ |
| **Voice of the Process**  | "This is what I actually produce" | Control Limits (UCL/LCL)       |
| **Voice of the Customer** | "This is what I need"             | Specification Limits (USL/LSL) |

**The critical insight:** These two voices are independent. The process doesn't know what the customer wants. The customer doesn't know what the process can do.

---

## The Two Voices Together

The power comes from listening to BOTH voices — and the **goal** is getting them aligned:

```
                    VOICE OF CUSTOMER
USL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UCL ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   ┐
              ●    ●                               │
         ●      ●     ●    ●                       │ VOICE OF
      ●    ●       ●     ●     ●                   │ PROCESS
x̄   ════════════════════════════════════════════   │ (inside
         ●    ●    ●       ●                       │ customer
      ●      ●        ●       ●                    │ requirements)
                 ●                                 │
LCL ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   ┘

LSL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    VOICE OF CUSTOMER
```

---

## The Goal: Control Limits Within Spec Limits

The ultimate objective of process improvement:

```
USL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  Voice of Customer


         UCL ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─             Voice of Process
                   ●●●●●●●●●●●●                        (INSIDE customer
         x̄   ══════════════════════════               requirements)
                   ●●●●●●●●●●●●
         LCL ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─


LSL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  Voice of Customer
```

**When control limits fit within spec limits:**

- Process naturally produces what customer needs
- No inspection needed — every unit is good
- Stable AND capable = predictable quality
- This is the target state

**The journey:**

| State                            | What It Means                             | Action                         |
| -------------------------------- | ----------------------------------------- | ------------------------------ |
| Control limits outside specs     | Process can't meet requirements naturally | Fundamental improvement needed |
| Control limits touch specs       | Barely capable, at risk                   | Reduce variation               |
| Control limits within specs      | Process naturally meets requirements      | ✅ Maintain                    |
| Control limits well within specs | Robust capability, room for drift         | Ideal state                    |

---

## The Critical Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   STEP 1: LISTEN TO THE PROCESS                                │
│                                                                 │
│   "Is it stable?"                                               │
│   → Plot I-Chart with Control Limits                           │
│   → Look for patterns, trends, out-of-control points           │
│                                                                 │
│   If NOT stable → Find and remove special causes FIRST         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   STEP 2: LISTEN TO THE CUSTOMER                               │
│                                                                 │
│   "Does it meet specs?"                                         │
│   → Plot Capability with Specification Limits                  │
│   → Calculate what % falls within specs                        │
│                                                                 │
│   If NOT capable → Fundamental process change needed           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Why this sequence matters:**

| Order                     | What Happens                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------- |
| Stability THEN Capability | You understand what the process naturally does, then compare to requirements          |
| Capability THEN Stability | You chase numbers without understanding the process — any "improvement" is accidental |

---

## Summary

| Concept            | Control Limits           | Specification Limits                      |
| ------------------ | ------------------------ | ----------------------------------------- |
| **Voice**          | Process                  | Customer                                  |
| **Source**         | Calculated from data     | Defined by requirements                   |
| **Question**       | "Is it stable?"          | "Does it meet needs?"                     |
| **Chart**          | I-Chart                  | Capability (and I-Chart when specs added) |
| **Can change?**    | Only by changing process | Only by negotiating                       |
| **VariScout Lens** | CHANGE                   | VALUE                                     |

**The key insight:**

> Listen to both voices. The process tells you what it CAN do. The customer tells you what it MUST do. The goal is alignment — control limits within spec limits. VariScout helps you see both voices and find WHERE to focus when they don't align.

---

## Learn More

- [Control Limits](control-limits.md) — Voice of the process
- [Spec Limits](spec-limits.md) — Voice of the customer
- [Variation Types](variation-types.md) — Special vs common cause
- [Four Scenarios](scenarios.md) — When voices align (or don't)

---

## Reference

Based on quality control principles as documented in:

- ITC Quality Control Manual for Coffee
- Shewhart's foundational work on control charts
- Wheeler's "Understanding Variation"
- Watson's Four Lenses of Process Knowledge

---

_"Control limits are the voice of the process. Specification limits are the voice of the customer. The goal is to get the process voice inside the customer voice — then quality happens naturally."_
