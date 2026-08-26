import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNotEmpty, IsString } from 'class-validator';
import { validatedConfig } from '../config/validated-config';

export class RabbitMqConfig {
  @IsString()
  @IsNotEmpty()
  readonly url!: string;
}

export const rabbitMqConfigProvider: Provider = {
  provide: RabbitMqConfig,
  useFactory: (config: ConfigService) => validatedConfig(RabbitMqConfig, { url: config.get('RABBITMQ_URL') }),
  inject: [ConfigService],
};
