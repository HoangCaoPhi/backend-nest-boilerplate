import { IntegrationEvent } from '../../common/event-bus/integration-event.interface';

export class TodoItemCompletedIntegrationEvent implements IntegrationEvent {
  readonly occurredOn: Date;

  constructor(
    readonly todoListId: string,
    readonly todoItemId: string,
    occurredOn: Date,
  ) {
    this.occurredOn = occurredOn;
  }
}
