# Two Voices: Understanding Control Limits vs Specification Limits

> A VaRiScout educational resource based on ITC Quality Control principles

---

## The Two Voices

Every process has two voices speaking at the same time:

| Voice                     | What It Says                      | Expressed As                   |
| ------------------------- | --------------------------------- | ------------------------------ |
| **Voice of the Process**  | "This is what I actually produce" | Control Limits (UCL/LCL)       |
| **Voice of the Customer** | "This is what I need"             | Specification Limits (USL/LSL) |

**The critical insight:** These two voices are independent. The process doesn't know what the customer wants. The customer doesn't know what the process can do.

---

## Voice of the Process: Control Limits

```
UCL ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    Upper Control Limit

         ●  ●     ●    ●
      ●        ●     ●     ●      Data points
           ●      ●         ●
x̄   ═══════════════════════════   Process Mean
         ●    ●       ●
      ●     ●    ●       ●
              ●      ●

LCL ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    Lower Control Limit
```

### What Control Limits Tell You

| Question                 | Answer                                           |
| ------------------------ | ------------------------------------------------ |
| Where do they come from? | **Calculated from your data** (typically x̄ ± 3σ) |
| What do they represent?  | The natural variation of YOUR process            |
| Who sets them?           | The process itself — through its behavior        |
| Can you change them?     | Only by changing the process                     |

### The Voice of the Process Says:

> "Given how I currently operate, this is the range of output you can expect from me. Points within my control limits are my normal behavior. Points outside mean something has changed."

### Control Limits Are NOT:

- ❌ Goals or targets
- ❌ What you want the process to do
- ❌ Customer requirements
- ❌ Arbitrary lines you can move
- ❌ Good/bad boundaries

### Control Limits ARE:

- ✅ Calculated from actual process data
- ✅ The process speaking for itself
- ✅ Stability indicators
- ✅ A baseline for detecting change
- ✅ Unique to YOUR process

---

## Voice of the Customer: Specification Limits

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

### What Specification Limits Tell You

| Question                 | Answer                                                  |
| ------------------------ | ------------------------------------------------------- |
| Where do they come from? | **Customer requirements** (contracts, standards, needs) |
| What do they represent?  | The boundary between acceptable and unacceptable        |
| Who sets them?           | The customer — based on their needs                     |
| Can you change them?     | Only by negotiating with the customer                   |

### The Voice of the Customer Says:

> "I don't care how your process works. I need the output to be between these limits. Anything outside is unacceptable to me."

### Specification Limits Are NOT:

- ❌ Calculated from your data
- ❌ Related to your process capability
- ❌ Indicators of process stability
- ❌ Something you can change unilaterally

### Specification Limits ARE:

- ✅ Defined by customer requirements
- ✅ The customer speaking for themselves
- ✅ Accept/reject boundaries
- ✅ External to your process
- ✅ Fixed unless customer agrees to change

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

## Two Types of Variation, Two Types of Action

The I-Chart reveals patterns — but what you DO about them depends on what TYPE of variation you're seeing:

### Special Cause Variation

```
UCL ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
                              ●        ← Point outside limits
         ●  ●     ●    ●
      ●        ●     ●     ●
x̄   ═══════════════════════════════════
         ●    ●       ●
      ●     ●    ●       ●
LCL ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
```

| Characteristic | Special Cause                                          |
| -------------- | ------------------------------------------------------ |
| **What it is** | Assignable, identifiable event                         |
| **Signal**     | Point outside control limits, patterns, trends         |
| **Examples**   | New operator, material batch change, equipment failure |
| **Who acts**   | Local level: Operator, Supervisor, Team                |
| **Action**     | Find it, remove it, prevent recurrence                 |
| **Goal**       | Restore stability                                      |

---

### Common Cause Variation

