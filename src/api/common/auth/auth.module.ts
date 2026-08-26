import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { IntegrationAuthenticator } from './integration-authenticator';
import { JwtConfig, jwtConfigProvider } from './jwt.config';
import { integrationConfigProvider } from './integration.config';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: JwtConfig) => ({
        secret: config.secret,
        signOptions: {
          issuer: config.issuer,
          audience: config.audience,
          expiresIn: config.expiresIn,
        },
      }),
      inject: [JwtConfig],
    }),
  ],
  providers: [
    jwtConfigProvider,
    integrationConfigProvider,
    IntegrationAuthenticator,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [JwtModule, JwtConfig],
})
export class AuthModule {}
