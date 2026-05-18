---
tier: stable
purpose: orient
title: Membership Philosophy
audience: human
category: reference
status: active
last-reviewed: 2026-05-17
related: [access-control, project-membership, acl, single-sku]
layer: L5
---

# Membership Philosophy

How VariScout V1 thinks about access control: **one product, role-based access
inside.** Not feature-gated tiers. Not seat-based licensing. Not capability
ladders.

This doc captures the principle, the model, and why it's better than the
enterprise-SaaS default. Companion to [ADR-082](../07-decisions/adr-082-wedge-architecture.md)
and the [V1 architecture spec](../superpowers/specs/2026-05-16-wedge-architecture-design.md).

---

## 1. The principle

**Every paid customer gets the whole product.**

VariScout V1 ships as a single SKU at €120/month per Azure tenant. That €120
buys the full analytical surface — every chart mode, every CoScout feature,
the entire Project lifecycle (Charter → Approach → Sustainment),
the Report, the Knowledge Catalyst, voice input, the works. Unlimited org
users, unlimited projects.

What's controlled is not _what features the org can use_ but _who in the org
can see a given Project's formal artifacts_.

This is a deliberate inversion of the enterprise-SaaS norm. Most B2B tools
gate features across pricing tiers — Starter has X, Pro has Y, Enterprise has
Z. That model serves the vendor (more SKUs, more upsell levers, more sales
conversations). It does not serve the customer (decision moment at purchase,
feature anxiety inside the product, internal politics about who gets the
"good" license).

VariScout's model says: one product, one price, one sales conversation. The
access scope is _per project_, not _per feature_, and it lives _inside_ the
product as project-membership ACLs.

---

## 2. Why this is better

### 2.1 The sales conversation collapses

"€120/month, Azure tenant-wide, invite your team per project."

That's the whole pitch. No tier comparison table. No "what does this feature
cost?" follow-up. No "is the AI in this plan?" hedging. A specialist evaluating
VariScout knows the price and the product in one sentence.

Compare the prior Standard (€79) + Team (€199) split: every prospect saw both,
weighed both, and many landed on the lower SKU even when the team product
was the right fit. The tier choice was a friction layer, not a value
discriminator.

### 2.2 Customer success doesn't need plan-mapping

Every customer is on the same surface. Support engineers don't need to
remember which features the customer paid for. Onboarding scripts don't
branch. Docs don't need "available on Team and above" annotations on every
section. The product feels the same to every customer because it _is_ the
same.

### 2.3 Engineering doesn't carry tier-gating UX

