import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PriorityLevel } from '@domain/todo-lists/priority-level.enum';
import { Result } from '@shared-kernel/result/result';
import { ReadDb } from '../../../common/data/read-db.interface';
import { READ_DB } from '../../../common/data/read-db.di-tokens';
import { paginate, PaginatableDelegate } from '../../../common/data/pagination';
import { GetTodoItemsWithPaginationQuery } from './get-todo-items-with-pagination.query';
import { TodoItemRecord } from './get-todo-items-with-pagination.query.record';
import { GetTodoItemsWithPaginationResponse } from './get-todo-items-with-pagination.query.response';

@QueryHandler(GetTodoItemsWithPaginationQuery)
export class GetTodoItemsWithPaginationQueryHandler implements IQueryHandler<
  GetTodoItemsWithPaginationQuery,
  Result<GetTodoItemsWithPaginationResponse>
> {
  constructor(
    @Inject(READ_DB)
    private readonly readDb: ReadDb,
  ) {}

  async execute(query: GetTodoItemsWithPaginationQuery): Promise<Result<GetTodoItemsWithPaginationResponse>> {
    const { items, meta } = await paginate<TodoItemRecord>(
      this.readDb.todoItem as PaginatableDelegate<TodoItemRecord>,
      {
        where: { todoListId: query.todoListId },
        orderBy: { id: 'asc' },
        select: { id: true, title: true, isDone: true, priority: true },
      },
      { page: query.page, pageSize: query.pageSize },
    );

    return Result.ok({
      items: items.map((record) => ({
        id: record.id,
        title: record.title,
        isDone: record.isDone,
        priority: record.priority as PriorityLevel,
      })),
      meta,
    });
  }
}
