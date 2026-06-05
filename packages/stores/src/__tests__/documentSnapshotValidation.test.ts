import { beforeEach, describe, expect, it } from 'vitest';
import type { ProcessHub } from '@variscout/core';
import { buildDocumentSnapshot } from '../documentSnapshot';
import {
  CURRENT_DOCUMENT_SCHEMA_VERSION,
  DocumentSnapshotCorruptError,
  DocumentSnapshotVersionMismatchError,
  validateDocumentSnapshot,
} from '../documentSnapshotValidation';
import { getAnalyzeInitialState, useAnalyzeStore } from '../analyzeStore';
import { useCanvasStore } from '../canvasStore';
import {
  getImprovementProjectInitialState,
  useImprovementProjectStore,
} from '../improvementProjectStore';
import { getProjectInitialState, useProjectStore } from '../projectStore';

const now = 1_714_000_000_000;

const hub: ProcessHub = {
  id: 'hub-1',
  name: 'Barrel molding',
  processGoal: 'Reduce molding scrap.',
  createdAt: now,
  deletedAt: null,
  outcomes: [],
  primaryScopeDimensions: [],
};

function resetStores() {
  useProjectStore.setState(getProjectInitialState());
  useAnalyzeStore.setState(getAnalyzeInitialState());
  useCanvasStore.setState(useCanvasStore.getInitialState());
  useImprovementProjectStore.setState(getImprovementProjectInitialState());
}

beforeEach(() => {
  resetStores();
});

describe('validateDocumentSnapshot — the PO-8a loud hydrate-seam validation', () => {
  it('accepts a freshly built current-version snapshot (negative control: loading stays possible)', () => {
    useProjectStore.setState({
      ...getProjectInitialState(),
      rawData: [{ yield: 91 }],
      outcome: 'yield',
    });
    const snapshot = buildDocumentSnapshot({ activeHub: hub });
    expect(() => validateDocumentSnapshot(snapshot)).not.toThrow();
    expect(validateDocumentSnapshot(snapshot)).toBe(snapshot);
  });

  it('throws DocumentSnapshotVersionMismatchError for a WELL-FORMED snapshot with a different numeric schemaVersion', () => {
    const snapshot = JSON.parse(JSON.stringify(buildDocumentSnapshot({ activeHub: hub })));
    snapshot.schemaVersion = 2; // full valid shape — ONLY the version differs
    expect(() => validateDocumentSnapshot(snapshot)).toThrow(DocumentSnapshotVersionMismatchError);
    expect(() => validateDocumentSnapshot(snapshot)).toThrow(/different version/i);
    expect(() => validateDocumentSnapshot(snapshot)).toThrow(/refresh/i);
    try {
      validateDocumentSnapshot(snapshot);
    } catch (err) {
      expect((err as DocumentSnapshotVersionMismatchError).foundVersion).toBe(2);
    }
  });

  it('throws DocumentSnapshotCorruptError for shape failures (missing facets, non-records, missing version)', () => {
    // current version but missing required facets
    expect(() => validateDocumentSnapshot({ schemaVersion: 1, hubId: 'hub-1' })).toThrow(
      DocumentSnapshotCorruptError
    );
    // not a record at all
    expect(() => validateDocumentSnapshot('garbage')).toThrow(DocumentSnapshotCorruptError);
    expect(() => validateDocumentSnapshot(null)).toThrow(DocumentSnapshotCorruptError);
    // schemaVersion absent / non-numeric → corrupt, NOT version-mismatch
    const snapshot = JSON.parse(JSON.stringify(buildDocumentSnapshot({ activeHub: hub })));
    delete snapshot.schemaVersion;
    expect(() => validateDocumentSnapshot(snapshot)).toThrow(DocumentSnapshotCorruptError);
    snapshot.schemaVersion = '2';
    expect(() => validateDocumentSnapshot(snapshot)).toThrow(DocumentSnapshotCorruptError);
  });

  it('corrupt message names documentSnapshot (kept assertable by the .vrs parser tests)', () => {
    expect(() => validateDocumentSnapshot({ schemaVersion: 1 })).toThrow(
      /invalid.*documentSnapshot/i
    );
  });
});

describe('PO-8a v1 shape freeze — the post-PO-7 cleaned shape IS schema v1', () => {
  it('the canonical snapshot carries exactly the frozen top-level keys', () => {
    const snapshot = buildDocumentSnapshot({ activeHub: hub });
    expect(Object.keys(snapshot).sort()).toEqual([
      'analyze',
      'canvas',
      'hub',
      'hubId',
      'improvementProject',
      'project',
      'schemaVersion',
    ]);
    expect(snapshot.schemaVersion).toBe(CURRENT_DOCUMENT_SCHEMA_VERSION);
    expect(Object.keys(snapshot.analyze).sort()).toEqual([
      'categories',
      'causalLinks',
      'findings',
      'hypotheses',
      'scopes',
    ]);
  });
});
