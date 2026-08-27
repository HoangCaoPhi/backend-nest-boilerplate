import { Body, Controller, Inject, Param, Post, UseInterceptors } from '@nestjs/common';
import { COMMAND_DISPATCHER } from '@application/common/message/command-dispatcher.di-tokens';
import { CommandDispatcher } from '@application/common/message/command-dispatcher.interface';
import { CreateTodoItemCommand } from '@application/todo-lists/commands/create-todo-item/create-todo-item.command';
import { Result } from '@shared-kernel/result/result';
import { IdempotencyInterceptor } from '../../../../common/idempotency/idempotency.interceptor';
import { CreateTodoItemRequestDto } from './create-todo-item.request.dto';

@Controller('api/todo-lists')
export class CreateTodoItemController {
  constructor(
    @Inject(COMMAND_DISPATCHER)
    private readonly commands: CommandDispatcher,
  ) {}

  @Post(':todoListId/items')
  @UseInterceptors(IdempotencyInterceptor)
  async createTodoItem(
    @Param('todoListId') todoListId: string,
    @Body() body: CreateTodoItemRequestDto,
  ): Promise<Result<{ id: string }>> {
    const result = await this.commands.dispatch(new CreateTodoItemCommand(todoListId, body.title));
    return result.map((id) => ({ id }));
  }
}
