import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { IntegrationEvent } from '@application/common/integration-event/integration-event.interface';
import { IntegrationEventOutbox } from '@application/common/outbox/integration-event-outbox.interface';
import { IdGenerator } from '@shared-kernel/id-generator/id-generator.interface';
import { ID_GENERATOR } from '@shared-kernel/id-generator/id-generator.di-tokens';
import { PrismaAdapter } from '../persistence/prisma/aggregate-repository.base';

@Injectable()
export class OutboxWriter implements IntegrationEventOutbox {
  constructor(
    private readonly txHost: TransactionHost<PrismaAdapter>,
    @Inject(ID_GENERATOR)
    private readonly idGenerator: IdGenerator,
  ) {}

  async enqueue(events: readonly IntegrationEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    await this.txHost.tx.outboxMessage.createMany({
      data: events.map((event) => ({
        id: this.idGenerator.generate(),
        // The wire name comes from the class, so a minifier renaming classes would rename
        // every event. The build is plain tsc — keep it that way.
        type: event.constructor.name,
        content: JSON.stringify(event),
        occurredOn: event.occurredOn,
      })),
    });
  }
}
