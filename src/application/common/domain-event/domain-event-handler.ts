import { Type } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { DomainEvent } from '@domain/common/domain-event.interface';

export interface DomainEventHandler<TEvent extends DomainEvent = DomainEvent> {
  handle(event: TEvent): Promise<void>;
}

export const DomainEventHandler = DiscoveryService.createDecorator<Type<DomainEvent>>();
