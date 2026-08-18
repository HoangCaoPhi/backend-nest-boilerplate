import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ReadDb } from '../../../common/data/read-db.interface';
import { READ_DB } from '../../../common/data/read-db.di-tokens';
import { paginate, PaginatableDelegate } from '../../../common/data/pagination';
import { GetTodoListsQuery } from './get-todo-lists.query';
import { GetTodoListsResponse } from './get-todo-lists.query.response';
import { TodoListRecord } from './get-todo-lists.query.record';

@QueryHandler(GetTodoListsQuery)
export class GetTodoListsQueryHandler implements IQueryHandler<GetTodoListsQuery, GetTodoListsResponse> {
  constructor(
    @Inject(READ_DB)
    private readonly readDb: ReadDb,
  ) {}

  async execute(query: GetTodoListsQuery): Promise<GetTodoListsResponse> {
    const { items, meta } = await paginate<TodoListRecord>(
      this.readDb.todoList as PaginatableDelegate<TodoListRecord>,
      {
        where: query.filter,
        orderBy: query.orderBy,
        select: {
          id: true,
          title: true,
          colourCode: true,
          items: { select: { isDone: true } },
        },
      },
      { page: query.page, pageSize: query.pageSize },
    );

    return {
      items: items.map((record) => ({
        id: record.id,
        title: record.title,
        colourCode: record.colourCode,
        incompleteItemCount: record.items.filter((item) => !item.isDone).length,
      })),
      meta,
    };
  }
}
