import { Command } from '../../../common/message/command.base';

export class CreateTodoItemCommand extends Command<string> {
  constructor(
    readonly todoListId: string,
    readonly title: string,
  ) {
    super();
  }
}
