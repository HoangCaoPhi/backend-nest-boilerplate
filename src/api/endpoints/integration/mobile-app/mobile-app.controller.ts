import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetTodoListsQuery } from '@application/todo-lists/queries/get-todo-lists/get-todo-lists.query';
import { GetTodoListsResponse } from '@application/todo-lists/queries/get-todo-lists/get-todo-lists.query.response';
import { Integration } from '../../../common/auth/integration.decorator';

// Integration endpoints: machine-to-machine, HMAC client credentials instead of JWT.
@Controller('api/integration/mobile-app')
@Integration('MobileApp')
export class MobileAppController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('todo-lists')
  async getTodoLists(): Promise<GetTodoListsResponse> {
    return this.queryBus.execute(new GetTodoListsQuery());
  }
}
