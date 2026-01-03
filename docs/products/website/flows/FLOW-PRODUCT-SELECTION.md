# Flow: Product Selection

## Overview

Helping users choose the right VaRiScout product for their needs.

---

## Decision Tree

```
                        START
                          │
                          ▼
            ┌─────────────────────────┐
            │ Where will you use it?  │
            └─────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
    Browser           Excel             Power BI
        │                 │                 │
        ▼                 ▼                 ▼
    ┌───────┐        ┌───────┐        ┌───────────┐
    │ Who?  │        │ Excel │        │ How many  │
    └───────┘        │ Add-in│        │ users?    │
        │            └───────┘        └───────────┘
   ┌────┴────┐                              │
   ▼         ▼                    ┌─────────┼─────────┐
 Just me   Org-wide               ▼         ▼         ▼
   │         │                  ≤10       10-50     50+
   ▼         ▼                   │         │         │
┌──────┐  ┌───────┐              ▼         ▼         ▼
│ Web  │  │ Azure │           Team    Department  Enterprise
│ App  │  │       │           €399      €999       €1,999
└──────┘  └───────┘
```

---

## Entry Points to Selection

| Entry                 | Likely Need | Direct To                     |
| --------------------- | ----------- | ----------------------------- |
| Homepage              | Exploring   | /product/compare              |
| "Try Free"            | Individual  | /app (Web App)                |
| "Power BI" search     | BI team     | /product/power-bi             |
| "Excel add-in" search | Excel user  | /product/excel                |
| IT/Procurement        | Enterprise  | /product/azure or /enterprise |

---

## Comparison Page Design

### Quick Selector

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Which VaRiScout is right for you?                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ I want to...                                             │   │
│  │                                                          │   │
│  │ ○ Try it right now              → Web App               │   │
│  │ ○ Analyze in Excel              → Excel Add-in          │   │
│  │ ○ Add to Power BI dashboards    → Power BI              │   │
│  │ ○ Deploy for my organization    → Azure                 │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Feature Table

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Compare Features                                               │
│                                                                 │
│  ┌───────────────┬────────┬────────┬──────────┬────────┐       │
│  │               │ Web    │ Excel  │ Power BI │ Azure  │       │
│  ├───────────────┼────────┼────────┼──────────┼────────┤       │
│  │ Try instantly │   ✓    │   –    │    –     │   –    │       │
│  │ No install    │   ✓    │   –    │    –     │   ✓*   │       │
│  │ Works offline │   ✓    │   ✓    │    –     │   ✓    │       │
│  │ Excel native  │   –    │   ✓    │    –     │   –    │       │
│  │ Dashboard     │   –    │   –    │    ✓     │   –    │       │
│  │ Auto refresh  │   –    │   –    │    ✓     │   –    │       │
│  │ Custom domain │   –    │   –    │    –     │   ✓    │       │
│  │ MS certified  │  N/A   │   ✓    │    ✓     │   ✓    │       │
│  ├───────────────┼────────┼────────┼──────────┼────────┤       │
│  │ Free tier     │   ✓    │   ✓    │    –     │   –    │       │
│  │ Individual    │  €49   │  €49   │    –     │   –    │       │
│  │ Team (10)     │   –    │   –    │  €399    │   –    │       │
│  │ Dept (50)     │   –    │   –    │  €999    │   –    │       │
│  │ Unlimited     │   –    │   –    │ €1,999   │  €999  │       │
│  └───────────────┴────────┴────────┴──────────┴────────┘       │
│                                                                 │
│  * For end users. IT deploys once.                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Scenarios

### Scenario 1: Individual Analyst

**Profile:**

- Works alone or small team
- Needs quick analysis
- No corporate BI infrastructure

**Journey:**

1. Lands on homepage
2. Clicks "Try Free"
3. Uses Web App
4. If likes it → Individual (€49)

**Recommendation:** Web App

---

### Scenario 2: Excel Power User

**Profile:**

- Lives in Excel
- Data already in spreadsheets
- Wants analysis alongside data

**Journey:**

1. Searches "Excel SPC add-in"
2. Lands on /product/excel
3. Installs from AppSource
4. If needs clean exports → Individual (€49)

**Recommendation:** Excel Add-in

---

### Scenario 3: BI Team

**Profile:**

- Uses Power BI for reporting
- Wants SPC in dashboards
- Multiple viewers

**Journey:**

1. Searches "Power BI control chart"
2. Lands on /product/power-bi
3. Reviews features
4. Checks pricing → Team or Department
5. Gets IT approval
6. Installs from AppSource

**Recommendation:** Power BI (Team €399 or Department €999)

---

### Scenario 4: IT/Operations Manager

**Profile:**

