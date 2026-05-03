// apps/pwa/src/components/__tests__/VrsButtons.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VrsExportButton } from '../VrsExportButton';
import { VrsImportButton } from '../VrsImportButton';
import { DEFAULT_PROCESS_HUB } from '@variscout/core/processHub';

const hub = { ...DEFAULT_PROCESS_HUB, processGoal: 'Test goal.' };

describe('VrsExportButton', () => {
  it('triggers a download when clicked', () => {
    const createObjectURL = vi.fn(() => 'blob:mock');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });

    render(<VrsExportButton currentHub={hub} currentData={[{ x: 1 }]} />);
    const clickSpy = vi.fn();
    HTMLAnchorElement.prototype.click = clickSpy;

    fireEvent.click(screen.getByRole('button', { name: /export.*\.vrs/i }));
    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
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
});
