import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { OutboxEventDispatcher } from '@application/common/outbox/outbox-event-dispatcher';
import { OutboxProcessor } from './outbox-processor';

// Only the running worker. Everything a repository needs lives in InfrastructureModule.
@Module({
  imports: [ScheduleModule.forRoot(), DiscoveryModule],
  providers: [OutboxEventDispatcher, OutboxProcessor],
})
export class OutboxModule {}
