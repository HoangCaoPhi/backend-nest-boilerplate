import { Command } from '../../../common/command.base';

export class CreateTodoItemCommand extends Command {
  constructor(
    readonly todoListId: string,
    readonly title: string,
  ) {
    super();
  }
}
