import { DiscoveryService } from '@nestjs/core';
import { IntegrationEvent } from '../integration-event/integration-event.interface';

export interface OutboxEventHandler<TEvent extends IntegrationEvent = IntegrationEvent> {
  handle(event: TEvent): Promise<void>;
}

// Keyed by the event class name, because that is all the outbox row carries.
export const OutboxEventHandler = DiscoveryService.createDecorator<string>();
