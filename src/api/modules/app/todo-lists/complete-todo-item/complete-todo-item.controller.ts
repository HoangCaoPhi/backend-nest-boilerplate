import { Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CompleteTodoItemCommand } from '@application/todo-lists/commands/complete-todo-item/complete-todo-item.command';
import { unwrapResult } from '../../../../common/unwrap-result';

@Controller('api/todo-lists')
export class CompleteTodoItemController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':todoListId/items/:todoItemId/complete')
  async completeTodoItem(
    @Param('todoListId') todoListId: string,
    @Param('todoItemId') todoItemId: string,
  ): Promise<void> {
    unwrapResult(await this.commandBus.execute(new CompleteTodoItemCommand(todoListId, todoItemId)));
  }
}
