import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result } from '@shared-kernel/result/result';
import { TodoListErrors } from '@domain/todo-lists/todo-list.errors';
import { TodoListRepository } from '@domain/todo-lists/todo-list.repository.interface';
import { TODO_LIST_REPOSITORY } from '@domain/todo-lists/todo-list.di-tokens';
import { CompleteTodoItemCommand } from './complete-todo-item.command';

@CommandHandler(CompleteTodoItemCommand)
export class CompleteTodoItemCommandHandler implements ICommandHandler<CompleteTodoItemCommand, Result> {
  constructor(
    @Inject(TODO_LIST_REPOSITORY)
    private readonly todoListRepository: TodoListRepository,
  ) {}

  async execute(command: CompleteTodoItemCommand): Promise<Result> {
    const todoList = await this.todoListRepository.getById(command.todoListId);
    if (!todoList) {
      return Result.fail(TodoListErrors.notFound(command.todoListId));
    }

    // An unknown item id is an expected outcome, not an invariant breach — the
    // aggregate's own throw stays as the unreachable backstop.
    if (!todoList.items.some((item) => item.id === command.todoItemId)) {
      return Result.fail(TodoListErrors.itemNotFound(command.todoItemId));
    }

    todoList.completeItem(command.todoItemId);
    await this.todoListRepository.update(todoList);

    return Result.ok();
  }
}
