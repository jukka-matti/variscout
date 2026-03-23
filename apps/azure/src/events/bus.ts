import { createEventBus } from '@variscout/core/events';
import type { DomainEventBus } from '@variscout/core/events';

/** Singleton event bus for the Azure app */
export const bus: DomainEventBus = createEventBus();
