import { Injectable } from '@nestjs/common';
import { DomainEvent } from '@domain/common/domain-event.interface';
import { TodoItemCompletedDomainEvent } from '@domain/todo-lists/events/todo-item-completed.domain-event';
import { IntegrationEventMapping } from '@application/common/event-bus/integration-event-mapping.interface';
import { IntegrationEvent } from '@application/common/event-bus/integration-event.interface';
import { TodoItemCompletedIntegrationEvent } from './todo-item-completed.integration-event';

@Injectable()
@IntegrationEventMapping()
export class TodoItemCompletedIntegrationEventMapping implements IntegrationEventMapping {
  toIntegrationEvent(event: DomainEvent): IntegrationEvent | null {
    return event instanceof TodoItemCompletedDomainEvent
      ? new TodoItemCompletedIntegrationEvent(event.todoListId, event.todoItemId, event.occurredOn)
      : null;
  }
}
