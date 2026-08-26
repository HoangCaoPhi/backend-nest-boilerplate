import { IntegrationEvent } from '../integration-event/integration-event.interface';

export interface IntegrationEventOutbox {
  enqueue(events: readonly IntegrationEvent[]): Promise<void>;
}
