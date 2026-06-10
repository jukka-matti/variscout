// apps/pwa/src/components/__tests__/VrsButtons.test.tsx
//
// ER-1: VrsExportButton was retired — its .vrs export logic now lives in
// App.tsx#handleExportVrs (the single source of truth, shared by the Process-tab
// toolbar button + the Explore context-line Export menu). The .vrs snapshot shape
// stays covered by buildDocumentSnapshotVrs's stores-level tests. The import path
// below is unaffected.
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VrsImportButton } from '../VrsImportButton';
import { DEFAULT_PROCESS_HUB } from '@variscout/core/processHub';
import {
  buildDocumentSnapshotVrs,
  getProjectInitialState,
  useProjectStore,
} from '@variscout/stores';

const hub = { ...DEFAULT_PROCESS_HUB, processGoal: 'Test goal.' };

describe('VrsImportButton', () => {
  it('rejects an uploaded non-snapshot .vrs', async () => {
    const onImport = vi.fn();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const json = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      hub,
      rawData: [{ x: 1 }],
    });
    const file = new File([json], 'scenario.vrs', { type: 'application/json' });

    render(<VrsImportButton onImport={onImport} />);
    const input = screen.getByLabelText(/import.*\.vrs/i) as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(onImport).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('parses an uploaded snapshot .vrs and emits onImport', async () => {
    const onImport = vi.fn();
    useProjectStore.setState({
      ...getProjectInitialState(),
      projectName: 'Imported snapshot',
      rawData: [{ x: 1 }],
      outcome: 'x',
    });
    const json = buildDocumentSnapshotVrs({ activeHub: hub });
    const file = new File([json], 'scenario.vrs', { type: 'application/json' });

    render(<VrsImportButton onImport={onImport} />);
    const input = screen.getByLabelText(/import.*\.vrs/i) as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => expect(onImport).toHaveBeenCalled());
    expect(onImport.mock.calls[0][0].documentSnapshot.project.projectName).toBe(
      'Imported snapshot'
    );
  });

  it('PO-8a: a version-mismatched .vrs is DECLINED with the refresh-hint message; onImport never fires', async () => {
    const onImport = vi.fn();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    // Construct a structurally valid VRS envelope with version=2 to trigger
    // the DocumentSnapshotVersionMismatchError path in parseDocumentSnapshotVrs.
    // The parser checks the envelope-level `version` field (numeric, ≠1 → mismatch)
    // before running validateDocumentSnapshot on the inner payload.
    const versionMismatchJson = JSON.stringify({
      kind: 'variscout.document',
      version: 2,
      exportedAt: new Date().toISOString(),
      documentSnapshot: {
        schemaVersion: 2,
        hubId: hub.id,
        hub: null,
        project: {},
        analyze: {},
        canvas: {},
        improvementProject: null,
      },
    });
    const file = new File([versionMismatchJson], 'newer.vrs', { type: 'application/json' });

    render(<VrsImportButton onImport={onImport} />);
    const input = screen.getByLabelText(/import.*\.vrs/i) as HTMLInputElement;
    // configurable: true is required so subsequent tests (and the finally-block reset)
    // can reassign the property without a TypeError.
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    fireEvent.change(input);

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(alertSpy.mock.calls[0][0]).toMatch(/different version/i);
    expect(alertSpy.mock.calls[0][0]).toMatch(/refresh/i);
    expect(onImport).not.toHaveBeenCalled(); // decline = no partial load
    alertSpy.mockRestore();
  });

  it('PO-8a: a corrupt .vrs is declined with the invalid-format message', async () => {
    const onImport = vi.fn();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const file = new File(['{"not":"a vrs"}'], 'corrupt.vrs', { type: 'application/json' });

    render(<VrsImportButton onImport={onImport} />);
    const input = screen.getByLabelText(/import.*\.vrs/i) as HTMLInputElement;
    // configurable: true is required so the finally-block value reset can reassign.
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    fireEvent.change(input);

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(alertSpy.mock.calls[0][0]).toMatch(/invalid file format/i);
    expect(onImport).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
