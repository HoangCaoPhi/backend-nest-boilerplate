import { Inject, Injectable } from '@nestjs/common';
import { ConfirmChannel, RecoveringChannelModel } from 'amqplib';
import { IntegrationEventPublisher } from '@application/common/integration-event/integration-event-publisher.interface';
import { RABBITMQ_CONNECTION } from './event-bus.di-tokens';

@Injectable()
export class RabbitMqIntegrationEventPublisher implements IntegrationEventPublisher {
  private channel: ConfirmChannel | null = null;
  private readonly assertedExchanges = new Set<string>();

  constructor(
    @Inject(RABBITMQ_CONNECTION)
    private readonly connection: RecoveringChannelModel,
  ) {}

  async publish(eventType: string, content: string): Promise<void> {
    const channel = await this.getChannel();

    if (!this.assertedExchanges.has(eventType)) {
      await channel.assertExchange(eventType, 'fanout', { durable: true, autoDelete: false });
      this.assertedExchanges.add(eventType);
    }

    channel.publish(eventType, '', Buffer.from(content), { persistent: true });
    // The publish call only buffers. Without this the caller would mark the outbox row
    // processed while the broker may never have accepted the message.
    await channel.waitForConfirms();
  }

  // One long-lived channel instead of one per message: opening a channel costs a
  // round-trip, and per-message churn is a known way to fall over under load.
  private async getChannel(): Promise<ConfirmChannel> {
    if (this.channel) {
      return this.channel;
    }

    const channel = await this.connection.createConfirmChannel();
    channel.on('close', () => this.forgetChannel());
    channel.on('error', () => this.forgetChannel());
    this.channel = channel;
    return channel;
  }

  private forgetChannel(): void {
    this.channel = null;
    // Exchange assertions live on the channel's connection; a new channel must redo them.
    this.assertedExchanges.clear();
  }
}
