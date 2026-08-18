import { Injectable } from '@nestjs/common';
import { TodoList } from '@domain/todo-lists/todo-list.entity';
import { TodoListRepository as ITodoListRepository } from '@domain/todo-lists/todo-list.repository.interface';
import { AggregateRepositoryBase, PrismaContext } from '../aggregate-repository.base';
import { TodoListMapper } from './todo-list.mapper';

@Injectable()
export class TodoListRepository extends AggregateRepositoryBase<TodoList> implements ITodoListRepository {
  protected async find(db: PrismaContext, id: string): Promise<TodoList | null> {
    const record = await db.todoList.findUnique({ where: { id }, include: { items: true } });
    return record ? TodoListMapper.toDomain(record) : null;
  }

  protected async insert(db: PrismaContext, todoList: TodoList): Promise<void> {
    await db.todoList.create(TodoListMapper.toCreateArgs(todoList));
  }

  protected async modify(db: PrismaContext, todoList: TodoList): Promise<void> {
    await db.todoList.update(TodoListMapper.toUpdateArgs(todoList));
  }

  protected async remove(db: PrismaContext, todoList: TodoList): Promise<void> {
    await db.todoList.delete({ where: { id: todoList.id } });
  }
}
