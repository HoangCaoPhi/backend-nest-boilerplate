import { Body, Controller, Param, Post, UseInterceptors } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CreateTodoItemCommand } from '@application/todo-lists/commands/create-todo-item/create-todo-item.command';
import { IdempotencyInterceptor } from '../../../../common/idempotency/idempotency.interceptor';
import { Result } from '@shared-kernel/result/result';
import { CreateTodoItemRequestDto } from './create-todo-item.request.dto';

@Controller('api/todo-lists')
export class CreateTodoItemController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':todoListId/items')
  @UseInterceptors(IdempotencyInterceptor)
  async createTodoItem(
    @Param('todoListId') todoListId: string,
    @Body() body: CreateTodoItemRequestDto,
  ): Promise<Result<{ id: string }>> {
    const result: Result<string> = await this.commandBus.execute(new CreateTodoItemCommand(todoListId, body.title));
    return result.map((id) => ({ id }));
  }
}
