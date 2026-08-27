import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { DiscoveryModule } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TODO_LIST_REPOSITORY } from '@domain/todo-lists/todo-list.di-tokens';
import { ApplicationModule } from '@application/application.module';
import { EnqueueIntegrationEventWhenTodoItemCompletedDomainEventHandler } from '@application/todo-lists/domain-event-handlers/enqueue-integration-event-when-todo-item-completed.domain-event-handler';
import { SharedKernelModule } from '@shared-kernel/shared-kernel.module';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import { PrismaClientExtended } from '@infrastructure/persistence/prisma/prisma-client.factory';
import { PRISMA_CLIENT } from '@infrastructure/persistence/prisma/prisma.di-tokens';
import { PrismaModule } from '@infrastructure/persistence/prisma/prisma.module';
import { TodoListRepository } from '@infrastructure/persistence/prisma/repositories/todo-list.repository';
import { FailingDomainEventHandler } from './failing-domain-event-handler';

type Providers = NonNullable<Parameters<typeof Test.createTestingModule>[0]['providers']>;

// Deliberately excludes OutboxModule: letting the poller run would drain the rows we
// assert on. InfrastructureModule supplies the dispatcher and the outbox writer.
export function createTestModule(extraProviders: Providers = []): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      ApplicationModule,
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
      EnqueueIntegrationEventWhenTodoItemCompletedDomainEventHandler,
      FailingDomainEventHandler,
      ...extraProviders,
    ],
  }).compile();
}
