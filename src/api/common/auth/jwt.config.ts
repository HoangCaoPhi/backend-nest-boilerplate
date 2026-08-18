import { registerAs } from '@nestjs/config';
import { JwtSignOptions } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, validateSync } from 'class-validator';

class JwtEnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ISSUER!: string;

  @IsString()
  @IsNotEmpty()
  JWT_AUDIENCE!: string;
}

export default registerAs('jwt', () => {
  const validated = plainToInstance(JwtEnvironmentVariables, {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_ISSUER: process.env.JWT_ISSUER,
    JWT_AUDIENCE: process.env.JWT_AUDIENCE,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return {
    secret: validated.JWT_SECRET,
    issuer: validated.JWT_ISSUER,
    audience: validated.JWT_AUDIENCE,
    // Env vars are strings; jsonwebtoken narrows this to its own duration union.
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '1h') as JwtSignOptions['expiresIn'],
  };
});
