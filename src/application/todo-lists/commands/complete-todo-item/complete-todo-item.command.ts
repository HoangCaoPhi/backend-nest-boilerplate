import { Command } from '../../../common/command.base';

export class CompleteTodoItemCommand extends Command {
  constructor(
    readonly todoListId: string,
    readonly todoItemId: string,
  ) {
    super();
  }
}
