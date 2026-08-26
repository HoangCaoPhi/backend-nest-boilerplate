import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { USER_SERVICE_CLIENT } from '@application/common/internal-clients/user-service/user-service.di-tokens';
import { UserServiceConfig } from './user-service.config';
import { UserServiceClient } from './user-service.client';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (config: UserServiceConfig) => ({
        baseURL: config.baseUrl,
        timeout: config.timeoutMs,
      }),
      inject: [UserServiceConfig],
    }),
  ],
  providers: [{ provide: USER_SERVICE_CLIENT, useClass: UserServiceClient }],
  exports: [USER_SERVICE_CLIENT],
})
export class UserServiceModule {}
