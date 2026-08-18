import { Entity } from './entity.base';
import { DomainEvent } from './domain-event.interface';

export abstract class AggregateRoot<TId> extends Entity<TId> {
  private readonly _domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  // Read without draining, so a caller whose transaction rolls back can retry
  // with the same instance and still have its events.
  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents.length = 0;
    return events;
  }
}
