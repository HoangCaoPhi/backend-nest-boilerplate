import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigType } from '@nestjs/config';
import { USER_SERVICE_CLIENT } from '@application/common/internal-clients/user-service/user-service.di-tokens';
import userServiceConfig from './user-service.config';
import { UserServiceClient } from './user-service.client';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (config: ConfigType<typeof userServiceConfig>) => ({
        baseURL: config.baseUrl,
        timeout: config.timeoutMs,
      }),
      inject: [userServiceConfig.KEY],
    }),
  ],
  providers: [{ provide: USER_SERVICE_CLIENT, useClass: UserServiceClient }],
  exports: [USER_SERVICE_CLIENT],
})
export class UserServiceModule {}
