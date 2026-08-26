import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { RecoveringChannelModel } from 'amqplib';
import { INTEGRATION_EVENT_OUTBOX } from '@application/common/outbox/outbox.di-tokens';
import { DomainEventDispatcher } from '../domain-event/domain-event-dispatcher';
import { OutboxProcessor } from './outbox-processor';
import { OutboxWriter } from './outbox-writer';
import { INTEGRATION_EVENT_PUBLISHER, RABBITMQ_CONNECTION } from '../integration-event/integration-event.di-tokens';
import { RabbitMqConfig } from '../integration-event/rabbitmq.config';
import { createRabbitMqConnection } from '../integration-event/rabbitmq-connection.factory';
import { RabbitMqIntegrationEventPublisher } from '../integration-event/rabbitmq-integration-event-publisher';

@Global()
@Module({
  imports: [ScheduleModule.forRoot(), DiscoveryModule],
  providers: [
    {
      provide: RABBITMQ_CONNECTION,
      useFactory: (config: RabbitMqConfig) => createRabbitMqConnection(config.url),
      inject: [RabbitMqConfig],
    },
    { provide: INTEGRATION_EVENT_PUBLISHER, useClass: RabbitMqIntegrationEventPublisher },
    DomainEventDispatcher,
    OutboxWriter,
    { provide: INTEGRATION_EVENT_OUTBOX, useExisting: OutboxWriter },
    OutboxProcessor,
  ],
  exports: [DomainEventDispatcher, OutboxWriter, INTEGRATION_EVENT_OUTBOX],
})
export class OutboxModule implements OnModuleDestroy {
  constructor(
    @Inject(RABBITMQ_CONNECTION)
    private readonly connection: RecoveringChannelModel,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await this.connection.close();
  }
}
