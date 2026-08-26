import { Command } from '../../../common/message/command.base';

export class CreateTodoListCommand extends Command {
  constructor(
    readonly title: string,
    readonly colourCode?: string,
  ) {
    super();
  }
}
