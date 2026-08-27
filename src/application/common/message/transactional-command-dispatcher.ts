import { Inject, Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Result } from '@shared-kernel/result/result';
import { UNIT_OF_WORK } from '../data/unit-of-work.di-tokens';
import { UnitOfWork } from '../data/unit-of-work.interface';
import { CommandDispatcher } from './command-dispatcher.interface';
import { Command } from './command.base';

// One command, one transaction: every repository write and every domain event handler the
// command sets off joins it, so they commit or roll back as one.
@Injectable()
export class TransactionalCommandDispatcher implements CommandDispatcher {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  dispatch<T>(command: Command<T>): Promise<Result<T>> {
    return this.unitOfWork.run(() => this.commandBus.execute(command));
  }
}
