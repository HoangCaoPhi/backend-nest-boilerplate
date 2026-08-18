import { TodoList } from '@domain/todo-lists/todo-list.entity';
import { TodoItem } from '@domain/todo-lists/todo-item.entity';
import { Colour } from '@domain/todo-lists/colour.value-object';
import { PriorityLevel } from '@domain/todo-lists/priority-level.enum';
import type { Prisma } from '../schema/generated/client';

type TodoListWithItems = Prisma.TodoListGetPayload<{ include: { items: true } }>;

export class TodoListMapper {
  static toDomain(record: TodoListWithItems): TodoList {
    const items = record.items.map((item) =>
      TodoItem.reconstitute(item.id, item.title, item.isDone, item.priority as PriorityLevel),
    );
    return TodoList.reconstitute(record.id, record.title, Colour.create(record.colourCode), items);
  }

  static toCreateArgs(todoList: TodoList): Prisma.TodoListCreateArgs {
    return {
      data: {
        id: todoList.id,
        title: todoList.title,
        colourCode: todoList.colour.code,
        items: {
          create: todoList.items.map((item) => ({
            id: item.id,
            title: item.title,
            isDone: item.isDone,
            priority: item.priority,
          })),
        },
      },
    };
  }

  static toUpdateArgs(todoList: TodoList): Prisma.TodoListUpdateArgs {
    const itemIds = todoList.items.map((item) => item.id);

    return {
      where: { id: todoList.id },
      data: {
        title: todoList.title,
        colourCode: todoList.colour.code,
        items: {
          // The aggregate is the source of truth: anything it no longer holds is gone.
          // Without this, items removed in the domain leak on as orphan rows.
          deleteMany: { id: { notIn: itemIds } },
          upsert: todoList.items.map((item) => ({
            where: { id: item.id },
            create: { id: item.id, title: item.title, isDone: item.isDone, priority: item.priority },
            update: { title: item.title, isDone: item.isDone, priority: item.priority },
          })),
        },
      },
    };
  }
}
