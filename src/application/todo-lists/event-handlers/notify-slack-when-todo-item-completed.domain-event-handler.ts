import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { TodoItemCompletedDomainEvent } from '@domain/todo-lists/events/todo-item-completed.domain-event';
import { SlackClient } from '../../common/external-clients/slack/slack.client.interface';
import { SLACK_CLIENT } from '../../common/external-clients/slack/slack.di-tokens';

// Best-effort by design: this runs outside the caller's transaction, so it may fire
// for a write that later rolls back. Anything that must not be lost goes via the outbox.
@EventsHandler(TodoItemCompletedDomainEvent)
export class NotifySlackWhenTodoItemCompletedDomainEventHandler implements IEventHandler<TodoItemCompletedDomainEvent> {
  constructor(
    @Inject(SLACK_CLIENT)
    private readonly slackClient: SlackClient,
  ) {}

  async handle(event: TodoItemCompletedDomainEvent): Promise<void> {
    await this.slackClient.notify(`Todo item '${event.todoItemId}' in list '${event.todoListId}' completed.`);
  }
}
