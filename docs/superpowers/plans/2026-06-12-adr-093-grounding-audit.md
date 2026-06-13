---
tier: living
purpose: build
title: 'ADR-093 grounding audit and deletion sequence'
audience: human
status: active
date: 2026-06-12
layer: spec
topic: [adr-093, local-first, deletion-sweep, collaboration, persistence, mobile, coscout]
related:
  - docs/07-decisions/adr-093-v1-simplification-cuts.md
  - docs/07-decisions/adr-092-local-first-variscout-product-model.md
  - docs/superpowers/specs/2026-06-11-local-first-variscout-product-vision-design.md
  - docs/superpowers/specs/2026-06-11-consultation-loop-design.md
implements:
  - docs/05-technical/architecture/system-map.md
  - docs/DATA-FLOW.md
---

# ADR-093 grounding audit and deletion sequence

> **Grounded 2026-06-12.** This is the queue reset before ADR-093 code deletion. It inventories live code for the V1 cuts, classifies what to delete versus protect, and defines the deletion order and validators. No product code is deleted by this audit.

## Summary

ADR-093 changes the V1 execution queue from feature addition to controlled simplification. The codebase still contains live collaboration, Azure document persistence, mobile/touch, and in-product voice-input code. The first implementation move is a set of grounded deletion sweeps, not app convergence and not the consultation-loop build.

Current queue state:

- Control/Report closure and Explore redesign work are already merged through ER-10/ER-5a; open GitHub PRs are dependency bumps only.
- ADR-093 sequencing governs new product work: ground before delete, app test suites as validators, and app convergence only after D1-D3 sweeps.
- The surviving product spine is local-first: `.vrs` snapshots, minimal local autosave, Workspace -> soft-formalized Project -> Analysis Scope, deterministic stats, typed CoScout, and future transcript distillation for consultation packs.

## Grounding Inventory

Commands used:

```bash
rg -l "ProjectMember|Invitation|ProjectRole|canAccess|projectMembership|useProjectMembershipStore|InviteModal|MemberList|NoAccessRedirect|onMembersChange" apps packages docs
rg -l "cloudSync|SaveConflictDialog|ETag|If-Match|DocumentSnapshot|documentSnapshot|hydrateDocumentSnapshot|buildDocumentSnapshot|HUB_PERSIST_SNAPSHOT|AzureHubRepository|Blob Storage|EasyAuth document|server storage|withDocumentSaveLock" apps packages docs
rg -l "Mobile|mobile|touch|Touch|useIsMobile|MobileMenu|mobile drawer|bottom sheet|tablet|responsive variant|StickyMobileCTA" apps packages docs
rg -l "voice|Voice|transcri|Transcri|microphone|Microphone|speech|Speech|audio|Audio|MediaRecorder|recording|recorded Teams|Teams recording" apps packages docs
```

### D6 - CoScout voice input

Classification: **delete now**.

Live code found:

- Azure speech service: `apps/azure/src/services/speechService.ts` and `apps/azure/src/services/__tests__/speechService.test.ts`.
- Runtime config and server policy: `apps/azure/src/lib/runtimeConfig.ts`, `apps/azure/src/lib/__tests__/runtimeConfig.test.ts`, `apps/azure/server.js`, `apps/azure/src/__tests__/server.integration.test.ts`.
- Azure UI plumbing: `apps/azure/src/components/editor/CoScoutSection.tsx`, `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`, `apps/azure/src/components/FindingsPanel.tsx`.
- Shared UI primitive: `packages/ui/src/components/VoiceInput/`, `packages/ui/src/components/FindingsLog/FindingEditor.tsx`, `FindingBoardView.tsx`, and `packages/ui/src/index.ts`.

Protect:

- Consultation-loop transcript import language in `docs/superpowers/specs/2026-06-11-consultation-loop-design.md`. This is manually acquired Teams/SharePoint transcript distillation, not in-product voice capture.
- General domain wording "voice of customer/process" in glossary/statistical docs.

Validator:

```bash
rg -n "voiceInput|speechToText|speechService|VoiceDraftButton|VoiceInput|transcribeAudio|microphone|MediaRecorder" apps/azure/src packages/ui/src packages/core/src
pnpm --filter @variscout/azure-app test -- CoScoutSection runtimeConfig server speechService
pnpm --filter @variscout/ui test -- FindingEditor CoScoutPanel
```

Expected post-sweep: grep has no in-product voice capture hits. Transcript/recorded-call references remain only in consultation-loop docs and future design text.

### D3 - mobile and touch surfaces

Classification: **delete after D6**.

Live code found:

