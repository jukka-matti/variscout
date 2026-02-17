# Gemini Deep Research: Contact Enrichment Prompt — Switzerland

> Use this prompt in Gemini Deep Research to find specific contact persons at HOT-segment Swiss companies.

---

## PROMPT START

You are a B2B sales intelligence researcher specializing in the Swiss industrial market. I need you to find **specific contact persons** at the following Swiss manufacturing companies who are responsible for **Operational Excellence, Quality Management, Continuous Improvement, Lean Six Sigma, or Process Engineering**.

### Context

We are selling **VariScout**, a process variation analysis SaaS tool on Microsoft Azure Marketplace (Managed Application — data stays in customer's Azure tenant). We need decision-makers and influencers who:

- Lead OpEx / CI programs
- Manage quality systems (ISO 9001, ISO 13485, IATF 16949)
- Evaluate analytical software (Minitab, JMP, or similar)
- Have titles like: Head of OpEx, Quality Director, CI Manager, Lean Manager, Process Engineer

### Important: Swiss Market Specifics

- Search LinkedIn (primary) and XING (secondary for German-speaking CH)
- Check jobs.ch and JobScout24 for current postings indicating team structure
- **Bilingual market**: German CH (Zurich/Basel/Schaffhausen) and French CH (Lausanne/Geneva/Arc Jurassien)
- Swiss companies use both English and German/French for titles
- "Bureau des Méthodes" in watchmaking = Methods Engineering = process improvement
- **nFADP** (data protection) sensitivity → mention Managed App architecture

### Target Companies (Switzerland — HOT segment, score 20-25)

For EACH company below, find **2-3 relevant contacts** with:

1. Full name
2. Current title/role
3. LinkedIn profile URL (if findable)
4. How they relate to process improvement / quality / OpEx
5. Any evidence of LSS certification, Minitab usage, or quality tool expertise

**Companies to research:**

1. Sensirion AG (Stäfa) — Sensors, 1,200 emp — IoT CI culture ⭐ Hiring OpEx Manager
2. u-blox AG (Thalwil) — Semiconductors, 1,400 emp — OpEx strategic pillar
3. Medela AG (Baar) — Medical Devices, 1,500 emp — Hiring LSS Black Belts
4. Georg Fischer GF (Schaffhausen) — Machinery, 15,000 emp — Strategy 2025 OpEx
5. Bühler Group (Uzwil) — Machinery, 12,000 emp — Bühler Insights on Azure ⭐
6. Straumann Group (Basel) — MedTech, 10,000 emp — ClearCorrect transformation
7. Sika AG (Baar) — Chemicals, 33,000 emp — Fast Forward efficiency program
8. Bobst Group (Mex) — Packaging Machinery, 6,000 emp — Bobst Connect Azure IoT
9. Oerlikon (Pfäffikon) — Surface Solutions, 12,000 emp — OOE global system
10. Huber+Suhner (Herisau) — Electronics, 4,000 emp — OpEx as 1 of 3 pillars
11. Bachem (Bubendorf) — Pharma/Biochem, 2,000 emp — LSS mandatory
12. Siegfried Holding (Zofingen) — Pharma CDMO, 3,600 emp — Global Head OpEx
13. Rieter (Winterthur) — Textile Machinery, 5,600 emp — CIP mandated
14. TE Connectivity CH (Schaffhausen) — Sensors, 80,000 emp — Smart Factory AI
15. Schott Schweiz AG (St. Gallen) — Pharma Packaging, 600 emp — VR + Lean
16. Ypsotec AG (Grenchen) — Precision Parts, 350 emp — ISO 13485 variation analysis
17. MPS Micro Precision (Biel) — Precision Systems, 400 emp — Extreme tolerances

### Already-known contacts (DO NOT duplicate, but verify if still current)

- u-blox: Jean-Pierre Wyss (Head of Production & Quality, ExCom)
- Straumann: Mark Johnson (Head of Ops, Regulatory & Quality Affairs — Six Sigma GB + Lean Expert)
- Bobst: Patrice Richard (Lean Project Manager), Alain Berger (ExCom, ex-Head Quality GF)
- Siegfried: Hartmut Loos (Head QA), Henrik Krüpper (COO Drug Substances)

### Output Format

Present results as a **table** with columns:
| Company | Contact Name | Title | LinkedIn URL | OpEx/CI Evidence | LSS/Minitab | Confidence |

Where Confidence = HIGH (company website/recent press), MEDIUM (LinkedIn), LOW (older reference)

### Important Notes

- Focus on people CURRENTLY in roles (2024-2026)
- Prefer mid-level decision-makers (Head of, Director, Manager) over C-suite
- Include evidence of: process analytics, SPC, statistical tools, Minitab, variation analysis
- Note conference presentations (Swissmem events, SAQ events, inspire AG workshops)
- For companies actively hiring OpEx/Quality roles, note hiring manager if identifiable
- Include both German- and French-speaking contacts

## PROMPT END
