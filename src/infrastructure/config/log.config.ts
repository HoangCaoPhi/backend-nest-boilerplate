import { LOG_LEVELS, LogLevel, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsIn } from 'class-validator';
import { validatedConfig } from './validated-config';

const DEFAULT_MIN_LEVEL: LogLevel = 'log';

export class LogConfig {
  @IsIn(LOG_LEVELS)
  readonly minLevel!: LogLevel;

  get levels(): LogLevel[] {
    return LOG_LEVELS.slice(LOG_LEVELS.indexOf(this.minLevel));
  }
}

export const logConfigProvider: Provider = {
  provide: LogConfig,
  useFactory: (config: ConfigService) =>
    validatedConfig(LogConfig, {
      minLevel: config.get<string>('LOG_LEVEL')?.trim().toLowerCase() || DEFAULT_MIN_LEVEL,
    }),
  inject: [ConfigService],
};
