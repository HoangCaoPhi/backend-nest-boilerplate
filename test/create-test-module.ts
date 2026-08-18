import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { DiscoveryModule } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { TODO_LIST_REPOSITORY } from '@domain/todo-lists/todo-list.di-tokens';
import { IntegrationEventMapper } from '@application/common/event-bus/integration-event.mapper';
import { DiscoveredOutboxPayloadSource } from '@application/common/outbox/discovered-outbox-payload-source';
import { OUTBOX_PAYLOAD_SOURCE } from '@application/common/outbox/outbox.di-tokens';
import { TodoItemCompletedIntegrationEventMapping } from '@application/todo-lists/integration-events/todo-item-completed.integration-event-mapping';
import { SharedKernelModule } from '@infrastructure/common/shared-kernel.module';
import { OutboxWriter } from '@infrastructure/outbox/outbox-writer';
import databaseConfig from '@infrastructure/persistence/prisma/database.config';
import { PrismaModule } from '@infrastructure/persistence/prisma/prisma.module';
import { TodoListRepository } from '@infrastructure/persistence/prisma/repositories/todo-list.repository';

// Deliberately excludes OutboxModule: its processor and RabbitMQ connection are not
// under test here, and letting the poller run would drain the rows we assert on.
export function createTestModule(): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig] }),
      SharedKernelModule,
      PrismaModule,
      CqrsModule,
      DiscoveryModule,
    ],
    providers: [
      { provide: TODO_LIST_REPOSITORY, useClass: TodoListRepository },
      { provide: OUTBOX_PAYLOAD_SOURCE, useClass: DiscoveredOutboxPayloadSource },
      IntegrationEventMapper,
      TodoItemCompletedIntegrationEventMapping,
      OutboxWriter,
    ],
  }).compile();
}
