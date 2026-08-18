import { Body, Controller, Param, Post, UseInterceptors } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CreateTodoItemCommand } from '@application/todo-lists/commands/create-todo-item/create-todo-item.command';
import { IdempotencyInterceptor } from '../../../../common/interceptors/idempotency.interceptor';
import { unwrapResult } from '../../../../common/unwrap-result';
import { CreateTodoItemRequestDto } from './create-todo-item.request.dto';

@Controller('api/todo-lists')
export class CreateTodoItemController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':todoListId/items')
  @UseInterceptors(IdempotencyInterceptor)
  async createTodoItem(
    @Param('todoListId') todoListId: string,
    @Body() body: CreateTodoItemRequestDto,
  ): Promise<{ id: string }> {
    const result = await this.commandBus.execute(new CreateTodoItemCommand(todoListId, body.title));
    return { id: unwrapResult(result) };
  }
}
