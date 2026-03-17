---
title: 'Features'
---

# Features

Centralized feature specifications for VariScout.

---

## Product Documentation

| Document                            | Description                          |
| ----------------------------------- | ------------------------------------ |
| [Specifications](specifications.md) | Product specs, tagline, capabilities |
| [User Guide](user-guide.md)         | End-user guide for VariScout         |

---

## Analysis Tools

The core statistical charts based on Watson's Four Lenses:

| Chart                                            | Lens    | Purpose                                  |
| ------------------------------------------------ | ------- | ---------------------------------------- |
| [I-Chart](analysis/i-chart.md)                   | CHANGE  | Time-based stability analysis            |
| [Boxplot](analysis/boxplot.md)                   | FLOW    | Factor comparison (includes Violin Mode) |
| [Pareto](analysis/pareto.md)                     | FAILURE | Problem concentration                    |
| [Capability](analysis/capability.md)             | VALUE   | Specification compliance                 |
| [Regression](analysis/regression.md)             | -       | Correlation analysis                     |
| [Performance Mode](analysis/performance-mode.md) | -       | Multi-channel analysis                   |

### Advanced Analysis

| Feature                                          | Description                                  |
| ------------------------------------------------ | -------------------------------------------- |
| [Nelson Rules](analysis/nelson-rules.md)         | Control chart pattern detection rules        |
| [Staged Analysis](analysis/staged-analysis.md)   | Before/after comparison with stage columns   |
| [Probability Plot](analysis/probability-plot.md) | Normal probability plot for distribution fit |

---

## Analysis Journey

| Map                                                                     | Description                                          |
| ----------------------------------------------------------------------- | ---------------------------------------------------- |
| [Analysis Journey Map](workflows/analysis-journey-map.md)               | 4-phase model: Frame → Scout → Investigate → Improve |
| [Investigation Lifecycle Map](workflows/investigation-lifecycle-map.md) | IDEOI state diagram for the Investigate phase        |

## Analyst Workflows

How analysts combine VariScout tools to solve real problems. See the [Workflows index](workflows/index.md) for the full guide.

| Workflow                                                        | Description                            |
| --------------------------------------------------------------- | -------------------------------------- |
| [Four Lenses](workflows/four-lenses-workflow.md)                | Foundational CHANGE-FLOW-FAILURE-VALUE |
| [Drill-Down](workflows/drill-down-workflow.md)                  | Progressive stratification             |
| [Performance Mode](workflows/performance-mode-workflow.md)      | Multi-channel analysis workflow        |
| [Quick Check](workflows/quick-check.md)                         | 5-minute shift monitoring              |
| [Deep Dive](workflows/deep-dive.md)                             | 30-minute systematic investigation     |
| [Decision Trees](workflows/decision-trees.md)                   | Chart selection flowcharts             |
| [Investigation to Action](workflows/investigation-to-action.md) | Investigate, refine, project           |
| [Process Maps](workflows/process-maps.md)                       | Step-by-step visual action maps        |

---

## Navigation

How users explore and filter data:

| Feature                                            | Description                |
| -------------------------------------------------- | -------------------------- |
| [Drill-Down](navigation/drill-down.md)             | Progressive stratification |
| [Linked Filtering](navigation/linked-filtering.md) | Cross-chart filtering      |
| [Breadcrumbs](navigation/breadcrumbs.md)           | Analysis path tracking     |

---

## Data

Data handling and storage:

| Feature                          | Description             |
| -------------------------------- | ----------------------- |
| [Data Input](data/data-input.md) | File upload and parsing |
| [Validation](data/validation.md) | Data quality checks     |
| [Storage](data/storage.md)       | IndexedDB persistence   |

---

## Learning

Educational features:

| Feature                                                | Description               |
| ------------------------------------------------------ | ------------------------- |
| [Glossary](learning/glossary.md)                       | Term definitions          |
| [Help Tooltips](learning/help-tooltips.md)             | Contextual help           |
| [Case-Based Learning](learning/case-based-learning.md) | Learning through examples |
