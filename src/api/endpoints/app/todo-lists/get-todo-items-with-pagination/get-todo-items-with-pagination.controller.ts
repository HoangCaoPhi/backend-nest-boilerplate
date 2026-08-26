import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetTodoItemsWithPaginationQuery } from '@application/todo-lists/queries/get-todo-items-with-pagination/get-todo-items-with-pagination.query';
import { GetTodoItemsWithPaginationResponse } from '@application/todo-lists/queries/get-todo-items-with-pagination/get-todo-items-with-pagination.query.response';
import { Result } from '@shared-kernel/result/result';
import { GetTodoItemsWithPaginationRequestDto } from './get-todo-items-with-pagination.request.dto';

@Controller('api/todo-lists')
export class GetTodoItemsWithPaginationController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':todoListId/items')
  async getTodoItems(
    @Param('todoListId') todoListId: string,
    @Query() query: GetTodoItemsWithPaginationRequestDto,
  ): Promise<Result<GetTodoItemsWithPaginationResponse>> {
    const result = await this.queryBus.execute(
      new GetTodoItemsWithPaginationQuery(todoListId, query.page, query.pageSize),
    );
    return result;
  }
}
