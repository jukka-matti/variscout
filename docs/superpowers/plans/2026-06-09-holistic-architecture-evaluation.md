---
tier: ephemeral
purpose: build
title: 'Holistic Architecture Evaluation'
status: active
date: 2026-06-09
layer: spec
related:
  - 2026-05-31-refactoring-roadmap
  - 2026-06-01-post-phase-6-refactoring-evaluation
  - 2026-06-09-workspace-architecture-and-project-formalization-design
  - 2026-06-09-workspace-architecture-roadmap
  - adr-078-pwa-azure-architecture-alignment
  - adr-082-wedge-architecture
  - coscout-ax-design
---

# Holistic Architecture Evaluation

> **For agentic workers:** This is an evaluation memo, not an implementation plan. Do not edit product code from this document directly. Promote one ranked boundary at a time into its own implementation plan before changing code.

**Goal:** Decide which VariScout V1 architecture boundaries should be decided, cleaned up, extracted, deeply refactored, or deferred before deeper product-code work resumes.

**Scope:** V1 product architecture across Project/IP vocabulary, state and persistence, Azure/PWA app shells, package boundaries, workflow surfaces, dead residue, and the ideal CoScout operating model. The previous Editor/PWA shell evaluation is retained here as one evidence lane.

**Follow-up decision 2026-06-09:** The recommendation from this memo was promoted into the [Workspace architecture spec](../specs/2026-06-09-workspace-architecture-and-project-formalization-design.md) and [Workspace architecture roadmap](2026-06-09-workspace-architecture-roadmap.md). Those documents supersede this memo's earlier "rename or narrow Active IP" option: the target model is now Workspace -> optional Project -> Analysis Scope, with Active IP retirement handled through staged migration.

---

## Evidence Summary

The current V1 codebase has several large coordination surfaces. Size alone is not the problem; the problem is that some files combine product vocabulary, persistence identity, app capability policy, role/ACL policy, and render routing.

| File                                                     |  LOC | Primary concern                                                                |
| -------------------------------------------------------- | ---: | ------------------------------------------------------------------------------ |
| `apps/azure/src/pages/Editor.tsx`                        | 2615 | Azure shell, document identity, Active IP, ACL, AI/share, workflow rendering   |
| `apps/pwa/src/App.tsx`                                   | 1886 | PWA shell, session model, `.vrs`, embed/offline, Active IP, workflow rendering |
| `packages/ui/src/components/Canvas/CanvasWorkspace.tsx`  | 1696 | Canvas render plus Active IP-backed write-through state                        |
| `packages/ui/src/components/AnalyzeWall/WallCanvas.tsx`  | 1554 | Wall render, measurement plans, hypothesis/finding orchestration               |
| `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`  | 1420 | Analyze orchestration, Wall/Explore handoffs, AI coupling                      |
| `packages/stores/src/analyzeStore.ts`                    | 1291 | Analyze document store and cross-surface domain state                          |
| `apps/azure/src/features/data-flow/useEditorDataFlow.ts` | 1167 | Azure ingestion, provenance, landing, match summaries                          |
| `apps/azure/src/services/storage.ts`                     | 1100 | Azure persistence facade and compatibility surface                             |
| `packages/core/src/ai/prompts/coScout/tools/registry.ts` |  832 | CoScout tool registry and phase gating                                         |
| `packages/core/src/ai/buildAIContext.ts`                 |  639 | AI context assembly and vocabulary bridge                                      |
| `packages/core/src/ai/responsesApi.ts`                   |  543 | Responses API client, streaming, tool loop, state continuity                   |
| `apps/azure/src/features/ai/useAIOrchestration.ts`       |  538 | Azure AI orchestration, context, KB, tools, store sync                         |

Targeted ESLint on the shell and AI architecture hotspots returned **0 errors / 64 warnings**. The warnings cluster around render-time ref writes, synchronous state updates inside effects, missing hook dependencies, and React Compiler memo-preservation. This supports lifecycle and view-model extraction. It does not justify a blind JSX split.

Key grounding facts:

