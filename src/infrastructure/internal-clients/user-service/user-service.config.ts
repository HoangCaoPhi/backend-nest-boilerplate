import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsInt, IsString, Min } from 'class-validator';
import { validatedConfig } from '../../config/validated-config';

export class UserServiceConfig {
  @IsString()
  readonly baseUrl!: string;

  @IsInt()
  @Min(1)
  readonly timeoutMs!: number;
}

export const userServiceConfigProvider: Provider = {
  provide: UserServiceConfig,
  useFactory: (config: ConfigService) =>
    validatedConfig(UserServiceConfig, {
      baseUrl: config.get('USER_SERVICE_URL') ?? '',
      timeoutMs: config.get('USER_SERVICE_TIMEOUT_MS') ?? 5000,
    }),
  inject: [ConfigService],
};