- App-level phone routing/chrome: `apps/azure/src/pages/Editor.tsx`, `apps/pwa/src/App.tsx`, `apps/azure/src/components/AppHeader.tsx`, `apps/pwa/src/components/layout/AppHeader.tsx`, `apps/pwa/src/components/layout/MobileMenu.tsx`.
- Mobile chart/dashboard surfaces: `apps/azure/src/components/MobileChartCarousel.tsx`, `apps/pwa/src/components/MobileDashboard.tsx`.
- Mobile bottom sheets and selectors: `apps/azure/src/components/editor/EditorMobileSheet.tsx`, `packages/ui/src/components/MobileCategorySheet/`, `packages/ui/src/components/MobileTabBar/`, `packages/ui/src/components/Canvas/internal/MobileLevelPicker.tsx`.
- Breakpoint hooks: `packages/ui/src/hooks/useMediaQuery.ts`, `useIsMobile` consumers in Azure/PWA dashboards, CoScout, PI sections, data ingestion, and `FindingEditor`.
- Tests: mobile carousel/dashboard/header/sheet tests plus mocks in broader dashboard/app suites.

Protect:

- Desktop-responsive chart sizing (`@visx/responsive`, chart margin calculations, resizable panels). ADR-093 cuts mobile/touch-specific product surfaces, not normal desktop responsiveness.
- Website marketing responsive layout unless a separate website decision cuts it. This audit focuses on product apps and shared product UI.

Validator:

```bash
rg -n "MobileChartCarousel|MobileDashboard|MobileMenu|EditorMobileSheet|MobileCategorySheet|MobileTabBar|MobileLevelPicker|touch-feedback|touch-show|useIsMobile" apps/azure/src apps/pwa/src packages/ui/src
pnpm --filter @variscout/azure-app test
pnpm --filter @variscout/pwa test
pnpm --filter @variscout/ui test
```

Expected post-sweep: product apps render desktop-only flows; phone/tablet may degrade unsupported. Generic responsive chart wrappers may remain.

### D1 - live collaboration, membership, ACLs

Classification: **delete after D3; high blast radius**.

Live code found:

- Core model and ACL: `packages/core/src/projectMembership/`, exports in `packages/core/src/index.ts` and `packages/core/src/actions/index.ts`, `ImprovementProjectMetadata.members`, measurement-plan owner type references.
- Store: `packages/stores/src/useProjectMembershipStore.ts`, exports and layer-boundary tests.
- Shared UI: `packages/ui/src/components/projects/InviteModal.tsx`, `MemberList.tsx`, `PendingInvitesBanner.tsx`, `IPDetailTeamRail.tsx`, `NoAccessRedirect.tsx`, ACL gates in `IPDetailPage`, `ImproveStage`, `HypothesisComments`, `HypothesisCardWithPlans`, `ObjectDetailDrawer`, and Wall action surfaces.
- Apps: pending-invite wiring in `apps/azure/src/pages/Editor.tsx`, `apps/pwa/src/App.tsx`, `HomeScreen`, `ProjectsTabView`, `ImprovementProjectPanel`; Azure `localDb.canAccessProjectRecord`.
- Docs: `docs/03-features/data/acl.md`, collaboration and membership feature docs, persona-role journey docs, and stale wedge-era plans.

Protect:

- Solo formalization: Project remains as the soft-formalized layer of a Workspace.
- Author/provenance labels on findings, comments, actions, plans, and reports when they are not access control.
- Consultation pack audience labels, including "Sponsor" as pack audience only.

Deletion shape:

- Collapse edit gates to solo/local-first defaults.
- Remove invite and pending-invite surfaces.
- Remove project-membership access filtering from Azure document listing/loading after D2 removes managed cloud documents.
- Replace member-owner fields with plain owner labels or local analyst identifiers where ownership remains useful.

Validator:

```bash
rg -n "ProjectMember|Invitation|ProjectRole|canAccess|projectMembership|useProjectMembershipStore|InviteModal|MemberList|PendingInvitesBanner|NoAccessRedirect|onMembersChange" apps/azure/src apps/pwa/src packages/core/src packages/stores/src packages/ui/src
pnpm --filter @variscout/core test -- projectMembership improvementProject measurementPlan
pnpm --filter @variscout/stores test -- useProjectMembershipStore layerBoundary
pnpm --filter @variscout/ui test -- IPDetail ImproveStage HypothesisComments HypothesisCardWithPlans ObjectDetailDrawer
pnpm --filter @variscout/azure-app test
pnpm --filter @variscout/pwa test
```

Expected post-sweep: no live ACL or invitation model remains in V1 product code. Project still exists as local lifecycle/formalization structure.

### D2 - Azure document persistence

Classification: **delete after D1; highest blast radius**.

Live code found:

- Blob/server storage: `apps/azure/server.js`, `apps/azure/src/services/blobClient.ts`, `cloudSync.ts`, `storage.ts`, `saveLock.ts`, server integration tests.
- Azure repository and dispatch: `apps/azure/src/persistence/AzureHubRepository.ts`, `applyAction.ts`, repository tests, evidence-source sync, analyze indexing.
- Document identity and conflict UX: `apps/azure/src/components/SaveConflictDialog.tsx`, conflict tests, `withDocumentSaveLock`, ETag/If-Match handling.
- Local database facade tied to cloud records: `apps/azure/src/services/localDb.ts`, `apps/azure/src/hooks/useProjectLoader.ts`, `apps/azure/src/lib/persistence.ts`, `persistenceAdapter.ts`.
- Shared snapshot infrastructure: `packages/stores/src/documentSnapshot.ts`, `documentSnapshotValidation.ts`, `documentSnapshotVrs.ts`, hooks `useProjectActions.ts`, PWA `.vrs` landing/import code.

