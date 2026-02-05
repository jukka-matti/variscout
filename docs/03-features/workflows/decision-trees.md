# Decision Trees

Flowcharts to answer common analyst questions: "Which chart should I use?" and "What do I do next?"

## Which Chart Should I Use?

```mermaid
flowchart TD
    A[I have data] --> B{What's my question?}

    B -->|"Is it stable over time?"| C[I-Chart]
    B -->|"Which factor causes variation?"| D[Boxplot]
    B -->|"Where do defects concentrate?"| E[Pareto]
    B -->|"Do we meet specs?"| F[Capability]
    B -->|"Is X related to Y?"| G[Regression]
    B -->|"Can I trust this measurement?"| H[Gage R&R]
    B -->|"Compare multiple channels?"| I[Performance Mode]

    C --> C1["Shows: Control limits, trends, outliers"]
    D --> D1["Shows: η² contribution, medians, spread"]
    E --> E1["Shows: Ranked categories, 80/20"]
    F --> F1["Shows: Cp, Cpk, histogram vs specs"]
    G --> G1["Shows: Correlation, R², prediction"]
    H --> H1["Shows: %GRR, repeatability, reproducibility"]
    I --> I1["Shows: All channels ranked by Cpk"]
```

## I Found Instability - Now What?

```mermaid
flowchart TD
    A[I-Chart shows instability] --> B{What pattern?}

    B -->|"Point outside limits"| C[Single special cause]
    B -->|"9+ points same side"| D[Process shifted]
    B -->|"Trend up or down"| E[Gradual drift]
    B -->|"Cycles/waves"| F[Periodic factor]
    B -->|"Increasing spread"| G[Stability degrading]

    C --> C1[Investigate that specific point]
    C1 --> C2[What happened at that time?]
    C2 --> C3[Check process logs, material, operator]

    D --> D1[Find when shift occurred]
    D1 --> D2[What changed then?]
    D2 --> D3[Settings, materials, personnel?]

    E --> E1[Check for wear or degradation]
    E1 --> E2[Tool wear? Calibration drift?]
    E2 --> E3[Maintenance or recalibration needed]

    F --> F1[Look for periodic causes]
    F1 --> F2[Temperature cycles? Shift changes?]
    F2 --> F3[Match cycle length to possible causes]

    G --> G1[Process becoming less predictable]
    G1 --> G2[Equipment wearing? Controls failing?]
    G2 --> G3[Major investigation needed]
```

## High Variation - Which Factor?

```mermaid
flowchart TD
    A["Boxplot: Multiple factors"] --> B{Which has highest η²?}

    B -->|"One factor dominates (>50%)"| C[Clear primary driver]
    B -->|"Two factors similar (30-40% each)"| D[Possible interaction]
    B -->|"All factors low (<20%)"| E[Check for missing factors]

    C --> C1[Drill into that factor]
    C1 --> C2[Which level is worst?]
    C2 --> C3[Investigate that specific level]

    D --> D1[Check interaction]
    D1 --> D2[Does Factor A effect depend on Factor B?]
    D2 --> D3[Multi-select to test combinations]

    E --> E1[Consider what's not in the data]
    E1 --> E2[Material batch? Environment? Supplier?]
    E2 --> E3[Collect additional data]
```

## Poor Capability - Why?

```mermaid
flowchart TD
    A["Cpk < 1.0"] --> B{Compare Cp vs Cpk}

    B -->|"Cp >> Cpk"| C[Centering problem]
    B -->|"Cp ≈ Cpk (both low)"| D[Spread problem]
    B -->|"Cp ≈ Cpk (both OK)"| E[Check histogram]

    C --> C1["Process off-target"]
    C1 --> C2["Easy fix: adjust setpoint"]
    C2 --> C3["Action: Recenter process"]

    D --> D1["Variation too high"]
    D1 --> D2["Need to reduce variation"]
    D2 --> D3["Action: Investigate variation sources"]

    E --> E1["Check distribution shape"]
    E1 --> E2{Shape?}
    E2 -->|"Bimodal"| E3["Two populations mixed"]
    E2 -->|"Skewed"| E4["Non-normal - check specs"]
    E2 -->|"Normal"| E5["Re-check calculations"]
```

## Defects Increasing - Where to Look?

