import { Inject, Injectable } from '@nestjs/common';
import { IntegrationEventPublisher } from '@application/common/integration-event/integration-event-publisher.interface';
import { INTEGRATION_EVENT_PUBLISHER } from '@application/common/integration-event/integration-event.di-tokens';
import { OutboxEventHandler } from '@application/common/outbox/outbox-event-handler';
import { TodoItemCompletedIntegrationEvent } from './todo-item-completed.integration-event';

@Injectable()
@OutboxEventHandler(TodoItemCompletedIntegrationEvent.name)
export class PublishToBrokerWhenTodoItemCompletedOutboxEventHandler implements OutboxEventHandler<TodoItemCompletedIntegrationEvent> {
  constructor(
    @Inject(INTEGRATION_EVENT_PUBLISHER)
    private readonly publisher: IntegrationEventPublisher,
  ) {}

  async handle(event: TodoItemCompletedIntegrationEvent): Promise<void> {
    await this.publisher.publish(TodoItemCompletedIntegrationEvent.name, JSON.stringify(event));
  }
}
