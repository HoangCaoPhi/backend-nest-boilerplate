import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PUBLIC_HOLIDAY_CLIENT } from '@application/common/external-clients/public-holiday/public-holiday.di-tokens';
import { PublicHolidayConfig } from './public-holiday.config';
import { PublicHolidayClient } from './public-holiday.client';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (config: PublicHolidayConfig) => ({
        baseURL: config.baseUrl,
        timeout: config.timeoutMs,
      }),
      inject: [PublicHolidayConfig],
    }),
  ],
  providers: [{ provide: PUBLIC_HOLIDAY_CLIENT, useClass: PublicHolidayClient }],
  exports: [PUBLIC_HOLIDAY_CLIENT],
})
export class PublicHolidayModule {}
