import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { COMMAND_DISPATCHER } from './common/message/command-dispatcher.di-tokens';
import { TransactionalCommandDispatcher } from './common/message/transactional-command-dispatcher';

@Global()
@Module({
  imports: [CqrsModule],
  providers: [{ provide: COMMAND_DISPATCHER, useClass: TransactionalCommandDispatcher }],
  exports: [COMMAND_DISPATCHER],
})
export class ApplicationModule {}
