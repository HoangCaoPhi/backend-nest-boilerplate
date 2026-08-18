import { DiscoveryService } from '@nestjs/core';
import { DomainEvent } from '@domain/common/domain-event.interface';
import { IntegrationEvent } from './integration-event.interface';

// Interface (type space) and decorator (value space) intentionally share a name.
export interface IntegrationEventMapping {
  toIntegrationEvent(event: DomainEvent): IntegrationEvent | null;
}

export const IntegrationEventMapping = DiscoveryService.createDecorator();
