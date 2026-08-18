import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result } from '@shared-kernel/result/result';
import { IdGenerator } from '@shared-kernel/id-generator/id-generator.interface';
import { ID_GENERATOR } from '@shared-kernel/id-generator/id-generator.di-tokens';
import { Colour } from '@domain/todo-lists/colour.value-object';
import { TodoList } from '@domain/todo-lists/todo-list.entity';
import { TodoListRepository } from '@domain/todo-lists/todo-list.repository.interface';
import { TODO_LIST_REPOSITORY } from '@domain/todo-lists/todo-list.di-tokens';
import { CreateTodoListCommand } from './create-todo-list.command';

@CommandHandler(CreateTodoListCommand)
export class CreateTodoListCommandHandler implements ICommandHandler<CreateTodoListCommand, Result<string>> {
  constructor(
    @Inject(TODO_LIST_REPOSITORY)
    private readonly todoListRepository: TodoListRepository,
    @Inject(ID_GENERATOR)
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(command: CreateTodoListCommand): Promise<Result<string>> {
    const colour = command.colourCode ? Colour.create(command.colourCode) : Colour.white;
    const todoList = TodoList.create(this.idGenerator.generate(), command.title, colour);

    await this.todoListRepository.add(todoList);

    return Result.ok(todoList.id);
  }
}
