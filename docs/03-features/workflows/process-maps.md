# Visual Process Maps

Scannable, step-by-step maps showing exactly how many user actions each analysis workflow requires.

## How to Read These Maps

Each map is a horizontal flow of step boxes connected by arrows. Every box shows:

- **Bold label** — what the user does ("Paste Data", "Click Bar")
- **Muted detail** — what appears or what the system does
- **Badge below** — number of user actions for that step

The summary strip at the end shows **total actions** and **approximate time**.

### Step Types

| Color               | Type         | Meaning                                    |
| ------------------- | ------------ | ------------------------------------------ |
| Gray border         | **Input**    | User provides data (paste, type, upload)   |
| Blue border         | **Navigate** | User clicks to move through UI             |
| Amber border        | **Analyze**  | User triggers analysis or filters data     |
| Green dashed border | **Read**     | User reads result — 0 clicks               |
| Purple border       | **Decision** | Analyst reads result and chooses next step |

### Counting Rules

**Counts as 1 action:** a click, a keyboard shortcut (Ctrl+V, Enter), or typing a value into a field.

**Does NOT count:** scrolling, reading, system processing, auto-detection, or hovering for tooltips.

---

## Flow 1: Stability Check

_"Is my process stable?"_

=== "PWA"

    <div class="process-map">
      <div class="process-step">
        <div class="process-step__box process-step__box--input">
          <div class="process-step__title">Paste Data</div>
          <div class="process-step__detail">Click "Paste from Excel", Ctrl+V</div>
        </div>
        <div class="process-step__clicks">2 actions</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--navigate">
          <div class="process-step__title">Analyze</div>
          <div class="process-step__detail">Click "Analyze Data"</div>
        </div>
        <div class="process-step__clicks">1 click</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--navigate">
          <div class="process-step__title">Map Columns</div>
          <div class="process-step__detail">Outcome + factor + "Start"</div>
        </div>
        <div class="process-step__clicks">3 clicks</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--read">
          <div class="process-step__title">Read I-Chart</div>
          <div class="process-step__detail">Red dots = unstable</div>
        </div>
        <div class="process-step__clicks">0 clicks</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--read">
          <div class="process-step__title">Check Stats</div>
          <div class="process-step__detail">Mean, sigma, UCL, LCL</div>
        </div>
        <div class="process-step__clicks">0 clicks</div>
      </div>
      <div class="process-summary">
        <div class="process-summary__total">6 actions</div>
        <div class="process-summary__time">~2 min</div>
      </div>
    </div>

    **Decision:** All blue dots → stable. Any red dots → investigate with [Root Cause Analysis](#flow-2-root-cause-analysis).

=== "Azure"

    <div class="process-map">
      <div class="process-step">
        <div class="process-step__box process-step__box--navigate">
          <div class="process-step__title">New Analysis</div>
          <div class="process-step__detail">Click in project list</div>
        </div>
        <div class="process-step__clicks">1 click</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--input">
          <div class="process-step__title">Paste or Upload</div>
          <div class="process-step__detail">Ctrl+V or select file</div>
        </div>
        <div class="process-step__clicks">2 actions</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--navigate">
          <div class="process-step__title">Analyze</div>
          <div class="process-step__detail">Auto-detects columns</div>
        </div>
        <div class="process-step__clicks">1 click</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--read">
          <div class="process-step__title">Read I-Chart</div>
          <div class="process-step__detail">Red dots = unstable</div>
        </div>
        <div class="process-step__clicks">0 clicks</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--read">
          <div class="process-step__title">Check Stats</div>
          <div class="process-step__detail">Mean, sigma, UCL, LCL</div>
        </div>
        <div class="process-step__clicks">0 clicks</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--navigate">
          <div class="process-step__title">Save</div>
          <div class="process-step__detail">Persists to OneDrive</div>
        </div>
        <div class="process-step__clicks">1 click</div>
      </div>
      <div class="process-summary">
        <div class="process-summary__total">5 actions</div>
        <div class="process-summary__time">~2 min</div>
      </div>
    </div>

    Azure skips column mapping when auto-detection succeeds, saving 1 action. The Save step persists to OneDrive.

---

## Flow 2: Root Cause Analysis

_"What's causing variation?"_

=== "PWA"

    <div class="process-map">
      <div class="process-step">
        <div class="process-step__box process-step__box--input">
          <div class="process-step__title">Paste Data</div>
          <div class="process-step__detail">Click "Paste from Excel", Ctrl+V</div>
        </div>
        <div class="process-step__clicks">2 actions</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--navigate">
          <div class="process-step__title">Analyze</div>
          <div class="process-step__detail">Click "Analyze Data"</div>
        </div>
        <div class="process-step__clicks">1 click</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--navigate">
          <div class="process-step__title">Map Columns</div>
          <div class="process-step__detail">Outcome + 2 factors + "Start"</div>
        </div>
        <div class="process-step__clicks">4 clicks</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--read">
          <div class="process-step__title">Read ANOVA</div>
          <div class="process-step__detail">Check eta-squared under Boxplot</div>
        </div>
        <div class="process-step__clicks">0 clicks</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--analyze">
          <div class="process-step__title">Filter Top Factor</div>
          <div class="process-step__detail">Click highest-eta bar</div>
        </div>
        <div class="process-step__clicks">1 click</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--read">
          <div class="process-step__title">Read Filtered</div>
          <div class="process-step__detail">Variation explained? Cpk improved?</div>
        </div>
        <div class="process-step__clicks">0 clicks</div>
      </div>
      <div class="process-summary">
        <div class="process-summary__total">8 actions</div>
        <div class="process-summary__time">~5 min</div>
      </div>
    </div>

    **Decision:** eta-squared > 50% → primary driver found. Filter isolates the cause.

=== "Azure"

    <div class="process-map">
      <div class="process-step">
        <div class="process-step__box process-step__box--navigate">
          <div class="process-step__title">New Analysis</div>
          <div class="process-step__detail">Click in project list</div>
        </div>
        <div class="process-step__clicks">1 click</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--input">
          <div class="process-step__title">Upload File</div>
          <div class="process-step__detail">Select CSV from dialog</div>
        </div>
        <div class="process-step__clicks">2 actions</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--navigate">
          <div class="process-step__title">Analyze</div>
          <div class="process-step__detail">Auto-detects columns</div>
        </div>
        <div class="process-step__clicks">1 click</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--read">
          <div class="process-step__title">Read ANOVA</div>
          <div class="process-step__detail">Check eta-squared under Boxplot</div>
        </div>
        <div class="process-step__clicks">0 clicks</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--analyze">
          <div class="process-step__title">Filter Top Factor</div>
          <div class="process-step__detail">Click Boxplot bar</div>
        </div>
        <div class="process-step__clicks">1 click</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--read">
          <div class="process-step__title">Read Filtered</div>
          <div class="process-step__detail">Variation explained? Cpk improved?</div>
        </div>
        <div class="process-step__clicks">0 clicks</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--navigate">
          <div class="process-step__title">Save</div>
          <div class="process-step__detail">Persists to OneDrive</div>
        </div>
        <div class="process-step__clicks">1 click</div>
      </div>
      <div class="process-summary">
        <div class="process-summary__total">6 actions</div>
        <div class="process-summary__time">~5 min</div>
      </div>
    </div>

    Azure provides drill-down through the Boxplot and filter chips.

---

## Flow 3: Capability Check

_"Do we meet specs?"_

=== "PWA"

    <div class="process-map">
      <div class="process-step">
        <div class="process-step__box process-step__box--input">
          <div class="process-step__title">Paste Data</div>
          <div class="process-step__detail">Click "Paste from Excel", Ctrl+V</div>
        </div>
        <div class="process-step__clicks">2 actions</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--navigate">
          <div class="process-step__title">Analyze</div>
          <div class="process-step__detail">Click "Analyze Data"</div>
        </div>
        <div class="process-step__clicks">1 click</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--navigate">
          <div class="process-step__title">Map Columns</div>
          <div class="process-step__detail">Outcome + factor + "Start"</div>
        </div>
        <div class="process-step__clicks">3 clicks</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--navigate">
          <div class="process-step__title">Enter Specs</div>
          <div class="process-step__detail">+ Specs, USL, LSL, Apply</div>
        </div>
        <div class="process-step__clicks">6 actions</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--read">
          <div class="process-step__title">Read Cp/Cpk</div>
          <div class="process-step__detail">Capability indices in stats panel</div>
        </div>
        <div class="process-step__clicks">0 clicks</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--navigate">
          <div class="process-step__title">View Histogram</div>
          <div class="process-step__detail">Click "Histogram" tab</div>
        </div>
        <div class="process-step__clicks">1 click</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--read">
          <div class="process-step__title">Read Distribution</div>
          <div class="process-step__detail">Shape vs spec lines</div>
        </div>
        <div class="process-step__clicks">0 clicks</div>
      </div>
      <div class="process-summary">
        <div class="process-summary__total">13 actions</div>
        <div class="process-summary__time">~3 min</div>
      </div>
    </div>

    **Decision:** Cpk > 1.33 → capable. Cpk < 1.0 → improvement needed.

=== "Azure"

    <div class="process-map">
      <div class="process-step">
        <div class="process-step__box process-step__box--navigate">
          <div class="process-step__title">New Analysis</div>
          <div class="process-step__detail">Click in project list</div>
        </div>
        <div class="process-step__clicks">1 click</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--input">
          <div class="process-step__title">Upload File</div>
          <div class="process-step__detail">Select CSV from dialog</div>
        </div>
        <div class="process-step__clicks">2 actions</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--navigate">
          <div class="process-step__title">Analyze</div>
          <div class="process-step__detail">Auto-detects columns</div>
        </div>
        <div class="process-step__clicks">1 click</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--navigate">
          <div class="process-step__title">Enter Specs</div>
          <div class="process-step__detail">+ Specs, USL, LSL, Apply</div>
        </div>
        <div class="process-step__clicks">6 actions</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--read">
          <div class="process-step__title">Read Cp/Cpk</div>
          <div class="process-step__detail">Capability indices in stats panel</div>
        </div>
        <div class="process-step__clicks">0 clicks</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--navigate">
          <div class="process-step__title">View Histogram</div>
          <div class="process-step__detail">Click "Histogram" tab</div>
        </div>
        <div class="process-step__clicks">1 click</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--read">
          <div class="process-step__title">Read Distribution</div>
          <div class="process-step__detail">Shape vs spec lines</div>
        </div>
        <div class="process-step__clicks">0 clicks</div>
      </div>
      <div class="process-arrow"></div>
      <div class="process-step">
        <div class="process-step__box process-step__box--navigate">
          <div class="process-step__title">Save</div>
          <div class="process-step__detail">Persists to OneDrive</div>
        </div>
        <div class="process-step__clicks">1 click</div>
      </div>
      <div class="process-summary">
        <div class="process-summary__total">12 actions</div>
        <div class="process-summary__time">~3 min</div>
      </div>
    </div>

    Azure saves 1 action via auto-detection, but adds 1 for the Save step.

---

## Comparison: Basic Flows

| Flow             | PWA        | Azure      | Core Question          |
| ---------------- | ---------- | ---------- | ---------------------- |
| Stability Check  | 6 actions  | 5 actions  | Is it stable?          |
| Root Cause       | 8 actions  | 6 actions  | What causes variation? |
| Capability Check | 13 actions | 12 actions | Do we meet specs?      |

Azure is slightly fewer actions because file upload with auto-detection skips column mapping. The Save step adds 1 action but provides OneDrive persistence.

---

## Analyst Flow A: Process Investigation

_Quality is dropping — find out why._

**Trigger:** Customer complaint or Cpk alert. The analyst needs to find the root cause and quantify its impact.

<div class="process-map">
  <div class="process-step">
    <div class="process-step__box process-step__box--input">
      <div class="process-step__title">Load Data</div>
      <div class="process-step__detail">Paste or upload process data</div>
    </div>
    <div class="process-step__clicks">2-3 actions</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--navigate">
      <div class="process-step__title">Start Analysis</div>
      <div class="process-step__detail">Map columns, click Start</div>
    </div>
    <div class="process-step__clicks">3-4 clicks</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--read">
      <div class="process-step__title">Scan I-Chart</div>
      <div class="process-step__detail">Red dots, runs, trends?</div>
    </div>
    <div class="process-step__clicks">0 clicks</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--decision">
      <div class="process-step__title">Stable?</div>
      <div class="process-step__detail">Blue only → skip ahead. Red → step 5</div>
    </div>
    <div class="process-step__clicks">0 clicks</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--analyze">
      <div class="process-step__title">Investigate Point</div>
      <div class="process-step__detail">Click red point, check timestamp</div>
    </div>
    <div class="process-step__clicks">1 click</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--read">
      <div class="process-step__title">Read ANOVA</div>
      <div class="process-step__detail">Check eta-squared under Boxplot</div>
    </div>
    <div class="process-step__clicks">0 clicks</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--analyze">
      <div class="process-step__title">Drill Top Factor</div>
      <div class="process-step__detail">Click highest-eta bar</div>
    </div>
    <div class="process-step__clicks">1 click</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--read">
      <div class="process-step__title">Filtered Cpk</div>
      <div class="process-step__detail">Did capability improve?</div>
    </div>
    <div class="process-step__clicks">0 clicks</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--decision">
      <div class="process-step__title">Enough?</div>
      <div class="process-step__detail">>50% explained → continue. Otherwise repeat drill</div>
    </div>
    <div class="process-step__clicks">0 clicks</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--navigate">
      <div class="process-step__title">Enter Specs</div>
      <div class="process-step__detail">+ Specs, USL, LSL, Apply</div>
    </div>
    <div class="process-step__clicks">6 actions</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--read">
      <div class="process-step__title">Read Capability</div>
      <div class="process-step__detail">Filtered vs overall Cpk</div>
    </div>
    <div class="process-step__clicks">0 clicks</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--navigate">
      <div class="process-step__title">Histogram</div>
      <div class="process-step__detail">Distribution shape</div>
    </div>
    <div class="process-step__clicks">1 click</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--navigate">
      <div class="process-step__title">Export / Save</div>
      <div class="process-step__detail">Copy chart or save project</div>
    </div>
    <div class="process-step__clicks">1 click</div>
  </div>
  <div class="process-summary">
    <div class="process-summary__total">~15 actions</div>
    <div class="process-summary__time">~10 min</div>
  </div>
</div>

**Outcome:** "Factor X on Level Y causes Z% of variation. Cpk improves from A to B when filtered."

See [Investigation to Action](investigation-to-action.md) for the full three-phase methodology.

---

## Analyst Flow B: Predict Improvement

_Root cause is known — can we fix it? What would change?_

**Trigger:** Root cause identified (from Flow A). The analyst wants to model "what if we fix this?" before investing in a change.

<div class="process-map">
  <div class="process-step">
    <div class="process-step__box process-step__box--input">
      <div class="process-step__title">Load Data</div>
      <div class="process-step__detail">Same data or saved project</div>
    </div>
    <div class="process-step__clicks">1-3 actions</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--navigate">
      <div class="process-step__title">Apply Filter</div>
      <div class="process-step__detail">Re-apply known filter path</div>
    </div>
    <div class="process-step__clicks">1-2 clicks</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--read">
      <div class="process-step__title">Confirm Baseline</div>
      <div class="process-step__detail">Current Cpk with filter</div>
    </div>
    <div class="process-step__clicks">0 clicks</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--navigate">
      <div class="process-step__title">Regression</div>
      <div class="process-step__detail">Click "Regression" tab</div>
    </div>
    <div class="process-step__clicks">1 click</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--read">
      <div class="process-step__title">Read Model</div>
      <div class="process-step__detail">R-squared, significant predictors</div>
    </div>
    <div class="process-step__clicks">0 clicks</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--decision">
      <div class="process-step__title">Good Model?</div>
      <div class="process-step__detail">R² > 0.5 → continue. R² < 0.3 → need more data</div>
    </div>
    <div class="process-step__clicks">0 clicks</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--navigate">
      <div class="process-step__title">Open What-If</div>
      <div class="process-step__detail">Click "What-If Simulator"</div>
    </div>
    <div class="process-step__clicks">1 click</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--analyze">
      <div class="process-step__title">Set Targets</div>
      <div class="process-step__detail">Adjust predictor sliders</div>
    </div>
    <div class="process-step__clicks">2-4 actions</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--read">
      <div class="process-step__title">Read Prediction</div>
      <div class="process-step__detail">Predicted value + CI</div>
    </div>
    <div class="process-step__clicks">0 clicks</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--decision">
      <div class="process-step__title">Meets Spec?</div>
      <div class="process-step__detail">Cpk > 1.33 → proceed. Otherwise adjust</div>
    </div>
    <div class="process-step__clicks">0 clicks</div>
  </div>
  <div class="process-arrow"></div>
  <div class="process-step">
    <div class="process-step__box process-step__box--navigate">
      <div class="process-step__title">Return & Save</div>
      <div class="process-step__detail">Back + save project</div>
    </div>
    <div class="process-step__clicks">2 clicks</div>
  </div>
  <div class="process-summary">
    <div class="process-summary__total">~12 actions</div>
    <div class="process-summary__time">~8 min</div>
  </div>
</div>

**Outcome:** "If we set Factor X to Level Y, predicted Cpk improves to Z with 95% confidence."

---

## All Flows at a Glance

| Flow                                                           | Actions | Time    | Core Question            | Difficulty |
| -------------------------------------------------------------- | ------- | ------- | ------------------------ | ---------- |
| [Stability Check](#flow-1-stability-check)                     | 5-6     | ~2 min  | Is it stable?            | Beginner   |
| [Root Cause](#flow-2-root-cause-analysis)                      | 6-8     | ~5 min  | What causes variation?   | Beginner   |
| [Capability Check](#flow-3-capability-check)                   | 12-13   | ~3 min  | Do we meet specs?        | Beginner   |
| [Process Investigation](#analyst-flow-a-process-investigation) | ~15     | ~10 min | Why is quality dropping? | Analyst    |
| [Predict Improvement](#analyst-flow-b-predict-improvement)     | ~12     | ~8 min  | Can we fix it?           | Analyst    |

## Related Documentation

- [Four Lenses Workflow](four-lenses-workflow.md) — The foundational methodology
- [Drill-Down Workflow](drill-down-workflow.md) — Progressive stratification mechanics
- [Investigation to Action](investigation-to-action.md) — Three-phase analyst workflow
- [Quick Check](quick-check.md) — 5-minute monitoring pattern
- [Decision Trees](decision-trees.md) — Which analysis to use when
