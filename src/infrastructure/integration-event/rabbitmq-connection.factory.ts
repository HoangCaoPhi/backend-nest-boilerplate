import { connect, RecoveringChannelModel } from 'amqplib';

export function createRabbitMqConnection(url: string): Promise<RecoveringChannelModel> {
  return connect(url, { recovery: true });
}
