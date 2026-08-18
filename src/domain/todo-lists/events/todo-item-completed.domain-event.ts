import { DomainEvent } from '../../common/domain-event.interface';

// Consumed by: NotifySlackWhenTodoItemCompletedDomainEventHandler (eventual, best-effort) and
// TodoItemCompletedIntegrationEventMapping (atomic, via outbox). Purely a locator comment — this
// class has no dependency on either.
export class TodoItemCompletedDomainEvent implements DomainEvent {
  readonly occurredOn: Date;
  readonly todoListId: string;
  readonly todoItemId: string;

  constructor(todoListId: string, todoItemId: string) {
    this.occurredOn = new Date();
    this.todoListId = todoListId;
    this.todoItemId = todoItemId;
  }
}
