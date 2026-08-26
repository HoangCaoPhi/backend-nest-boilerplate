import { IntegrationEvent } from '../../common/integration-event/integration-event.interface';

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
