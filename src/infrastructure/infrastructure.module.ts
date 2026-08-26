import { Global, Module } from '@nestjs/common';
import { SharedKernelModule } from '@shared-kernel/shared-kernel.module';
import { databaseConfigProvider, DatabaseConfig } from './config/database.config';
import { httpConfigProvider, HttpConfig } from './config/http.config';
import { logConfigProvider, LogConfig } from './config/log.config';
import {
  publicHolidayConfigProvider,
  PublicHolidayConfig,
} from './external-clients/public-holiday/public-holiday.config';
import { userServiceConfigProvider, UserServiceConfig } from './internal-clients/user-service/user-service.config';
import { rabbitMqConfigProvider, RabbitMqConfig } from './integration-event/rabbitmq.config';

// Every infrastructure config in one place, validated at boot: a missing env var fails
// startup instead of the first request that happens to need it.
@Global()
@Module({
  imports: [SharedKernelModule],
  providers: [
    databaseConfigProvider,
    httpConfigProvider,
    logConfigProvider,
    rabbitMqConfigProvider,
    publicHolidayConfigProvider,
    userServiceConfigProvider,
  ],
  exports: [
    SharedKernelModule,
    DatabaseConfig,
    HttpConfig,
    LogConfig,
    RabbitMqConfig,
    PublicHolidayConfig,
    UserServiceConfig,
  ],
})
export class InfrastructureModule {}
