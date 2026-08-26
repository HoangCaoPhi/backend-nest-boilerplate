import { Injectable, OnModuleInit, Type } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { DomainEvent } from '@domain/common/domain-event.interface';
import { DomainEventHandler } from '@application/common/domain-event/domain-event-handler';

const DEPTH_KEY = 'domainEventDepth';
const MAX_DEPTH = 5;

@Injectable()
export class DomainEventDispatcher implements OnModuleInit {
  private readonly handlers = new Map<Type<DomainEvent>, DomainEventHandler[]>();

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly cls: ClsService,
  ) {}

  onModuleInit(): void {
    for (const wrapper of this.discovery.getProviders({ metadataKey: DomainEventHandler.KEY })) {
      const eventType = this.discovery.getMetadataByDecorator(DomainEventHandler, wrapper);
      const handler = wrapper.instance as DomainEventHandler | undefined;

      if (!eventType || typeof handler?.handle !== 'function') {
        continue;
      }

      this.handlers.set(eventType, [...(this.handlers.get(eventType) ?? []), handler]);
    }
  }

  // Awaited and sequential: the caller runs this inside its transaction, so a handler's
  // writes join it and a handler throwing rolls the whole thing back.
  async dispatch(events: readonly DomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    const depth = this.currentDepth();
    if (depth >= MAX_DEPTH) {
      throw new Error(
        `Domain event dispatch nested deeper than ${MAX_DEPTH} while handling ` +
          `${events.map((event) => event.constructor.name).join(', ')} — handlers are raising each other in a cycle.`,
      );
    }

    this.setDepth(depth + 1);
    try {
      for (const event of events) {
        for (const handler of this.handlersFor(event)) {
          await handler.handle(event);
        }
      }
    } finally {
      this.setDepth(depth);
    }
  }

  private handlersFor(event: DomainEvent): DomainEventHandler[] {
    return this.handlers.get(event.constructor as Type<DomainEvent>) ?? [];
  }

  private currentDepth(): number {
    return this.cls.isActive() ? (this.cls.get<number>(DEPTH_KEY) ?? 0) : 0;
  }

  private setDepth(depth: number): void {
    if (this.cls.isActive()) {
      this.cls.set(DEPTH_KEY, depth);
    }
  }
}