- Responsible for team tools
- Data sovereignty concerns
- Needs organization-wide solution

**Journey:**

1. Referred by analyst who tried Web App
2. Reviews /product/azure
3. Checks data sovereignty
4. Discusses with IT
5. Deploys to Azure

**Recommendation:** Azure (€999)

---

### Scenario 5: Training Organization

**Profile:**

- Teaches Lean Six Sigma
- Many students
- Budget-conscious

**Journey:**

1. Searches "Minitab alternative"
2. Lands on /use-cases/lss-training
3. Tries Web App (free)
4. Uses free tier for classroom (watermark OK)
5. Contacts for volume licensing

**Recommendation:** Web App (Free) for students

---

## Product Selection Wizard

### Interactive Questionnaire

```
Step 1: Where will you analyze?
─────────────────────────────────────────────────────

○ In a web browser
○ Inside Excel
○ On Power BI dashboards
○ Not sure / Multiple


Step 2: How many people will use it?
─────────────────────────────────────────────────────

○ Just me
○ My team (2-10 people)
○ My department (10-50 people)
○ Whole organization (50+)


Step 3: Any special requirements?
─────────────────────────────────────────────────────

☐ Data must stay in our network
☐ Need custom branding
☐ Must be Microsoft certified
☐ Budget is very limited


RESULT
─────────────────────────────────────────────────────

Based on your answers, we recommend:

╔═══════════════════════════════════════════════════╗
║                                                   ║
║  VaRiScout for Power BI - Department              ║
║                                                   ║
║  €999/year for up to 50 users                    ║
║                                                   ║
║  ✓ All 4 Power BI visuals                        ║
║  ✓ Microsoft certified                           ║
║  ✓ Priority support                              ║
║                                                   ║
║  [Get from AppSource]                            ║
║                                                   ║
╚═══════════════════════════════════════════════════╝

Not quite right? [See all options]
```

---

## Common Objections

### "Too expensive"

| Objection             | Response                                             |
| --------------------- | ---------------------------------------------------- |
| Power BI €399 is high | Compare to Minitab (€1,500+/user), share across team |
| Any paid tier         | Start with free, upgrade when you see value          |
| Enterprise pricing    | Contact us for volume discounts                      |

### "We use Minitab"

| Objection             | Response                                            |
| --------------------- | --------------------------------------------------- |
| Already have licenses | VaRiScout for quick/live analysis, Minitab for deep |
| Training investment   | Zero learning curve, no new training                |
| Advanced features     | We focus on 80% use case; Minitab for advanced      |

### "IT won't approve"

| Objection        | Response                           |
| ---------------- | ---------------------------------- |
| Unknown vendor   | Microsoft certified in AppSource   |
| Data security    | Data never leaves browser          |
| Support concerns | Email support, clear documentation |

### "Need to evaluate"

| Objection         | Response                        |
| ----------------- | ------------------------------- |
| Trial period      | Free tier is unlimited trial    |
| Compare to others | Use Web App free, no commitment |
| Show to team      | Share /app link, anyone can try |

---

## Upgrade Paths

### From Free

```
Free Web App
    │
    ├──► Individual Web (€49) - Remove watermark
    │
    ├──► Power BI Team (€399) - Need dashboards
    │
    └──► Azure (€999) - Need org-wide
```

### From Individual

```
Individual (€49)
    │
    ├──► Power BI Team (€399) - Add dashboard
    │
    └──► Azure (€999) - Scale organization
```

### From Power BI Team

```
Power BI Team (€399)
    │
    ├──► Power BI Department (€999) - More users
    │
    ├──► Power BI Enterprise (€1,999) - Unlimited
    │
    └──► Azure (€999) - Add self-deploy option
```

---

## Cross-Sell Opportunities

| Current Product | Cross-Sell | Trigger                    |
| --------------- | ---------- | -------------------------- |
| Web App         | Power BI   | "Want to automate this?"   |
| Excel           | Power BI   | "Share with the team?"     |
| Power BI        | Azure      | "Need custom branding?"    |
| Any             | Training   | "Need help training team?" |

---

## Selection Page CTAs

| Product  | Primary CTA           | Secondary CTA                   |
| -------- | --------------------- | ------------------------------- |
| Web App  | "Try Free" → /app     | "Learn More" → /product/web-app |
| Excel    | "Get from AppSource"  | "Learn More" → /product/excel   |
| Power BI | "Get from AppSource"  | "See Pricing" → /pricing        |
| Azure    | "View in Marketplace" | "Learn More" → /product/azure   |

---

## Analytics for Selection

Track:

- Which products viewed
- Comparison table interactions
- Wizard completion rate
- Selection → conversion rate
- Cross-navigation patterns
