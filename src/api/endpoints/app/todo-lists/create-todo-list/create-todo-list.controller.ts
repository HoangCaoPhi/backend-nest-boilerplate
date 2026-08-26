import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CreateTodoListCommand } from '@application/todo-lists/commands/create-todo-list/create-todo-list.command';
import { IdempotencyInterceptor } from '../../../../common/idempotency/idempotency.interceptor';
import { Result } from '@shared-kernel/result/result';
import { CreateTodoListRequestDto } from './create-todo-list.request.dto';

@Controller('api/todo-lists')
export class CreateTodoListController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  async createTodoList(@Body() body: CreateTodoListRequestDto): Promise<Result<{ id: string }>> {
    const result: Result<string> = await this.commandBus.execute(
      new CreateTodoListCommand(body.title, body.colourCode),
    );
    return result.map((id) => ({ id }));
  }
}
