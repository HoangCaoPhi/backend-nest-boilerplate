import { Injectable } from '@nestjs/common';
import { TodoItemCompletedDomainEvent } from '@domain/todo-lists/events/todo-item-completed.domain-event';
import { DomainEventHandler } from '@application/common/domain-event/domain-event-handler';

@Injectable()
@DomainEventHandler(TodoItemCompletedDomainEvent)
export class FailingDomainEventHandler implements DomainEventHandler<TodoItemCompletedDomainEvent> {
  failWith: Error | null = null;

  async handle(): Promise<void> {
    if (this.failWith) {
      throw this.failWith;
    }
  }
}
