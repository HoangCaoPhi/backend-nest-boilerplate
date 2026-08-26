import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtSignOptions } from '@nestjs/jwt';
import { IsNotEmpty, IsString } from 'class-validator';
import { validatedConfig } from '@infrastructure/config/validated-config';

export class JwtConfig {
  @IsString()
  @IsNotEmpty()
  readonly secret!: string;

  @IsString()
  @IsNotEmpty()
  readonly issuer!: string;

  @IsString()
  @IsNotEmpty()
  readonly audience!: string;

  // Env vars are strings; jsonwebtoken narrows this to its own duration union.
  readonly expiresIn!: JwtSignOptions['expiresIn'];
}

export const jwtConfigProvider: Provider = {
  provide: JwtConfig,
  useFactory: (config: ConfigService) =>
    validatedConfig(JwtConfig, {
      secret: config.get('JWT_SECRET'),
      issuer: config.get('JWT_ISSUER'),
      audience: config.get('JWT_AUDIENCE'),
      expiresIn: config.get('JWT_EXPIRES_IN') ?? '1h',
    }),
  inject: [ConfigService],
};
