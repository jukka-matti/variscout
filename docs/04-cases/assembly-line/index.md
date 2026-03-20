---
title: 'Assembly Line Case - PCB Assembly'
---

# Assembly Line Case - PCB Assembly

## Campaign Position

**Yamazumi Introduction** - The Lean Time Study Case

## Origin

Teaching case for Yamazumi analysis mode. Demonstrates how composition analysis reveals that the station with the most total time is not necessarily the station with the most waste.

## The Setup

An electronics manufacturer assembles PCBs across 8 stations. Management has identified **Testing** (Station 7) as the bottleneck — it has the highest average cycle time at 68 seconds against a 60-second takt time. They are considering a €120,000 investment in automated test equipment to speed it up.

**The twist:** When you decompose the cycle time into activity types, Testing has 85% value-add time — it's slow because the work is genuinely complex. **Wave Solder** (Station 4) has only 58 seconds total (below takt!) but 40% of that time is waste: rework, waiting for the machine to heat up, and walking to get flux. Wave Solder's waste propagates downstream, causing Testing to re-test boards with solder defects.

## The Problem Statement

> "Testing was our bottleneck — 68 seconds against a 60-second takt. Management wanted to automate it. But when we broke down what each station was actually doing with its time, the real story was upstream..."

## VariScout Analysis

### Charts Used

| Chart         | What It Shows                                                                             |
| ------------- | ----------------------------------------------------------------------------------------- |
| YamazumiChart | Stacked composition per station — Testing is tall but green; Wave Solder has the most red |
| I-Chart       | Cycle time over time — Wave Solder shows high NVA variability                             |
| Pareto        | Waste by station — Wave Solder ranks #1 despite being "below takt"                        |
| Summary       | Process Efficiency 62%, Takt Compliance 6/8 stations                                      |

### The Reveal

- **Testing:** 68s total, 58s VA (85% efficient) — genuinely complex work
- **Wave Solder:** 58s total, 35s VA (60% efficient) — 23s of waste hidden inside a "passing" station
- **The insight:** "The station below takt had more waste than the bottleneck."

## Three-Act Structure

### Act 1: The Problem

Show the total cycle times. Testing is clearly the tallest bar at 68 seconds, exceeding takt by 8 seconds. Wave Solder is 58 seconds — comfortably below takt. Management's conclusion: invest in Testing.

**Key visualization:** Simple bar chart of total times — Testing is the obvious target.

### Act 2: Your Turn

Interactive VariScout demo. The user explores the Yamazumi chart themselves.

**Guided questions:**

- "Look at the Yamazumi chart. What color dominates in Testing vs Wave Solder?"
- "Click on Wave Solder's red segment. What activities make up the waste?"
- "Switch the Pareto to 'Waste by Station'. Who's number one?"
- "Filter to Wave Solder — check the I-Chart. Is the waste consistent or growing?"

### Act 3: The Solution

The composition analysis reveals the truth:

**Station Breakdown:**

| Station      | Total | VA  | NVA | SNVA | Wait | Efficiency |
| ------------ | ----- | --- | --- | ---- | ---- | ---------- |
| Pick & Place | 45s   | 38s | 4s  | 3s   | 0s   | 84%        |
| Reflow       | 52s   | 44s | 3s  | 5s   | 0s   | 85%        |
| Inspection 1 | 40s   | 32s | 5s  | 3s   | 0s   | 80%        |
| Wave Solder  | 58s   | 35s | 12s | 4s   | 7s   | 60%        |
| Touch-Up     | 48s   | 36s | 8s  | 4s   | 0s   | 75%        |
| Conformal    | 42s   | 35s | 4s  | 3s   | 0s   | 83%        |
| Testing      | 68s   | 58s | 5s  | 3s   | 2s   | 85%        |
| Final Pack   | 35s   | 30s | 3s  | 2s   | 0s   | 86%        |

**Root cause chain:**

