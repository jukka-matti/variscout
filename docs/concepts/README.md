# Concepts & Strategy

Core methodologies, strategic decisions, and learning frameworks that guide VariScout development.

---

## Quick Navigation

### Methodologies

The statistical and quality methodologies that VariScout embodies:

| Topic            | Path                                        | Description                                    |
| ---------------- | ------------------------------------------- | ---------------------------------------------- |
| **Four Pillars** | [four-pillars/](./four-pillars/OVERVIEW.md) | Watson's methodology for process understanding |
| **Two Voices**   | [two-voices/](./two-voices/OVERVIEW.md)     | Control limits vs. specification limits        |

### Learning Frameworks

How VariScout teaches quality concepts:

| Topic                   | Path                                                             | Description                             |
| ----------------------- | ---------------------------------------------------------------- | --------------------------------------- |
| **Case-Based Learning** | [CASE_BASED_LEARNING.md](./CASE_BASED_LEARNING.md)               | Three-act case structure for engagement |
| **Contextual Learning** | [CONTEXTUAL_LEARNING_SYSTEM.md](./CONTEXTUAL_LEARNING_SYSTEM.md) | In-app help and glossary system         |

### Product Strategy

Strategic decisions for each product:

| Topic              | Path                                                 | Description                            |
| ------------------ | ---------------------------------------------------- | -------------------------------------- |
| **Licensing**      | [licensing/](./licensing/OVERVIEW.md)                | Paddle integration, license key system |
| **Excel Strategy** | [EXCEL_ADDIN_STRATEGY.md](./EXCEL_ADDIN_STRATEGY.md) | Excel Add-in product strategy          |
| **LSS Trainer**    | [LSS_TRAINER_STRATEGY.md](./LSS_TRAINER_STRATEGY.md) | Green Belt training feature roadmap    |
| **Power BI**       | [POWER_BI_STRATEGY.md](./POWER_BI_STRATEGY.md)       | Power BI custom visuals strategy       |

---

## Methodology Details

### Four Pillars (Watson's Framework)

The foundational methodology for understanding process variation:

| Pillar         | File                                        | Purpose                        |
| -------------- | ------------------------------------------- | ------------------------------ |
| **Failure**    | [FAILURE.md](./four-pillars/FAILURE.md)     | Understanding process failures |
| **Flow**       | [FLOW.md](./four-pillars/FLOW.md)           | Process flow analysis          |
| **Value**      | [VALUE.md](./four-pillars/VALUE.md)         | Value stream perspective       |
| **Change**     | [CHANGE.md](./four-pillars/CHANGE.md)       | Sustaining improvements        |
| **Drill-Down** | [DRILLDOWN.md](./four-pillars/DRILLDOWN.md) | Progressive analysis technique |

### Two Voices (Process vs. Customer)

Understanding the two perspectives on process data:

| Voice               | File                                                  | Purpose                              |
| ------------------- | ----------------------------------------------------- | ------------------------------------ |
| **Control Limits**  | [CONTROL-LIMITS.md](./two-voices/CONTROL-LIMITS.md)   | Voice of the process                 |
| **Spec Limits**     | [SPEC-LIMITS.md](./two-voices/SPEC-LIMITS.md)         | Voice of the customer                |
| **Variation Types** | [VARIATION-TYPES.md](./two-voices/VARIATION-TYPES.md) | Common vs. special cause             |
| **Scenarios**       | [SCENARIOS.md](./two-voices/SCENARIOS.md)             | Practical interpretation guides      |
| **Implementation**  | [VARISCOUT-IMPL.md](./two-voices/VARISCOUT-IMPL.md)   | How VariScout visualizes both voices |

### Licensing System

Complete licensing architecture:

| Topic                 | File                                                     | Purpose                       |
| --------------------- | -------------------------------------------------------- | ----------------------------- |
| **Overview**          | [OVERVIEW.md](./licensing/OVERVIEW.md)                   | License system architecture   |
| **Billing Channels**  | [BILLING-CHANNELS.md](./licensing/BILLING-CHANNELS.md)   | Paddle, AppSource integration |
| **License Key**       | [LICENSE-KEY.md](./licensing/LICENSE-KEY.md)             | Key format and generation     |
| **Activation**        | [ACTIVATION.md](./licensing/ACTIVATION.md)               | Activation flow               |
| **Hybrid Validation** | [HYBRID-VALIDATION.md](./licensing/HYBRID-VALIDATION.md) | Offline + online validation   |
| **Implementation**    | [IMPLEMENTATION.md](./licensing/IMPLEMENTATION.md)       | Technical implementation      |

---

## Architecture

```
concepts/
├── README.md                     # This file
│
├── four-pillars/                 # Watson's methodology
│   ├── OVERVIEW.md               # Core philosophy
│   ├── FAILURE.md
│   ├── FLOW.md
│   ├── VALUE.md
│   ├── CHANGE.md
│   └── DRILLDOWN.md
│
├── two-voices/                   # Control vs. Spec limits
│   ├── OVERVIEW.md
│   ├── CONTROL-LIMITS.md
│   ├── SPEC-LIMITS.md
│   ├── VARIATION-TYPES.md
│   ├── SCENARIOS.md
│   └── VARISCOUT-IMPL.md
│
├── licensing/                    # License system
│   ├── OVERVIEW.md
│   ├── BILLING-CHANNELS.md
│   ├── LICENSE-KEY.md
│   ├── ACTIVATION.md
│   ├── HYBRID-VALIDATION.md
│   └── IMPLEMENTATION.md
│
├── CASE_BASED_LEARNING.md        # Three-act case structure
├── CONTEXTUAL_LEARNING_SYSTEM.md # In-app help system
├── EXCEL_ADDIN_STRATEGY.md       # Excel product strategy
├── LSS_TRAINER_STRATEGY.md       # Training feature roadmap
└── POWER_BI_STRATEGY.md          # Power BI strategy
```

---

## Related Documentation

- **Case Studies**: [cases/](../cases/README.md) - Teaching cases with demo data
- **User Flows**: [flows/](../flows/OVERVIEW.md) - How users interact with VariScout
- **Products**: [products/](../products/) - Product specifications
- **Design System**: [design-system/](../design-system/README.md) - UI/UX standards
