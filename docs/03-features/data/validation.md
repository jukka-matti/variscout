---
title: 'Data Validation'
---

# Data Validation

Quality checks applied to uploaded data.

---

## Validation Rules

| Check             | Severity | Description                |
| ----------------- | -------- | -------------------------- |
| Empty file        | Error    | File has no data rows      |
| No measure column | Error    | No numeric column detected |
| All values same   | Warning  | Zero variation             |
| Too few points    | Warning  | <10 data points            |
| Outlier detected  | Info     | Values >3σ from mean       |
| Missing values    | Info     | Nulls in measure column    |

---

## Severity Levels

| Level   | Effect                       |
| ------- | ---------------------------- |
| Error   | Blocks analysis              |
| Warning | Allows analysis with caution |
| Info    | Informational only           |

---

## Validation Banner

Results shown in DataQualityBanner:

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ Data Quality Check                                          │
│                                                                 │
│ ✓ 1,234 rows loaded                                            │
│ ⚠ 12 missing values in 'Temperature' (will be excluded)       │
│ ℹ 3 potential outliers detected                                │
│                                                                 │
│ [Proceed Anyway]  [Review Data]                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Missing Value Handling

| Option  | Behavior                        |
| ------- | ------------------------------- |
| Exclude | Skip rows with missing values   |
| Include | Use available values, note gaps |

---

## See Also

- [Data Input](data-input.md)
- [Storage](storage.md)
