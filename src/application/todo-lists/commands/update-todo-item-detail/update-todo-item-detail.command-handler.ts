import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result } from '@shared-kernel/result/result';
import { TodoListErrors } from '@domain/todo-lists/todo-list.errors';
import { TodoListRepository } from '@domain/todo-lists/todo-list.repository.interface';
import { TODO_LIST_REPOSITORY } from '@domain/todo-lists/todo-list.di-tokens';
import { UpdateTodoItemDetailCommand } from './update-todo-item-detail.command';

@CommandHandler(UpdateTodoItemDetailCommand)
export class UpdateTodoItemDetailCommandHandler implements ICommandHandler<UpdateTodoItemDetailCommand, Result> {
  constructor(
    @Inject(TODO_LIST_REPOSITORY)
    private readonly todoListRepository: TodoListRepository,
  ) {}

  async execute(command: UpdateTodoItemDetailCommand): Promise<Result> {
    const todoList = await this.todoListRepository.getById(command.todoListId);
    if (!todoList) {
      return Result.fail(TodoListErrors.notFound(command.todoListId));
    }

    if (!todoList.items.some((item) => item.id === command.todoItemId)) {
      return Result.fail(TodoListErrors.itemNotFound(command.todoItemId));
    }

    todoList.updateItemDetail(command.todoItemId, command.title, command.priority);
    await this.todoListRepository.update(todoList);

    return Result.ok();
  }
}
