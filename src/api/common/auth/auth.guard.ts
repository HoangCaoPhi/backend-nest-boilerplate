import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IntegrationAuthenticator } from './integration-authenticator';
import { INTEGRATION_CALLER } from './integration.decorator';
import jwtConfig from './jwt.config';
import { IS_PUBLIC } from './public.decorator';

// Single global guard, three endpoint categories: public, integration (HMAC), app (JWT).
// Registering separate global guards would AND them together, which is the wrong shape here.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly integrationAuthenticator: IntegrationAuthenticator,
    @Inject(jwtConfig.KEY)
    private readonly config: ConfigType<typeof jwtConfig>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];

    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const callerName = this.reflector.getAllAndOverride<string>(INTEGRATION_CALLER, targets);
    if (callerName) {
      if (!this.integrationAuthenticator.authenticate(callerName, request.headers)) {
        throw new UnauthorizedException();
      }
      return true;
    }

    return this.authenticateJwt(request);
  }

  private async authenticateJwt(request: { headers: Record<string, unknown>; user?: unknown }): Promise<boolean> {
    const [scheme, token] = String(request.headers['authorization'] ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException();
    }

    try {
      request.user = await this.jwtService.verifyAsync(token, {
        secret: this.config.secret,
        issuer: this.config.issuer,
        audience: this.config.audience,
      });
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }
}
