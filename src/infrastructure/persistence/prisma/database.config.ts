import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, validateSync } from 'class-validator';

class DatabaseEnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;
}

export default registerAs('database', () => {
  const validated = plainToInstance(DatabaseEnvironmentVariables, {
    DATABASE_URL: process.env.DATABASE_URL,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return { url: validated.DATABASE_URL };
});
