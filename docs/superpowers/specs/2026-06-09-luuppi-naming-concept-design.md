---
title: 'Luuppi — Product Naming Concept (rebrand proposal)'
status: draft
purpose: design
tier: living
audience: human
date: 2026-06-09
topic: [branding, naming, vision, marketing]
related: [product-overview, glossary, decision-log]
layer: spec
implements:
  - docs/01-vision/product-overview.md
---

# Luuppi — Product Naming Concept

> **STATUS: PROPOSAL (draft).** Recommends renaming **VariScout → Luuppi**. Not yet adopted — gated on two cheap validations: (1) a say-it-aloud test with ~5 target users, and (2) a formal trademark clearance (EU + Finland, optional US). Until both clear, the product name remains VariScout. This document captures _why Luuppi_, so the choice is durable and we don't relitigate it.

## 1. The decision, in one line

Rebrand the product from **VariScout** to **Luuppi** — Finnish for _loupe_, the jeweler's precision lens. The name **is** the product's thesis: a loupe is the instrument you hold to your eye to see the fine detail — and judge the true quality — that the naked eye misses.

## 2. Why Luuppi is the right name (not just a nice one)

Three things have to be true of a great product name, and Luuppi is the only candidate that hit all three.

**a) It lands on the product's true center.** The product's chosen essence is _"see into the process"_ — make the invisible drivers of variation visible. A loupe is exactly that instrument. And the name secretly carries the product's _other_ core truth too: you **loupe a gem to find the value in the stone** — i.e. you look closely at the very detail (the outliers, the spread) that everyone else averages away. _See into the process_ **and** _the treasure is in the spread_ — one four-letter Finnish word.

**b) The etymology unifies everything.** _Evidence_ ← Latin _ē-vidēre_ = "to **see** out, to make visible." So _evidence_ and _"see into the process"_ are literally the same idea — and a loupe is the tool that produces it. The two threads we kept splitting (see vs. prove) were always one.

**c) It's authentically the founder's, and it travels.** Luuppi is a real Finnish word — like the proven lineage of Finnish-rooted global brands (Oura, Wolt, Relex). But unlike most Finnish words, it _travels_: English/French already lent the world _loupe_, so an international audience can recover the meaning. That's the rare sweet spot — **authentic Finnish identity AND international legibility.** (Naakka, näätä, huomio do not have that bridge; luuppi does.)

## 3. The manifesto (the soul)

John Tukey, founder of Exploratory Data Analysis (1977):

> _"The greatest value of a picture is when it forces us to notice what we never expected to see."_

and, in the same book:

> _"Exploratory data analysis is detective work — numerical detective work, graphical detective work."_

Tukey fused the two things the product does — **seeing** and **investigating** — and named its purpose: _force you to notice the unexpected_ (the anomaly, the outlier, the golden nugget). That line is the brand's reason-for-being.

**Manifesto / hero line:**

> # Luuppi
>
> ### Notice what you never expected to see.

**Tagline options (for testing):** _"See what your process hides." · "From hunch to evidence." · "Notice what you never expected to see."_

## 4. The brand voice & 10-second story

A loupe is a **craftsman's** instrument — and the buyer (a Lean/Six Sigma belt, a quality engineer) is a craftsman of quality. The voice is _precise, calm, confident, a little quirky_ — an instrument, not a corporate "platform." It can be used as a verb ("loupe the data; what does the loupe show?").

First-contact read: _"Loo-pee?… oh — luuppi, a loupe, a magnifier. A magnifier for my process data."_ Costs one beat; rewards it.

## 5. The namespace — a system, not just a name

The "evidence/see" idea cascades cleanly across the whole product, and most of it the codebase _already speaks_:

| Surface                      | In the Luuppi system                               | Status             |
| ---------------------------- | -------------------------------------------------- | ------------------ |
| The product / brand          | **Luuppi**                                         | new                |
| Manifesto                    | _"Notice what you never expected to see."_ (Tukey) | new                |
| The canvas (data → process)  | **Evidence Map**                                   | already named this |
| A saved chart observation    | a **Finding** = a piece of evidence                | already named this |
| Hypothesis lifecycle         | proposed → **evidenced** → confirmed / refuted     | already named this |
| The AI partner (was CoScout) | **Evi** — "ask Evi," your evidence partner         | optional, later    |
| Export file (was `.vrs`)     | **`.evd`** — the evidence file                     | optional, later    |
| The verb / CTA               | "**Make it evident**" · "Loupe it"                 | new copy           |

The point: because the product is _already evidence-native_ (it literally calls its core surface the **Evidence Map** and its hypothesis status **evidenced**), this is the **lowest-friction rebrand** of every candidate — the new brand's vocabulary is mostly already in the code and docs.

## 6. Identity sketch (for a designer)