The prior tier model touched ~28 files of `isPaidTier()` / `hasTeamFeatures()`
/ tier-conditional rendering. Every new feature had to consider "what tier is
this for?" That cognitive load propagates into product decisions
("this should be Team because it's collaborative" — but who actually
collaborates and who actually doesn't?). The membership model retires all of
that. Features are either in the product or not; access is either granted to
a project member or not.

### 2.4 Privacy is sellable

Project-scoped membership creates a defensible privacy boundary that
tenant-wide access cannot. Users not invited to Project X cannot see Project
X's Charter, Approach, Sustainment, Improve tab, or Report — even though they're
in the same Azure tenant as the buyer. This is sellable to GDPR-concerned
buyers, SOC2-audited orgs, and quality-paranoid manufacturing customers
where investigation data names internal failure modes that shouldn't be
casually visible across the whole org.

A tier-based model can't promise this. A membership-based model can.

---

## 3. The model — three roles per project

Inside any given Project, every member holds one of three roles. The role
controls which actions they can take. Authority comes from `packages/core/src/projectMembership/canAccess.ts`:

```typescript
type ProjectAction =
  | 'edit-charter'
  | 'edit-approach'
  | 'edit-improve'
  | 'edit-sustainment'
  | 'manage-membership'
  | 'view-report';

const ROLE_PERMISSIONS: Record<ProjectRole, ReadonlyArray<ProjectAction>> = {
  lead: [
    'edit-charter',
    'edit-approach',
    'edit-improve',
    'edit-sustainment',
    'manage-membership',
    'view-report',
  ],
  member: ['edit-charter', 'edit-approach', 'edit-improve', 'edit-sustainment', 'view-report'],
  sponsor: ['view-report'],
};
```

### 3.1 Lead

Real-world counterpart: Black Belt, Master Black Belt, project lead, quality
manager running the work.

Lead has full edit across every Project stage and manages membership (invite,
remove, change roles). Typically the analyst who created the Project. A
Project has at least one Lead at all times; promoting a Member to Lead is
allowed and creates a co-lead arrangement.

### 3.2 Member

Real-world counterpart: SME, analyst, frontline operator, quality engineer
contributing to the work.

Member has full edit on the Charter, Approach, and Sustainment stages plus the
Improve tab, and can read the Report. Member cannot manage other members —
invites and role changes go through a Lead.

### 3.3 Sponsor

Real-world counterpart: executive sponsor, Champion, steering committee
member, divisional VP.

Sponsor has **Report-only** access at V1. They see the Report tab for
projects they sponsor. They do not see Charter, Approach, Sustainment internals, or Improve tab
content.

Sponsor signoff at lifecycle gates (Charter approval, Sustainment closure)
lives **outside the product at V1 — by design, not as a placeholder.** The
Lead presents the Report; the Sponsor approves verbally, by email, or in
their existing organizational signoff workflow; the Lead records the signoff
in the relevant stage's notes. Audit trail and in-app Sponsor signoff are
VariScout Process features. In V1, the value of VariScout is the analysis +
investigation rigor that makes any signoff conversation faster and more
defensible; the signoff workflow itself is intentionally not productized.

Vocabulary note: "Sponsor" is the canonical Six Sigma / Lean / CI term for the
executive who authorizes and underwrites the project. The "Champion"
terminology (GE-school Six Sigma) is equivalent; V1 uses Sponsor for
unambiguity.

---

## 4. Data isolation — two scopes

V1 has **two access scopes** that work together:

| Scope                          | Who has access                              | What's gated                                                                                                               |
| ------------------------------ | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Hub-level (tenant-wide)**    | Anyone in the Azure tenant (all paid users) | The shared data container — paste data, outcome spec, process map, factors. Quick analysis works here without any Project. |
| **Project-level (membership)** | Only invited members of a specific Project  | Project-formal data — Charter content, Approach Hypotheses + Plans, Sustainment closure, Improve tab actions, Report.      |

A Lead can promote any quick analysis into a Project; that Project then locks
its formal artifacts to its membership while leaving the underlying Hub data
tenant-wide. Members and Sponsors see only the Projects they're invited to.

This is the primary data-isolation boundary inside V1. ACL enforcement points
(per ADR-082 §4.4):

- `useProjectMembershipStore` — annotation-layer store for the membership graph
- Auth checks at `core/project/*` read paths
- Sponsor role check at Report rendering (Sponsors see only the Report for
  projects they sponsor)
- UI: project list filters to memberships; invite modal in Charter stage

---

## 5. Where access checks live — inside the surface, not at entry

A core architectural rule: **access check inside each surface, not at surface
entry.**

Concretely: when an unauthorized user navigates to (say) a Project's
Investigation tab, they don't see a paywall-style "you don't have access" CTA
at the tab boundary. Instead, the surface itself renders an appropriate state:
the project doesn't show up in their project list, or the deep-linked URL
404s into a "this project isn't shared with you" empty state.

Why this matters:

- **No false advertising.** Users don't see surfaces they can't use.
- **No "upgrade to access" friction.** There is no upgrade — they either have
  membership or they don't, and that's a Project Lead decision, not a
  payment decision.
- **Free-tier pedagogy preserved.** The free PWA shows every analytical
  surface (Process, Analyze, Investigation) for the local session's data —
  there's no "this is a paid feature" badge anywhere. Pedagogy and product
  coherence both benefit.

This rule predates the V1 single-SKU pivot (originally written for
tier-gating) and survived the membership shift because the principle is
about UX coherence, not access mechanism.

---

## 6. Cross-tenant invitations — explicitly out of V1

Project members must already be in the buyer's Azure AD tenant. Cross-AD-
tenant invitations are explicitly out of scope for V1.

This is **a feature, not a limitation**. It creates a clean privacy boundary
(no consultant accidentally exposed to another customer's data; no consulting
firm building shadow access across multiple client tenants), aligns with the
Azure Marketplace per-deployment distribution model, and keeps the V1 surface
focused. Buyers who need to bring in external consultants can use Azure AD
guest accounts — that's overhead the buyer manages, not the product.

If pipeline analysis reveals significant ICP demand for cross-org invites,
the SaaS distribution path becomes a future product decision, not a V1
scope creep.

---

## 7. The PWA stays free

The free PWA is a learning tool, not a degraded paid product. Same charts,
same methodology, same investigation structure — session-only storage, no
file upload, no CoScout, no persistence. The struggle is the point
([ADR-019](../07-decisions/adr-019-ai-integration.md), Constitution §10):
guided frustration builds statistical intuition that AI shortcuts would
undermine.

PWA users don't have project membership because they don't have an Azure
tenant. They have the methodology. When the natural ceiling hits ("I need to
save this; I need my team in here"), the Azure product is one Marketplace
click away. See [Positioning §6.2](../01-vision/positioning.md#62-the-pwa-as-funnel).

---

## 8. What this replaces

This doc replaces the prior **Tier Philosophy** doc that captured the
Standard (€79) / Team (€199) tier ladder. The principle "PWA teaches, paid
produces" survives. The "two paid plans capability maturity model" retires.
The "tier-gate inside surfaces, not at entry CTAs" rule survives, recast as
"membership access check inside surfaces, not at entry CTAs."

VariScout Process (the future enterprise product per [ADR-082](../07-decisions/adr-082-wedge-architecture.md))
may reintroduce a higher SKU. That will be a different product with different
unit economics, not a tier on V1.

---

## 9. Cross-reference

- [ADR-082](../07-decisions/adr-082-wedge-architecture.md) — V1
  architecture decision (the strategic record).
- [V1 architecture spec §4](../superpowers/specs/2026-05-16-wedge-architecture-design.md#§4-project-membership-model-new)
  — Project membership model (canonical V1 design).
- `packages/core/src/projectMembership/canAccess.ts` — Permission matrix
  source of truth (the only place to update if roles change).
- [Positioning Bible §3.4](../01-vision/positioning.md#34-one-product-role-based-access-inside)
  — How this principle shows up in customer-facing positioning.
- [Business Bible](../01-vision/business-bible.md) — Strategic hypotheses
  including H6 (per-deployment beats per-seat).
- [ADR-074](../07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md)
  — Surface-boundary policy (related; tells you where access checks sit
  relative to render).
