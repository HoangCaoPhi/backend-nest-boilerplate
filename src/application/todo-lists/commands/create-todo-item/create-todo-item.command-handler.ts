import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result } from '@shared-kernel/result/result';
import { IdGenerator } from '@shared-kernel/id-generator/id-generator.interface';
import { ID_GENERATOR } from '@shared-kernel/id-generator/id-generator.di-tokens';
import { TodoListErrors } from '@domain/todo-lists/todo-list.errors';
import { TodoItem } from '@domain/todo-lists/todo-item.entity';
import { TodoListRepository } from '@domain/todo-lists/todo-list.repository.interface';
import { TODO_LIST_REPOSITORY } from '@domain/todo-lists/todo-list.di-tokens';
import { CreateTodoItemCommand } from './create-todo-item.command';

@CommandHandler(CreateTodoItemCommand)
export class CreateTodoItemCommandHandler implements ICommandHandler<CreateTodoItemCommand, Result<string>> {
  constructor(
    @Inject(TODO_LIST_REPOSITORY)
    private readonly todoListRepository: TodoListRepository,
    @Inject(ID_GENERATOR)
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(command: CreateTodoItemCommand): Promise<Result<string>> {
    const todoList = await this.todoListRepository.getById(command.todoListId);
    if (!todoList) {
      return Result.fail(TodoListErrors.notFound(command.todoListId));
    }

    const item = TodoItem.create(this.idGenerator.generate(), command.title);
    todoList.addItem(item);
    await this.todoListRepository.update(todoList);

    return Result.ok(item.id);
  }
}
