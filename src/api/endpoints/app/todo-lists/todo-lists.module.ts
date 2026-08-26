import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TODO_LIST_REPOSITORY } from '@domain/todo-lists/todo-list.di-tokens';
import { TodoListRepository } from '@infrastructure/persistence/prisma/repositories/todo-list.repository';
import { CompleteTodoItemCommandHandler } from '@application/todo-lists/commands/complete-todo-item/complete-todo-item.command-handler';
import { CreateTodoItemCommandHandler } from '@application/todo-lists/commands/create-todo-item/create-todo-item.command-handler';
import { CreateTodoListCommandHandler } from '@application/todo-lists/commands/create-todo-list/create-todo-list.command-handler';
import { UpdateTodoItemDetailCommandHandler } from '@application/todo-lists/commands/update-todo-item-detail/update-todo-item-detail.command-handler';
import { GetTodoListsQueryHandler } from '@application/todo-lists/queries/get-todo-lists/get-todo-lists.query-handler';
import { GetTodoItemsWithPaginationQueryHandler } from '@application/todo-lists/queries/get-todo-items-with-pagination/get-todo-items-with-pagination.query-handler';
import { PublishIntegrationEventWhenTodoItemCompleted } from '@application/todo-lists/event-handlers/publish-integration-event-when-todo-item-completed.domain-event-handler';
import { CompleteTodoItemController } from './complete-todo-item/complete-todo-item.controller';
import { CreateTodoItemController } from './create-todo-item/create-todo-item.controller';
import { CreateTodoListController } from './create-todo-list/create-todo-list.controller';
import { GetTodoItemsWithPaginationController } from './get-todo-items-with-pagination/get-todo-items-with-pagination.controller';
import { GetTodoListsController } from './get-todo-lists/get-todo-lists.controller';
import { UpdateTodoItemDetailController } from './update-todo-item-detail/update-todo-item-detail.controller';

// One controller per use case; all App endpoints are JWT-authenticated (the global AuthGuard's default category).
@Module({
  imports: [CqrsModule],
  controllers: [
    GetTodoListsController,
    CreateTodoListController,
    GetTodoItemsWithPaginationController,
    CreateTodoItemController,
    UpdateTodoItemDetailController,
    CompleteTodoItemController,
  ],
  providers: [
    { provide: TODO_LIST_REPOSITORY, useClass: TodoListRepository },
    CreateTodoListCommandHandler,
    CreateTodoItemCommandHandler,
    UpdateTodoItemDetailCommandHandler,
    CompleteTodoItemCommandHandler,
    GetTodoListsQueryHandler,
    GetTodoItemsWithPaginationQueryHandler,
    PublishIntegrationEventWhenTodoItemCompleted,
  ],
})
export class TodoListsModule {}