```
USL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UCL ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  ← Process is STABLE
         ●  ●     ●    ●                  but control limits
      ●        ●     ●     ●              exceed specs!
x̄   ═══════════════════════════════════
         ●    ●       ●
      ●     ●    ●       ●
LCL ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

LSL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

| Characteristic | Common Cause                                                            |
| -------------- | ----------------------------------------------------------------------- |
| **What it is** | Inherent to the system as designed                                      |
| **Signal**     | Stable process BUT control limits outside specs                         |
| **Examples**   | Equipment capability, process design, material specs                    |
| **Who acts**   | System level: Management, Corporate Quality, Business Improvement, OpEx |
| **Action**     | Fundamental process change, investment, redesign                        |
| **Goal**       | Reduce variation, improve capability                                    |

---

### The Critical Insight

**Looking at stability is the traditional use of control charts — but it's only half the story.**

| Situation                  | I-Chart Shows                                      | Action Required                               |
| -------------------------- | -------------------------------------------------- | --------------------------------------------- |
| **Special cause present**  | Points outside limits, patterns                    | Find and remove the cause (local action)      |
| **Stable but not capable** | All points within limits, BUT limits outside specs | Reduce common cause variation (system action) |

**The trap:** When a process is stable but not capable, local actions won't help. "Trying harder" or adjusting individual points just adds variation. The **system itself** must change.

---

### Who Does What?

| Role                            | Focus                | Type of Variation     | Typical Actions                       |
| ------------------------------- | -------------------- | --------------------- | ------------------------------------- |
| **Operator**                    | Run the process      | Detect special causes | Flag abnormalities, follow procedures |
| **Supervisor**                  | Daily management     | Remove special causes | Investigate, correct, document        |
| **Quality Team**                | Monitor & measure    | Both                  | Track Cp/Cpk, report trends           |
| **OpEx / Business Improvement** | System improvement   | Common cause          | Projects, Kaizen, process redesign    |
| **Corporate Quality**           | Strategy & standards | Common cause          | Capability targets, investment cases  |
| **Management**                  | Resource allocation  | Common cause          | Approve changes, fund improvements    |

**Deming's insight:** Management is responsible for the system. If the system produces common cause variation that's too high, only management can authorize the changes needed to fix it.

---

### VaRiScout Shows Both Situations

When you add specification limits to the I-Chart, you immediately see which situation you're in:

**Situation A: Special Cause Present**

```
┌─────────────────────────────────────────────────────────────────┐
│  USL ━━━━━━━━━━━━━━━━━━━━━━━━━                                  │
│  UCL ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─       ●  ← Special cause!           │
│           ●  ●     ●    ●                                       │
│  x̄   ═══════════════════════════                                │
│           ●    ●       ●                                        │
│  LCL ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─                                     │
│  LSL ━━━━━━━━━━━━━━━━━━━━━━━━━                                  │
│                                                                 │
│  Action: Find what caused that point. Local investigation.      │
└─────────────────────────────────────────────────────────────────┘
```

**Situation B: Stable but Not Capable (Common Cause Issue)**

```
┌─────────────────────────────────────────────────────────────────┐
│  USL ━━━━━━━━━━━━━━━━━━━━━━━━━                                  │
│  UCL ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   ← Stable! But UCL > USL       │
│           ●  ●     ●    ●                                       │
│  x̄   ═══════════════════════════                                │
│           ●    ●       ●                                        │
│  LCL ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   ← Stable! But LCL < LSL       │
│  LSL ━━━━━━━━━━━━━━━━━━━━━━━━━                                  │
│                                                                 │
│  Action: System change needed. Escalate to management/OpEx.     │
└─────────────────────────────────────────────────────────────────┘
```

**Situation C: The Goal State**

```
┌─────────────────────────────────────────────────────────────────┐
│  USL ━━━━━━━━━━━━━━━━━━━━━━━━━                                  │
│                                                                 │
│  UCL ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─                                     │
│           ●  ●     ●    ●        ← Stable AND capable!         │
│  x̄   ═══════════════════════════                                │
│           ●    ●       ●                                        │
│  LCL ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─                                     │
│                                                                 │
│  LSL ━━━━━━━━━━━━━━━━━━━━━━━━━                                  │
│                                                                 │
│  Action: Maintain. Monitor. Celebrate.                          │
└─────────────────────────────────────────────────────────────────┘
```

---

### The Business Improvement Function's Role

When VaRiScout reveals a "stable but not capable" situation, this is where **Corporate Quality / Business Improvement / OpEx** comes in:

| They Ask                                          | VaRiScout Provides                                  |
| ------------------------------------------------- | --------------------------------------------------- |
| "Which processes need fundamental improvement?"   | Capability analysis showing stable but not capable  |
| "Where should we invest in process redesign?"     | Prioritized list by gap between UCL/LCL and USL/LSL |
| "What's the potential ROI of improvement?"        | Variation % that could be reduced                   |
| "Which factors drive the common cause variation?" | Boxplot showing factor contribution                 |

**The workflow:**

```
LOCAL LEVEL                         SYSTEM LEVEL
─────────────────                   ─────────────────
I-Chart reveals                     I-Chart reveals
special cause                       stable but not capable
       ↓                                   ↓