- ADR-082 says V1 formalizes **Project** as the customer-visible unit; **Hub** is the internal data container.
- `packages/stores/CLAUDE.md` says the current store model is **10 Zustand stores across 3 layers**: Document x4, Annotation x4, View x2.
- `useActiveIPStore` is annotation-per-user: `variscout:activeIP:{hubId}:{userId}`.
- `useActiveIPContext` auto-activates the only live project unless the user cleared focus for the session.
- The CoScout registry currently exposes **25 tool entries**: 7 read-classified tools and 18 action-classified tools.
- CoScout already uses the Responses API with streaming, `previous_response_id`, prompt cache keys, `store`, reasoning effort selection, structured schemas, and an app-owned tool loop.
- Existing docs still contain some drift signals: CoScout AX says PWA has read-only coaching, while ADR-082 and app evidence treat AI as Azure-owned for V1; `Project = ImprovementProject` is logged as a known vocabulary issue; control/handoff and sustainment identifiers are partly live and partly residue.

Package manifest evidence confirms the intended package graph is mostly explicit at workspace-dependency level:

| Package/app              | Workspace dependencies              | Boundary read                                                                                   |
| ------------------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| `@variscout/core`        | none                                | Foundation package                                                                              |
| `@variscout/data`        | `core`                              | Sample/data helpers depend downward                                                             |
| `@variscout/stores`      | `core`                              | Store/domain state depends downward                                                             |
| `@variscout/charts`      | `core`                              | Chart primitives depend downward                                                                |
| `@variscout/hooks`       | `core`, `data`, `stores`            | Workflow hooks compose domain packages                                                          |
| `@variscout/ui`          | `core`, `charts`, `hooks`, `stores` | Shared UI is allowed to consume shared workflow state, but store-aware exceptions need scrutiny |
| `apps/pwa`, `apps/azure` | all shared packages                 | Apps own capability adapters and composition roots                                              |

Original holistic-plan lane coverage:

| Lane                   | Covered where                                                          | Current status                                                                  |
| ---------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Conceptual model       | Architecture lane 1; ranked rows 1 and 6; superseded by Workspace spec | Covered, with Workspace model now selected and Active IP retirement staged      |
| State and persistence  | Architecture lane 2; ranked rows 3, 7, 8                               | Covered, with 10-store model and Azure/PWA persistence split called out         |
| PWA/Azure architecture | Architecture lane 3; ranked rows 4, 6, 7                               | Covered, with app-owned capability adapters separated from shared workflow      |
| Workflow surfaces      | Architecture lane 5; ranked rows 1, 4, 5, 11                           | Covered, with vocabulary drift treated as decision work before render splitting |
| Package boundaries     | Architecture lane 6; ranked row 10; package manifest table above       | Covered, with graph evidence added from package manifests                       |
| Dead code and residue  | Architecture lane 7; ranked row 9                                      | Covered, with deletion gated by zero-consumer proof and owning tests            |

## External Best-Practice Check

Current official-source guidance supports the existing direction, with specific gates for deeper AI refactoring:

