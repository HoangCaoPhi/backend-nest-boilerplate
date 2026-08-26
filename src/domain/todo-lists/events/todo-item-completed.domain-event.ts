import { DomainEvent } from '../../common/domain-event.interface';

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