- **Wordmark:** lowercase `luuppi` in a precise Nordic grotesque (Aino / Suisse-Int'l register). The paired **uu** cradles a small lens ring — a loupe — as the one distinctive glyph move.
- **Mark:** a single clean circular lens (a loupe), optionally with a faint scatter of points resolving toward focus inside it.
- **Feel:** engineered, premium, calm. Graphite/ink + one signal accent (deep blue or a precise green).
- **Motion:** a hero animation of scattered data points sharpening into a legible shape _as the loupe passes over them_ — Tukey's "forced to notice," made visual.

## 7. Options considered (so we don't relitigate)

~60 candidates over one session. Why the serious finalists lost:

| Candidate                                              | Why not                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **VariScout** (incumbent)                              | The null hypothesis. Clear but forgettable, faintly SPC-niche; it's the name that _never gave an edge_. Keeping it = choosing safe mediocrity. Rejected by the founder's own "ok… I guess."                                                                             |
| **Exploria**                                           | A $750M timeshare company (Exploria Resorts) owns the registered trademark + domain + SEO. Generic ("explore") on top of that.                                                                                                                                          |
| **Evidento**                                           | Best _idea_ (evidence = "made visible"), clean trademark, free `.ai`/`.io` — but real-user feedback: **"sounds like a dental brand"** (the buried _evi-**DENT**-o_). Second independent "off for B2B" hit on the `-o`. Idea survives as the _vocabulary_, not the name. |
| **Lode / Trove / Assay / Facet**                       | Treasure-in-the-spread lane. Lode = telecom firm + "load" homophone; Trove/Assay/Magpie crowded in analytics SaaS.                                                                                                                                                      |
| **Murmur / Murmuration**                               | Beautiful (emergence) but _off-center_ (emergence ≠ causal investigation), and badly contested — Murmuration is a Bloomberg-backed civic-**data** nonprofit; Murmur is 5+ AI startups.                                                                                  |
| **Heron / Kestrel / Magpie / Dipper / Rook / Goshawk** | The "obvious sharp-eyed animal" names are all already taken in data/analytics. Only **Jackdaw** and **Marten** came back clean.                                                                                                                                         |
| **Salient**                                            | Near-literal Tukey ("what leaps out and forces notice") — strongest _meaning_ of the real-word options; kept as the runner-up name. Repurposed: Tukey's line becomes Luuppi's manifesto instead.                                                                        |
| **Tracer / Augur / Quarry / Jackdaw**                  | Real runners-up. Tracer = the clarity-vs-distinctiveness bridge; Jackdaw = the clean, characterful animal. Held in reserve if Luuppi fails its gates.                                                                                                                   |

## 8. Risks & open gates

1. **The "loopy / loo-pee" first-impression** — the one thing that could veto Luuppi. _Gate: say-it-aloud test_ with ~5 target users (say it / spell it / "what's it do?" / "text it to a colleague"). Watch for the smirk. Expectation: passes (the hard double-p of _luuppi_ doesn't slide to "loopy"), but the faces decide.
2. **Pronunciation/teaching cost for non-Finns** — a one-time cost that buys a permanent moat (the Oura/Wolt path). Mitigated by the _loupe_ bridge.
3. **Trademark** — _Gate: formal clearance_ (see §9). Preliminary web screen found no commercial "Luuppi" software brand; `luuppi.fi` belongs to a Tampere university student association (not a competitor). The English word **Loupe** is more crowded (Loupedeck — Helsinki, Logitech-owned; Loupe streaming/photo apps) — a reason the _Finnish_ form is the better, more ownable choice.
4. **Domains** — `luuppi.fi` taken (student org). **Grab `luuppi.io` + `luuppi.ai` now** (`.ai` fits the Evi assistant; both checked available at proposal time). `.com` later / not needed to launch.

## 9. Trademark clearance brief (hand this to an EU IP attorney)

- **Mark:** LUUPPI (word mark).
- **Goods/services:** Downloadable and cloud-based (SaaS) software for statistical process analysis, exploratory data analysis, and process-improvement investigation; data visualization software.
- **Nice classes:** **9** (software) + **42** (SaaS / software development).
- **Territories:** **EU (EUIPO)** + **Finland (PRH)** primary; **US (USPTO)** if selling there.
- **Marks to clear against (similarity / likelihood of confusion):** any LUUPPI / LUUPI / LUPPI; and assess proximity of LOUPE / LOUPEDECK in classes 9/42.
- **Registers:** EUIPO eSearch plus · PRH (Finland) · USPTO Trademark Search · WIPO Global Brand Database.

## 10. Rollout scope (becomes a separate implementation plan)

Right-sized so it doesn't blow up a sprint. Follows the established rename pattern (cf. Task #40 / PR #242): **rename user-facing strings + brand assets; keep code identifiers** (`variscout` package names, IDB identifiers) to bound churn.

- **Brand assets / domains:** wordmark, favicon, logo; secure `luuppi.io` + `luuppi.ai`.
- **User-facing strings:** "VariScout" → "Luuppi" across Azure + PWA UI + i18n (mirror both apps); marketing/landing copy + manifesto/tagline.
- **Docs:** product-overview, glossary, vision; banner this concept doc → `active` once gates clear.
- **Optional, later (own decisions):** CoScout → **Evi**; `.vrs` → `.evd`; deeper code-identifier rename (likely _not_ worth the churn).
- **Out of scope here:** the engineering plan itself — drafted via `writing-plans` after the two gates clear.

## 11. Status & next steps

1. **Say-it-aloud test** (~5 belts) — the veto gate.
2. **Trademark clearance** (§9) + grab `luuppi.io` / `luuppi.ai`.
3. On pass → flip this doc to `status: active`, log the adoption in `decision-log.md`, and open the rollout plan via `writing-plans`.
4. On fail (the smirk) → fall back to **Tracer** or **Jackdaw**, or stay **VariScout** deliberately (do not trade down to another generic).