Protect:

- `.vrs` export/import: `packages/stores/src/documentSnapshotVrs.ts`, PWA import/export, and paid-channel artifact infrastructure.
- DocumentSnapshot as an internal artifact boundary if it continues to serve `.vrs`, packs, or local autosave. Do not delete just because it was reused by Blob.
- Minimal local autosave cache/IndexedDB once designed; do not remove all Dexie usage blindly because app state, canvas viewport, or local artifact caches may still need it.
- Company server for licensing/auth gate and CoScout proxy. EasyAuth may remain for company deployment identity even when document persistence is gone.

Deletion shape:

- Remove Blob project list/load/save APIs and ETag conflict machinery.
- Remove Save/Save As cloud document identity semantics from Azure.
- Keep/factor `.vrs` snapshot serialization as paid artifact layer.
- Reclassify or delete evidence-source Blob sync only after deciding whether any evidence import remains local-only or pack-bound.

Validator:

```bash
rg -n "cloudSync|SaveConflictDialog|ETag|If-Match|saveBlobProject|loadBlobProject|listBlobProjects|AzureHubRepository|withDocumentSaveLock|document identity|Blob Storage" apps/azure/src apps/pwa/src packages
pnpm --filter @variscout/stores test -- documentSnapshot documentSnapshotVrs documentSnapshotValidation
pnpm --filter @variscout/hooks test -- useProjectActions
pnpm --filter @variscout/azure-app test
pnpm --filter @variscout/pwa test
```

Expected post-sweep: no Azure document cloud store remains. `.vrs` round-trip and local-first artifact paths still pass tests.

## Deletion Sequence

1. **D6 voice input cut.** Smallest slice; confirms typed-first CoScout. One worktree, one PR.
2. **D3 mobile/touch cut.** Remove product mobile/touch surfaces and phone-only navigation. Keep desktop responsiveness.
3. **D1 collaboration/membership cut.** Remove ACL/invite/member role model from V1. Preserve solo Project formalization and provenance labels.
4. **D2 Azure persistence cut.** Remove Blob document storage, ETag conflict UX, and cloud document identity. Preserve `.vrs` and local artifact infrastructure.
5. **D4 app convergence.** Start only after D1-D3 land and D2 has shrunk Azure to licensing/auth + CoScout.

Each deletion slice must follow the ADR-093 atomic-cascade discipline: one implementer, grounded audit at slice start, per-category commits, app test suites as validators, and a browser walk of the demo path before merge.

## Demo-path Smoke Gate

Run this before each deletion PR and after each deletion PR:

1. Start PWA: `pnpm dev --host 127.0.0.1`.
2. Browser path at desktop size:
   - load app
   - paste or sample-load data
   - Process: confirm map/framing surface renders
   - Explore: confirm I-chart, factor strip, condition/scope affordance render
   - Analyze: confirm Wall/cause surface renders
   - Improve/Control: confirm action/control surfaces render
   - Report: confirm single-project report renders
3. For Azure-specific slices, also run `pnpm --filter @variscout/azure-app dev` and walk the same tabs.

Record failures in the slice PR before deleting more. Do not use this audit as permission to skip browser verification later.

### Baseline smoke evidence - 2026-06-12

Baseline checked before any deletion on `codex/adr-093-grounding-audit` using the PWA dev server at `http://127.0.0.1:5173/` and the built-in **Syringe Barrel Weight (End-to-End GB)** sample.

Observed signals:

- Landing loaded and sample import created a 300-row Workspace.
- Process rendered the framing surface with `Weight_g` as Y, selected X factors, and process-step affordance.
- Explore tab selected successfully and showed I-chart/capability/`Weight_g` signals.
- Analyze tab selected successfully and showed suspected/supported/finding signals.
- Improve tab selected successfully and showed Improve/action signals.
- Report tab selected successfully and showed report sections: "Where we started", "What we found", "Did it work?", and the Technical toggle.
- Browser console check returned no `error` logs during the smoke walk.

## Next Slice Prompt

Use this as the next implementation prompt:

> Implement ADR-093 D6 CoScout voice input cut. Work in `.worktrees/codex/adr-093-d6-voice-cut`. Ground first against `docs/superpowers/plans/2026-06-12-adr-093-grounding-audit.md` and ADR-093 D6. Delete in-product voice capture/transcription code, runtime config fields, server microphone permission behavior, and shared `VoiceInput` UI plumbing. Keep typed CoScout and consultation-loop transcript-distillation docs intact. Validators: targeted Azure CoScout/runtime/server/speech tests updated or deleted, UI FindingEditor/CoScout tests updated, grep clean for in-product voice capture terms, app test suites for touched packages.
