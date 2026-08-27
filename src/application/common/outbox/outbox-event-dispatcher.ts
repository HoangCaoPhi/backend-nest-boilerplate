import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { IntegrationEvent } from '../integration-event/integration-event.interface';
import { OutboxEventHandler, OutboxEventHandler as OutboxEventHandlerContract } from './outbox-event-handler';

@Injectable()
export class OutboxEventDispatcher implements OnModuleInit {
  private readonly handlers = new Map<string, OutboxEventHandlerContract[]>();

  constructor(private readonly discovery: DiscoveryService) {}

  onModuleInit(): void {
    for (const wrapper of this.discovery.getProviders({ metadataKey: OutboxEventHandler.KEY })) {
      const eventType = this.discovery.getMetadataByDecorator(OutboxEventHandler, wrapper);
      const handler = wrapper.instance as OutboxEventHandlerContract | undefined;

      if (!eventType || typeof handler?.handle !== 'function') {
        continue;
      }

      this.handlers.set(eventType, [...(this.handlers.get(eventType) ?? []), handler]);
    }
  }

  // Throwing on an unknown type keeps the row pending instead of silently marking it done:
  // a handler that was renamed or never registered shows up as a stuck message, not a loss.
  async dispatch(eventType: string, content: string): Promise<void> {
    const handlers = this.handlers.get(eventType) ?? [];
    if (handlers.length === 0) {
      throw new Error(`No outbox event handler registered for ${eventType}`);
    }

    const event = JSON.parse(content) as IntegrationEvent;
    for (const handler of handlers) {
      await handler.handle(event);
    }
  }
}
