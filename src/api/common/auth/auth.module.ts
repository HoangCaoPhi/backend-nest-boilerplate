import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { IntegrationAuthenticator } from './integration-authenticator';
import jwtConfig from './jwt.config';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigType<typeof jwtConfig>) => ({
        secret: config.secret,
        signOptions: {
          issuer: config.issuer,
          audience: config.audience,
          expiresIn: config.expiresIn,
        },
      }),
      inject: [jwtConfig.KEY],
    }),
  ],
  providers: [IntegrationAuthenticator, { provide: APP_GUARD, useClass: AuthGuard }],
  exports: [JwtModule],
})
export class AuthModule {}
