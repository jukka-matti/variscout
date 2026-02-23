# VariScout Lead Generation Pipeline

Systematic lead research across 22 target countries using Gemini Deep Research.

## Directory Structure

```
docs/09-leads/
├── prompts/          # Gemini Deep Research prompts (v2 format)
│   ├── 01-finland.md
│   ├── 02-sweden.md
│   └── ... (22 files)
├── results/          # Raw Gemini output (paste here)
│   └── XX-country.md
├── enriched/         # AI-enriched versions (validated + supplemented)
│   └── XX-country.md
├── csv/              # Machine-readable exports
│   ├── XX-country.csv
│   └── master-leads.csv
└── README.md         # This file
```

## Workflow

### 1. Generate → `prompts/`

- Copy prompt from `prompts/XX-country.md` into Gemini Deep Research
- Run the research

### 2. Capture → `results/`

- Paste raw Gemini output into `results/XX-country.md`
- Keep narrative + tables as-is

### 3. Enrich → `enriched/`

- Normalize scores to 1-5 scale
- Validate company data, add missing seed companies
- Add LinkedIn URLs where missing
- Flag duplicates across countries
- Add VariScout-specific pitch notes

### 4. Export → `csv/`

- Parse enriched tables into CSV
- Merge into `master-leads.csv`
- Ready for CRM import or spreadsheet analysis

## CSV Schema

```csv
Country,Rank,Company,Industry,Employees,CI_Evidence,Azure_Cloud,Contact_Titles,LinkedIn_URL,S1_OpEx,S2_Size,S3_Minitab,S4_Azure,S5_Reach,Total_Score,Market_Tier,Segment,Notes
```

### Scoring (S1-S5, each 1-5, max 25)

| Score | Criterion             | 5 = Best                  | 1 = Lowest           |
| ----- | --------------------- | ------------------------- | -------------------- |
| S1    | CI/OpEx maturity      | Dedicated OpEx team + LSS | No visible CI        |
| S2    | Size & team potential | 500+ emp, 10+ tool users  | <50 employees        |
| S3    | Minitab replacement   | Known Minitab user        | No quality analytics |
| S4    | Microsoft ecosystem   | Confirmed Azure/M365      | Non-Microsoft stack  |
| S5    | Reachability          | Clear contact found       | No contacts          |

### Segmentation

| Segment | Total Score | Action                           |
| ------- | ----------- | -------------------------------- |
| 🔴 HOT  | 20-25       | Direct personalized outreach     |
| 🟠 WARM | 15-19       | Template + personalization       |
| 🟡 COOL | 10-14       | Content nurture (webinars, blog) |
| ⚪ COLD | <10         | Archive for later                |

### Market Tiers

| Tier               | Countries                                     |
| ------------------ | --------------------------------------------- |
| 1 - Nordics (home) | Finland, Sweden, Denmark, Norway              |
| 2 - DACH           | Germany, Austria, Switzerland                 |
| 3 - UK/IE          | United Kingdom, Ireland                       |
| 4 - Benelux        | Netherlands, Belgium                          |
| 5 - Western EU     | France, Italy, Spain                          |
| 6 - Central EU     | Poland, Czech Republic                        |
| 7 - Overseas       | USA, Canada, Australia, India, Brazil, Mexico |

## Countries (22)

| #   | Country        | Prompt | Status                                                     |
| --- | -------------- | ------ | ---------------------------------------------------------- |
| 01  | Finland        | ✅ v2  | ⏳ Pending                                                 |
| 02  | Sweden         | ✅ v2  | ⏳ Pending                                                 |
| 03  | Denmark        | ✅ v2  | ✅ 52 companies → HOT: 30, WARM: 19, COOL: 3               |
| 04  | Norway         | ✅ v2  | ✅ 52 companies → HOT: 31, WARM: 20, COOL: 1               |
| 05  | Germany        | ✅ v2  | ✅ 55 companies → HOT: 26, WARM: 27, COOL: 2               |
| 06  | Austria        | ✅ v2  | ✅ 50 companies (1-10 scale) → HOT: 14, WARM: 26, COOL: 10 |
| 07  | Switzerland    | ✅ v2  | ✅ 52 companies → HOT: 17, WARM: 32, COOL: 3               |
| 08  | UK             | ✅ v2  | ✅ 60 companies → HOT: 28, WARM: 32                        |
| 09  | Ireland        | ✅ v2  | ✅ 50 companies → HOT: 29, WARM: 21                        |
| 10  | Netherlands    | ✅ v2  | ✅ 54 companies → HOT: 23, WARM: 31                        |
| 11  | Belgium        | ✅ v2  | ✅ 52 companies → HOT: 42, WARM: 10                        |
| 12  | France         | ✅ v2  | ✅ 52 companies → HOT: 23, WARM: 29                        |
| 13  | Italy          | ✅ v2  | ⏳ Pending                                                 |
| 14  | Spain          | ✅ v2  | ⏳ Pending                                                 |
| 15  | Poland         | ✅ v2  | ⏳ Pending                                                 |
| 16  | Czech Republic | ✅ v2  | ⏳ Pending                                                 |
| 17  | USA            | ✅ v2  | ⏳ Pending                                                 |
| 18  | Canada         | ✅ v2  | ⏳ Pending                                                 |
| 19  | Australia      | ✅ v2  | ⏳ Pending                                                 |
| 20  | India          | ✅ v2  | ⏳ Pending                                                 |
| 21  | Brazil         | ✅ v2  | ⏳ Pending                                                 |
| 22  | Mexico         | ✅ v2  | ⏳ Pending                                                 |
