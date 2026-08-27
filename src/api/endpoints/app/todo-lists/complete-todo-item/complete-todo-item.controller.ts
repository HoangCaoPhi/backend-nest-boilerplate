import { Controller, Inject, Param, Post } from '@nestjs/common';
import { COMMAND_DISPATCHER } from '@application/common/message/command-dispatcher.di-tokens';
import { CommandDispatcher } from '@application/common/message/command-dispatcher.interface';
import { CompleteTodoItemCommand } from '@application/todo-lists/commands/complete-todo-item/complete-todo-item.command';
import { Result } from '@shared-kernel/result/result';

@Controller('api/todo-lists')
export class CompleteTodoItemController {
  constructor(
    @Inject(COMMAND_DISPATCHER)
    private readonly commands: CommandDispatcher,
  ) {}

  @Post(':todoListId/items/:todoItemId/complete')
  async completeTodoItem(
    @Param('todoListId') todoListId: string,
    @Param('todoItemId') todoItemId: string,
  ): Promise<Result<void>> {
    return this.commands.dispatch(new CompleteTodoItemCommand(todoListId, todoItemId));
  }
}
