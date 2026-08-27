import { Body, Controller, Inject, Post, UseInterceptors } from '@nestjs/common';
import { COMMAND_DISPATCHER } from '@application/common/message/command-dispatcher.di-tokens';
import { CommandDispatcher } from '@application/common/message/command-dispatcher.interface';
import { CreateTodoListCommand } from '@application/todo-lists/commands/create-todo-list/create-todo-list.command';
import { Result } from '@shared-kernel/result/result';
import { IdempotencyInterceptor } from '../../../../common/idempotency/idempotency.interceptor';
import { CreateTodoListRequestDto } from './create-todo-list.request.dto';

@Controller('api/todo-lists')
export class CreateTodoListController {
  constructor(
    @Inject(COMMAND_DISPATCHER)
    private readonly commands: CommandDispatcher,
  ) {}

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  async createTodoList(@Body() body: CreateTodoListRequestDto): Promise<Result<{ id: string }>> {
    const result = await this.commands.dispatch(new CreateTodoListCommand(body.title, body.colourCode));
    return result.map((id) => ({ id }));
  }
}
