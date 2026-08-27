import { Inject, Injectable } from '@nestjs/common';
import { TodoItemCompletedDomainEvent } from '@domain/todo-lists/events/todo-item-completed.domain-event';
import { DomainEventHandler } from '@application/common/domain-event/domain-event-handler';
import { IntegrationEventOutbox } from '@application/common/outbox/integration-event-outbox.interface';
import { INTEGRATION_EVENT_OUTBOX } from '@application/common/outbox/outbox.di-tokens';
import { TodoItemCompletedIntegrationEvent } from '../integration-events/todo-item-completed.integration-event';

@Injectable()
@DomainEventHandler(TodoItemCompletedDomainEvent)
export class EnqueueIntegrationEventWhenTodoItemCompletedDomainEventHandler implements DomainEventHandler<TodoItemCompletedDomainEvent> {
  constructor(
    @Inject(INTEGRATION_EVENT_OUTBOX)
    private readonly outbox: IntegrationEventOutbox,
  ) {}

  async handle(event: TodoItemCompletedDomainEvent): Promise<void> {
    await this.outbox.enqueue([
      new TodoItemCompletedIntegrationEvent(event.todoListId, event.todoItemId, event.occurredOn),
    ]);
  }
}
