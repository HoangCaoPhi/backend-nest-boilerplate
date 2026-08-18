import { Injectable } from '@nestjs/common';
import { DomainEvent } from '@domain/common/domain-event.interface';
import { IntegrationEvent } from '../event-bus/integration-event.interface';
import { IntegrationEventMapper } from '../event-bus/integration-event.mapper';
import { OutboxPayload } from './outbox-payload.interface';
import { OutboxPayloadSource } from './outbox-payload-source.interface';

@Injectable()
export class DiscoveredOutboxPayloadSource implements OutboxPayloadSource {
  constructor(private readonly mapper: IntegrationEventMapper) {}

  toOutboxPayloads(events: readonly DomainEvent[]): readonly OutboxPayload[] {
    return events
      .map((event) => this.mapper.toIntegrationEvent(event))
      .filter((integrationEvent): integrationEvent is IntegrationEvent => integrationEvent !== null);
  }
}
