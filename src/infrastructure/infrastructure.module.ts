import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { SharedKernelModule } from '@shared-kernel/shared-kernel.module';
import { UNIT_OF_WORK } from '@application/common/data/unit-of-work.di-tokens';
import { DomainEventDispatcher } from '@application/common/domain-event/domain-event-dispatcher';
import { INTEGRATION_EVENT_OUTBOX } from '@application/common/outbox/outbox.di-tokens';
import { databaseConfigProvider, DatabaseConfig } from './config/database.config';
import { httpConfigProvider, HttpConfig } from './config/http.config';
import { logConfigProvider, LogConfig } from './config/log.config';
import {
  publicHolidayConfigProvider,
  PublicHolidayConfig,
} from './external-clients/public-holiday/public-holiday.config';
import { userServiceConfigProvider, UserServiceConfig } from './internal-clients/user-service/user-service.config';
import { rabbitMqConfigProvider, RabbitMqConfig } from './event-bus/rabbitmq.config';
import { OutboxWriter } from './outbox/outbox-writer';
import { PrismaUnitOfWork } from './persistence/prisma/prisma-unit-of-work';

// Wiring only: every infrastructure config validated at boot, plus the pieces a command
// handler's transaction needs. Anything that runs on its own — the outbox poller, the broker
// connection — lives in its own module so a test can take the wiring without starting them.
@Global()
@Module({
  imports: [SharedKernelModule, DiscoveryModule],
  providers: [
    databaseConfigProvider,
    httpConfigProvider,
    logConfigProvider,
    rabbitMqConfigProvider,
    publicHolidayConfigProvider,
    userServiceConfigProvider,
    DomainEventDispatcher,
    OutboxWriter,
    { provide: INTEGRATION_EVENT_OUTBOX, useExisting: OutboxWriter },
    { provide: UNIT_OF_WORK, useClass: PrismaUnitOfWork },
  ],
  exports: [
    SharedKernelModule,
    DatabaseConfig,
    HttpConfig,
    LogConfig,
    RabbitMqConfig,
    PublicHolidayConfig,
    UserServiceConfig,
    DomainEventDispatcher,
    OutboxWriter,
    INTEGRATION_EVENT_OUTBOX,
    UNIT_OF_WORK,
  ],
})
export class InfrastructureModule {}
