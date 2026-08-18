import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetTodoListsQuery } from '@application/todo-lists/queries/get-todo-lists/get-todo-lists.query';
import { GetTodoListsResponse } from '@application/todo-lists/queries/get-todo-lists/get-todo-lists.query.response';
import { GetTodoListsRequestDto } from './get-todo-lists.request.dto';

@Controller('api/todo-lists')
export class GetTodoListsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async getTodoLists(@Query() query: GetTodoListsRequestDto): Promise<GetTodoListsResponse> {
    return this.queryBus.execute(
      new GetTodoListsQuery(query.title ? { title: query.title } : undefined, undefined, query.page, query.pageSize),
    );
  }
}
