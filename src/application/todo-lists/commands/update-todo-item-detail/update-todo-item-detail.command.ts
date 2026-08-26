import { PriorityLevel } from '@domain/todo-lists/priority-level.enum';
import { Command } from '../../../common/message/command.base';

export class UpdateTodoItemDetailCommand extends Command {
  constructor(
    readonly todoListId: string,
    readonly todoItemId: string,
    readonly title: string,
    readonly priority: PriorityLevel,
  ) {
    super();
  }
}
