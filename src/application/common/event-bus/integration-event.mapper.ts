import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { DomainEvent } from '@domain/common/domain-event.interface';
import { IntegrationEvent } from './integration-event.interface';
import { IntegrationEventMapping } from './integration-event-mapping.interface';

@Injectable()
export class IntegrationEventMapper implements OnModuleInit {
  private mappings: IntegrationEventMapping[] = [];

  constructor(private readonly discovery: DiscoveryService) {}

  onModuleInit(): void {
    this.mappings = this.discovery
      .getProviders({ metadataKey: IntegrationEventMapping.KEY })
      .map((wrapper) => wrapper.instance as IntegrationEventMapping | undefined)
      .filter((mapping): mapping is IntegrationEventMapping => typeof mapping?.toIntegrationEvent === 'function');
  }

  toIntegrationEvent(event: DomainEvent): IntegrationEvent | null {
    for (const mapping of this.mappings) {
      const integrationEvent = mapping.toIntegrationEvent(event);
      if (integrationEvent) {
        return integrationEvent;
      }
    }
    return null;
  }
}
