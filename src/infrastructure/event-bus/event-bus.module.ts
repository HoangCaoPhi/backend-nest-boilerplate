import { Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { RecoveringChannelModel } from 'amqplib';
import { INTEGRATION_EVENT_PUBLISHER } from '@application/common/integration-event/integration-event.di-tokens';
import { RABBITMQ_CONNECTION } from './event-bus.di-tokens';
import { RabbitMqConfig } from './rabbitmq.config';
import { createRabbitMqConnection } from './rabbitmq-connection.factory';
import { RabbitMqIntegrationEventPublisher } from './rabbitmq-integration-event-publisher';

// Kept out of InfrastructureModule so a test that only needs the wiring does not open a
// broker connection at boot.
@Module({
  providers: [
    {
      provide: RABBITMQ_CONNECTION,
      useFactory: (config: RabbitMqConfig) => createRabbitMqConnection(config.url),
      inject: [RabbitMqConfig],
    },
    { provide: INTEGRATION_EVENT_PUBLISHER, useClass: RabbitMqIntegrationEventPublisher },
  ],
  exports: [INTEGRATION_EVENT_PUBLISHER],
})
export class EventBusModule implements OnModuleDestroy {
  constructor(
    @Inject(RABBITMQ_CONNECTION)
    private readonly connection: RecoveringChannelModel,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await this.connection.close();
  }
}