- [OpenAI Agents SDK](https://developers.openai.com/api/docs/guides/agents): stay on the Responses API when one model call plus tools and application-owned logic is enough; move to agent runtime patterns when orchestration, tool execution, approvals, and state become agent responsibilities.
- [OpenAI evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices): evaluate instruction following, functional correctness, tool selection, argument precision, and handoff accuracy before adding multi-agent complexity.
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs): use function calling for tools, data, and UI actions; use structured response schemas when the model response itself must drive UI.
- [OpenAI reasoning best practices](https://developers.openai.com/api/docs/guides/reasoning-best-practices): preserve reasoning continuity with stored Responses state or `previous_response_id` where appropriate.
- [Azure OpenAI Responses API](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/responses): Azure supports stateful Responses flows, tool follow-up via `previous_response_id`, API key auth, and Entra ID auth.
- [React: You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect): derived render data and user-event logic should not be synchronized through effects; effects should synchronize with external systems.
- [Zustand useShallow](https://zustand.docs.pmnd.rs/learn/guides/prevent-rerenders-with-use-shallow) and [Zustand slices pattern](https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/slices-pattern.md): selectors should be granular, shallow-stable where needed, and large stores can be organized by slices while middleware belongs at the combined-store boundary.

Evaluation implication: CoScout should **not** move to a heavier agent runtime by default. The first decision is an autonomy/eval boundary. Agent-runtime migration is justified only if evals show that Responses API plus app-owned orchestration cannot handle tool choice, approvals, state, or role-aware behavior.

## Architecture Lanes

### 1. Conceptual Model

The selected V1 model is `Workspace -> optional Project -> current Analysis Scope`.

- Workspace is the user-facing object: the place where an analyst brings data and investigates.
- Project is optional formalization of that Workspace: membership, role context, charter/status, actions, and formal report work.
- Analysis Scope is the only active analytical lens: outcome or measure, factor, process step, and filters.
- `ProcessHub` remains internal storage vocabulary.
- Active IP / Project Focus / Exit IP retire as target architecture.

Current conclusion: **do not remove Active IP in one step**. It still drives live behavior:

- Canvas reads/writes project-backed `stepTimings`, `formulaBindings`, `timeDecompositionBindings`, `binnedFactorBindings`, and `goal.factorControls`.
- Azure edit permission derives from project membership currently reached through `activeIP.metadata.members`.
- Analyze scope, canvas focus, scoped factor requests, Wall context, Report context, and project action ownership still read Active IP in current code.
- `useActiveIPStore` persists per-hub/per-user focus and explicit clear behavior.

Target direction: migrate each live read either to the Workspace's attached Project or to Analysis Scope. Removal remains staged until ACL, Wall, Analyze, Report, Control, mobile navigation, and quick-analysis behavior are verified.

### 2. State and Persistence

The 10-store model is the current architectural center. The core boundary is sound: Document state is portable, Annotation state persists per hub/user but is not portable, and View state is transient.

Primary risks:

- Store layer documentation and session instructions disagree on 9 vs 10 stores; `packages/stores/CLAUDE.md` is the authoritative current source.
- Direct `getState()` writes and cross-store imperative updates are common in shells and canvas. Some are legitimate event handlers; others deserve view-model or action-boundary cleanup.
- Azure persistence has durable identity, ETag/conflict behavior, Blob sync, and server access constraints. PWA has session-first `.vrs` import/export. Those should not be collapsed.
- `storage.ts`, `useEditorDataFlow.ts`, and document snapshot helpers remain high-blast-radius surfaces for any persistence cleanup.

### 3. Azure/PWA Architecture

Azure and PWA are the same product workflow with different capabilities.

Keep Azure-owned:

- EasyAuth identity, Azure durable save identity, Save/Save As, ETag conflict flow, cloud sync, Teams/share, AI/CoScout, knowledge search, Azure server access enforcement.

Keep PWA-owned:

- Session-only default, `.vrs` import/export, embed mode, offline banner, local identity assumptions, training/demo funnel behavior.

Shared candidates:

- Workflow route/view model, active project focus derivations, Wall planning lifecycle, pure ingestion parsing/classification utilities, and shared render components after state boundaries are stable.

Do not build a shared mega-shell unless the evaluation proves stable app capability adapters and stable vocabulary first.

### 4. CoScout Ideal Operation

CoScout should operate as an **Azure capability over validated product state**, not as an independent product-state owner.

Current target model:

- Responses API remains the default runtime.
- App-owned orchestration remains responsible for context assembly, tool execution, approvals, state persistence, ACL checks, and UI routing.
- Read tools may auto-execute when scoped and side-effect-free.
- Action tools return proposals and require user confirmation before mutation.
- Navigation tools may route or propose routing depending on disruption and role.
- Team/collaboration tools require Azure identity, project membership, and role-aware permission checks.
- Retrieval tools must honor project scope and source attribution.
- Future autonomous workflow is out of V1 unless evals prove a need and an ADR defines the autonomy boundary.

CoScout permissions:

- Lead: may receive methodology coaching, proposal cards, navigation suggestions, project/member-oriented actions when ACL permits.
- Member: may receive task-oriented suggestions and contribution/edit proposals where ACL permits.
- Sponsor: should receive outcome/status summaries and read-safe navigation; action prompts that imply write authority should be suppressed or downgraded to drafts.

CoScout eval gap:

- Current code has strong unit coverage for prompt assembly, tool registry, Responses API, action tools, and reasoning config.
- The canonical AX doc says no automated CoScout eval suite exists beyond prompt-tier safety.
- Next slice should define eval fixtures for prompt quality, tool choice, argument precision, phase gating, REF marker correctness, role tone, proposal safety, and refusal to invent numeric claims.

### 5. Workflow Surfaces

Home / Project / Process / Explore / Analyze / Improve / Report are mostly coherent in user-facing shape, but internal names still carry history:

- `sustainment` remains a code identifier in some stage/control paths.
- `handoff` remains live in Control-domain types and tests, not simply dead residue.
- `charter`, `IP`, `Active IP`, and Project naming still need a vocabulary decision.
- Project-tab stage overviews and Analyze/Wall vocabulary have active investigation/spec follow-ups.

This is not a reason to split files first. It is a reason to decide the vocabulary boundary before committing deeper state moves.

### 6. Package Boundaries

The intended dependency flow remains:

`core -> data/stores/charts -> hooks -> ui -> apps`

Current pressure points:

- `ui` components are store-aware in specific places; this is acceptable only when documented as shared workflow state rather than app-local UI state.
- App-local feature stores should stay in `apps/*/src/features`.
- Compatibility re-exports and barrel paths should be migrated only with proof of consumers and tests.
- Package-boundary cleanup should follow the conceptual/state decisions, not precede them.

### 7. Dead Code and Residue

No deletion should happen in this evaluation. Evidence-backed cleanup candidates:

- PWA `useImprovementOrchestration` appears orphaned in `docs/ephemeral/investigations.md`; verify zero live callers before deletion.
- Some panel flags and view-state migration names look compatibility-driven rather than active behavior.
- Old DataContext wording appears in comments/types even though ADR-078 retired DataContext as app-state architecture.
- Control/handoff i18n keys and process-cadence components are documented as suspected dead or intentionally retained pending future process-owner work.
- CoScout tool docs claim 27 tools in some places, while the current registry scan found 25 entries. Treat as doc/code drift until verified against intended tool count.

## Ranked Architecture Table

This table extends the original `Rank | Seam | Evidence | Classification | Risk | Decision Needed | Suggested Slice | Verification` format with the v2 `Refactor Depth` and `CoScout Impact` columns.

| Rank | Boundary                                   | Evidence                                                                                                                                                                                                   | Classification               | Refactor Depth                            | CoScout Impact                                                                                                    | Risk                                                                   | Decision Needed                                                                                               | Suggested Slice                                                    | Verification                                                                                                                             |
| ---: | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
|    1 | Workspace/Project/Analysis Scope ownership | Workspace spec selects Workspace as product object, Project as optional formalization, Analysis Scope as active lens; Active IP still drives ACL, Canvas writes, Analyze/Wall/Report scope in current code | decide first                 | foundational refactor candidate           | High: CoScout role tone, action proposals, context scope, and team tools need Workspace + Project + Scope context | High                                                                   | How do current Active IP reads migrate to attached Project vs Analysis Scope without breaking quick analysis? | Workspace architecture roadmap slices 1-5                          | `useActiveIPContext`, `activeIPStore`, `CanvasWorkspace`, Editor/App shell tests, membership ACL tests, Analysis Scope tests             |
|    2 | CoScout structural autonomy boundary       | 25-tool registry; Responses API tool loop; Watson B5 open question; no automated eval suite beyond prompt-tier safety                                                                                      | decide first                 | foundational refactor candidate           | Direct: decides answer/propose/draft/route/apply boundaries                                                       | High                                                                   | Does CoScout stay Responses API + app-owned orchestration, or need agent-runtime architecture?                | CoScout autonomy ADR + eval fixture plan                           | `responsesApi.test.ts`, `toolRegistry.test.ts`, `actionTools.test.ts`, `useAICoScout.test.ts`, Azure AI feature tests, new eval fixtures |
|    3 | State/persistence layer cleanup            | 10-store model; snapshot boundary; Azure durable identity vs PWA `.vrs`; direct store writes in shells                                                                                                     | shared abstraction candidate | medium foundational cleanup               | Medium: AI context should read validated snapshots/state, not app-shell incidental state                          | High                                                                   | Which writes must go through repository/action boundaries, and which remain view/event writes?                | State/persistence boundary cleanup                                 | store layer tests, snapshot tests, PWA export/import, Azure persistence/conflict tests                                                   |
|    4 | Azure/PWA shell workflow view-model        | `Editor.tsx` 2615 LOC, `App.tsx` 1886 LOC, 64 ESLint warnings in hotspots                                                                                                                                  | shared abstraction candidate | medium extraction                         | Medium: CoScout surface placement and active scope labels can consume the same view model                         | Medium                                                                 | Which derivations are shared product workflow vs app capability policy?                                       | Shell route/view-model extraction                                  | Editor/App tests, panel store tests, mobile routing tests                                                                                |
|    5 | Wall planning lifecycle                    | Mirrored Wall measurement-plan/pending-match wiring in both shells and Wall surfaces                                                                                                                       | shared abstraction candidate | medium extraction                         | Medium: CoScout critique/proposal tools need stable Wall context                                                  | Medium                                                                 | Is Azure/PWA behavior equivalent after user/repository adapters?                                              | Wall planning lifecycle hook                                       | WallCanvas tests, AnalyzeWorkspace tests, App tests, measurement-plan tests                                                              |
|    6 | CoScout capability policy drift            | ADR-082 says V1 single SKU and PWA free funnel; AX doc still describes PWA read-only coaching                                                                                                              | accidental drift             | docs/design cleanup first                 | High: determines where AI UI appears and what PWA promises                                                        | Medium                                                                 | Is PWA AI absent, read-only coaching, or named-future only?                                                   | CoScout V1 capability policy cleanup                               | docs checks, PWA App tests if UI changes later, Azure CoScout tests                                                                      |
|    7 | Document capability adapter                | Azure Save/Save As/ETag vs PWA session `.vrs`; app shells duplicate chrome state concepts                                                                                                                  | app-owned capability         | narrow adapter later                      | Low to medium: CoScout should know document identity only via app-provided context                                | Medium                                                                 | What common shell status/action shape is safe without changing persistence semantics?                         | Document capability adapter design                                 | Azure save/conflict tests, PWA export/import tests                                                                                       |
|    8 | Ingestion flow convergence                 | Azure `useEditorDataFlow` 1167 LOC; PWA paste/import hook; shared parsing/classification concepts                                                                                                          | shared abstraction candidate | pure utility extraction                   | Low: CoScout consumes outcomes/context after ingestion                                                            | Medium                                                                 | Which helpers are pure and which are app-persistence specific?                                                | Ingestion utility extraction                                       | Azure data-flow tests, PWA paste/import tests, snapshot tests                                                                            |
|    9 | Dead residue cleanup                       | Orphaned hook investigation, DataContext wording, panel compatibility flags, tool-count doc drift                                                                                                          | dead/suspected dead          | safe cleanup when proven                  | Low to medium: tool docs and prompt docs affect AI safety                                                         | Low-medium                                                             | Which items have zero live consumers and which are intentionally retained?                                    | Dead residue cleanup                                               | `rg` zero-consumer proof, owning package tests, docs checks                                                                              |
|   10 | Package-boundary/import hygiene            | ADR-078 package graph; store-aware UI exceptions; compatibility re-exports                                                                                                                                 | safe cleanup                 | incremental hygiene                       | Low                                                                                                               | Which imports violate intended package direction or hide ownership?    | Package-boundary hygiene                                                                                      | boundary checks, package tests, `rg` import proof                  |
|   11 | Render/component decomposition             | Large shells and UI surfaces remain after decisions                                                                                                                                                        | defer                        | low/medium refactor after boundaries      | Low unless CoScout mount changes                                                                                  | Medium                                                                 | Which route sections are pure enough to extract without behavior changes?                                     | Render split                                                       | Shell tests, visual/browser checks if UI touched                                                                                         |
|   12 | Agent-runtime migration                    | External guidance says evals should drive multi-agent complexity; current app already owns orchestration/approvals/state                                                                                   | defer                        | high foundational refactor only if proven | Very high                                                                                                         | Do evals show Responses API + app-owned orchestration is insufficient? | Agent runtime spike only after eval failures                                                                  | CoScout eval suite, tool handoff tests, latency/cost/safety review |

## Proposed Slice Sequence

1. **Workspace/Product Model Lock.** Use the Workspace architecture spec to define Workspace, optional Project, Analysis Scope, and internal `ProcessHub`.
2. **CoScout structural autonomy boundary and eval plan.** Define what CoScout may answer, propose, draft, route, and apply using Workspace + optional Project + Analysis Scope context.
3. **State/persistence boundary cleanup.** Align store-layer docs, direct write boundaries, snapshot ownership, and Azure/PWA persistence responsibilities.
4. **Shell workflow view-model extraction.** Extract pure derivations for Workspace identity, Project presence, Analysis Scope labels, Wall-first mode, mobile route state, and chrome visibility.
5. **Dead residue cleanup.** Remove only deletion-proof code/docs residue, starting with comments/docs and zero-consumer compatibility boundaries.
6. **Package-boundary and import hygiene.** Tighten app/local/shared boundaries after vocabulary and state decisions are stable.
7. **Render/component decomposition.** Split route sections and large render components only when their inputs are already stable and tested.
8. **Agent-runtime migration.** Defer unless CoScout evals prove Responses API plus app-owned orchestration cannot handle the required behavior.

## Verification Inventory

Read-only evidence commands run for this memo:

- `rg` scans for Hub / Project / `ImprovementProject` / Active IP / selected project / ACL terms.
- `rg` scans for CoScout / Responses API / tool registry / action proposals / reasoning / prompt cache.
- `rg` scans for DataContext / retired / legacy / sustainment / handoff / panel compatibility / suspected dead seams.
- `wc -l` on large shell, store, UI, persistence, and AI hotspot files.
- Targeted ESLint on shell and AI architecture hotspots: **0 errors / 64 warnings**.
- Test inventory scan for stores, snapshots, shells, persistence, panel routing, Active IP, Canvas, Report, Control, CoScout, Responses API, tool registry, action tools, and AI orchestration.

Minimum verification for later implementation slices:

- Project focus changes: `packages/hooks/src/__tests__/useActiveIPContext.test.ts`, `packages/stores/src/__tests__/activeIPStore.test.ts`, `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx`, shell tests, membership ACL tests.
- CoScout autonomy changes: `packages/core/src/ai/__tests__/responsesApi.test.ts`, `toolRegistry.test.ts`, `actionTools.test.ts`, `promptTierSafety.test.ts`, `packages/hooks/src/__tests__/useAICoScout.test.ts`, Azure AI feature tests, and new eval fixtures.
- State/persistence changes: store layer tests, document snapshot tests, PWA export/import tests, Azure persistence and conflict tests.
- Shell/view-model changes: Azure `Editor.test.tsx`, PWA `App.test.tsx`, panel store tests, mobile routing tests.
- Dead cleanup: static zero-consumer proof plus owning package tests.

Docs verification for this memo:

- `pnpm docs:check:frontmatter`
- `pnpm docs:check`
- `git diff --check`

## Assumptions

- This evaluation changes docs only.
- Deep refactoring is allowed as a recommendation, but every promoted code change needs a separate implementation plan and dedicated worktree.
- Active IP retirement is the target architecture, but implementation remains staged and proof-gated.
- CoScout remains Responses API plus app-owned orchestration unless evals prove a heavier runtime is necessary.
- The immediate next move should be a decision slice, not a large render split.
