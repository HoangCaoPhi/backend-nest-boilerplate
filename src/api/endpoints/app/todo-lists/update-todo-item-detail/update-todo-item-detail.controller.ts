import { Body, Controller, Inject, Param, Put } from '@nestjs/common';
import { COMMAND_DISPATCHER } from '@application/common/message/command-dispatcher.di-tokens';
import { CommandDispatcher } from '@application/common/message/command-dispatcher.interface';
import { UpdateTodoItemDetailCommand } from '@application/todo-lists/commands/update-todo-item-detail/update-todo-item-detail.command';
import { Result } from '@shared-kernel/result/result';
import { UpdateTodoItemDetailRequestDto } from './update-todo-item-detail.request.dto';

@Controller('api/todo-lists')
export class UpdateTodoItemDetailController {
  constructor(
    @Inject(COMMAND_DISPATCHER)
    private readonly commands: CommandDispatcher,
  ) {}

  @Put(':todoListId/items/:todoItemId')
  async updateTodoItemDetail(
    @Param('todoListId') todoListId: string,
    @Param('todoItemId') todoItemId: string,
    @Body() body: UpdateTodoItemDetailRequestDto,
  ): Promise<Result<void>> {
    return this.commands.dispatch(new UpdateTodoItemDetailCommand(todoListId, todoItemId, body.title, body.priority));
  }
}
