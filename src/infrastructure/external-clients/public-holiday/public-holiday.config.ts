import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsInt, IsString, Min } from 'class-validator';
import { validatedConfig } from '../../config/validated-config';

export class PublicHolidayConfig {
  @IsString()
  readonly baseUrl!: string;

  @IsInt()
  @Min(1)
  readonly timeoutMs!: number;
}

export const publicHolidayConfigProvider: Provider = {
  provide: PublicHolidayConfig,
  useFactory: (config: ConfigService) =>
    validatedConfig(PublicHolidayConfig, {
      baseUrl: config.get('PUBLIC_HOLIDAY_URL') ?? '',
      timeoutMs: config.get('PUBLIC_HOLIDAY_TIMEOUT_MS') ?? 5000,
    }),
  inject: [ConfigService],
};
