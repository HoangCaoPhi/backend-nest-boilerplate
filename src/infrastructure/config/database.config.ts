import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNotEmpty, IsString } from 'class-validator';
import { validatedConfig } from './validated-config';

export class DatabaseConfig {
  @IsString()
  @IsNotEmpty()
  readonly url!: string;
}

export const databaseConfigProvider: Provider = {
  provide: DatabaseConfig,
  useFactory: (config: ConfigService) => validatedConfig(DatabaseConfig, { url: config.get('DATABASE_URL') }),
  inject: [ConfigService],
};