1. Wave Solder machine takes 7s to reach temperature between batches (Wait)
2. Flux station is 15m away — operator walks 2 round trips per batch (NVA: 8s walking)
3. Cold solder joints from temperature inconsistency cause 4s rework at Wave Solder
4. Defective boards from Wave Solder cause re-test at Testing (+3s per defective board)

**Business impact:**

- Automating Testing (€120k) would save ~5s per board but not address root cause
- Fixing Wave Solder: pre-heat schedule (€0), relocate flux (€2k), preheat optimization (€5k)
- Expected result: Wave Solder drops from 58s to 42s, Testing drops from 68s to 62s (fewer re-tests)
- Net savings: 22s per board, €7k investment vs €120k

## Teaching Points

| Concept                               | Learning                                        |
| ------------------------------------- | ----------------------------------------------- |
| Total time misleads                   | High total time does not mean high waste        |
| Composition matters                   | You must see _what_ the time is made of         |
| Below-takt can still be a problem     | A station "passing" can hide the most waste     |
| Waste propagates downstream           | Wave Solder's defects caused Testing's re-tests |
| Yamazumi reveals what bar charts hide | Averages and totals conceal the waste structure |

## Key Message

> "The bottleneck was hiding in plain sight — below takt, below suspicion."

## Linked Filtering Demonstration

- Click Wave Solder's NVA segment → I-Chart filters to Wave Solder NVA observations
- Time series reveals: first boards after machine restart have 3x the rework (temperature issue)
- Click "Waste by Type" in Pareto → Walking + Waiting dominate across all stations

## Dataset

### File: `data.csv`

| Column       | Description                      | Type        |
| ------------ | -------------------------------- | ----------- |
| Station      | Process station (8 stations)     | categorical |
| Activity     | Specific activity description    | categorical |
| Type         | Activity type (VA/NVA/SNVA/Wait) | categorical |
| Duration_sec | Activity duration in seconds     | numeric     |
| Observation  | Sequential cycle ID (1-120)      | int         |
| Shift        | Morning/Afternoon                | categorical |
| Operator     | Operator name                    | categorical |

### Data Characteristics

- 8 stations, 15 observations per station (120 total cycles)
- Multiple activities per station per cycle (rows expand to ~480)
- Wave Solder: highest NVA ratio (40% waste)
- Testing: highest total time but highest VA ratio (85%)
- Takt time: 60 seconds

### Sample Rows

```csv
Station,Activity,Type,Duration_sec,Observation,Shift,Operator
Pick & Place,Load PCB,VA,5,1,Morning,Mika
Pick & Place,Place SMD components,VA,28,1,Morning,Mika
Pick & Place,Inspect placement,SNVA,3,1,Morning,Mika
Pick & Place,Clear jam,NVA,4,1,Morning,Mika
Pick & Place,Move to conveyor,VA,5,1,Morning,Mika
...
Wave Solder,Wait for preheat,Wait,7,1,Morning,Jari
Wave Solder,Apply flux,VA,8,1,Morning,Jari
Wave Solder,Walk to flux station,NVA,4,1,Morning,Jari
Wave Solder,Solder,VA,22,1,Morning,Jari
Wave Solder,Rework cold joint,NVA,8,1,Morning,Jari
Wave Solder,Inspect solder,SNVA,4,1,Morning,Jari
Wave Solder,Move to next station,VA,5,1,Morning,Jari
...
Testing,Load test fixture,VA,8,1,Afternoon,Liisa
Testing,Run functional test,VA,35,1,Afternoon,Liisa
Testing,Run boundary scan,VA,12,1,Afternoon,Liisa
Testing,Log results,SNVA,3,1,Afternoon,Liisa
Testing,Re-test failed board,NVA,5,1,Afternoon,Liisa
Testing,Inspect test report,VA,3,1,Afternoon,Liisa
Testing,Wait for next board,Wait,2,1,Afternoon,Liisa
...
```

---

_Case created for: VariScout Yamazumi Mode launch_
_Teaching level: Introduction to lean time study analysis_
_Prerequisites: Basic understanding of cycle time and takt time_