Supervisor                          Corporate Quality /
investigates                        Business Improvement
       ↓                                   ↓
Find & remove                       Fundamental process
the cause                           change project
       ↓                                   ↓
Restore stability                   Reduce common cause
                                    variation
       ↓                                   ↓
BACK TO NORMAL                      NEW CAPABILITY LEVEL
```

---

### VaRiScout Connects Both Levels

**For local teams:** I-Chart with control limits → "Is something unusual happening?"

**For improvement functions:** I-Chart with BOTH limits → "Is the system capable?" + Boxplot → "What drives the variation?"

> VaRiScout finds WHERE to focus — whether it's a special cause for local action or common cause variation for system improvement. Apply Lean thinking to find WHY — and what to do about it.

---

## Four Scenarios: When the Voices Align (or Don't)

### Scenario 1: Stable AND Capable ✅

```
USL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UCL ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
         ●●●●●●●●●●●●
x̄   ══════════════════════════════
         ●●●●●●●●●●●●
LCL ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
LSL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

| Voice of Process | Voice of Customer   | Status         |
| ---------------- | ------------------- | -------------- |
| "I'm stable"     | "You meet my needs" | ✅ Ideal state |

**Action:** Maintain. Monitor. Don't over-adjust.

---

### Scenario 2: Stable but NOT Capable ⚠️

```
USL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         ●●●●●●●●●●●●            } Some output
x̄   ══════════════════════════════  } exceeds specs
         ●●●●●●●●●●●●            }
LSL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

| Voice of Process               | Voice of Customer         | Status                 |
| ------------------------------ | ------------------------- | ---------------------- |
| "I'm stable — this is my best" | "You don't meet my needs" | ⚠️ Fundamental problem |

**Action:** The process IS stable — this is what it naturally produces. You cannot "try harder." You must **fundamentally change the process** (equipment, method, materials) or **renegotiate specs** with customer.

---

### Scenario 3: Capable but NOT Stable ⚠️

```
USL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        ●        } Unstable points
         ●●●●●●●●●●               } but within
x̄   ══════════════════════════════  } spec limits
              ●●●●●●●●●          }
                    ●            }
LSL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

| Voice of Process    | Voice of Customer             | Status   |
| ------------------- | ----------------------------- | -------- |
| "I'm unpredictable" | "You meet my needs (for now)" | ⚠️ Risky |

**Action:** Dangerous situation! Currently meeting specs but not predictable. A special cause could push output outside specs at any time. **Find and remove the instability sources** before disaster.

---

### Scenario 4: Neither Stable NOR Capable ❌

```
         ●                       } Chaos
USL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              ●    ●             } AND
         ●        ●   ●          } failing
x̄   ══════════════════════════════  } specs
      ●       ●        ●         }
                  ●              }
LSL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              ●                  }
```

| Voice of Process    | Voice of Customer         | Status    |
| ------------------- | ------------------------- | --------- |
| "I'm unpredictable" | "You don't meet my needs" | ❌ Crisis |

**Action:** **Stabilize first, then improve capability.** Trying to fix capability while unstable is futile — you're chasing variation, not understanding it.

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

## Common Mistakes

### Mistake 1: Confusing the Two Limits

❌ "Our UCL is 15 because that's the max the customer accepts"

✅ "Our USL is 15 (customer requirement). Our UCL is 13.2 (calculated from our data)."

---

### Mistake 2: Adjusting Process to Hit Spec Limits

❌ "We're at 14.8, getting close to the USL of 15. Better adjust down!"

✅ "Is that point within our control limits? If yes, it's normal variation — don't adjust. If no, find out why."

**Tampering with a stable process increases variation.**

---

### Mistake 3: Celebrating When Within Spec

❌ "All our output is within spec! We're done!"

✅ "Is the process stable? If not, we're lucky today but at risk tomorrow."

---

### Mistake 4: Setting Control Limits from Specs

❌ "Let's set our control limits at ±10% of the spec limit"

✅ "Control limits must be calculated from actual process data. They cannot be chosen."

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

## VaRiScout Implementation

### I-Chart: Both Voices in One View

**VaRiScout Lite shows BOTH control limits AND specification limits on the I-Chart when specs are added.** This lets you see both voices simultaneously:

```
┌─────────────────────────────────────────────────────────────────┐
│  I-CHART: Process Stability with Customer Requirements          │
│                                                                 │
│  USL ━━━━━━━━━━━━━━━━━━━━━━━━━    Voice of Customer            │
│                                                                 │
│  UCL ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    Voice of Process            │
│           ●  ●     ●    ●                                       │
│        ●        ●     ●     ●                                   │
│  x̄   ═══════════════════════════   Process mean                │
│           ●    ●       ●                                        │
│        ●     ●    ●       ●                                     │
│  LCL ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    Voice of Process            │
│                                                                 │
│  LSL ━━━━━━━━━━━━━━━━━━━━━━━━━    Voice of Customer            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

━━━ Specification Limits (customer requirements)
─ ─ Control Limits (calculated from process data)
```

**What you can see instantly:**

| Observation             | Meaning                                       |
| ----------------------- | --------------------------------------------- |
| UCL/LCL inside USL/LSL  | ✅ Process capable — naturally meets specs    |
| UCL/LCL outside USL/LSL | ⚠️ Process not capable — will produce defects |
| Points within UCL/LCL   | Normal variation — don't adjust               |
| Points outside UCL/LCL  | Special cause — investigate                   |
| Points outside USL/LSL  | Defect — customer impact                      |

**The power of seeing both:**

| Without Both             | With Both (VaRiScout)                                              |
| ------------------------ | ------------------------------------------------------------------ |
| "Is this point bad?"     | "Is this point normal for the process AND acceptable to customer?" |
| React to every variation | Understand which variation matters                                 |
| Chase specs              | Improve process capability                                         |

---

### Capability Chart: Both Voices

```
┌─────────────────────────────────────────────────────────────────┐
│  CAPABILITY: Process vs Requirements                            │
│                                                                 │
│  USL ━━━━━━━━━━━━━━━━━━━━━    Voice of Customer               │
│                                                                 │
│        ▂▄▆█▆▄▂                 Distribution of                 │
│       ▄████████▄               process output                  │
│      ████████████              (Voice of Process)              │
│                                                                 │
│  LSL ━━━━━━━━━━━━━━━━━━━━━    Voice of Customer               │
│                                                                 │
│  Question: "Does it meet customer specs?"                       │
│  Answer: % within spec, Cp/Cpk indices                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### The VaRiScout Workflow

```
CHANGE (I-Chart)                    FLOW (Boxplot)         VALUE (Capability)
─────────────────                   ──────────────         ──────────────────
Both Voices visible                 Find the source        Detailed capability
when specs added                    of variation           analysis

● Control Limits                    ● Variation %          ● Distribution shape
  (Voice of Process)                  by factor            ● Cp/Cpk indices
● Spec Limits                       ● Which subgroup       ● % within spec
  (Voice of Customer)                 drives it?           ● Where is the gap?

"Is it stable AND                   "Where does it         "How capable
within specs?"                      come from?"            are we really?"
```

**The Goal Through the Workflow:**

| Step       | Question                                 | Goal State               |
| ---------- | ---------------------------------------- | ------------------------ |
| I-Chart    | "Are control limits within spec limits?" | Yes — stable AND capable |
| Boxplot    | "Which factors drive variation?"         | Identify what to improve |
| Capability | "What's our actual capability?"          | Cp > 1.33, Cpk > 1.33    |

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

## Summary

| Concept              | Control Limits           | Specification Limits                      |
| -------------------- | ------------------------ | ----------------------------------------- |
| **Voice**            | Process                  | Customer                                  |
| **Source**           | Calculated from data     | Defined by requirements                   |
| **Question**         | "Is it stable?"          | "Does it meet needs?"                     |
| **Chart**            | I-Chart                  | Capability (and I-Chart when specs added) |
| **Can change?**      | Only by changing process | Only by negotiating                       |
| **VaRiScout Pillar** | CHANGE                   | VALUE                                     |

**The Goal:**

> Get control limits INSIDE specification limits. Then the process naturally produces what the customer needs.

**The Key Feature:**

> VaRiScout Lite shows BOTH control limits and specification limits on the I-Chart when specs are added — so you see both voices at once.

**The key insight:**

> Listen to both voices. The process tells you what it CAN do. The customer tells you what it MUST do. The goal is alignment — control limits within spec limits. VaRiScout helps you see both voices and find WHERE to focus when they don't align.

---

## Reference

Based on quality control principles as documented in:

- ITC Quality Control Manual for Coffee
- Shewhart's foundational work on control charts
- Wheeler's "Understanding Variation"
- Watson's Four Pillars of Process Knowledge

---

_"Control limits are the voice of the process. Specification limits are the voice of the customer. The goal is to get the process voice inside the customer voice — then quality happens naturally."_
