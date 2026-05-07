/**
 * DocumentSnapshot — type-only intersection of all Document-layer store state shapes.
 *
 * Pre-positioned for future `.vrs` export envelope (see data-flow foundation
 * spec §7). When `exportDocument()` ships, its parameter type will be
 * `DocumentSnapshot`, and Annotation/View store state will fail to typecheck
 * if accidentally passed in.
 *
 * Shape: intersection (`A & B & C`), NOT a record `{ project, investigation, canvas }`
 * and NOT a union (`A | B | C`). Rationale (F4 spec D5): a `.vrs` export carries
 * ONE snapshot containing all document slices — flat is the right shape, the
 * future export consumer reads `(snap.outcomes, snap.findings, snap.canonicalMap)`
 * without needing to reach through namespacing nesting. If property names
 * collide across Document stores in the future, the intersection forces explicit
 * resolution at type-eval time — desirable, not a hazard.
 *
 * F4 ships only the type. F5+ wires the runtime function.
 */
import type { ProjectState } from './projectStore';
import type { InvestigationState } from './investigationStore';
import type { CanvasStoreState } from './canvasStore';

export type DocumentSnapshot = ProjectState & InvestigationState & CanvasStoreState;
