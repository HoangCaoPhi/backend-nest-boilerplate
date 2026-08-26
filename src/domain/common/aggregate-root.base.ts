import { Entity } from './entity.base';
import { DomainEvent } from './domain-event.interface';

export abstract class AggregateRoot<TId> extends Entity<TId> {
  private readonly _domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  get hasUncommittedEvents(): boolean {
    return this._domainEvents.length > 0;
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  clearUncommittedEvents(): void {
    this._domainEvents.length = 0;
  }
}
