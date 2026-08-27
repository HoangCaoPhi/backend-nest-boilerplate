import { Command } from '../../../common/message/command.base';

export class CreateTodoListCommand extends Command<string> {
  constructor(
    readonly title: string,
    readonly colourCode?: string,
  ) {
    super();
  }
}
