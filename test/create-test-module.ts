import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { DiscoveryModule } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TODO_LIST_REPOSITORY } from '@domain/todo-lists/todo-list.di-tokens';
import { INTEGRATION_EVENT_OUTBOX } from '@application/common/outbox/outbox.di-tokens';
import { PublishIntegrationEventWhenTodoItemCompleted } from '@application/todo-lists/event-handlers/publish-integration-event-when-todo-item-completed.domain-event-handler';
import { SharedKernelModule } from '@shared-kernel/shared-kernel.module';
import { DomainEventDispatcher } from '@infrastructure/domain-event/domain-event-dispatcher';
import { OutboxWriter } from '@infrastructure/outbox/outbox-writer';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import { PrismaClientExtended } from '@infrastructure/persistence/prisma/prisma-client.factory';
import { PRISMA_CLIENT } from '@infrastructure/persistence/prisma/prisma.di-tokens';
import { PrismaModule } from '@infrastructure/persistence/prisma/prisma.module';
import { TodoListRepository } from '@infrastructure/persistence/prisma/repositories/todo-list.repository';
import { FailingDomainEventHandler } from './failing-domain-event-handler';

// Deliberately excludes OutboxModule: its processor and RabbitMQ connection are not
// under test here, and letting the poller run would drain the rows we assert on.
export function createTestModule(): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      InfrastructureModule,
      SharedKernelModule,
      PrismaModule,
      ClsModule.forRoot({
        global: true,
        plugins: [
          new ClsPluginTransactional({
            adapter: new TransactionalAdapterPrisma<PrismaClientExtended>({
              prismaInjectionToken: PRISMA_CLIENT,
            }),
            enableTransactionProxy: true,
          }),
        ],
      }),
      CqrsModule,
      DiscoveryModule,
    ],
    providers: [
      { provide: TODO_LIST_REPOSITORY, useClass: TodoListRepository },
      DomainEventDispatcher,
      OutboxWriter,
      { provide: INTEGRATION_EVENT_OUTBOX, useExisting: OutboxWriter },
      PublishIntegrationEventWhenTodoItemCompleted,
      FailingDomainEventHandler,
    ],
  }).compile();
}
