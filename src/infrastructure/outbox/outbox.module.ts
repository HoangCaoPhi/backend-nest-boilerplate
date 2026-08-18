import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { DiscoveryModule } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { RecoveringChannelModel } from 'amqplib';
import { IntegrationEventMapper } from '@application/common/event-bus/integration-event.mapper';
import { DiscoveredOutboxPayloadSource } from '@application/common/outbox/discovered-outbox-payload-source';
import { OUTBOX_PAYLOAD_SOURCE } from '@application/common/outbox/outbox.di-tokens';
import { OutboxProcessor } from './outbox.processor';
import { OutboxWriter } from './outbox-writer';
import { INTEGRATION_EVENT_PUBLISHER, RABBITMQ_CONNECTION } from './outbox.di-tokens';
import rabbitmqConfig from './rabbitmq.config';
import { createRabbitMqConnection } from './rabbitmq-connection.factory';
import { RabbitMqIntegrationEventPublisher } from './rabbitmq-integration-event-publisher';

@Global()
@Module({
  imports: [ScheduleModule.forRoot(), DiscoveryModule],
  providers: [
    {
      provide: RABBITMQ_CONNECTION,
      useFactory: (config: ConfigType<typeof rabbitmqConfig>) => createRabbitMqConnection(config.url),
      inject: [rabbitmqConfig.KEY],
    },
    { provide: INTEGRATION_EVENT_PUBLISHER, useClass: RabbitMqIntegrationEventPublisher },
    IntegrationEventMapper,
    { provide: OUTBOX_PAYLOAD_SOURCE, useClass: DiscoveredOutboxPayloadSource },
    OutboxWriter,
    OutboxProcessor,
  ],
  exports: [OutboxWriter, OUTBOX_PAYLOAD_SOURCE],
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
