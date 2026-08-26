import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

type ConfigSchema<T> = new () => T;

export function validatedConfig<T extends object>(schema: ConfigSchema<T>, raw: Record<string, unknown>): T {
  const config = plainToInstance(schema, raw, { enableImplicitConversion: true });
  const errors = validateSync(config, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Invalid ${schema.name}: ${errors.toString()}`);
  }

  return config;
}
