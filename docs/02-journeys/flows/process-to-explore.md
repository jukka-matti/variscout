---
title: 'Process to Explore Flow'
description: Frame-to-Explore handoff for candidate factors, process-step context, time-derived factors, and project intent.
---

# Process to Explore Flow

This flow covers the handoff from **Process** (Frame) into **Explore** for a project with pasted or imported data.

## Contract

- **Vocabulary symmetry:** Process asks "What might be affecting it?" Explore answers "What does explain it?" The bridge copy on both surfaces states that these are the same candidate factors; Explore ranks them from the data.
- **Seeds do not gate analysis:** Frame's default X seeds are capped for first-screen clarity only. Explore screens the full candidate factor list and uses Frame selections as prominence, not permission.
- **Time-derived factors do not duplicate existing columns:** timestamp-derived columns are created only when the dataset does not already contain equivalent labels, such as a user-provided weekday column.
- **Steps become Explore context:** columns mapped to process steps through the canonical Process Map appear as step badges on factor-strip chips. The same mapped columns are available to the Stages lens, but no factor or stage is selected automatically.
- **Goal vs spec split:** specs remain engineering limits for capability and direction-of-goodness. The project goal and `AnalysisBrief.target` express improvement intent, live with the Issue/Project context, and feed Report's "What we aimed for" narrative path.

## User Path

1. The analyst frames a Y in Process.
2. Process shows "What might be affecting it?" for candidate Xs and explains that Explore will rank the same candidates from the data.
3. If the process map has step-column mappings, the candidate factors carry their step context forward.
4. The analyst opens Explore.
5. Explore's factor strip asks "What does explain it?", ranks all candidate factors, badges step-attributed chips, and leaves factor/stage selection to the analyst.

## ER-DOC Notes

- D13.2 vocabulary symmetry is now a UI contract on both sides of the tab transition.
- D13.5 steps-to-stages is metadata-only: it annotates chips and exposes Stage lens choices without auto-selection.
- The time dedup gate suppresses generated duplicate columns before they are appended; it does not add a persisted shape, so `docs/DATA-FLOW.md` does not require an update.
