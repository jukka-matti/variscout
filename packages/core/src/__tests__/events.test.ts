import { describe, it, expect, vi } from 'vitest';
import { createEventBus } from '../events';
import type { Finding } from '../findings';

const stubFinding = (id: string): Finding =>
  ({ id, text: 'test', status: 'observed' }) as unknown as Finding;

describe('createEventBus', () => {
  it('creates a bus with emit and on methods', () => {
    const bus = createEventBus();
    expect(bus.emit).toBeInstanceOf(Function);
    expect(bus.on).toBeInstanceOf(Function);
    expect(bus.off).toBeInstanceOf(Function);
  });

  it('delivers finding:created to listeners', () => {
    const bus = createEventBus();
    const handler = vi.fn();
    bus.on('finding:created', handler);

    const payload = { finding: stubFinding('f1') };
    bus.emit('finding:created', payload);

    expect(handler).toHaveBeenCalledWith(payload);
  });

  it('delivers navigate:to to listeners', () => {
    const bus = createEventBus();
    const handler = vi.fn();
    bus.on('navigate:to', handler);

    bus.emit('navigate:to', { target: 'finding' as const, targetId: 'f1' });

    expect(handler).toHaveBeenCalledWith({ target: 'finding', targetId: 'f1' });
  });

  it('removes listener with off', () => {
    const bus = createEventBus();
    const handler = vi.fn();
    bus.on('finding:created', handler);
    bus.off('finding:created', handler);

    bus.emit('finding:created', { finding: stubFinding('f1') });

    expect(handler).not.toHaveBeenCalled();
  });

  it('supports multiple listeners for the same event', () => {
    const bus = createEventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on('finding:created', h1);
    bus.on('finding:created', h2);

    bus.emit('finding:created', { finding: stubFinding('f1') });

    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });
});
