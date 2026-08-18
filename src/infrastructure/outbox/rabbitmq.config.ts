import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, validateSync } from 'class-validator';

class RabbitMqEnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  RABBITMQ_URL!: string;
}

export default registerAs('rabbitmq', () => {
  const validated = plainToInstance(RabbitMqEnvironmentVariables, {
    RABBITMQ_URL: process.env.RABBITMQ_URL,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return { url: validated.RABBITMQ_URL };
});
