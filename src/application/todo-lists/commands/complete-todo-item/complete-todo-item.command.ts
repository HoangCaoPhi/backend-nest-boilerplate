import { Command } from '../../../common/message/command.base';

export class CompleteTodoItemCommand extends Command {
  constructor(
    readonly todoListId: string,
    readonly todoItemId: string,
  ) {
    super();
  }
}