```mermaid
flowchart TD
    A["Pareto shows defects"] --> B{What's the pattern?}

    B -->|"One defect type dominates"| C[Focus on that type]
    B -->|"Multiple types growing"| D[Systematic issue]
    B -->|"New defect appeared"| E[Something changed]

    C --> C1["Drill down with filter"]
    C1 --> C2["When/where does it occur?"]
    C2 --> C3["Root cause for specific defect"]

    D --> D1["Check common causes"]
    D1 --> D2["Material? Equipment? Training?"]
    D2 --> D3["Broader investigation needed"]

    E --> E1["When did it start?"]
    E1 --> E2["What changed then?"]
    E2 --> E3["New process/material/operator?"]
```

## Performance Mode - Which Channel?

```mermaid
flowchart TD
    A["Multiple channels"] --> B{Pattern?}

    B -->|"One clearly worst"| C[Isolated problem]
    B -->|"Group of bad channels"| D[Position-based?]
    B -->|"All similar (poor)"| E[Systematic issue]
    B -->|"All similar (good)"| F[Equipment qualified]

    C --> C1["Drill into that channel"]
    C1 --> C2["Use Four Pillars analysis"]
    C2 --> C3["Fix channel-specific issue"]

    D --> D1["Check physical arrangement"]
    D1 --> D2["Adjacent channels? Same side?"]
    D2 --> D3["Look for spatial cause"]

    E --> E1["Not a channel problem"]
    E1 --> E2["Check common inputs"]
    E2 --> E3["Material, settings, environment"]

    F --> F1["Equipment OK"]
    F1 --> F2["Document and monitor"]
```

## MSA Decision - Should I Do Gage R&R?

```mermaid
flowchart TD
    A["Should I validate measurement?"] --> B{Situation?}

    B -->|"Found operator effect"| C[Is it real or measurement?]
    B -->|"New gage/method"| D[Validate before use]
    B -->|"Cpk doesn't match reality"| E[Measurement bias?]
    B -->|"High unexplained variation"| F[Could be gage]
    B -->|"Routine check"| G[Annual MSA]

    C --> C1["Run Gage R&R"]
    D --> C1
    E --> C1
    F --> C1
    G --> C1

    C1 --> H{Result?}

    H -->|"<10% GRR"| I["Measurement OK"]
    H -->|"10-30% GRR"| J["Acceptable, but improve"]
    H -->|">30% GRR"| K["Fix measurement first"]

    I --> I1["Return to process analysis"]
    J --> J1["Proceed with caution"]
    K --> K1["Stop - fix gage before analysis"]
```

## After Drill-Down - What Action?

```mermaid
flowchart TD
    A["Isolated the problem"] --> B{What kind of issue?}

    B -->|"One operator different"| C[Training opportunity]
    B -->|"One machine different"| D[Maintenance/setup issue]
    B -->|"One shift different"| E[Process condition issue]
    B -->|"One material batch"| F[Supplier issue]
    B -->|"One time period"| G[Event-based cause]

    C --> C1["Compare techniques"]
    C1 --> C2["Best practice → Training"]

    D --> D1["Compare settings"]
    D1 --> D2["Inspection → Repair/adjust"]

    E --> E1["Compare conditions"]
    E1 --> E2["Temperature? Staffing? Volume?"]

    F --> F1["Check material properties"]
    F1 --> F2["Incoming inspection? Supplier feedback?"]

    G --> G1["Check logs for that period"]
    G1 --> G2["What was unique about that time?"]
```

## Quick Reference Card

### Chart Selection

| Question           | Chart            |
| ------------------ | ---------------- |
| Stable over time?  | I-Chart          |
| Which factor?      | Boxplot          |
| Which defects?     | Pareto           |
| Meet specs?        | Capability       |
| X vs Y related?    | Regression       |
| Trust measurement? | Gage R&R         |
| Compare channels?  | Performance Mode |

### Next Steps

| Finding              | Action                       |
| -------------------- | ---------------------------- |
| Point outside limits | Investigate that sample      |
| High η² factor       | Drill down                   |
| Poor Cpk             | Check Cp vs Cpk              |
| New defect type      | Find when it started         |
| Channel worst        | Four Pillars on that channel |
| Operator effect      | Consider MSA first           |

### Warning Signs

| Sign               | Investigate         |
| ------------------ | ------------------- |
| Bimodal histogram  | Mixed populations   |
| Cp >> Cpk          | Centering issue     |
| All factors low η² | Missing factor      |
| All channels poor  | Systematic cause    |
| GRR > 30%          | Measurement problem |

## Related Documentation

- [Four Pillars Workflow](four-pillars-workflow.md)
- [Drill-Down Workflow](drill-down-workflow.md)
- [Quick Check](quick-check.md)
- [Deep Dive](deep-dive.md)
- [MSA Workflow](msa-workflow.md)
