// apps/pwa/src/components/__tests__/VrsButtons.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VrsExportButton } from '../VrsExportButton';
import { VrsImportButton } from '../VrsImportButton';
import { DEFAULT_PROCESS_HUB } from '@variscout/core/processHub';
import { getProjectInitialState, useProjectStore } from '@variscout/stores';

const hub = { ...DEFAULT_PROCESS_HUB, processGoal: 'Test goal.' };

describe('VrsExportButton', () => {
  it('downloads a snapshot .vrs with documentSnapshot and legacy rawData', async () => {
    useProjectStore.setState({
      ...getProjectInitialState(),
      rawData: [{ x: 1 }],
      outcome: 'x',
    });
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:mock');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });

    render(<VrsExportButton currentHub={hub} />);
    const clickSpy = vi.fn();
    HTMLAnchorElement.prototype.click = clickSpy;

    fireEvent.click(screen.getByRole('button', { name: /export.*\.vrs/i }));
    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    const parsed = JSON.parse(await blob.text());
    expect(parsed.rawData).toEqual([{ x: 1 }]);
    expect(parsed.documentSnapshot).toMatchObject({
      schemaVersion: 1,
      project: { rawData: [{ x: 1 }], outcome: 'x' },
    });
  });
});

describe('VrsImportButton', () => {
  it('parses an uploaded .vrs and emits onImport', async () => {
    const onImport = vi.fn();
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

    await waitFor(() => expect(onImport).toHaveBeenCalled());
    const arg = onImport.mock.calls[0][0];
    expect(arg.hub.processGoal).toBe('Test goal.');
    expect(arg.rawData).toEqual([{ x: 1 }]);
  });

  it('parses an uploaded snapshot .vrs and emits onImport', async () => {
    const onImport = vi.fn();
    const json = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      hub,
      rawData: [{ x: 1 }],
      documentSnapshot: {
        schemaVersion: 1,
        hubId: hub.id,
        project: {
          projectId: '',
          projectName: 'Imported snapshot',
          rawData: [{ x: 1 }],
          outcome: 'x',
          factors: [],
          specs: {},
          analysisMode: 'standard',
        },
        analyze: { findings: [], categories: [], hypotheses: [], causalLinks: [], scopes: [] },
        canvas: {
          canonicalMap: { version: 1, nodes: [], tributaries: [], assignments: {}, arrows: [] },
          outcomes: [],
          primaryScopeDimensions: [],
        },
        improvementProject: null,
      },
    });
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
});
