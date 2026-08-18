import { DomainEvent } from '@domain/common/domain-event.interface';
import { OutboxPayload } from './outbox-payload.interface';

export interface OutboxPayloadSource {
  toOutboxPayloads(events: readonly DomainEvent[]): readonly OutboxPayload[];
}
