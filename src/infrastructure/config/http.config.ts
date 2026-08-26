import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsInt, Max, Min } from 'class-validator';
import { validatedConfig } from './validated-config';

export class HttpConfig {
  @IsInt()
  @Min(1)
  @Max(65535)
  readonly port!: number;
}

export const httpConfigProvider: Provider = {
  provide: HttpConfig,
  useFactory: (config: ConfigService) => validatedConfig(HttpConfig, { port: config.get('PORT') ?? 3000 }),
  inject: [ConfigService],
};
