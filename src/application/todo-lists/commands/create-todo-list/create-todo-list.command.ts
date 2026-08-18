import { Command } from '../../../common/command.base';

export class CreateTodoListCommand extends Command {
  constructor(
    readonly title: string,
    readonly colourCode?: string,
  ) {
    super();
  }
}
