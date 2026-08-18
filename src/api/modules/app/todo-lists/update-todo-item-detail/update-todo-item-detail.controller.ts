import { Body, Controller, Param, Put } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { UpdateTodoItemDetailCommand } from '@application/todo-lists/commands/update-todo-item-detail/update-todo-item-detail.command';
import { unwrapResult } from '../../../../common/unwrap-result';
import { UpdateTodoItemDetailRequestDto } from './update-todo-item-detail.request.dto';

@Controller('api/todo-lists')
export class UpdateTodoItemDetailController {
  constructor(private readonly commandBus: CommandBus) {}

  @Put(':todoListId/items/:todoItemId')
  async updateTodoItemDetail(
    @Param('todoListId') todoListId: string,
    @Param('todoItemId') todoItemId: string,
    @Body() body: UpdateTodoItemDetailRequestDto,
  ): Promise<void> {
    unwrapResult(
      await this.commandBus.execute(new UpdateTodoItemDetailCommand(todoListId, todoItemId, body.title, body.priority)),
    );
  }
}
